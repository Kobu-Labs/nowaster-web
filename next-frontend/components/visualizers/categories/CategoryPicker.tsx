import { FC, useState } from "react";

import { CategoryWithId } from "@/api/definitions";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Frown } from "lucide-react";
import { CategoryPickerUiProvider } from "@/components/ui-providers/categories/CategoryPickerUiProvider";
import { useCategories } from "@/components/hooks/category/useCategory";
import { arrayFromUndefined } from "@/lib/utils";

type CategoryPickerProps = {
  availableCategories?: CategoryWithId[];
  onSelectCategory?: (category: CategoryWithId) => void;
  categoryDisplayStrategy?: (
    selectedCategories: CategoryWithId[],
    availableCategories: CategoryWithId[],
  ) => CategoryWithId[];
  categoryMatchStrategy?: (
    category: CategoryWithId,
    searchTerm: string,
  ) => number;
} & (
  | { mode: "single"; selectedCategory?: CategoryWithId | null }
  | { mode: "multiple"; selectedCategories?: CategoryWithId[] | null }
);

export const CategoryPicker: FC<CategoryPickerProps> = (props) => {
  const categories = useCategories();

  const [selectedCategories, setSelectedCategories] = useState<
    CategoryWithId[]
  >([]);

  // INFO:  the following abstractions allows the following
  // 1. switch between 'single' and 'multiple' mode
  // 2. conditionally switch whether the input is controlled or not
  // 3. pass in availableCategories as a prop
  const isControlled =
    props.mode === "single"
      ? props.selectedCategory !== undefined
      : props.selectedCategories !== undefined;

  const value = isControlled
    ? props.mode === "single"
      ? arrayFromUndefined(props.selectedCategory)
      : (props.selectedCategories ?? [])
    : selectedCategories;

  const onSelectCategory = (category: CategoryWithId) => {
    if (!isControlled) {
      if (props.mode === "single") {
        setSelectedCategories([category]);
      } else {
        setSelectedCategories(
          (prev) =>
            prev.some((c) => c.id === category.id)
              ? prev.filter((c) => c.id !== category.id) // remove if already selected
              : [...prev, category], // add if not selected
        );
      }
    }
    props.onSelectCategory?.(category);
  };

  if (!props.availableCategories && categories.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (!props.availableCategories && categories.isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
    );
  }

  return (
    <CategoryPickerUiProvider
      availableCategories={props.availableCategories ?? categories.data ?? []}
      selectedCategories={value}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};
