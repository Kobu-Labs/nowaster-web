import { useTags } from "@/components/hooks/tag/useTags";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  TagPickerUiProvider,
  TagPickerUiProviderProps,
} from "@/components/ui-providers/tags/TagPickerUiProvider";
import { Frown } from "lucide-react";
import { FC } from "react";

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
      disabled={props.disabled}
      availableTags={tags.data}
      forCategory={props.forCategory}
      selectedTags={props.selectedTags}
      onNewTagsSelected={props.onNewTagsSelected}
      modal={props.modal}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
      tagMatchStrategy={props.tagMatchStrategy}
    />
  );
};
