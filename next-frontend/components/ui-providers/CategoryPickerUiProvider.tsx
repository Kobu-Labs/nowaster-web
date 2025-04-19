import { FC, useState } from "react";
import { CategoryWithId } from "api/definitions";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, randomColor } from "@/lib/utils";
import { Badge } from "@/components/shadcn/badge";
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
import FuzzySearch from "fuzzy-search";
import { useCreateCategory } from "@/components/hooks/category/useCreateCategory";

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

  // TODO move this higher
  const { mutate: createCategory } = useCreateCategory({
    onSuccess: (cat) => {
      props.onSelectCategory(cat);
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
                    <Badge variant="outline" key={category.id}>
                      {category.name}
                    </Badge>
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
          {!categoriesInDisplayOrder.length && (
            <CommandItem className="cursor-pointer py-6 text-center text-sm hover:bg-accent">
              {searchTerm &&
                props.availableCategories.every(
                  (cat) => cat.name !== searchTerm,
                ) && (
                <CommandGroup>
                  <CommandItem
                    className="flex"
                    onSelect={() =>
                      createCategory({
                        color: randomColor(),
                        name: searchTerm,
                      })
                    }
                  >
                    <p>Create</p>
                    <div className="grow"></div>
                    <Badge variant="outline">{searchTerm}</Badge>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandItem>
          )}
          <CommandGroup>
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
                  <Badge variant="outline">{category.name}</Badge>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
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

  const { mutate: createCategory } = useCreateCategory({
    onSuccess: props.onSelectCategory,
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
            <Badge variant="outline">{props.selectedCategory.name}</Badge>
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
            <CommandItem className="cursor-pointer py-6 text-center text-sm hover:bg-accent">
              <CommandGroup>
                <CommandItem
                  className="flex"
                  onSelect={() =>
                    createCategory({ color: randomColor(), name: searchTerm })
                  }
                >
                  <p>Create</p>
                  <div className="grow"></div>
                  <Badge variant="outline">{searchTerm}</Badge>
                </CommandItem>
              </CommandGroup>
            </CommandItem>
          )}
          <CommandGroup>
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
                  <Badge variant="outline">{category.name}</Badge>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
