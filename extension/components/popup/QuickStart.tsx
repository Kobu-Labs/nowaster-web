import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { setActiveSession } from "@/lib/storage";
import { refreshFromApi } from "@/lib/sync";
import type { Category, Settings } from "@/lib/types";

type Props = { settings: Settings; hasActive: boolean };

const MAX_SHOWN = 8;
// Matches the badge colour; the web app lets the user recolour the category later.
const NEW_CATEGORY_COLOR = "#b82e8a";

export const QuickStart: FC<Props> = ({ settings, hasActive }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const categories = useQuery({ queryKey: ["categories", settings.apiBase], queryFn: () => api.getCategories(settings) });
  const tags = useQuery({ queryKey: ["tags", settings.apiBase], queryFn: () => api.getTags(settings) });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const created = await api.createCategory(settings, { name, color: NEW_CATEGORY_COLOR });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategory(created);
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Pick a category");
      const session = await api.startSession(settings, { category, tagIds, description });
      await setActiveSession(session);
      await refreshFromApi();
    },
  });

  const q = search.trim().toLowerCase();
  const shownCategories = useMemo(
    () => (categories.data ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, MAX_SHOWN),
    [categories.data, q],
  );
  const shownTags = useMemo(
    () =>
      (tags.data ?? [])
        .filter((t) => t.label.toLowerCase().includes(q))
        .filter((t) => !category || !t.allowedCategories || t.allowedCategories.length === 0 || t.allowedCategories.some((c) => c.id === category.id))
        .slice(0, MAX_SHOWN),
    [tags.data, q, category],
  );

  const exactCategory = categories.data?.some((c) => c.name.trim().toLowerCase() === q) ?? false;
  const canCreateCategory = q.length > 0 && categories.isSuccess && !exactCategory;

  const toggleTag = (id: string) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const loadError = categories.error ?? tags.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick start</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          placeholder="Search categories and tags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search categories and tags"
        />
        {loadError ? <p className="text-xs text-red-400">{loadError.message}</p> : null}
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-1">
            {shownCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c)}>
                <Badge variant={category?.id === c.id ? "active" : "default"}>
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </Badge>
              </button>
            ))}
            {categories.isSuccess && shownCategories.length === 0 && !canCreateCategory ? (
              <span className="text-xs text-muted-foreground">No categories</span>
            ) : null}
            {canCreateCategory ? (
              <Button
                variant="outline"
                size="sm"
                disabled={createCategory.isPending}
                onClick={() => createCategory.mutate(search.trim())}
              >
                <Plus className="h-4 w-4" /> Create &quot;{search.trim()}&quot;
              </Button>
            ) : null}
          </div>
          {createCategory.isError ? <p className="mt-1 text-xs text-red-400">{createCategory.error.message}</p> : null}
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1">
            {shownTags.map((t) => (
              <button key={t.id} type="button" onClick={() => toggleTag(t.id)}>
                <Badge variant={tagIds.includes(t.id) ? "active" : "outline"}>{t.label}</Badge>
              </button>
            ))}
            {tags.isSuccess && shownTags.length === 0 ? (
              <span className="text-xs text-muted-foreground">No tags</span>
            ) : null}
          </div>
        </div>
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
        />
        <Button disabled={!category || start.isPending || hasActive} onClick={() => start.mutate()}>
          <Play className="h-4 w-4" />
          {start.isPending ? "Starting..." : "Start"}
        </Button>
        {hasActive ? <p className="text-xs text-muted-foreground">Stop the current session to start another</p> : null}
        {start.isError ? <p className="text-xs text-red-400">{start.error.message}</p> : null}
      </CardContent>
    </Card>
  );
};
