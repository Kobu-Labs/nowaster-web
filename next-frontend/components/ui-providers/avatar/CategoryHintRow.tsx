"use client";

import type { Hint } from "@/api/definitions/models/avatar";
import { useAssignCategoryHint } from "@/components/hooks/avatar/useAssignCategoryHint";
import { useCreateHint } from "@/components/hooks/avatar/useCreateHint";
import { useCategoryHints } from "@/components/hooks/avatar/useCategoryHints";
import { useRemoveCategoryHint } from "@/components/hooks/avatar/useRemoveCategoryHint";
import { useSearchHints } from "@/components/hooks/avatar/useSearchHints";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Plus, X } from "lucide-react";
import { type FC, useState } from "react";

type Props = {
  categoryId: string;
  categoryName: string;
};

export const CategoryHintRow: FC<Props> = ({ categoryId, categoryName }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: assigned = [] } = useCategoryHints(categoryId);
  const { data: suggestions = [] } = useSearchHints(query);
  const assign = useAssignCategoryHint(categoryId);
  const remove = useRemoveCategoryHint(categoryId);
  const createHint = useCreateHint();

  const assignedIds = new Set(assigned.map((h) => h.id));
  const filterable = suggestions.filter((h) => !assignedIds.has(h.id));

  const handleSelect = async (hint: Hint) => {
    setOpen(false);
    setQuery("");
    await assign.mutateAsync(hint.id);
  };

  const handleCreate = async () => {
    if (!query.trim()) return;
    const hint = await createHint.mutateAsync(query.trim());
    setOpen(false);
    setQuery("");
    await assign.mutateAsync(hint.id);
  };

  const showCreate =
    query.trim().length > 0 &&
    !suggestions.some(
      (h) => h.label.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <tr>
      <td className="py-3 pr-4 align-top text-sm font-medium">
        {categoryName}
      </td>
      <td className="py-3 align-top">
        <div className="flex flex-wrap items-center gap-1">
          {assigned.map((hint) => (
            <Badge className="gap-1 pr-1" key={hint.id} variant="secondary">
              {hint.label}
              <button
                aria-label={`Remove ${hint.label}`}
                className="ml-0.5 rounded-full opacity-60 hover:opacity-100"
                onClick={() => remove.mutate(hint.id)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Popover onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
              <Button
                className="h-6 gap-1 px-2 text-xs"
                size="sm"
                variant="outline"
              >
                <Plus className="h-3 w-3" />
                Add hint
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-56">
              <Command>
                <CommandInput
                  onValueChange={setQuery}
                  placeholder="Search or create…"
                  value={query}
                />
                <CommandList>
                  {showCreate && (
                    <CommandGroup heading="Create new">
                      <CommandItem onSelect={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create &quot;{query.trim()}&quot;
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {filterable.length > 0 && (
                    <CommandGroup heading="Suggestions">
                      {filterable.map((hint) => (
                        <CommandItem
                          key={hint.id}
                          onSelect={() => handleSelect(hint)}
                          value={hint.label}
                        >
                          {hint.label}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {hint.usageCount}×
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {!showCreate && filterable.length === 0 && (
                    <CommandEmpty>No hints found.</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </td>
    </tr>
  );
};
