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
  onCategorySelected: (category: string | null) => void
}

export const CategoryPicker: FC<CategoryPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getCategories(),
  });

  if (!data || isLoading || isError) {
    return <div >Something bad happenned</div>;
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-[200px] justify-between"
        >
          {value || "Select category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput onValueChange={setValue} placeholder="Search categories" />
          <CommandEmpty
            className="cursor-pointer py-6 text-center text-sm"
            onClick={() => {
              props.onCategorySelected(value);
              setIsOpen(false);
            }}>
            {"Create '" + value + "'"}
          </CommandEmpty>
          <CommandGroup>
            {data.value.filter(c => prefixBasedMatch(c, value || "", { caseInsensitive: true })).map((category) => (
              <CommandItem
                key={category}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? null : currentValue);
                  props.onCategorySelected(currentValue === value ? null : currentValue);
                  setIsOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === category ? "opacity-100" : "opacity-0"
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
