import { FC } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  TagPickerUiProvider,
  TagPickerUiProviderProps,
} from "@/components/ui-providers/TagPickerUiProvider";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Frown } from "lucide-react";

type SimpleTagPickerProps = Omit<TagPickerUiProviderProps, "availableTags">;

export const SimpleTagPicker: FC<SimpleTagPickerProps> = (props) => {
  const {
    data: tags,
    isPending,
    isError,
  } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
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
    <TagPickerUiProvider
      disabled={props.disabled}
      availableTags={tags}
      forCategory={props.forCategory}
      selectedTags={props.selectedTags}
      onNewTagsSelected={props.onNewTagsSelected}
      modal={props.modal}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
      tagMatchStrategy={props.tagMatchStrategy}
    />
  );
};
