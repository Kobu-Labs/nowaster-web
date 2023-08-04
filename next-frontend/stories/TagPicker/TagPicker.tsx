import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { FC, useState } from "react"
import { SessionTag } from "../SessionTag/SessionTag"

type TagPickerProps = {
  tags: string[]
  onTagSelected: (tag: string[]) => void
}

export const TagPicker: FC<TagPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild >
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-start"
        >
          {selectedTags.length === 0
            ? "Select Tags"
            : selectedTags.map((tag) => (<SessionTag value={tag} />))}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput onValueChange={setSearchTerm} placeholder="Search tags" />
          <CommandEmpty>
            <button onClick={() => console.log("Creating " + searchTerm)}>
              {"Create '" + searchTerm + "'"}
            </button>
          </CommandEmpty>
          <CommandGroup>
            {props.tags.map((tag) => (
              <CommandItem
                key={tag}
                onSelect={() => {
                  if (selectedTags.indexOf(tag) === -1) {
                    const newArray = [tag, ...selectedTags]
                    setSelectedTags(newArray)
                    props.onTagSelected(newArray)
                  } else {
                    const newArray = selectedTags.filter(t => t !== tag)
                    setSelectedTags(newArray)
                    props.onTagSelected(newArray)
                  }
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedTags.find(x => x === tag) ? "opacity-100" : "opacity-0"
                  )}
                />
                <SessionTag value={tag} />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
