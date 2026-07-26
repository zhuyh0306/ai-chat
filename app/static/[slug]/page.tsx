"use client";

import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import AppLayout from "@/src/components/AppLayout";
import { getStaticPage } from "@/src/config/staticPages";

export default function StaticPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const page = getStaticPage(slug);

  if (!page) {
    return (
      <AppLayout title="页面不存在">
        <Box sx={{ p: 4 }}>未找到该静态页面：{slug}</Box>
      </AppLayout>
    );
  }

  const isExternal = /^https?:\/\//i.test(page.file);
  const isAbsolute = page.file.startsWith("/");
  const src = isExternal ? page.file : isAbsolute ? page.file : `/static/${page.slug}/${page.file}`;

  return (
    <AppLayout title={page.title}>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <iframe
          src={src}
          title={page.title}
          style={{ flex: 1, width: "100%", height: "100%", border: 0 }}
        />
      </Box>
    </AppLayout>
  );
}
