import { useTags } from "@/components/hooks/tag/useTags";
import { Skeleton } from "@/components/shadcn/skeleton";
import type {
  TagPickerUiProviderProps} from "@/components/ui-providers/tags/TagPickerUiProvider";
import {
  TagPickerUiProvider
} from "@/components/ui-providers/tags/TagPickerUiProvider";
import { Frown } from "lucide-react";
import type { FC } from "react";

type SimpleTagPickerProps = Omit<TagPickerUiProviderProps, "availableTags">;

export const SimpleTagPicker: FC<SimpleTagPickerProps> = (props) => {
  const tags = useTags();

  if (tags.isError) {
    return (
      <Frown className="flex w-full items-center justify-center h-10 grow text-red-500" />
    );
  }

  if (tags.isPending) {
    return (
      <Skeleton className="flex items-center justify-center w-full grow h-10" />
    );
  }

  return (
    <TagPickerUiProvider
      availableTags={tags.data}
      disabled={props.disabled}
      forCategory={props.forCategory}
      modal={props.modal}
      onNewTagsSelected={props.onNewTagsSelected}
      selectedTags={props.selectedTags}
      tagMatchStrategy={props.tagMatchStrategy}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
    />
  );
};
