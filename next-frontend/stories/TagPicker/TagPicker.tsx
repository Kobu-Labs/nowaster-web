import { TagApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { prefixBasedMatch } from "@/lib/searching";
import { cn } from "@/lib/utils";
import { Tag } from "@/validation/models";
import { CreateTagRequest } from "@/validation/requests/tags";
import { CreateTagResponse } from "@/validation/responses/tags";
import { Result } from "@badrap/result";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useState } from "react";
import { SessionTag } from "../SessionTag/SessionTag";

type TagWithId = Tag & { id: string }

type TagPickerProps = {
  onTagSelected: (tag: TagWithId[]) => void
}

export const TagPicker: FC<TagPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: tags, isLoading, isError } = useQuery({
    queryKey: ["tags"],
    retry: false,
    queryFn: async () => await TagApi.readMany(),
  });

  const queryClient = useQueryClient();
  const { mutate: createTag } = useMutation<Result<CreateTagResponse>, unknown, CreateTagRequest>({

    mutationFn: async (params) => await TagApi.create(params),
    retry: false,
    onSuccess: (tagResult) => {
      if (tagResult.isErr) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["tags"] });
      handleSelectTag(tagResult.value);
    }
  });

  if (isLoading || isError) {
    return <div >Something bad happenned</div>;
  }

  if (tags.isErr) {
    return <div>{tags.error.message}</div>;
  }

  const handleDeselectTag = (tag: TagWithId) => {
    const newTags = selectedTags.filter(t => t.id !== tag.id);
    setSelectedTags(newTags);
    props.onTagSelected(newTags);

  };
  const handleSelectTag = (tag: TagWithId) => {
    const newTags = [tag, ...selectedTags];
    setSelectedTags(newTags);
    props.onTagSelected(newTags);
  };

  return (
    <Popover open={isOpen} onOpenChange={(shouldOpen) => {
      if (!shouldOpen) {
        setSearchTerm("");
      }
      setIsOpen(shouldOpen);
    }}>
      <PopoverTrigger asChild >
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-start"
        >
          {selectedTags.length === 0
            ? "Select Tags"
            : selectedTags.map((tag) => (<SessionTag value={tag.label} />))}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput onValueChange={setSearchTerm} placeholder="Search tags" />
          {searchTerm && tags.value.every(t => t.label !== searchTerm) &&
            <CommandGroup>
              <CommandItem
                className="flex"
                onSelect={() => createTag({ label: searchTerm })}
              >
                <p>Create</p>
                <div className="grow"></div>
                <SessionTag value={searchTerm} />
              </CommandItem>
            </CommandGroup>
          }
          <CommandGroup>
            <ScrollArea type="always" className="max-h-48 overflow-y-auto rounded-md border-none">
              {tags.value.filter((tag) => prefixBasedMatch(tag.label, searchTerm)).map((tag) => (
                <CommandItem
                  value={tag.label}
                  key={tag.id}
                  onSelect={() => (selectedTags.some(t => t.id === tag.id)) ? handleDeselectTag(tag) : handleSelectTag(tag)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.some(t => t.id === tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <SessionTag value={tag.label} />
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
