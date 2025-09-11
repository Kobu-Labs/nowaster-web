import type { Category, TagDetails } from "@/api/definitions";
import { Check, ChevronsUpDown } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import { useCreateTag } from "@/components/hooks/tag/useCreateTag";
import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { fuzzyFindSearch } from "@/lib/searching";
import { cn, randomColor, showSelectedTagsFirst } from "@/lib/utils";

export interface TagPickerUiProviderProps {
  availableTags: TagDetails[];
  disabled?: boolean;
  forCategory?: Category;
  modal?: boolean;
  onNewTagsSelected?: (tags: TagDetails[]) => void;
  selectedTags?: TagDetails[];
  tagMatchStrategy?: (tag: TagDetails, searchTerm: string) => boolean;
  tagsDisplayStrategy?: (
    selectedTags: TagDetails[],
    availableTags: TagDetails[],
  ) => TagDetails[];
}

const fuzzyFindTag = (tag: TagDetails, searchTerm: string) => {
  return fuzzyFindSearch(tag.label, searchTerm).length !== 0;
};

const orderCategories = (
  selectedCategory: Category,
  categories: [string, TagDetails[]][],
): [string, TagDetails[]][] => {
  const selected = categories.find(([name]) => name === selectedCategory.name);
  const unspecified = categories.find(([name]) => name === "-");

  const rest = categories.filter(
    ([name]) => name !== selectedCategory.name && name !== "-",
  );

  if (selected) {
    return unspecified ? [selected, unspecified, ...rest] : [selected, ...rest];
  }

  return unspecified ? [unspecified, ...rest] : categories;
};

export const TagPickerUiProvider: FC<TagPickerUiProviderProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState(randomColor());
  const [selectedTagsInternal, setSelectedTagsInternal] = useState<
    TagDetails[]
  >([]);

  const tagsValue = props.selectedTags ?? selectedTagsInternal;
  const isControlled = props.selectedTags !== undefined;

  // TODO move this higher
  const { mutate: createTag } = useCreateTag();

  const handleTagCreate = (tag: TagDetails) => {
    handleTagSelect(tag);
    setNewTagColor(randomColor());
  };

  const handleTagSelect = (tag: TagDetails) => {
    const newTags = tagsValue.some((t) => t.id === tag.id)
      ? tagsValue.filter((t) => t.id !== tag.id)
      : [tag, ...tagsValue];
    if (!isControlled) {
      setSelectedTagsInternal(newTags);
    }
    if (props.onNewTagsSelected) {
      props.onNewTagsSelected(newTags);
    }
  };

  const matchStrategy = props.tagMatchStrategy ?? fuzzyFindTag;

  let tagsToDisplay = props.availableTags;
  tagsToDisplay = tagsToDisplay.filter((tag) => matchStrategy(tag, searchTerm));

  // group tags based on their allowed categories
  const categories = new Map<string, TagDetails[]>([["-", []]]);
  tagsToDisplay.forEach((tag) => {
    const categoryNames =
      tag.allowedCategories.length > 0
        ? tag.allowedCategories.map((c) => c.name)
        : ["-"];

    categoryNames.forEach((name) => {
      const group = categories.get(name) ?? [];
      group.push(tag);
      categories.set(name, group);
    });
  });

  let categoriesInOrder = [...categories.entries()];
  if (props.forCategory) {
    categoriesInOrder = orderCategories(props.forCategory, categoriesInOrder);
  }
  const tagsOrderStrategy = props.tagsDisplayStrategy ?? showSelectedTagsFirst;

  return (
    <Popover
      modal={props.modal}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchTerm("");
        }
        setIsOpen(shouldOpen);
      }}
      open={isOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={isOpen}
          className="max-w-full grow justify-start"
          disabled={props.disabled}
          role="combobox"
          variant="outline"
        >
          <ChevronsUpDown className="mx-2 size-4 shrink-0 opacity-50" />
          <ScrollArea className="flex  max-w-full overflow-hidden ">
            <div className="flex w-max max-w-full gap-1">
              {tagsValue.length === 0
                ? "Select Tags"
                : tagsValue.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} variant="auto" />
                  ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder="Search tags"
          />
          {searchTerm &&
            props.availableTags.every((t) => t.label !== searchTerm) && (
              <CommandGroup>
                <CommandItem
                  className="flex"
                  onSelect={() => {
                    createTag(
                      {
                        allowedCategories: [],
                        color: newTagColor,
                        label: searchTerm,
                      },
                      { onSuccess: handleTagCreate },
                    );
                  }}
                >
                  <p>Create</p>
                  <div className="grow"></div>
                  <TagBadge
                    colors={newTagColor}
                    value={searchTerm}
                    variant="manual"
                  />
                </CommandItem>
              </CommandGroup>
            )}
          <ScrollArea
            className="max-h-48 overflow-y-auto rounded-md border-none"
            type="always"
          >
            {categoriesInOrder.map(([category, tags]) => (
              <CommandGroup heading={category} key={category}>
                {tagsOrderStrategy(tagsValue, tags).map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => {
                      handleTagSelect(tag);
                    }}
                    value={tag.id}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        tagsValue.some((t) => t.id === tag.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <TagBadge tag={tag} variant="auto" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
