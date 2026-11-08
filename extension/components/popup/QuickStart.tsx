import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { CategoryPicker } from "@/components/popup/CategoryPicker";
import { TagPicker } from "@/components/popup/TagPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as api from "@/lib/api";
import { setActiveSession } from "@/lib/storage";
import { refreshFromApi } from "@/lib/sync";
import type { Category, Settings, Tag } from "@/lib/types";

type Props = { settings: Settings; hasActive: boolean };

// New items get a default colour; the web app lets the user recolour them later.
const NEW_CATEGORY_COLOR = "#b82e8a";
const NEW_TAG_COLOR = "#7c3aed";

export const QuickStart: FC<Props> = ({ settings, hasActive }) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
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

  const createTag = useMutation({
    mutationFn: async (label: string) => {
      const created = await api.createTag(settings, { label, color: NEW_TAG_COLOR });
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      setSelectedTags((prev) => [...prev, created]);
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Pick a category");
      const session = await api.startSession(settings, {
        category,
        tagIds: selectedTags.map((t) => t.id),
        description,
      });
      await setActiveSession(session);
      await refreshFromApi();
    },
  });

  // Tags restricted to other categories are hidden; unrestricted tags always show.
  const visibleTags = (tags.data ?? []).filter(
    (t) =>
      !category ||
      !t.allowedCategories ||
      t.allowedCategories.length === 0 ||
      t.allowedCategories.some((c) => c.id === category.id),
  );

  const toggleTag = (tag: Tag) =>
    setSelectedTags((prev) =>
      prev.some((t) => t.id === tag.id) ? prev.filter((t) => t.id !== tag.id) : [...prev, tag],
    );

  const loadError = categories.error ?? tags.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick start</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loadError ? <p className="text-xs text-red-400">{loadError.message}</p> : null}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Category</p>
          <CategoryPicker
            categories={categories.data ?? []}
            selected={category}
            onSelect={setCategory}
            onCreate={(name) => createCategory.mutate(name)}
            creating={createCategory.isPending}
          />
          {createCategory.isError ? <p className="text-xs text-red-400">{createCategory.error.message}</p> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Tags</p>
          <TagPicker
            tags={visibleTags}
            selected={selectedTags}
            onToggle={toggleTag}
            onCreate={(label) => createTag.mutate(label)}
            creating={createTag.isPending}
          />
          {createTag.isError ? <p className="text-xs text-red-400">{createTag.error.message}</p> : null}
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
