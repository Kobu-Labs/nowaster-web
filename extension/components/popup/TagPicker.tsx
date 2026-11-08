import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { TagBadge } from "@/components/popup/TagBadge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  tags: Tag[];
  selected: Tag[];
  onToggle: (tag: Tag) => void;
  onCreate: (label: string) => void;
  creating: boolean;
};

/**
 * Multi-select tag dropdown, modelled on the web app's TagPickerUiProvider.
 * Overlays the fields below (see CategoryPicker) and stays open while toggling.
 */
export const TagPicker: FC<Props> = ({ tags, selected, onToggle, onCreate, creating }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim();
  const lower = query.toLowerCase();

  const isSelected = (tag: Tag) => selected.some((t) => t.id === tag.id);
  const matches = tags.filter((t) => t.label.toLowerCase().includes(lower));
  const ordered = [...matches.filter(isSelected), ...matches.filter((t) => !isSelected(t))];
  const exists = tags.some((t) => t.label.trim().toLowerCase() === lower);

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="h-auto min-h-9 w-full flex-wrap justify-start py-1.5"
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
      >
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        {selected.length === 0 ? (
          <span className="text-muted-foreground">Select tags</span>
        ) : (
          selected.map((t) => <TagBadge key={t.id} label={t.label} color={t.color} />)
        )}
      </Button>
      {open ? (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search tags" value={search} onValueChange={setSearch} />
            <CommandList className="max-h-40">
              {query && !exists ? (
                <CommandItem
                  value="__create__"
                  disabled={creating}
                  onSelect={() => {
                    onCreate(query);
                    setSearch("");
                  }}
                >
                  <Plus />
                  Create <TagBadge label={query} color="#7c3aed" />
                </CommandItem>
              ) : null}
              {ordered.length > 0 ? (
                <CommandGroup heading="Tags">
                  {ordered.map((t) => (
                    <CommandItem key={t.id} value={t.id} onSelect={() => onToggle(t)}>
                      <Check className={cn(isSelected(t) ? "opacity-100" : "opacity-0")} />
                      <TagBadge label={t.label} color={t.color} selected={isSelected(t)} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : !query ? (
                <p className="p-3 text-center text-sm text-muted-foreground">Type to create a tag.</p>
              ) : null}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
};
