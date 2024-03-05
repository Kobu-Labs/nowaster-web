import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Button } from "@/components/shadcn/button";
import { Command, CommandGroup, CommandInput, CommandItem } from "@/components/shadcn/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { prefixBasedMatch } from "@/lib/searching";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useState } from "react";

type CategoryPickerProps = {
  onCategorySelected: (category: string | undefined) => void
}

export const CategoryPicker: FC<CategoryPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);

  const { data: categories, isLoading, isError } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
  });

  if (!categories || isLoading || isError) {
    return <div >Something bad happenned</div>;
  }

  if (categories.isErr) {
    return <div>{categories.error.message}</div>;
  }

  const onSelect = (category: string) => {
    setCurrentCategory(category);
    props.onCategorySelected(category);
    setIsOpen(false);
  };

  const onDeselect = () => {
    setCurrentCategory(undefined);
    props.onCategorySelected(undefined);
  };

  const shouldShowAddButton = () => {
    return currentCategory && categories.value.every(cat => !prefixBasedMatch(cat.name, currentCategory));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {currentCategory || "Select category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput onValueChange={setCurrentCategory} placeholder={"Search categories"} value={currentCategory} />
          {shouldShowAddButton() && (
            <CommandItem
              className="cursor-pointer py-6 text-center text-sm hover:bg-accent"
              onSelect={() => {
                props.onCategorySelected(currentCategory);
                setIsOpen(false);
              }}>
              {"Create '" + currentCategory + "'"}
            </CommandItem>
          )}
          <CommandGroup>
            <ScrollArea type="always" className="max-h-48 overflow-y-auto rounded-md border-none">
              {categories.value
                .filter(category => prefixBasedMatch(category.name, currentCategory, { caseInsensitive: true }))
                .map((category) => (
                  <CommandItem
                    value={category.name}
                    key={category.name}
                    onSelect={selectedValue => (selectedValue === currentCategory) ? onDeselect() : onSelect(category.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentCategory === category.name ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {category}
                    </Check>
                  </CommandItem>
                ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
