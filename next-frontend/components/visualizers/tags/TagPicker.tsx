import { FC, useState } from "react"
import { TagApi } from "@/api"
import { Result } from "@badrap/result"
import {
  TagRequest,
  TagResponse,
  TagWithId,
} from "@kobu-labs/nowaster-js-typing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown } from "lucide-react"

import { prefixBasedMatch } from "@/lib/searching"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys"
import { Button } from "@/components/shadcn/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/shadcn/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover"
import { ScrollArea } from "@/components/shadcn/scroll-area"
import { TagBadge } from "@/components/visualizers/tags/TagBadge"

type TagPickerProps = {
  onTagSelected: (tag: TagWithId[]) => void
}

export const TagPicker: FC<TagPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  })

  const queryClient = useQueryClient()
  const { mutate: createTag } = useMutation<
    Result<TagResponse["create"]>,
    unknown,
    TagRequest["create"]
  >({
    mutationFn: async (params) => await TagApi.create(params),
    retry: false,
    onSuccess: (tagResult) => {
      if (tagResult.isErr) {
        return
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.tags._def })
      handleSelectTag(tagResult.value)
    },
  })

  if (!tags || isLoading || isError) {
    return <div>Something bad happenned</div>
  }

  if (tags.isErr) {
    return <div>{tags.error.message}</div>
  }

  const showSelectedTagsFirst = (tags: TagWithId[]) => {
    return tags.sort((tag1, tag2) => {
      if (selectedTags.some((t) => t.id === tag1.id)) {
        if (selectedTags.some((t) => t.id === tag2.id)) {
          return 0
        }
        return -1
      }

      if (selectedTags.some((t) => t.id === tag2.id)) {
        return 1
      }
      return 0
    })
  }

  const handleDeselectTag = (tag: TagWithId) => {
    const newTags = selectedTags.filter((t) => t.id !== tag.id)
    setSelectedTags(newTags)
    props.onTagSelected(newTags)
  }
  const handleSelectTag = (tag: TagWithId) => {
    const newTags = [tag, ...selectedTags]
    setSelectedTags(newTags)
    props.onTagSelected(newTags)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchTerm("")
        }
        setIsOpen(shouldOpen)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-start"
        >
          {selectedTags.length === 0
            ? "Select Tags"
            : selectedTags.map((tag) => (
                <TagBadge key={tag.id} value={tag.label} />
              ))}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder="Search tags"
          />
          {searchTerm && tags.value.every((t) => t.label !== searchTerm) && (
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
              {showSelectedTagsFirst(tags.value)
                .filter((tag) =>
                  prefixBasedMatch(tag.label, searchTerm, {
                    caseInsensitive: true,
                  })
                )
                .map((tag) => (
                  <CommandItem
                    value={tag.label}
                    key={tag.id}
                    onSelect={() =>
                      selectedTags.some((t) => t.id === tag.id)
                        ? handleDeselectTag(tag)
                        : handleSelectTag(tag)
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some((t) => t.id === tag.id)
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
  )
}
