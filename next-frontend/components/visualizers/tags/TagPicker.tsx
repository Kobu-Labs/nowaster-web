import { FC, useState } from "react"
import { TagWithId } from "@kobu-labs/nowaster-js-typing"
import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys"
import {
  TagPickerUiProvider,
  TagPickerUiProviderProps,
} from "@/components/ui-providers/TagPickerUiProvider"

//TODO: extract the "selectedTags" to seprarat component

type SimpleTagPickerProps = {
  onSelectedTagsChanged: (newTags: TagWithId[]) => void
} & Omit<
  TagPickerUiProviderProps,
  "availableTags" | "selectedTags" | "onSelectTag"
>

export const SimpleTagPicker: FC<SimpleTagPickerProps> = (props) => {
  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([])

  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  })


  if (!tags || isLoading || isError) {
    return <div>Something bad happenned</div>
  }

  if (tags.isErr) {
    return <div>{tags.error.message}</div>
  }

  const onSelectTag = (tag: TagWithId) => {
    let newTags
    if (selectedTags.some((t) => t.id === tag.id)) {
      // deselect
      newTags = selectedTags.filter((t) => t.id !== tag.id)
    } else {
      // select
      newTags = [tag, ...selectedTags]
    }
    setSelectedTags(newTags)
    props.onSelectedTagsChanged(newTags)
  }

  return (
    <TagPickerUiProvider
      availableTags={tags.value}
      selectedTags={selectedTags}
      onSelectTag={onSelectTag}
      modal={props.modal}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
      tagMatchStrategy={props.tagMatchStrategy}
    />
  )
}

type StatelessTagPickerProps = {
} & Omit<
  TagPickerUiProviderProps,
  "availableTags"
>

export const StatelessTagPicker: FC<StatelessTagPickerProps> = (props) => {
  const {
    data: tags,
    isLoading,
    isError,
  } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  })


  if (!tags || isLoading || isError) {
    return <div>Something bad happenned</div>
  }

  if (tags.isErr) {
    return <div>{tags.error.message}</div>
  }

  return (
    <TagPickerUiProvider
      availableTags={tags.value}
      selectedTags={props.selectedTags}
      onSelectTag={props.onSelectTag}
      modal={props.modal}
      tagsDisplayStrategy={props.tagsDisplayStrategy}
      tagMatchStrategy={props.tagMatchStrategy}
    />
  )
}
