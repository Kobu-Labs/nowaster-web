import { FC, useContext, useState } from "react"
import { TagWithId } from "@kobu-labs/nowaster-js-typing"
import { SessionFilterContext } from "components/visualizers/charts/FilteredSessionAreaChart"

import { Button } from "@/components/shadcn/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/shadcn/sheet"
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker"
import { StatelessTagPicker } from "@/components/visualizers/tags/TagPicker"

type FilterSettingsProps = {}

export const FilterSettings: FC<FilterSettingsProps> = () => {
  const [selectedTags, setSelectedTags] = useState<TagWithId[]>([])
  const context = useContext(SessionFilterContext)
  if (context === undefined) {
    throw new Error("Context must be set")
  }
  const { filter, setFilter } = context

  const updateTagsFilter = (tags: string[]) => {
    const { tags: oldTags, ...rest } = filter
    setFilter({
      tags: {
        label: {
          some: tags,
        },
      },
      ...rest,
    })
  }

  const updateCategoryFilter = (categories: string[]) => {
    const { category: oldCategories, ...rest } = filter
    setFilter({
      category: {
        label: {
          some: categories,
        },
      },
      ...rest,
    })
  }

  const onSelectTag = (tag: TagWithId) => {
    const t = filter.tags?.label?.some
    if (t === undefined) {
      updateTagsFilter([tag.label])
    } else {
      if (t.includes(tag.label)) {
        updateTagsFilter(t.filter((s) => s !== tag.label))
      } else {
        updateTagsFilter([tag.label, ...t])
      }
    }

    // TODO: this is sooo bad - state is duplicated in filter and in this
    if (selectedTags.findIndex((v) => v.id === tag.id) === -1) {
      setSelectedTags([tag, ...selectedTags])
    } else {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id))
    }
  }

  return (
    <div className="flex flex-col">
      <Sheet modal={false}>
        <SheetTrigger asChild>
          <Button variant="outline">Open</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <StatelessTagPicker
            modal={false}
            onSelectTag={onSelectTag}
            selectedTags={selectedTags}
          />
          <MultipleCategoryPicker
            onSelectedCategoriesChanged={updateCategoryFilter}
          />
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Save changes</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
