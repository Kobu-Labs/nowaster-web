import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { FC, useState } from "react"

type CategoryPickerProps = {
  categories: string[]
}

export const CategoryPicker: FC<CategoryPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {searchTerm
            ? props.categories.find((framework) => framework === searchTerm) || ""
            : "Select category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput onValueChange={setSearchTerm} placeholder="Search categories" />
          <CommandEmpty>
            <button onClick={() => console.log("Creating " + searchTerm)}>
              {"Create '" + searchTerm + "'"}
            </button>
          </CommandEmpty>
          <CommandGroup>
            {props.categories.map((framework) => (
              <CommandItem
                key={framework}
                onSelect={(currentValue) => {
                  setSearchTerm(currentValue === searchTerm ? "" : currentValue)
                  setIsOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    searchTerm === framework ? "opacity-100" : "opacity-0"
                  )}
                />
                {framework}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
