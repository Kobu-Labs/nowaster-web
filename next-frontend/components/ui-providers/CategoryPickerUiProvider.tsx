import { FC, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { prefixBasedMatch } from "@/lib/searching"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/shadcn/badge"
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

export type MultipleCategoryPickerUiProviderProps = {
  availableCategories: string[]
  selectedCategories: string[]
  onSelectCategory: (category: string) => void
  categoryDisplayStrategy?: (
    selectedCategories: string[],
    availableCategories: string[]
  ) => string[]
  categoryMatchStrategy?: (category: string, searchTerm: string) => number
  modal?: boolean
}

export const MultipleCategoryPickerUiProvider: FC<
  MultipleCategoryPickerUiProviderProps
> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")

  let categoriesInDisplayOrder = props.availableCategories
  if (props.categoryDisplayStrategy) {
    categoriesInDisplayOrder = props.categoryDisplayStrategy(
      props.selectedCategories,
      props.availableCategories
    )
  }

  if (props.categoryMatchStrategy) {
    categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
      props.categoryMatchStrategy!(category, searchTerm)
    )
  } else {
    categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
      prefixBasedMatch(category, searchTerm, { caseInsensitive: true })
    )
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
      modal={props.modal}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {props.selectedCategories.length === 0
            ? "Search Category"
            : props.selectedCategories.map((category) => (
                <Badge variant="outline" key={category}>
                  {category}
                </Badge>
              ))}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder={"Search categories"}
            value={searchTerm}
          />
          {!categoriesInDisplayOrder.length && (
            <CommandItem className="cursor-pointer py-6 text-center text-sm hover:bg-accent">
              {`Category '${searchTerm}' not found.`}
            </CommandItem>
          )}
          <CommandGroup>
            <ScrollArea
              type="always"
              className="max-h-48 overflow-y-auto rounded-md border-none"
            >
              {categoriesInDisplayOrder.map((category) => (
                <CommandItem
                  value={category}
                  key={category}
                  onSelect={() => props.onSelectCategory(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      props.selectedCategories.some((cat) => cat === category)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Badge variant="outline">{category}</Badge>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export type SingleCategoryPickerUiProviderProps = {
  availableCategories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  categoryDisplayStrategy?: (
    selectedCategories: string,
    availableCategories: string[]
  ) => string[]
  categoryMatchStrategy?: (category: string, searchTerm: string) => number
  modal?: boolean
}

// TODO: just dynamically allow only one element in selectedCategories[] you dumb ass
export const SingleCategoryPickerUiProvider: FC<
  SingleCategoryPickerUiProviderProps
> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>("")

  let categoriesInDisplayOrder = props.availableCategories
  if (props.categoryDisplayStrategy) {
    categoriesInDisplayOrder = props.categoryDisplayStrategy(
      props.selectedCategory,
      props.availableCategories
    )
  }

  if (props.categoryMatchStrategy) {
    categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
      props.categoryMatchStrategy!(category, searchTerm)
    )
  } else {
    categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
      prefixBasedMatch(category, searchTerm, { caseInsensitive: true })
    )
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
      modal={props.modal}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {!props.selectedCategory ? (
            "Search Category"
          ) : (
            <Badge variant="outline">{props.selectedCategory}</Badge>
          )}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder={"Search categories"}
            value={searchTerm}
          />
          {!categoriesInDisplayOrder.length && (
            <CommandItem className="cursor-pointer py-6 text-center text-sm hover:bg-accent">
              {`Category '${searchTerm}' not found.`}
            </CommandItem>
          )}
          <CommandGroup>
            <ScrollArea
              type="always"
              className="max-h-48 overflow-y-auto rounded-md border-none"
            >
              {categoriesInDisplayOrder.map((category) => (
                <CommandItem
                  value={category}
                  key={category}
                  onSelect={() => props.onSelectCategory(category)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      category === props.selectedCategory
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Badge variant="outline">{category}</Badge>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
