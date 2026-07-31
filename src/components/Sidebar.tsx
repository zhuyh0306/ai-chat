"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  AutoAwesome as SparklesIcon,
  SmartToy as AgentIcon,
  MenuBook as MenuBookIcon,
  Article as ArticleIcon,
  Psychology as CoachIcon,
} from "@mui/icons-material";
import { ReactNode } from "react";
import { staticPages } from "@/src/config/staticPages";
import { markdownDocs } from "@/src/config/markdownDocs";

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const mainNavItems: NavItem[] = [
  { label: "AI Chat", path: "/", icon: <ChatIcon /> },
  { label: "面试教练", path: "/interview", icon: <CoachIcon /> },
  { label: "Agents", path: "/agents", icon: <AgentIcon /> },
  { label: "Dashboard", path: "/dashboard", icon: <SparklesIcon /> },
];

const staticNavItems: NavItem[] = staticPages.map((p) => ({
  label: p.title,
  path: `/static/${p.slug}`,
  icon: <MenuBookIcon />,
}));

const markdownNavItems: NavItem[] = markdownDocs.map((p) => ({
  label: p.title,
  path: `/md/${p.slug}`,
  icon: <ArticleIcon />,
}));

const secondaryNavItems: NavItem[] = [
  { label: "Settings", path: "/settings", icon: <SettingsIcon /> },
  { label: "About", path: "/about", icon: <InfoIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const renderItem = (item: NavItem) => (
    <ListItemButton
      key={item.path}
      selected={isActive(item.path)}
      onClick={() => router.push(item.path)}
      sx={{
        px: 1.5,
        py: 1,
        color: isActive(item.path) ? "primary.main" : "text.secondary",
        "&.Mui-selected": {
          backgroundColor: "primary.main",
          color: "#fff",
          "&:hover": {
            backgroundColor: "primary.dark",
          },
          "& .MuiListItemIcon-root": {
            color: "#fff",
          },
        },
        "&:hover:not(.Mui-selected)": {
          backgroundColor: "action.hover",
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 40,
          color: isActive(item.path) ? "inherit" : "text.secondary",
        }}
      >
        {item.icon}
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        sx={{
          "& .MuiListItemText-primary": {
            fontSize: 14,
            fontWeight: isActive(item.path) ? 600 : 500,
          },
        }}
      />
    </ListItemButton>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      {/* Logo 区域 */}
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SparklesIcon sx={{ fontSize: 18, color: "#fff" }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              Mastra AI
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", lineHeight: 1.2 }}
            >
              Powered by AI
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Divider />

      {/* 主导航 */}
      <Box sx={{ flex: 1, overflow: "auto", px: 1.5, pt: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            px: 2,
            pb: 0.5,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Menu
        </Typography>
        <List dense disablePadding>
          {mainNavItems.map(renderItem)}
        </List>

        <Divider sx={{ my: 1.5 }} />

        <Typography
          variant="caption"
          sx={{
            px: 2,
            pb: 0.5,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          学习资料
        </Typography>
        <List dense disablePadding>
          {staticNavItems.map(renderItem)}
        </List>

        {markdownNavItems.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />

            <Typography
              variant="caption"
              sx={{
                px: 2,
                pb: 0.5,
                fontWeight: 600,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Markdown 文档
            </Typography>
            <List dense disablePadding>
              {markdownNavItems.map(renderItem)}
            </List>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Typography
          variant="caption"
          sx={{
            px: 2,
            pb: 0.5,
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          System
        </Typography>
        <List dense disablePadding>
          {secondaryNavItems.map(renderItem)}
        </List>
      </Box>

      {/* 底部版本信息 */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", fontSize: 11 }}
        >
          v1.0.0 - Mastra.ai
        </Typography>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
