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
  });

  if (isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
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
