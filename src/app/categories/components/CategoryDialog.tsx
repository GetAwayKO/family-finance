"use client";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import {
  CATEGORY_KIND_LABELS,
  type Category,
  type CategoryKind,
} from "@/shared/finance/types";

interface CategoryDialogProps {
  /** Категория для редактирования; без неё — создание. */
  category?: Category;
  kind: CategoryKind;
  categories: Category[];
  onClose(): void;
  onSaved(): void;
}

const NO_PARENT = "";

export default function CategoryDialog({
  category,
  kind: initialKind,
  categories,
  onClose,
  onSaved,
}: CategoryDialogProps) {
  const [id] = useState(() => category?.id ?? crypto.randomUUID());
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? initialKind);
  const [parentId, setParentId] = useState(category?.parentId ?? NO_PARENT);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasChildren =
    !!category && categories.some((c) => c.parentId === category.id);
  // Вложенность — один уровень: родителем может быть только категория верхнего уровня.
  const parents = categories.filter(
    (c) => c.kind === kind && !c.parentId && c.id !== id && !c.archived,
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const parent = parentId === NO_PARENT ? null : parentId;
    try {
      await call(() =>
        category
          ? api.PATCH("/categories/{id}", {
              params: { path: { id } },
              body: { name: name.trim(), parentId: parent },
            })
          : api.POST("/categories", {
              body: { id, name: name.trim(), kind, parentId: parent },
            }),
      );
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{category ? "Категория" : "Новая категория"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <TextField
              select
              label="Тип"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as CategoryKind);
                setParentId(NO_PARENT);
              }}
              disabled={!!category}
            >
              {Object.entries(CATEGORY_KIND_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Входит в"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={hasChildren}
              helperText={
                hasChildren
                  ? "У категории есть подкатегории, вложить её нельзя"
                  : undefined
              }
            >
              <MenuItem value={NO_PARENT}>— верхний уровень —</MenuItem>
              {parents.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !name.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
