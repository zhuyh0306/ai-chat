"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Alert,
} from "@mui/material";
import {
  SmartToy as AgentIcon,
  Memory as MemoryIcon,
} from "@mui/icons-material";
import AppLayout from "@/src/components/AppLayout";

interface Agent {
  id: string;
  name: string;
  description: string;
  modelId: string;
  provider: string;
  supportsMemory: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/mastra/agents");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setAgents(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "获取 Agent 列表失败");
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  return (
    <AppLayout title="Agents">
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto", width: "100%" }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          可用 Agent 列表
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          以下是从 Mastra API 获取的所有可用 Agent
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : agents.length === 0 ? (
          <Alert severity="info">暂无可用 Agent</Alert>
        ) : (
          <Grid container spacing={2}>
            {agents.map((agent) => (
              <Grid size={{ xs: 12, md: 6 }} key={agent.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    transition: "box-shadow 0.2s",
                    "&:hover": {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <AgentIcon color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {agent.name}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      ID: {agent.id}
                    </Typography>

                    {agent.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5, lineHeight: 1.5 }}
                      >
                        {agent.description}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                      <Chip
                        label={`模型: ${agent.modelId}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Chip
                        label={`提供商: ${agent.provider}`}
                        size="small"
                        variant="outlined"
                      />
                      {agent.supportsMemory && (
                        <Chip
                          icon={<MemoryIcon sx={{ fontSize: 14 }} />}
                          label="支持记忆"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
}
