import { useCreateCategory } from "@/components/hooks/category/useCreateCategory";
import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { fuzzyFindSearch } from "@/lib/searching";
import { cn, randomColor } from "@/lib/utils";
import type { CategoryWithId } from "api/definitions";
import { Check, ChevronsUpDown } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

export interface CategoryPickerUiProviderProps {
  availableCategories: CategoryWithId[];
  categoryDisplayStrategy?: (
    selectedCategories: CategoryWithId[],
    availableCategories: CategoryWithId[],
  ) => CategoryWithId[];
  categoryMatchStrategy?: (
    category: CategoryWithId,
    searchTerm: string,
  ) => number;
  modal?: boolean;
  onSelectCategory: (category: CategoryWithId) => void;
  selectedCategories: CategoryWithId[];
}

export const showSelectedCategoryFirst = (
  selectedCateogries: CategoryWithId[],
  availableCategories: CategoryWithId[],
) => {
  return availableCategories.sort((cat1, cat2) => {
    if (selectedCateogries.some((cat) => cat.id === cat1.id)) {
      if (selectedCateogries.some((cat) => cat.id === cat2.id)) {
        return 0;
      }
      return -1;
    }

    if (selectedCateogries.some((cat) => cat.id === cat2.id)) {
      return 1;
    }

    return cat2.last_used_at.getTime() - cat1.last_used_at.getTime();
  });
};

const fuzzyFindCategory = (category: CategoryWithId, searchTerm: string) => {
  return fuzzyFindSearch(category.name, searchTerm).length !== 0;
};

export const CategoryPickerUiProvider: FC<CategoryPickerUiProviderProps> = (
  props,
) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor]
    = useState<string>(randomColor());

  const { mutateAsync: createCategory } = useCreateCategory();

  let categoriesInDisplayOrder = props.availableCategories;

  const matchStrategy = props.categoryMatchStrategy ?? fuzzyFindCategory;
  categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
    matchStrategy(category, searchTerm),
  );

  const displayStrategy
    = props.categoryDisplayStrategy ?? showSelectedCategoryFirst;
  categoriesInDisplayOrder = displayStrategy(
    props.selectedCategories,
    categoriesInDisplayOrder,
  );

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
          role="combobox"
          variant="outline"
        >
          <ChevronsUpDown className="mx-2 size-4 shrink-0 opacity-50" />
          <div className="flex  max-w-full overflow-hidden ">
            <div className="flex w-max max-w-full gap-1">
              <ScrollArea
                className="max-w-fit overflow-y-auto rounded-md border-none"
                type="hover"
              >
                <ScrollBar className="top-4" orientation="horizontal" />
                {props.selectedCategories.length === 0
                  ? "Search Category"
                  : props.selectedCategories.map((category) => (
                      <CategoryBadge
                        color={category.color}
                        key={category.id}
                        name={category.name}
                      />
                    ))}
              </ScrollArea>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder="Search categories"
            value={searchTerm}
          />
          {searchTerm
            && props.availableCategories.every(
              (cat) => cat.name !== searchTerm,
            ) && (
            <Button
              className="m-0"
              onClick={async () =>
                await createCategory(
                  {
                    color: newCategoryColor,
                    name: searchTerm,
                  },
                  {
                    onSuccess: (cat) => {
                      props.onSelectCategory(cat);
                      setNewCategoryColor(randomColor());
                    },
                  },
                )}
              variant="ghost"
            >
              <p>Create</p>
              <div className="grow"></div>
              <CategoryBadge color={newCategoryColor} name={searchTerm} />
            </Button>
          )}
          <CommandSeparator />
          {categoriesInDisplayOrder.length > 0 && (
            <CommandGroup heading="Existing Categories">
              <ScrollArea
                className="max-h-48 overflow-y-auto rounded-md border-none"
                type="always"
              >
                {categoriesInDisplayOrder.map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => { props.onSelectCategory(category); }}
                    value={category.name}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        props.selectedCategories.some(
                          (cat) => cat.id === category.id,
                        )
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <CategoryBadge
                      color={category.color}
                      name={category.name}
                    />
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          )}
          {categoriesInDisplayOrder.length === 0
            && searchTerm.trim().length === 0 && (
            <div className="p-1 text-center text-sm text-muted-foreground placeholder:text-muted-foreground">
              Type to create!
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
