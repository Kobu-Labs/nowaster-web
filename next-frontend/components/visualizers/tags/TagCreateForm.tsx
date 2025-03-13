import { FC, useEffect, useState } from "react";
import { CategoryWithId, TagWithId } from "@/api/definitions";

import { randomColor } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { CircleHelp, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import Link from "next/link";
import { useCreateTag } from "@/components/hooks/tag/useCreateTag";

type CreateTagDialogProps = {
  onSave: (tag: TagWithId) => void;
};

export const TagCreateForm: FC<CreateTagDialogProps> = (props) => {
  const [newTagName, setNewTagName] = useState("");
  const [randomColors, setRandomColors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryWithId[]
  >([]);

  // INFO: This is a workaround to avoid hydration errors due to random colors
  useEffect(() => {
    setRandomColors(Array.from({ length: 10 }, () => randomColor()));
  }, []);

  const [selectedColor, setSelectedColor] = useState(randomColor());

  const handleSelectCategory = (category: CategoryWithId) => {
    const isSelected = selectedCategories.some((cat) => cat.id === category.id);
    if (isSelected) {
      setSelectedCategories((prev) =>
        prev.filter((cat) => cat.id !== category.id),
      );
    } else {
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const mutation = useCreateTag({
    onSuccess: (data) => {
      setNewTagName("");
      props.onSave(data);
    },
  });

  return (
    <Card className="h-fit">
      <CardContent>
        <CardHeader>
          <CardTitle className="font-mono">Create New Tag</CardTitle>
          <CardDescription className="text-gray-400">
            Add a new tag to organize your learning sessions
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="tagName"
              className="text-sm font-medium text-gray-300"
            >
              Tag Name
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                className="w-48"
              />
              {newTagName.length > 0 && (
                <TagBadge
                  variant="manual"
                  value={newTagName}
                  colors={selectedColor}
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Tag Color
            </label>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {randomColors.map((color, i) => (
                <Button
                  key={i}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
                      : ""
                  }`}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
              <ColorPicker onSelect={setSelectedColor} value={selectedColor} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-300">
                  Allowed Categories
                </label>
                <TooltipProvider delayDuration={250}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="text-nowrap">
                      Read more about category specific tags on our{" "}
                      <Link
                        rel="noopener noreferrer"
                        target="_blank"
                        className="text-nowrap underline hover:text-blue-500"
                        href={
                          "https://github.com/Kobu-Labs/nowaster-web/wiki/Category-specific-tags"
                        }
                      >
                        wiki
                      </Link>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex-grow-0 max-w-64">
                <MultipleCategoryPicker
                  onSelectCategory={handleSelectCategory}
                  selectedCategories={selectedCategories}
                />
              </div>
            </div>
          </div>
        </div>
        <CardFooter className="flex gap-2">
          <div className="flex-grow"></div>
          <Button
            loading={mutation.isPending}
            disabled={newTagName.length === 0}
            onClick={() =>
              mutation.mutate({
                label: newTagName,
                allowedCategories: selectedCategories,
                color: selectedColor,
              })
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
