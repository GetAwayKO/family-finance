"use client";
import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import Page from "@/components/layout/Page";
import { api } from "@/shared/api/client";
import { ApiError, call } from "@/shared/api/request";
import { categoryTree } from "@/shared/finance/categories";
import { useCategories } from "@/shared/finance/hooks";
import {
  CATEGORY_KIND_LABELS,
  type Category,
  type CategoryKind,
} from "@/shared/finance/types";
import CategoryDialog from "./components/CategoryDialog";

type Editing = { category?: Category; kind: CategoryKind } | null;

export default function CategoriesPage() {
  const categories = useCategories();
  const [editing, setEditing] = useState<Editing>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const all = categories.data ?? [];

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      categories.reload();
    } catch (e) {
      setActionError(
        e instanceof ApiError ? e.message : "Не удалось выполнить",
      );
    }
  }

  const setArchived = (category: Category, archived: boolean) =>
    run(() =>
      call(() =>
        api.PATCH("/categories/{id}", {
          params: { path: { id: category.id } },
          body: { archived },
        }),
      ),
    );

  const remove = (category: Category) => {
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) return;
    void run(() =>
      call(() =>
        api.DELETE("/categories/{id}", {
          params: { path: { id: category.id } },
        }),
      ),
    );
  };

  return (
    <Page
      title="Категории"
      error={categories.error ?? actionError}
      actions={
        <FormControlLabel
          control={
            <Switch
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
          }
          label="Показать архив"
        />
      }
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          alignItems: "start",
        }}
      >
        {(["expense", "income"] as const).map((kind) => (
          <Paper key={kind} sx={{ p: 2 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="h6" component="h3" sx={{ mb: 0 }}>
                {CATEGORY_KIND_LABELS[kind]}
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setEditing({ kind })}
              >
                Добавить
              </Button>
            </Stack>
            <List dense>
              {categoryTree(all, kind)
                .filter(({ category }) => showArchived || !category.archived)
                .map(({ category, depth }) => (
                  <ListItem
                    key={category.id}
                    sx={{ pl: 1 + depth * 4 }}
                    secondaryAction={
                      <>
                        <Tooltip title="Изменить">
                          <IconButton
                            edge="end"
                            onClick={() => setEditing({ category, kind })}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            category.archived ? "Вернуть из архива" : "В архив"
                          }
                        >
                          <IconButton
                            edge="end"
                            onClick={() =>
                              setArchived(category, !category.archived)
                            }
                          >
                            {category.archived ? (
                              <UnarchiveOutlinedIcon fontSize="small" />
                            ) : (
                              <ArchiveOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            edge="end"
                            onClick={() => remove(category)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    }
                  >
                    <ListItemText
                      primary={
                        <>
                          {category.name}{" "}
                          {category.archived && (
                            <Chip size="small" label="в архиве" />
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          </Paper>
        ))}
      </Box>
      {editing && (
        <CategoryDialog
          category={editing.category}
          kind={editing.kind}
          categories={all}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            categories.reload();
          }}
        />
      )}
    </Page>
  );
}
