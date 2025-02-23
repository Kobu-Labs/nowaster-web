import { CategoryWithId, TagDetails } from "@/api/definitions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
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
import { CircleHelp, Save, Trash2 } from "lucide-react";
import { useRecoilState } from "recoil";
import { tagColors } from "@/state/tags";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";

type TagEditFormProps = {
  tag: TagDetails;
  onEdit: (tag: TagDetails) => void;
  onDelete: () => void;
};

export const TagEditForm: FC<TagEditFormProps> = (props) => {
  const [newTagName, setNewTagName] = useState(props.tag.label);
  const [colors, setColors] = useRecoilState(tagColors);
  const tagColor = colors[props.tag.label];
  const queryClient = useQueryClient();
  const [newColor, setNewColor] = useState<string>(tagColor ?? "#00f00f");

  const [selectedCategories, setSelectedCategories] = useState<
    CategoryWithId[]
  >(props.tag.allowedCategories);
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

  const { toast } = useToast();
  const deleteTagMutation = useMutation({
    mutationFn: async () => {
      return await TagApi.deleteTag({ id: props.tag.id });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
      if (data.isErr) {
        toast({
          title: "Error deleting tag",
          description: data.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tag deleted",
          description: (
            <>
              <TagBadge value={props.tag.label} />
              deleted successfully!
            </>
          ),
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error deleting tag",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: props.onDelete,
  });

  const mutation = useMutation({
    mutationFn: async (data: {
      tagLabel: string;
      allowedCategories: CategoryWithId[];
      tagColor: string;
    }) => {
      setColors((prev) => ({
        ...prev,
        [data.tagLabel]: data.tagColor,
      }));
      return await TagApi.update({
        id: props.tag.id,
        label: data.tagLabel,
        allowedCategories: data.allowedCategories,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
      if (data.isErr) {
        toast({
          title: "Error editing tag",
          description: data.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tag edited",
          description: (
            <>
              <TagBadge value={data.value.label} />
              edit successfully!
            </>
          ),
          variant: "default",
        });
        props.onEdit(data.value);
      }
    },
  });

  return (
    <Card className="h-fit">
      <CardContent>
        <CardHeader>
          <CardTitle className="font-mono flex items-center gap-2">
            Edit
            <TagBadge value={props.tag.label} colors={newColor} />
          </CardTitle>
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
                <TagBadge value={newTagName} colors={newColor} />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Tag Color
            </label>
            <div className="flex flex-wrap gap-2">
              <ColorPicker onSelect={setNewColor} value={newColor} />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this tag from all associated sessions
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteTagMutation.mutate()}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            disabled={newTagName.length === 0}
            onClick={() =>
              mutation.mutate({
                tagLabel: newTagName,
                allowedCategories: selectedCategories,
                tagColor: newColor,
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
