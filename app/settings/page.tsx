"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import AppLayout from "@/src/components/AppLayout";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/AuthProvider";
import { apiFetch } from "@/src/lib/api";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
}

const PROVIDERS = [
  "alibaba-cn",
  "openai",
  "anthropic",
  "google",
  "azure",
  "moonshot-v1",
  "zhipu",
  "baichuan",
  "deepseek",
  "custom",
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);

  const [formName, setFormName] = useState("");
  const [formId, setFormId] = useState("");
  const [formProvider, setFormProvider] = useState("alibaba-cn");

  // 从服务端加载模型配置
  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<ModelConfig[]>("/models");
      setModels(data);
    } catch {
      console.warn("加载模型配置失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingModel(null);
    setFormName("");
    setFormId("");
    setFormProvider("alibaba-cn");
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model);
    setFormName(model.name);
    setFormId(model.id);
    setFormProvider(model.provider);
    setDialogOpen(true);
  };

  // 保存模型（新增或编辑）
  const handleSave = async () => {
    const trimmedId = formId.trim();
    const trimmedName = formName.trim();
    if (!trimmedId || !trimmedName) return;

    try {
      if (editingModel) {
        // 编辑：调用 PUT /api/models/[id]
        const data = await apiFetch<ModelConfig[]>(
          `/models/${encodeURIComponent(editingModel.id)}`,
          {
            method: "PUT",
            body: JSON.stringify({ name: trimmedName, provider: formProvider }),
          },
        );
        setModels(data);
      } else {
        // 新增：调用 POST /api/models
        const data = await apiFetch<ModelConfig[]>("/models", {
          method: "POST",
          body: JSON.stringify({ id: trimmedId, name: trimmedName, provider: formProvider }),
        });
        setModels(data);
      }
      setDialogOpen(false);
    } catch (e) {
      alert(`操作失败: ${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  // 删除模型
  const handleDelete = async (modelId: string) => {
    try {
      const data = await apiFetch<ModelConfig[]>(
        `/models/${encodeURIComponent(modelId)}`,
        { method: "DELETE" },
      );
      setModels(data);
    } catch (e) {
      alert(`删除失败: ${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  // 重置为默认
  const handleReset = async () => {
    try {
      const data = await apiFetch<ModelConfig[]>("/models", {
        method: "PUT",
        body: JSON.stringify({ reset: true }),
      });
      setModels(data);
    } catch (e) {
      alert(`重置失败: ${e instanceof Error ? e.message : "未知错误"}`);
    }
  };

  return (
    <AppLayout title="Settings">
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto", width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            模型配置
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" onClick={handleReset}>
              重置默认
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd}>
              添加模型
            </Button>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          在此配置可选的 AI 大模型，配置后可在聊天页面中选择使用（配置存储在服务端）
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : models.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            暂无配置的模型，点击"添加模型"开始配置
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {models.map((model) => (
              <Grid size={{ xs: 12, sm: 6 }} key={model.id}>
                <Card
                  variant="outlined"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <CardContent sx={{ py: 0, px: 0, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {model.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                      <Chip label={model.id} size="small" variant="outlined" />
                      <Chip
                        label={model.provider}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => handleEdit(model)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(model.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 新增/编辑对话框 */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingModel ? "编辑模型" : "添加模型"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="模型 ID"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="例如: deepseek-v4-flash"
                size="small"
                fullWidth
                helperText="模型的唯一标识符，对应 Mastra API 中的 model 参数"
                disabled={!!editingModel}
              />
              <TextField
                label="模型名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="例如: DeepSeek V4 Flash"
                size="small"
                fullWidth
                helperText="在前端选择器中显示的名称"
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={formProvider}
                  label="Provider"
                  onChange={(e) => setFormProvider(e.target.value)}
                >
                  {PROVIDERS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>取消</Button>
            <Button variant="contained" onClick={handleSave} disabled={!formId.trim() || !formName.trim()}>
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
