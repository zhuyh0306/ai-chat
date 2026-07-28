// Markdown 文档清单
// 文档文件由 nginx 托管（与 staticPages 同一套机制）：
//   宿主机目录: /root/static-docs/<slug>/<file>
//   nginx 访问:  http://<host>/docs/<slug>/<file>
// 例如 file: "/docs/guide/getting-started.md"
//   对应 ECS 上的 /root/static-docs/guide/getting-started.md
//
// 新增一篇文档：在 ECS 上把 .md 传到 /root/static-docs/<slug>/<file>，
// 然后在此数组追加一条记录即可，无需改代码。

export interface MarkdownDoc {
  slug: string;
  title: string;
  /** nginx 托管的 .md 路径，例如 /docs/guide/getting-started.md */
  file: string;
}

export const markdownDocs: MarkdownDoc[] = [
  {
    slug: "getting-started",
    title: "快速开始",
    file: "/docs/md/getting-started.md",
  },
];

export function getMarkdownDoc(slug?: string): MarkdownDoc | undefined {
  if (!slug) return undefined;
  return markdownDocs.find((d) => d.slug === slug);
}
