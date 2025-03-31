import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  MultipleCategoryPickerUiProvider,
  MultipleCategoryPickerUiProviderProps,
  SingleCategoryPickerUiProvider,
  SingleCategoryPickerUiProviderProps,
} from "@/components/ui-providers/CategoryPickerUiProvider";
import { CategoryWithId } from "@/api/definitions";

type MultipleCategoryPickerProps = Omit<
  MultipleCategoryPickerUiProviderProps,
  "availableCategories"
>;

export const MultipleCategoryPicker: FC<MultipleCategoryPickerProps> = (
  props,
) => {
  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!categories || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (categories.isErr) {
    return <div>{categories.error.message}</div>;
  }

  return (
    <MultipleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories.value}
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
  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<
    CategoryWithId | undefined
  >();
  const isControlled = props.value !== undefined;
  const value = isControlled ? props.value : selectedCategory;

  if (!categories || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (categories.isErr) {
    return <div>{categories.error.message}</div>;
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
      availableCategories={categories.value}
      selectedCategory={value}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};
