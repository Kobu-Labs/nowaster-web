import { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  MultipleCategoryPickerUiProvider,
  MultipleCategoryPickerUiProviderProps,
  SingleCategoryPickerUiProvider,
  SingleCategoryPickerUiProviderProps,
} from "@/components/ui-providers/CategoryPickerUiProvider";

type MultipleCategoryPickerProps = {
  onSelectedCategoriesChanged: (newCategories: string[]) => void;
} & Omit<
  MultipleCategoryPickerUiProviderProps,
  "availableCategories" | "selectedCategories" | "onSelectCategory"
>;

export const MultipleCategoryPicker: FC<MultipleCategoryPickerProps> = (
  props
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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  if (!categories || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (categories.isErr) {
    return <div>{categories.error.message}</div>;
  }

  const onSelectCategory = (category: string) => {
    let newCategories;
    if (selectedCategories.some((t) => t === category)) {
      // deselect
      newCategories = selectedCategories.filter((t) => t !== category);
    } else {
      // select
      newCategories = [category, ...selectedCategories];
    }
    setSelectedCategories(newCategories);
    props.onSelectedCategoriesChanged(newCategories);
  };

  return (
    <MultipleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories.value.map((cat) => cat.name)}
      selectedCategories={selectedCategories}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};

type SingleCategoryPickerProps = {
  onSelectedCategoriesChanged: (newCategory: string) => void;
} & Omit<
  SingleCategoryPickerUiProviderProps,
  "availableCategories" | "selectedCategory" | "onSelectCategory"
>;

// TODO: just dynamically allow only one element in selectedCategories[] you dumb ass
export const SingleCategoryPicker: FC<SingleCategoryPickerProps> = (props) => {
  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("");

  if (!categories || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (categories.isErr) {
    return <div>{categories.error.message}</div>;
  }

  const onSelectCategory = (category: string) => {
    setSelectedCategory(category);
    props.onSelectedCategoriesChanged(category);
  };

  return (
    <SingleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories.value.map((cat) => cat.name)}
      selectedCategory={selectedCategory}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};
