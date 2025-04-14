import { FC, useEffect, useState } from "react";
import { CategoryWithId, TagWithId } from "@/api/definitions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { TagApi } from "@/api";
import { useToast } from "@/components/shadcn/use-toast";
import { Input } from "@/components/shadcn/input";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { MultipleCategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { CircleHelp, Save } from "lucide-react";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useSetRecoilState } from "recoil";
import { tagColors } from "@/state/tags";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import Link from "next/link";

type CreateTagDialogProps = {
  onSave: (tag: TagWithId) => void;
};

export const TagCreateForm: FC<CreateTagDialogProps> = (props) => {
  const [newTagName, setNewTagName] = useState("");
  const { toast } = useToast();
  const [randomColors, setRandomColors] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryWithId[]
  >([]);

  // INFO: This is a workaround to avoid hydration errors due to random colors
  useEffect(() => {
    setRandomColors(Array.from({ length: 10 }, () => randomColor()));
  }, []);

  const setColors = useSetRecoilState(tagColors);
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

  const mutation = useMutation({
    mutationFn: async (data: {
      tagLabel: string;
      allowedCategories: CategoryWithId[];
    }) => {
      return await TagApi.create({
        label: data.tagLabel,
        allowedCategories: data.allowedCategories,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
      if (data.isErr) {
        toast({
          title: "Error creating tag",
          description: data.error.message,
          variant: "destructive",
        });
      } else {
        setColors((prev) => ({
          ...prev,
          [data.value.label]: selectedColor,
        }));
        toast({
          title: "Tag created",
          description: (
            <>
              <TagBadge value={data.value.label} colors={selectedColor} />
              created successfully!
            </>
          ),
          variant: "default",
        });
        setNewTagName("");
        props.onSave(data.value);
      }
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
                <TagBadge value={newTagName} colors={selectedColor} />
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
            disabled={newTagName.length === 0}
            onClick={() =>
              mutation.mutate({
                tagLabel: newTagName,
                allowedCategories: selectedCategories,
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
