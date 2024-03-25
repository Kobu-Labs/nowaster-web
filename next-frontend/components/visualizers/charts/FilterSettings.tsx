import { FC, useContext, useState } from "react"
import { TagWithId } from "@kobu-labs/nowaster-js-typing"
import { SessionFilterContext } from "components/visualizers/charts/FilteredSessionAreaChart"
import { Filter } from "lucide-react"

import { cn, countLeaves } from "@/lib/utils"
import { Button } from "@/components/shadcn/button"
import {
  Sheet,
  SheetContent,
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

  // TODO: this should be refactored
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

  const appliedFiltersCount = countLeaves(filter)

  return (
    <div className="flex flex-col">
      <Sheet modal={false}>
        <SheetTrigger asChild className="cursor-pointer group  relative">
          <Button
            variant="outline"
            className="flex justify-center items-center"
          >
            <Filter className="group-hover:text-pink-300 ">Open</Filter>
            {appliedFiltersCount > 0 && (
              <div
                className={cn(
                  "absolute right-[10%] top-[-20%] text-shadow-neon-pink group-hover:text-pink-300 animate-blink"
                )}
              >
                {appliedFiltersCount}
              </div>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Apply filter</SheetTitle>
          </SheetHeader>
          <div className="flex  ">
            <StatelessTagPicker
              modal={false}
              onSelectTag={onSelectTag}
              selectedTags={selectedTags}
            />
          </div>
          <MultipleCategoryPicker
            onSelectedCategoriesChanged={updateCategoryFilter}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
