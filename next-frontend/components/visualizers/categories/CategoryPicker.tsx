import { FC, useState } from "react";

import { CategoryWithId } from "@/api/definitions";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Frown } from "lucide-react";
import {
  MultipleCategoryPickerUiProviderProps,
  MultipleCategoryPickerUiProvider,
  SingleCategoryPickerUiProviderProps,
  SingleCategoryPickerUiProvider,
} from "@/components/ui-providers/CategoryPickerUiProvider";
import { useCategories } from "@/components/hooks/category/useCategory";

type MultipleCategoryPickerProps = Omit<
  MultipleCategoryPickerUiProviderProps,
  "availableCategories"
>;

export const MultipleCategoryPicker: FC<MultipleCategoryPickerProps> = (
  props,
) => {
  const categories = useCategories();

  if (categories.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (categories.isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
    );
  }

  return (
    <MultipleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories.data}
      selectedCategories={props.selectedCategories}
      onSelectCategory={props.onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};

type SingleCategoryPickerProps = {
  onSelectedCategoriesChanged: (newCategory: CategoryWithId) => void;
} & Omit<
  SingleCategoryPickerUiProviderProps,
  "availableCategories" | "selectedCategory" | "onSelectCategory"
>;

// TODO: just dynamically allow only one element in selectedCategories[] you dumb ass
export const SingleCategoryPicker: FC<
  SingleCategoryPickerProps & { value?: CategoryWithId }
> = (props) => {
  const categories = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<
    CategoryWithId | undefined
  >();
  const isControlled = props.value !== undefined;
  const value = isControlled ? props.value : selectedCategory;

  if (categories.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (categories.isPending) {
    return (
      <Skeleton className="flex w-full items-center justify-center h-10 grow" />
    );
  }

  const onSelectCategory = (category: CategoryWithId) => {
    if (!isControlled) {
      setSelectedCategory(category);
    }
    props.onSelectedCategoriesChanged(category);
  };

  return (
    <SingleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories.data}
      selectedCategory={value}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};
