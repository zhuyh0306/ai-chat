#!/usr/bin/env python3
"""
将面试 PDF 解析为结构化 JSON，并存入 PostgreSQL。

支持的格式（自动检测）：
  - numbered       : 数字题号 + 答：前缀（前端百题 v1.2.3）
  - q-prefix       : Q1：前缀（AI 应用百题）
  - poetries       : blog.poetries.top Web 打印版（第1~8部分，坐标感知解析）
  - nowcoder       : 牛客网（第9部分）

用法：
  cd nest-server
  python scripts/import-interview-pdf.py /path/to/file.pdf
  python scripts/import-interview-pdf.py /path/to/directory  # 批量导入

依赖：
  pip install pdfplumber psycopg2-binary python-dotenv
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import pdfplumber
import psycopg2
from dotenv import load_dotenv

# ---- 通用正则 ----
CATEGORY_RE = re.compile(r'^[一二三四五六七八九十]+、(.+)$')
SUB_CATEGORY_RE = re.compile(r'^(\d+)、(.+)$')

# ---- numbered 格式 ----
QUESTION_RE = re.compile(r'^(\d+)\.\s*(.+)$')
ANSWER_RE = re.compile(r'^答[：:]\s*(.*)$')

# ---- q-prefix 格式 ----
Q_QUESTION_RE = re.compile(r'^Q(\d+)[：:]\s*(.+)$')

# ---- poetries 格式 ----
POETRIES_QUESTION_RE = re.compile(r'^(\d+(?:\.\d+)?)\s+(.+)$')
POETRIES_FOOTER_RE = re.compile(
    r'(blog\.poetries\.top|FE-Interview|'
    r'第[一二三四五六七八九十]+部分)'
)

# ---- nowcoder 格式 ----
NOWCODER_QUESTION_RE = re.compile(r'^(\d+)、(.+)$')
NOWCODER_ANSWER_RE = re.compile(r'^参考回答[：:]\s*(.*)$')
NOWCODER_FOOTER_RE = re.compile(
    r'(NOWCODER\.COM|牛客网|名企校招|互联网学习|扫描二维码|微信号|'
    r'复制代码|前端八股文)'
)


# ======================== 格式检测 ========================
def detect_format(text_lines: list[str]) -> str:
    """根据文本内容检测 PDF 格式。"""
    combined = "\n".join(text_lines[:200])
    first_stripped = [l.strip() for l in text_lines[:200]]

    if 'NOWCODER.COM' in combined or '牛客网' in combined:
        return 'nowcoder'
    if any('参考回答' in l for l in first_stripped):
        return 'nowcoder'

    if any(Q_QUESTION_RE.match(l) for l in first_stripped):
        return 'q-prefix'

    has_poetries_q = any(POETRIES_QUESTION_RE.match(l) for l in first_stripped)
    is_poetries_site = 'FE-Interview' in combined or 'blog.poetries.top' in combined

    if has_poetries_q and is_poetries_site:
        return 'poetries'

    has_category = any(CATEGORY_RE.match(l) for l in first_stripped)
    if has_poetries_q and has_category:
        return 'poetries'

    if any(QUESTION_RE.match(l) for l in first_stripped):
        return 'numbered'

    return 'numbered'


def detect_format_from_pdf(pdf: pdfplumber.pdf.PDF) -> str:
    """从 PDF 对象检测格式（提取首 5 页文本）。"""
    text_sample = ""
    for page in pdf.pages[:5]:
        t = page.extract_text()
        if t:
            text_sample += t + "\n"
    return detect_format(text_sample.split("\n"))


# ======================== 各格式解析器 ========================
def parse_pdf_q_prefix(lines: list[str]) -> list[dict[str, Any]]:
    """Q-prefix 格式（Q1：问题，答案紧跟）。"""
    items = []
    cur_cat = None
    cur_q = None
    cur_num = None
    cur_a = []

    def save():
        if cur_q and cur_a:
            items.append({
                "category": cur_cat, "subCategory": None,
                "questionNumber": cur_num, "question": cur_q,
                "answer": "\n".join(cur_a).strip(),
                "tags": [cur_cat] if cur_cat else [],
            })

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        m = CATEGORY_RE.match(line)
        if m:
            save()
            cur_cat = m.group(1).strip()
            cur_q = cur_num = None; cur_a = []
            continue
        m = Q_QUESTION_RE.match(line)
        if m:
            save()
            cur_num = int(m.group(1))
            cur_q = m.group(2).strip(); cur_a = []
            continue
        if cur_q is not None:
            cur_a.append(line)
    save()
    return items


def parse_pdf_numbered(lines: list[str]) -> list[dict[str, Any]]:
    """numbered 格式（数字题号 + 答：前缀）。"""
    items = []
    cur_cat = cur_sub = None
    cur_q = None; cur_num = None; cur_a = []

    def save():
        if cur_q and cur_a:
            items.append({
                "category": cur_cat, "subCategory": cur_sub,
                "questionNumber": cur_num, "question": cur_q,
                "answer": "\n".join(cur_a).strip(),
                "tags": [t for t in [cur_cat, cur_sub] if t],
            })

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        m = CATEGORY_RE.match(line)
        if m:
            save()
            cur_cat = m.group(1).strip(); cur_sub = None
            cur_q = None; cur_a = []
            continue
        m = SUB_CATEGORY_RE.match(line)
        if m:
            save()
            cur_sub = m.group(2).strip()
            cur_q = None; cur_a = []
            continue
        m = QUESTION_RE.match(line)
        if m:
            save()
            cur_num = int(m.group(1))
            cur_q = m.group(2).strip(); cur_a = []
            continue
        m = ANSWER_RE.match(line)
        if m:
            cur_a.append(m.group(1).strip())
            continue
        if cur_q is not None:
            cur_a.append(line)
    save()
    return items


def parse_pdf_poetries(pdf: pdfplumber.pdf.PDF) -> list[dict[str, Any]]:
    """poetries 格式（blog.poetries.top Web打印版，第1~8部分）。
    
    利用 word 级坐标（x0）区分题目标题（左侧 x < 70）和答案正文（x >= 70）。
    过滤页眉页脚、侧边栏导航噪音。
    """
    items = []
    cur_cat = None       # 大分类（如 "基础篇"）
    cur_sub = None       # 子节（如 "HTML、HTTP、web综合问题"）
    cur_q = None         # 当前题目
    cur_num = None
    cur_a = []

    QUESTION_LEFT_MAX = 70   # 题目标题的最大 x0
    SECTION_LEFT_MAX = 70    # 子节的最大 x0

    def save():
        if cur_q and cur_a:
            answer = "\n".join(cur_a).strip()
            # 过滤过短的答案（< 20 字），大概率是解析噪音
            if len(answer) < 20:
                return
            tags = [t for t in [cur_cat, cur_sub] if t]
            items.append({
                "category": cur_cat,
                "subCategory": cur_sub,
                "questionNumber": cur_num,
                "question": cur_q,
                "answer": answer,
                "tags": tags,
            })

    for page in pdf.pages:
        words = page.extract_words(
            keep_blank_chars=True,
            x_tolerance=3,
            y_tolerance=3,
        )
        if not words:
            continue

        # 将页面上的词按行聚合
        rows: list[list[dict]] = []
        current_row = []
        current_y = None

        for w in words:
            wy = round(w['top'], 1)
            if current_y is None or abs(wy - current_y) > 4:
                if current_row:
                    rows.append(current_row)
                current_row = [w]
                current_y = wy
            else:
                current_row.append(w)

        if current_row:
            rows.append(current_row)

        for row_words in rows:
            if not row_words:
                continue

            # 构建整行文本
            x0 = row_words[0]['x0']
            line_text = ' '.join(w['text'] for w in row_words).strip()
            if not line_text:
                continue

            # ---- 过滤噪音 ----
            if POETRIES_FOOTER_RE.search(line_text):
                continue
            if line_text in ('{', '}', '...', '……', '复制代码', '目录'):
                continue
            # 过滤纯数字/日期行
            if re.match(r'^\d{4}/\d{1,2}/\d{1,2}$', line_text):
                continue
            if len(line_text) < 2:
                continue

            # ---- 子节标题（左对齐） ----
            m = CATEGORY_RE.match(line_text)
            if m and x0 < SECTION_LEFT_MAX:
                save()
                sub_name = m.group(1).strip()
                # 带"部分"的是大分类，否则是子节
                if '部分' in sub_name or '篇' in sub_name:
                    cur_cat = sub_name
                    cur_sub = None
                else:
                    cur_sub = sub_name
                cur_q = cur_num = None; cur_a = []
                continue

            # ---- 题目行（左对齐 + 数字开头） ----
            m = POETRIES_QUESTION_RE.match(line_text)
            if m and x0 < QUESTION_LEFT_MAX:
                num_str = m.group(1)
                title = m.group(2).strip()
                # 过滤明显不是题目的行
                if len(title) < 3:
                    if cur_q is not None:
                        cur_a.append(line_text)
                    continue
                save()
                try:
                    cur_num = int(float(num_str))
                except ValueError:
                    cur_num = None
                cur_q = title; cur_a = []
                continue

            # ---- 正文（缩进或无编号标题） ----
            if cur_q is not None:
                cur_a.append(line_text)

    save()
    return items


def parse_pdf_nowcoder(pdf: pdfplumber.pdf.PDF) -> list[dict[str, Any]]:
    """nowcoder 格式（牛客网，第9部分）。

    先提取 TOC 页面的顶层分类白名单，解析时区分顶级分类和子节标题。
    """
    # ---- 第一遍：从 TOC 页面（第8页）提取顶层分类白名单 ----
    top_level_categories: set[str] = set()
    if len(pdf.pages) > 7:
        page8_text = pdf.pages[7].extract_text()  # page 8 = index 7
        if page8_text:
            for line in page8_text.split('\n'):
                m = CATEGORY_RE.match(line.strip())
                if m:
                    # 排除导航/辅助类别（面试技巧、面试考点等不是面试技术题类别）
                    cat_name = m.group(1).strip()
                    if cat_name not in ('学习说明', '面试技巧', '面试考点导图',
                                        '惊喜福利', '一对一答疑讲解戳这里',
                                        'hr面'):
                        top_level_categories.add(cat_name)

    if not top_level_categories:
        # fallback：如果没提取到白名单，使用已知类别
        top_level_categories = {
            '前端基础', '前端核心', '前端进阶',
            '移动端开发', '职业发展', '项目',
            '计算机基础', '算法与数据结构', '设计模式',
            '智力题', '场景题',
        }

    # ---- 第二遍：文本解析 ----
    full_text = ""
    for page in pdf.pages:
        t = page.extract_text()
        if t:
            full_text += t + "\n"
    lines = full_text.split("\n")

    items = []
    cur_cat: str | None = None
    cur_sub: str | None = None
    cur_q: str | None = None
    cur_num: int | None = None
    cur_a: list[str] = []

    # 子节关键词（用于区分 子节标题 vs 真实题目）
    SUB_KEYWORDS = {'HTTP', 'CSS', 'JavaScript', 'HTML', '浏览器',
                    '框架', '基础', '移动', '算法', '数据结构',
                    '后端', 'Node'}

    def save():
        if cur_q and cur_a:
            answer = "\n".join(cur_a).strip()
            if len(answer) >= 15:
                tags = [t for t in [cur_cat, cur_sub] if t]
                items.append({
                    "category": cur_cat, "subCategory": cur_sub,
                    "questionNumber": cur_num, "question": cur_q,
                    "answer": answer, "tags": tags,
                })

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if NOWCODER_FOOTER_RE.search(line):
            continue
        if line in ('{', '}', '...', '……', '复制代码'):
            continue

        # 顶层分类（白名单里才认）
        m = CATEGORY_RE.match(line)
        if m:
            cat_name = m.group(1).strip()
            if cat_name in top_level_categories:
                save()
                cur_cat = cat_name; cur_sub = None
                cur_q = cur_num = None; cur_a = []
                continue
            else:
                # 子节标题（如 "一、px和视口"、"四、自适应场景下的rem解决方案"）
                save()
                cur_sub = cat_name
                cur_q = cur_num = None; cur_a = []
                continue

        # 数字+、题目
        m = NOWCODER_QUESTION_RE.match(line)
        if m:
            num = int(m.group(1))
            title = m.group(2).strip()

            # 子分类头判断
            is_sub_header = (
                len(title) <= 10 and
                not title.endswith('?') and not title.endswith('？') and
                any(kw in title for kw in SUB_KEYWORDS)
            )
            if is_sub_header:
                save()
                cur_sub = title
                cur_q = cur_num = None; cur_a = []
                continue

            save()
            cur_num = num; cur_q = title; cur_a = []
            continue

        # 参考回答：标记
        m = NOWCODER_ANSWER_RE.match(line)
        if m:
            ans = m.group(1).strip()
            if ans:
                cur_a.append(ans)
            continue

        if cur_q is not None:
            cur_a.append(line)

    save()
    return items


# ======================== 统一入口 ========================
def parse_pdf(pdf_path: str) -> list[dict[str, Any]]:
    """解析 PDF，自动检测格式并拆分为问答对。"""
    pdf = pdfplumber.open(pdf_path)
    fmt = detect_format_from_pdf(pdf)
    print(f"  检测到 PDF 格式: {fmt}")

    try:
        if fmt in ('poetries', 'poetries-plain'):
            return parse_pdf_poetries(pdf)

        if fmt == 'nowcoder':
            return parse_pdf_nowcoder(pdf)

        # 文本模式解析（q-prefix / numbered）
        full_text = ""
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                full_text += t + "\n"
        lines = full_text.split("\n")

        parsers = {
            "q-prefix": parse_pdf_q_prefix,
            "numbered": parse_pdf_numbered,
        }
        return parsers.get(fmt, parse_pdf_numbered)(lines)
    finally:
        pdf.close()


# ======================== 数据库 ========================
def load_db_config() -> dict[str, str]:
    script_dir = Path(__file__).resolve().parent
    env_path = script_dir.parent / ".env"
    load_dotenv(env_path)
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432"),
        "user": os.getenv("DB_USERNAME", "postgres"),
        "password": os.getenv("DB_PASSWORD", "123456"),
        "dbname": os.getenv("DB_DATABASE", "mastra_app"),
    }


def ensure_table(conn: psycopg2.extensions.connection) -> None:
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS interview_questions (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                source character varying(255) NOT NULL,
                category character varying(255),
                sub_category character varying(255),
                question_number integer,
                question text NOT NULL,
                answer text NOT NULL,
                tags text[],
                created_at timestamp with time zone NOT NULL DEFAULT now()
            );
        """)
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'uq_interview_question'
                      AND conrelid = 'interview_questions'::regclass
                ) THEN
                    ALTER TABLE interview_questions
                    ADD CONSTRAINT uq_interview_question
                    UNIQUE (source, category, sub_category, question_number);
                END IF;
            END $$;
        """)
    conn.commit()


def save_to_db(
    conn: psycopg2.extensions.connection,
    source: str,
    items: list[dict[str, Any]],
) -> int:
    upsert_sql = """
        INSERT INTO interview_questions
            (source, category, sub_category, question_number, question, answer, tags)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (source, category, sub_category, question_number)
        DO UPDATE SET
            question = EXCLUDED.question,
            answer = EXCLUDED.answer,
            tags = EXCLUDED.tags;
    """
    count = 0
    with conn.cursor() as cur:
        for item in items:
            cur.execute(upsert_sql, (
                source, item.get("category"), item.get("subCategory"),
                item.get("questionNumber"), item["question"], item["answer"],
                item.get("tags") or None,
            ))
            count += cur.rowcount
    conn.commit()
    return count


def extract_category_from_filename(filename: str) -> str | None:
    """从文件名提取顶层分类，如 '基础篇'、'进阶篇'、'高级篇' 等。"""
    m = re.search(r'第[一二三四五六七八九十\d]+部分[：:]\s*(.+?)(?:\(|\.|$)', filename)
    if m:
        return m.group(1).strip()
    return None


def process_single_pdf(
    pdf_path: Path,
    conn: psycopg2.extensions.connection | None = None,
    json_only: bool = False,
) -> int:
    print(f"\n正在解析: {pdf_path.name}")
    try:
        items = parse_pdf(str(pdf_path))
    except Exception as e:
        print(f"  ❌ 解析失败: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 0

    if not items:
        print(f"  ⚠ 未解析到有效题目")
        return 0

    # 为缺失顶层分类的项补充文件名中的分类
    file_cat = extract_category_from_filename(pdf_path.name)
    if file_cat:
        for item in items:
            if not item.get("category"):
                item["category"] = file_cat
        filled = sum(1 for it in items if it.get("category") == file_cat)
        print(f"  从文件名补充分类 '{file_cat}' 到 {filled} 道题目")

    print(f"  ✓ 共解析 {len(items)} 道题目")

    # JSON 输出
    json_out = pdf_path.with_suffix(".json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump({
            "source": pdf_path.name, "total": len(items), "items": items,
        }, f, ensure_ascii=False, indent=2)
    print(f"  JSON → {json_out.name}")

    if json_only or conn is None:
        return len(items)

    count = save_to_db(conn, pdf_path.name, items)
    print(f"  数据库 upsert: {count} 条")
    return len(items)


# ======================== 主入口 ========================
def main() -> int:
    parser = argparse.ArgumentParser(description="将面试 PDF 解析并存入 PostgreSQL")
    parser.add_argument(
        "target", nargs="?", default=None,
        help="PDF 文件路径 或 目录路径（批量导入目录下所有 PDF）",
    )
    parser.add_argument("--json-only", action="store_true",
                       help="仅生成 JSON，不写入数据库")
    parser.add_argument("--no-db", action="store_true",
                       help="跳过数据库写入")
    args = parser.parse_args()

    if args.target is None:
        target = Path.home() / "Downloads" / "AI视频" / "7-前端八股文(基础-进阶-高级)"
    else:
        target = Path(args.target).expanduser().resolve()

    if not target.exists():
        print(f"错误：路径不存在: {target}", file=sys.stderr)
        return 1

    if target.is_dir():
        pdf_files = sorted([f for f in target.iterdir() if f.suffix.lower() == '.pdf'])
        print(f"找到 {len(pdf_files)} 个 PDF 文件\n")
    else:
        pdf_files = [target]

    conn = None
    if not args.json_only and not args.no_db and pdf_files:
        db_cfg = load_db_config()
        print(f"数据库: {db_cfg['user']}@{db_cfg['host']}:{db_cfg['port']}/{db_cfg['dbname']}")
        conn = psycopg2.connect(**db_cfg)
        ensure_table(conn)

    try:
        total = 0
        for f in pdf_files:
            total += process_single_pdf(f, conn=conn, json_only=args.json_only)
        print(f"\n{'='*50}")
        print(f"全部完成！共解析 {total} 道题目（{len(pdf_files)} 个 PDF）")
    finally:
        if conn:
            conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
