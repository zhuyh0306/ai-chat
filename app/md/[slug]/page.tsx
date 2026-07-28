"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import AppLayout from "@/src/components/AppLayout";
import MarkdownRenderer from "@/src/components/MarkdownRenderer";
import { getMarkdownDoc } from "@/src/config/markdownDocs";

export default function MarkdownPage() {
  const params = useParams<{ slug: string | string[] }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const doc = getMarkdownDoc(slug);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doc) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setContent("");

    fetch(doc.file, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => setContent(text))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [doc]);

  return (
    <AppLayout title={doc?.title ?? "Markdown 文档"}>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, md: 4 },
          py: 3,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 900 }}>
          {!doc && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              未找到 Markdown 文档：<code>{slug}</code>
              。请检查 src/config/markdownDocs.ts 是否配置了对应的 slug。
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              加载失败（{error}）。请确认 ECS 上的 {doc?.file} 已上传到
              /root/static-docs 对应目录，且 nginx 可访问。
            </Alert>
          )}

          {!loading && !error && doc && content && (
            <MarkdownRenderer content={content} />
          )}

          {!loading && !error && doc && !content && (
            <Typography color="text.secondary">文档内容为空。</Typography>
          )}
        </Box>
      </Box>
    </AppLayout>
  );
}
