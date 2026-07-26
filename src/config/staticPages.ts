export interface StaticPage {
  slug: string;
  title: string;
  file: string;
}

/**
 * 学习资料（静态 HTML 页）菜单配置。
 * 所有页面文件均由 nginx 从 /home/ai-chat/static-docs/ 直接 serve（前缀 /docs/<slug>/），
 * 不进 git、不进 Docker 镜像，避免仓库/镜像膨胀。
 * 菜单路由仍由 Next.js 提供（/static/<slug>），页面内 iframe 再加载 /docs/<slug>/<file>。
 * 新增/更新页面：把整文件夹上传到 ECS 的 /home/ai-chat/static-docs/<slug>/ 即可。
 */
export const staticPages: StaticPage[] = [
  { slug: "ai-frontend", title: "AI 前端", file: "/docs/ai-frontend/ai-frontend.html" },
  { slug: "cross-platform", title: "跨平台开发", file: "/docs/cross-platform/cross-platform.html" },
  { slug: "css-modern", title: "CSS 现代化", file: "/docs/css-modern/css-modern.html" },
  { slug: "cutting-edge-tech", title: "前沿技术", file: "/docs/cutting-edge-tech/cutting-edge-tech.html" },
  { slug: "frontend-engineering-testing", title: "前端工程化与测试", file: "/docs/frontend-engineering-testing/frontend-engineering-testing.html" },
  { slug: "frontend-interview-prep", title: "前端面试准备", file: "/docs/frontend-interview-prep/frontend-interview-prep.html" },
  { slug: "frontend-interview-qa", title: "前端面试问答", file: "/docs/frontend-interview-qa/frontend-interview-qa.html" },
  { slug: "frontend-learning-priority", title: "前端学习优先级", file: "/docs/frontend-learning-priority/frontend-learning-priority.html" },
  { slug: "fullstack-companion", title: "全栈开发伴侣", file: "/docs/fullstack-companion/fullstack-companion.html" },
  { slug: "fullstack-guide", title: "全栈开发指南", file: "/docs/fullstack-guide/fullstack-guide.html" },
  { slug: "nestjs-learning-guide", title: "NestJS 学习指南", file: "/docs/nestjs-learning-guide/nestjs-learning-guide.html" },
  { slug: "react-19-fullstack", title: "React 19 全栈", file: "/docs/react-19-fullstack/react-19-fullstack.html" },
  { slug: "typescript-advanced", title: "TypeScript 进阶", file: "/docs/typescript-advanced/typescript-advanced.html" },
  { slug: "vue3-nuxt", title: "Vue3 与 Nuxt", file: "/docs/vue3-nuxt/vue3-nuxt.html" },
];

export function getStaticPage(slug?: string): StaticPage | undefined {
  return staticPages.find((p) => p.slug === slug);
}
