import type { CategoryWithId, TagDetails } from "@/api/definitions";
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
import type { FC } from "react";
import { useState } from "react";
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
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { CircleHelp, Save, Trash2 } from "lucide-react";
import { tagColors } from "@/state/tags";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useUpdateTag } from "@/components/hooks/tag/useUpdateTag";
import { useAtomValue } from "jotai";
import { Label } from "@/components/shadcn/label";

type TagEditFormProps = {
  onDelete: () => void;
  onEdit: (tag: TagDetails) => void;
  tag: TagDetails;
};

export const TagEditForm: FC<TagEditFormProps> = (props) => {
  const [newTagName, setNewTagName] = useState(props.tag.label);
  const colors = useAtomValue(tagColors);
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
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error deleting tag",
        variant: "destructive",
      });
    },
    onSettled: props.onDelete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });
      toast({
        description: (
          <div className="flex items-center gap-2">
            <TagBadge
              colors={props.tag.color}
              value={props.tag.label}
              variant="manual"
            />
            deleted successfully!
          </div>
        ),
        title: "Tag deleted",
        variant: "default",
      });
    },
  });

  const saveMutation = useUpdateTag();

  return (
    <Card className="h-fit">
      <CardContent>
        <CardHeader>
          <CardTitle className="font-mono flex items-center gap-2">
            Edit
            <TagBadge
              colors={newColor}
              value={props.tag.label}
              variant="manual"
            />
          </CardTitle>
        </CardHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label
              className="text-sm font-medium text-gray-300"
              htmlFor="tagName"
            >
              Tag Name
            </Label>
            <div className="flex items-center gap-4">
              <Input
                className="w-48"
                id="tagName"
                onChange={(e) => {
                  setNewTagName(e.target.value);
                }}
                placeholder="Enter tag name"
                value={newTagName}
              />
              {newTagName.length > 0 && (
                <TagBadge
                  colors={newColor}
                  value={newTagName}
                  variant="manual"
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">
              Tag Color
            </Label>
            <div className="flex flex-wrap gap-2">
              <ColorPicker onSelect={setNewColor} value={newColor} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Label
                  className="text-sm font-medium text-gray-300"
                  htmlFor="categoryPicker"
                >
                  Allowed Categories
                </Label>
                <TooltipProvider delayDuration={250}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleHelp className="text-muted-foreground size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="text-nowrap">
                      Read more about category specific tags on our
                      <Link
                        className="text-nowrap underline hover:text-blue-500"
                        href="https://github.com/Kobu-Labs/nowaster-web/wiki/Category-specific-tags"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        wiki
                      </Link>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grow-0 max-w-64" id="categoryPicker">
                <CategoryPicker
                  mode="multiple"
                  onSelectCategory={handleSelectCategory}
                  selectedCategories={selectedCategories}
                />
              </div>
            </div>
          </div>
        </div>
        <CardFooter className="flex gap-2">
          <div className="grow"></div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                loading={deleteTagMutation.isPending}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
                <AlertDialogAction
                  onClick={() => {
                    deleteTagMutation.mutate();
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            disabled={newTagName.length === 0}
            loading={saveMutation.isPending}
            onClick={() => {
              saveMutation.mutate(
                {
                  allowedCategories: selectedCategories,
                  color: newColor,
                  id: props.tag.id,
                  label: newTagName,
                },
                {
                  onSuccess: props.onEdit,
                },
              );
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};
