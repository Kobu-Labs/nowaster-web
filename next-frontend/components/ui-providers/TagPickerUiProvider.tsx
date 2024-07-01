import { FC, useState } from "react";
import { TagApi } from "@/api";
import { Result } from "@badrap/result";
import {
  TagRequest,
  TagResponse,
  TagWithId,
} from "@kobu-labs/nowaster-js-typing";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
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

export type TagPickerUiProviderProps = {
  availableTags: TagWithId[];
  selectedTags: TagWithId[];
  onSelectTag: (tag: TagWithId) => void;
  tagsDisplayStrategy?: (
    selectedTags: TagWithId[],
    availableTags: TagWithId[]
  ) => TagWithId[];
  tagMatchStrategy?: (tag: TagWithId, searchTerm: string) => boolean;
  modal?: boolean;
};

export const TagPickerUiProvider: FC<TagPickerUiProviderProps> = (props) => {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // TODO move this higher
  const { mutate: createTag } = useMutation<
    Result<TagResponse["create"]>,
    unknown,
    TagRequest["create"]
  >({
    mutationFn: async (params) => await TagApi.create(params),
    retry: false,
    onSuccess: (tagResult) => {
      if (tagResult.isErr) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
      props.onSelectTag(tagResult.value);
    },
  });

  let tagsInDisplayOrder = props.availableTags;
  if (props.tagsDisplayStrategy) {
    tagsInDisplayOrder = props.tagsDisplayStrategy(
      props.selectedTags,
      props.availableTags
    );
  }

  if (props.tagMatchStrategy) {
    tagsInDisplayOrder = tagsInDisplayOrder.filter((tag) =>
      props.tagMatchStrategy!(tag, searchTerm)
    );
  }

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
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="max-w-full grow justify-start"
        >
          <ChevronsUpDown className="mx-2 size-4 shrink-0 opacity-50" />
          <ScrollArea  className="flex  max-w-full overflow-hidden ">
            <div className="flex w-max max-w-full gap-1">
              {props.selectedTags.length === 0
                ? "Select Tags"
                : props.selectedTags.map((tag) => (
                  <TagBadge key={tag.id} value={tag.label} />
                ))}
            </div>
            <ScrollBar orientation="horizontal"  />
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
                onSelect={() => createTag({ label: searchTerm })}
              >
                <p>Create</p>
                <div className="grow"></div>
                <TagBadge value={searchTerm} />
              </CommandItem>
            </CommandGroup>
          )}
          <CommandGroup>
            <ScrollArea
              type="always"
              className="max-h-48 overflow-y-auto rounded-md border-none"
            >
              {tagsInDisplayOrder.map((tag) => (
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
                        : "opacity-0"
                    )}
                  />
                  <TagBadge value={tag.label} />
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
