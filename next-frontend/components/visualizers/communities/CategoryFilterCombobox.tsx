"use client";

import { useCategoryAutocomplete } from "@/components/hooks/community/useCategoryAutocomplete";
import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type CategoryFilterComboboxProps = {
  onValueChange: (value: string | undefined) => void;
  value: string | undefined;
};

export const CategoryFilterCombobox: FC<CategoryFilterComboboxProps> = ({
  onValueChange,
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, prefix, setPrefix, suggestions } = useCategoryAutocomplete();

  return (
    <div className="flex items-center gap-1">
      <Popover
        onOpenChange={(shouldOpen) => {
          if (!shouldOpen) {
            setPrefix("");
          }
          setIsOpen(shouldOpen);
        }}
        open={isOpen}
      >
        <PopoverTrigger asChild>
          <Button
            aria-expanded={isOpen}
            className="w-full justify-between sm:w-52"
            role="combobox"
            variant="outline"
          >
            {value ?? "Filter by category"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              onValueChange={setPrefix}
              placeholder="Search categories"
              value={prefix}
            />
            {!isLoading && suggestions.length === 0 && (
              <CommandEmpty>No categories found.</CommandEmpty>
            )}
            <CommandGroup>
              {suggestions.map((category) => (
                <CommandItem
                  key={category}
                  onSelect={() => {
                    onValueChange(category);
                    setIsOpen(false);
                  }}
                  value={category}
                >
                  <Check
                    className={value === category ? "mr-2 h-4 w-4 opacity-100" : "mr-2 h-4 w-4 opacity-0"}
                  />
                  {category}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          className="h-10 w-10 shrink-0"
          onClick={() => onValueChange(undefined)}
          size="icon"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
