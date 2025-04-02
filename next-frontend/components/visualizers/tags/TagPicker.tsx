import { FC } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  TagPickerUiProvider,
  TagPickerUiProviderProps,
} from "@/components/ui-providers/TagPickerUiProvider";

type SimpleTagPickerProps = Omit<TagPickerUiProviderProps, "availableTags">;

export const SimpleTagPicker: FC<SimpleTagPickerProps> = (props) => {
  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  });

  if (!tags || isLoading || isError) {
    return <div>Something bad happenned</div>;
  }

  if (tags.isErr) {
    return <div>{tags.error.message}</div>;
  }

  return (
    <TagPickerUiProvider
      disabled={props.disabled}
      availableTags={tags.value}
      forCategory={props.forCategory}
      selectedTags={props.selectedTags}
      onNewTagsSelected={props.onNewTagsSelected}
      modal={props.modal}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
      tagMatchStrategy={props.tagMatchStrategy}
    />
  );
};
