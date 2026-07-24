"use client";

import { Typography, Box, Paper, Grid } from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SpeedIcon from "@mui/icons-material/Speed";
import AppLayout from "@/src/components/AppLayout";

const stats = [
  { label: "Total Messages", value: "1,234", icon: <ChatBubbleOutlineIcon />, color: "#2563eb" },
  { label: "Avg Response", value: "1.2s", icon: <SpeedIcon />, color: "#7c3aed" },
  { label: "Active Sessions", value: "12", icon: <AutoGraphIcon />, color: "#059669" },
  { label: "Uptime", value: "99.9%", icon: <AccessTimeIcon />, color: "#d97706" },
];

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AppLayout>
  );
}
