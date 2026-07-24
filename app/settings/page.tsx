"use client";

import AppLayout from "@/src/components/AppLayout";
import { Box, Typography } from "@mui/material";

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <Box sx={{ p: 4, maxWidth: 800, mx: "auto", width: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Application settings coming soon.
        </Typography>
      </Box>
    </AppLayout>
  );
}
