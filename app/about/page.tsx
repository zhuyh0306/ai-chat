"use client";

import AppLayout from "@/src/components/AppLayout";
import { Box, Typography, Paper, Divider } from "@mui/material";

export default function AboutPage() {
  return (
    <AppLayout title="About">
      <Box sx={{ p: 4, maxWidth: 800, mx: "auto", width: "100%" }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: 1, borderColor: "divider" }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
            Mastra AI Chat
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            v1.0.0
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            An AI-powered chat application built with Next.js 16, Material UI, and
            Mastra.ai agent framework. This application demonstrates how to
            integrate AI agents with a modern React frontend.
          </Typography>
        </Paper>
      </Box>
    </AppLayout>
  );
}
