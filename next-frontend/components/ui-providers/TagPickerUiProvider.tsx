import { FC, useState } from "react";
import { Category, TagDetails } from "@/api/definitions";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn, randomColor, showSelectedTagsFirst } from "@/lib/utils";
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
import FuzzySearch from "fuzzy-search";
import { useCreateTag } from "@/components/hooks/tag/useCreateTag";

export type TagPickerUiProviderProps = {
  availableTags: TagDetails[];
  selectedTags: TagDetails[];
  forCategory?: Category;
  onSelectTag: (tag: TagDetails) => void;
  tagsDisplayStrategy?: (
    selectedTags: TagDetails[],
    availableTags: TagDetails[],
  ) => TagDetails[];
  tagMatchStrategy?: (tag: TagDetails, searchTerm: string) => boolean;
  modal?: boolean;
  disabled?: boolean;
};

const fuzzyFindStrategy = (tags: TagDetails, searchTerm: string): boolean => {
  const searcher = new FuzzySearch([tags.label], []);
  const result = searcher.search(searchTerm);
  return result.length !== 0;
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
  // this is used if the user is creating a new tag
  const [newTagColor, setNewTagColor] = useState(randomColor());

  // TODO move this higher
  const { mutate: createTag } = useCreateTag({
    onSuccess: (tag) => {
      props.onSelectTag(tag);
      setNewTagColor(randomColor());
    },
  });

  const matchStrategy = props.tagMatchStrategy ?? fuzzyFindStrategy;

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

  let categoriesInOrder = Array.from(categories.entries());
  if (props.forCategory) {
    categoriesInOrder = orderCategories(props.forCategory, categoriesInOrder);
  }
  const tagsOrderStrategy = props.tagsDisplayStrategy ?? showSelectedTagsFirst;

  return (
    <Popover
      modal={props.modal}
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchTerm("");
        }
        setIsOpen(shouldOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          disabled={props.disabled}
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="max-w-full grow justify-start"
        >
          <ChevronsUpDown className="mx-2 size-4 shrink-0 opacity-50" />
          <ScrollArea className="flex  max-w-full overflow-hidden ">
            <div className="flex w-max max-w-full gap-1">
              {props.selectedTags.length === 0
                ? "Select Tags"
                : props.selectedTags.map((tag) => (
                  <TagBadge tag={tag} variant="auto" key={tag.id}/>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
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
                onSelect={() =>
                  createTag({
                    color: newTagColor,
                    label: searchTerm,
                    allowedCategories: [],
                  })
                }
              >
                <p>Create</p>
                <div className="grow"></div>
                <TagBadge
                  variant="manual"
                  value={searchTerm}
                  colors={newTagColor}
                />
              </CommandItem>
            </CommandGroup>
          )}
          <ScrollArea
            type="always"
            className="max-h-48 overflow-y-auto rounded-md border-none"
          >
            {categoriesInOrder.map(([category, tags]) => (
              <CommandGroup heading={category} key={category}>
                {tagsOrderStrategy(props.selectedTags, tags).map((tag) => (
                  <CommandItem
                    value={tag.label}
                    key={tag.id}
                    onSelect={() => props.onSelectTag(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        props.selectedTags.some((t) => t.id === tag.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <TagBadge variant="auto" tag={tag} />
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
