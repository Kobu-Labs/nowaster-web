import { useQuery } from "@tanstack/react-query";
import { FC, useState } from "react";

import { CategoryWithId } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Frown } from "lucide-react";
import {
  MultipleCategoryPickerUiProviderProps,
  MultipleCategoryPickerUiProvider,
  SingleCategoryPickerUiProviderProps,
  SingleCategoryPickerUiProvider,
} from "@/components/ui-providers/CategoryPickerUiProvider";

type MultipleCategoryPickerProps = Omit<
  MultipleCategoryPickerUiProviderProps,
  "availableCategories"
>;

export const MultipleCategoryPicker: FC<MultipleCategoryPickerProps> = (
  props,
) => {
  const {
    data: categories,
    isPending,
    isError,
  } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value;
    },
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center  w-full grow h-screen m-20">
        <Frown className="text-red-500 grow h-1/2 w-1/2" />
      </div>
    );
  }

  if (isPending) {
    return (
      <Skeleton className="flex items-center justify-center  w-full grow  m-10"></Skeleton>
    );
  }

  return (
    <MultipleCategoryPickerUiProvider
      modal={props.modal}
      availableCategories={categories}
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
    isPending,
    isError,
  } = useQuery({
    ...queryKeys.categories.all,
    retry: false,
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value;
    },
  });

  const [selectedCategory, setSelectedCategory] = useState<
    CategoryWithId | undefined
  >();
  const isControlled = props.value !== undefined;
  const value = isControlled ? props.value : selectedCategory;

  if (isError) {
    return (
      <div className="flex items-center justify-center  w-full grow h-screen m-20">
        <Frown className="text-red-500 grow h-1/2 w-1/2" />
      </div>
    );
  }

  if (isPending) {
    return (
      <Skeleton className="flex w-full items-center justify-center h-10 grow"/ >
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
      availableCategories={categories}
      selectedCategory={value}
      onSelectCategory={onSelectCategory}
      categoryMatchStrategy={props.categoryMatchStrategy}
      categoryDisplayStrategy={props.categoryDisplayStrategy}
    />
  );
};
