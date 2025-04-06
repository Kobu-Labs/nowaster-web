import { FC, useState } from "react";
import { CategoryWithId } from "api/definitions";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, randomColor } from "@/lib/utils";
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
import FuzzySearch from "fuzzy-search";
import { useCreateCategory } from "@/components/hooks/category/useCreateCategory";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";

export type MultipleCategoryPickerUiProviderProps = {
  availableCategories: CategoryWithId[];
  selectedCategories: CategoryWithId[];
  onSelectCategory: (category: CategoryWithId) => void;
  categoryDisplayStrategy?: (
    selectedCategories: CategoryWithId[],
    availableCategories: CategoryWithId[],
  ) => CategoryWithId[];
  categoryMatchStrategy?: (
    category: CategoryWithId,
    searchTerm: string,
  ) => number;
  modal?: boolean;
};

const fuzzyFindStrategy = (
  category: CategoryWithId,
  searchTerm: string,
): boolean => {
  const searcher = new FuzzySearch([category.name], []);
  const result = searcher.search(searchTerm);
  return result.length !== 0;
};

export const MultipleCategoryPickerUiProvider: FC<
  MultipleCategoryPickerUiProviderProps
> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] =
    useState<string>(randomColor());

  // TODO move this higher
  const { mutate: createCategory } = useCreateCategory({
    onSuccess: (cat) => {
      props.onSelectCategory(cat);
      setNewCategoryColor(newCategoryColor);
    },
  });

  let categoriesInDisplayOrder = props.availableCategories;
  if (props.categoryDisplayStrategy) {
    categoriesInDisplayOrder = props.categoryDisplayStrategy(
      props.selectedCategories,
      props.availableCategories,
    );
  }

  const matchStrategy = props.categoryMatchStrategy ?? fuzzyFindStrategy;
  categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
    matchStrategy(category, searchTerm),
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchTerm("");
        }
        setIsOpen(shouldOpen);
      }}
      modal={props.modal}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="max-w-full grow justify-start"
        >
          <ChevronsUpDown className="mx-2 size-4 shrink-0 opacity-50" />
          <div className="flex  max-w-full overflow-hidden ">
            <div className="flex w-max max-w-full gap-1">
              <ScrollArea
                type="hover"
                className="max-w-fit overflow-y-auto rounded-md border-none"
              >
                <ScrollBar orientation="horizontal" className="top-4" />
                {props.selectedCategories.length === 0
                  ? "Search Category"
                  : props.selectedCategories.map((category) => (
                    <CategoryBadge
                      key={category.id}
                      name={category.name}
                      color={category.color}
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
            placeholder={"Search categories"}
            value={searchTerm}
          />
          {searchTerm &&
            props.availableCategories.every(
              (cat) => cat.name !== searchTerm,
            ) && (
            <Button
              variant="ghost"
              className="m-0"
              onClick={() =>
                createCategory({
                  color: newCategoryColor,
                  name: searchTerm,
                })
              }
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
                type="always"
                className="max-h-48 overflow-y-auto rounded-md border-none"
              >
                {categoriesInDisplayOrder.map((category) => (
                  <CommandItem
                    value={category.name}
                    key={category.id}
                    onSelect={() => props.onSelectCategory(category)}
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
          {categoriesInDisplayOrder.length === 0 &&
            searchTerm.trim().length === 0 && (
            <div className="p-1 text-center text-sm text-muted-foreground placeholder:text-muted-foreground">
                Type to create!
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export type SingleCategoryPickerUiProviderProps = {
  availableCategories: CategoryWithId[];
  selectedCategory: CategoryWithId | undefined;
  onSelectCategory: (category: CategoryWithId) => void;
  categoryDisplayStrategy?: (
    selectedCategories: CategoryWithId,
    availableCategories: CategoryWithId[],
  ) => CategoryWithId[];
  categoryMatchStrategy?: (
    category: CategoryWithId,
    searchTerm: string,
  ) => number;
  modal?: boolean;
};

// TODO: just dynamically allow only one element in selectedCategories[] you dumb ass
export const SingleCategoryPickerUiProvider: FC<
  SingleCategoryPickerUiProviderProps
> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] =
    useState<string>(randomColor());

  const { mutate: createCategory } = useCreateCategory({
    onSuccess: (cat) => {
      props.onSelectCategory(cat);
      setNewCategoryColor(randomColor());
    },
  });

  let categoriesInDisplayOrder = props.availableCategories;
  if (props.categoryDisplayStrategy && props.selectedCategory) {
    categoriesInDisplayOrder = props.categoryDisplayStrategy(
      props.selectedCategory,
      props.availableCategories,
    );
  }

  const matchStrategy = props.categoryMatchStrategy ?? fuzzyFindStrategy;
  categoriesInDisplayOrder = categoriesInDisplayOrder.filter((category) =>
    matchStrategy(category, searchTerm),
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchTerm("");
        }
        setIsOpen(shouldOpen);
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
            <CategoryBadge
              name={props.selectedCategory.name}
              color={props.selectedCategory.color}
            />
          )}
          <div className="grow"></div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchTerm}
            placeholder={"Search categories"}
            value={searchTerm}
          />
          {searchTerm.trim().length > 0 &&
            props.availableCategories.every(
              (cat) => cat.name !== searchTerm,
            ) && (
            <Button
              variant="ghost"
              className="m-0"
              onClick={() =>
                createCategory({
                  color: newCategoryColor,
                  name: searchTerm,
                })
              }
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
                type="always"
                className="max-h-48 overflow-y-auto rounded-md border-none"
              >
                {categoriesInDisplayOrder.map((category) => (
                  <CommandItem
                    value={category.name}
                    key={category.id}
                    onSelect={() => props.onSelectCategory(category)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        category.id === props.selectedCategory?.id
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
          {categoriesInDisplayOrder.length === 0 &&
            searchTerm.trim().length === 0 && (
            <div className="p-1 text-center text-sm text-muted-foreground placeholder:text-muted-foreground">
                Type to create!
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
