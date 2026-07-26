export interface StaticPage {
  slug: string;
  title: string;
  file: string;
}

/**
 * 学习资料（静态 HTML 页）菜单配置。
 * - file 为相对文件名：整文件夹放 public/static/<slug>/，iframe 内嵌 /static/<slug>/<file>。
 * - file 为以 / 开头的绝对路径：直接作为 iframe src（如 nginx 手动托管的 /docs/<slug>/<file>，不进 git/镜像）。
 * - file 为完整 http(s) URL：iframe 直接加载该外链。
 * 新增本地页面：复制文件夹到 public/static/<slug>/ 并追加一项即可。
 */
export const staticPages: StaticPage[] = [
  { slug: "ai-frontend", title: "AI 前端", file: "ai-frontend.html" },
  { slug: "cross-platform", title: "跨平台开发", file: "cross-platform.html" },
  { slug: "css-modern", title: "CSS 现代化", file: "css-modern.html" },
  { slug: "cutting-edge-tech", title: "前沿技术", file: "cutting-edge-tech.html" },
  { slug: "frontend-engineering-testing", title: "前端工程化与测试", file: "frontend-engineering-testing.html" },
  { slug: "frontend-interview-prep", title: "前端面试准备", file: "frontend-interview-prep.html" },
  { slug: "frontend-interview-qa", title: "前端面试问答", file: "frontend-interview-qa.html" },
  { slug: "frontend-learning-priority", title: "前端学习优先级", file: "frontend-learning-priority.html" },
  { slug: "fullstack-companion", title: "全栈开发伴侣", file: "/docs/fullstack-companion/fullstack-companion.html" },
  { slug: "fullstack-guide", title: "全栈开发指南", file: "fullstack-guide.html" },
  { slug: "nestjs-learning-guide", title: "NestJS 学习指南", file: "nestjs-learning-guide.html" },
  { slug: "react-19-fullstack", title: "React 19 全栈", file: "react-19-fullstack.html" },
  { slug: "typescript-advanced", title: "TypeScript 进阶", file: "typescript-advanced.html" },
  { slug: "vue3-nuxt", title: "Vue3 与 Nuxt", file: "vue3-nuxt.html" },
];

export function getStaticPage(slug?: string): StaticPage | undefined {
  return staticPages.find((p) => p.slug === slug);
}
