import { tool } from 'ai';
import { z } from 'zod';

const NEST_API = process.env.NEST_API_URL || 'http://localhost:3001';

/**
 * 面试题搜索工具 - 集成 pg_trgm 语义搜索 + 结构化过滤
 *
 * 使用方式：
 * - 传入 question 做语义搜索（pg_trgm trigram 相似度，中英文均有效）
 * - 传入 category/source 做精确过滤
 * - 返回 topK 条最相关题目及答案
 *
 * 这是"Tool + RAG"的混合模式：
 * - Tool 提供结构化查询能力（按分类/来源）
 * - pg_trgm 提供语义检索能力（替代传统向量 RAG）
 */
export const searchInterviewQuestions = tool({
  description: `搜索面试题库（共 1548 题，覆盖前端八股文/牛客网校招题/AI 应用）。

【重要】优先使用此工具搜索相关面试题，再基于结果回答用户问题。
- question: 用户的问题或知识点关键词，工具会用 pg_trgm 语义相似度匹配
- category: 按大分类过滤（如"前端核心""前端基础""框架相关""计算机网络"）
- source: 按来源过滤（如"基础篇""高级篇""第九部分"）
- topK: 返回数量，默认 5

当用户要求"随机出题"时，可省略 question 参数，只指定 category/source。
当用户询问具体知识点时（如"React hooks 原理"），务必传入 question 参数做语义搜索。`,

  inputSchema: z.object({
    question: z
      .string()
      .optional()
      .describe('要搜索的问题或知识点关键词，用于语义相似度匹配'),
    category: z
      .string()
      .optional()
      .describe('题目分类（前端基础/前端核心/框架相关/计算机网络等）'),
    source: z
      .string()
      .optional()
      .describe('题目来源（基础篇/进阶篇/高级篇/第九部分等）'),
    topK: z.number().min(1).max(20).optional().default(5).describe('返回题目数量'),
  }),

  execute: async (input: { question?: string; category?: string; source?: string; topK?: number }) => {
    const { question, category, source, topK = 5 } = input;

    const params = new URLSearchParams();
    if (question) params.set('q', question);
    if (category) params.set('category', category);
    if (source) params.set('source', source);
    params.set('topK', String(topK));

    const url = `${NEST_API}/interview/search?${params.toString()}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return {
          success: false,
          message: `搜索失败: HTTP ${res.status}`,
          items: [],
        };
      }

      const data = await res.json();

      // 格式化结果给 LLM 使用
      const items = (data.items || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        category: q.category,
        source: q.source,
      }));

      return {
        success: true,
        total: data.total || items.length,
        query: data.query || question,
        items,
        tip:
          items.length === 0
            ? '未找到匹配的面试题，建议用户调整搜索词或分类后重试。'
            : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `搜索异常: ${err.message}`,
        items: [],
      };
    }
  },
});

/**
 * 获取所有分类及题数（供 Agent 了解数据概况）
 */
export const getInterviewCategories = tool({
  description:
    '获取面试题库中所有分类及每题数，用于了解题库覆盖范围，帮助用户选择合适的分类。',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const res = await fetch(`${NEST_API}/interview/meta/categories`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        return { success: false, categories: [] };
      }
      const data = await res.json();
      return { success: true, categories: data };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
});
