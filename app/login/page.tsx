"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@/src/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [tab, setTab] = useState(0); // 0=登录 1=注册
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!username || !password || (tab === 1 && !email)) {
      setError("请填写所有必填字段");
      return;
    }
    setLoading(true);
    try {
      if (tab === 0) {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: 400, maxWidth: "100%" }} elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Mastra AI Chat
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            登录后使用模型配置与对话功能
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setError("");
            }}
            sx={{ mb: 2 }}
          >
            <Tab label="登录" />
            <Tab label="注册" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              size="small"
            />
            {tab === 1 && (
              <TextField
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                size="small"
              />
            )}
            <TextField
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ py: 1, textTransform: "none" }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : tab === 0 ? (
                "登录"
              ) : (
                "注册"
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
