import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { CategoryBadge } from "@/components/popup/CategoryBadge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  categories: Category[];
  selected: Category | null;
  onSelect: (category: Category) => void;
  onCreate: (name: string) => void;
  creating: boolean;
};

/** Single-select category dropdown, modelled on the web app's CategoryPickerUiProvider. */
export const CategoryPicker: FC<Props> = ({ categories, selected, onSelect, onCreate, creating }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const query = search.trim();
  const lower = query.toLowerCase();

  const matches = categories.filter((c) => c.name.toLowerCase().includes(lower));
  const ordered = [
    ...matches.filter((c) => c.id === selected?.id),
    ...matches.filter((c) => c.id !== selected?.id),
  ];
  const exists = categories.some((c) => c.name.trim().toLowerCase() === lower);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-start">
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          {selected ? (
            <CategoryBadge name={selected.name} color={selected.color} selected />
          ) : (
            <span className="text-muted-foreground">Select category</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search categories" value={search} onValueChange={setSearch} />
          <CommandList>
            {query && !exists ? (
              <CommandItem
                value="__create__"
                disabled={creating}
                onSelect={() => {
                  onCreate(query);
                  setOpen(false);
                }}
              >
                <Plus />
                Create <CategoryBadge name={query} color="#b82e8a" />
              </CommandItem>
            ) : null}
            {ordered.length > 0 ? (
              <CommandGroup heading="Categories">
                {ordered.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      onSelect(c);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn(selected?.id === c.id ? "opacity-100" : "opacity-0")} />
                    <CategoryBadge name={c.name} color={c.color} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : !query ? (
              <p className="p-3 text-center text-sm text-muted-foreground">Type to create a category.</p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
