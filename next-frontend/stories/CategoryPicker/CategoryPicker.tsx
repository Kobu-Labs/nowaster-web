import { ScheduledSessionApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    queryKey: ["categories"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getCategories(),
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
          <CommandEmpty
            className="cursor-pointer py-6 text-center text-sm"
            onClick={() => {
              props.onCategorySelected(currentCategory);
              setIsOpen(false);
            }}>
            {"Create '" + currentCategory + "'"}
          </CommandEmpty>
          <CommandGroup>
            {categories.value
              .filter(category => prefixBasedMatch(category, currentCategory || "", { caseInsensitive: true }))
              .map((category) => (
                <CommandItem
                  key={category}
                  onSelect={selectedValue => (selectedValue === currentCategory) ? onDeselect() : onSelect(selectedValue)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentCategory === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category}
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
