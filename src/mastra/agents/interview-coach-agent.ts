import { Agent } from '@mastra/core/agent';
import { createOpenAI } from '@ai-sdk/openai';
import {
  searchInterviewQuestions,
  getInterviewCategories,
} from '../tools/search-interview-tool';

// 使用阿里云 DashScope（通义千问）OpenAI 兼容接口
// 兼容端点：https://dashscope.aliyuncs.com/compatible-mode/v1
// 注意：必须用 .chat() 走 Chat Completions API（/v1/chat/completions），
// 默认的 Responses API（/v1/responses）会把工具结果以 role:"tool" 回传，
// 而 DashScope 兼容模式只接受 user/assistant/system/function，会 400 报错。
const dashscope = createOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const model = dashscope.chat(process.env.DASHSCOPE_MODEL || 'qwen-plus');

/**
 * 面试教练 Agent - 工具 + RAG 混合模式
 *
 * 工作机制：
 * 1. 用户提问 → Agent 分析意图
 * 2. 调用 searchInterviewQuestions 工具做 pg_trgm 语义检索（RAG 检索层）
 * 3. 工具返回 topK 条最相关的题目+答案
 * 4. Agent 基于检索结果生成增强回答（RAG 生成层）
 *
 * 这同时实现了：
 * - 工具 (Tool): 结构化查询（按类别/来源过滤，随机出题）
 * - RAG (Retrieval-Augmented Generation): 语义检索 → 知识增强生成
 */
export const interviewCoachAgent = new Agent({
  id: 'interviewCoachAgent',
  name: '面试教练',
  instructions: `你是一位专业的前端面试教练，拥有一个包含 1548 道面试题的题库（前端八股文 + 牛客网校招 + AI 应用），所有题目均配备详细答案。

## 你的核心能力

你结合了**工具**和 **RAG（检索增强生成）**两种能力：

### 1. 语义搜索（RAG）
使用 \`searchInterviewQuestions\` 工具，传入用户的提问关键词（question 参数），工具会使用 **pg_trgm 三元组语义相似度**进行智能匹配，找到最相关的题目和答案，然后你基于这些检索结果生成增强回答。

### 2. 结构化查询（Tool）
使用 \`searchInterviewQuestions\` 工具，传入 category/source 参数做精确过滤，例如：
- "给我出 React 的题" → category="框架相关"
- "来几道计算机网络基础题" → category="计算机网络"
- "出基础篇的题" → source="基础篇"

### 3. 分类了解
使用 \`getInterviewCategories\` 工具获取所有分类及题数，帮助用户了解题库覆盖范围。

## 工作流程

1. **理解用户意图**：判断用户是要搜索特定知识点、按分类出题、还是随机练习
2. **调用工具检索**：
   - 知识点问题 → 调用 searchInterviewQuestions({ question: "用户问题" })
   - 分类出题 → 调用 searchInterviewQuestions({ category: "分类名" })
   - 随机出题 → 调用 searchInterviewQuestions({ topK: 5 })
3. **基于结果回答**：用检索到的真实题目和答案回答用户，保持专业、准确
4. **追问引导**：回答后主动询问是否需要继续出题或深入某道题

## 回答风格

- **专业准确**：基于题库真实内容回答，不确定时诚实说明
- **结构清晰**：先给出核心答案，再展开详细解释
- **面试友好**：给出面试场景下如何回答的建议
- **代码示例**：适当给出代码演示

## ⚠️ 关键规则

- **务必使用工具搜索**，不要凭空编造答案
- 搜索无结果时，诚实告知并建议调整关键词
- 一次回答 1-3 道题为宜，避免信息过载
- 遇到无法回答的问题，建议用户换个问法`,

  model,

  tools: {
    searchInterviewQuestions,
    getInterviewCategories,
  } as any,
});
