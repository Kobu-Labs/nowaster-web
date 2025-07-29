"use client";

import { TagWithId } from "@/api/definitions";
import { useCreateTag } from "@/components/hooks/tag/useCreateTag";
import { useDeleteTag } from "@/components/hooks/tag/useDeleteTag";
import { useTags } from "@/components/hooks/tag/useTags";
import { useTagStats } from "@/components/hooks/tag/useTagStats";
import { useUpdateTag } from "@/components/hooks/tag/useUpdateTag";
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
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { randomColor } from "@/lib/utils";
import {
  Clock,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type SortOption = "name" | "usages" | "recent";
type SortDirection = "asc" | "desc";

export default function TagsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("usages");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<TagWithId | null>(null);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState(randomColor());

  const tagsQuery = useTags();
  const statsQuery = useTagStats();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const filteredAndSortedTags = useMemo(() => {
    if (!tagsQuery.data) return [];

    const filtered = tagsQuery.data.filter((tag) =>
      tag.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
      case "name":
        comparison = a.label.localeCompare(b.label);
        break;
      case "usages":
        comparison = a.usages - b.usages;
        break;
      case "recent":
        comparison = 0;
        break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tagsQuery.data, searchQuery, sortBy, sortDirection]);

  const handleCreateTag = () => {
    if (newTagLabel.trim()) {
      createTag.mutate(
        {
          label: newTagLabel.trim(),
          color: newTagColor,
          allowedCategories: [],
        },
        {
          onSuccess: () => {
            setNewTagLabel("");
            setNewTagColor(randomColor());
            setShowCreateDialog(false);
          },
        },
      );
    }
  };

  const handleUpdateTag = () => {
    if (editingTag && newTagLabel.trim()) {
      updateTag.mutate(
        {
          id: editingTag.id,
          label: newTagLabel.trim(),
          color: newTagColor,
        },
        {
          onSuccess: () => {
            setEditingTag(null);
            setNewTagLabel("");
            setNewTagColor(randomColor());
          },
        },
      );
    }
  };

  const openEditDialog = (tag: TagWithId) => {
    setEditingTag(tag);
    setNewTagLabel(tag.label);
    setNewTagColor(tag.color);
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("desc");
    }
  };

  if (tagsQuery.isPending || statsQuery.isPending) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (tagsQuery.isError || statsQuery.isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Tags
            </CardTitle>
            <CardDescription>
              There was an error loading your tags or statistics. Please try
              refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const totalTags = stats?.total_tags ?? 0;
  const totalUsages = stats?.total_usages ?? 0;
  const mostUsedTag = stats?.most_used_tag;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Manage and analyze your time tracking tags
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to organize your time tracking sessions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder="Tag label..."
                />
              </div>
              <div>
                <Label htmlFor="color" className="mr-2">
                  Color
                </Label>
                <ColorPicker
                  initialColor={newTagColor}
                  onSelect={setNewTagColor}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!newTagLabel.trim() || createTag.isPending}
              >
                {createTag.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Active tags in your workspace
            </p>
          </CardContent>
        </Card>

        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsages}</div>
            <p className="text-xs text-muted-foreground">
              Total tag usages across all sessions
            </p>
          </CardContent>
        </Card>

        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Tag</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostUsedTag ? (
                <TagBadge tag={mostUsedTag} variant="auto" />
              ) : (
                "None"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tag with the most session usages
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort("name")}
            className="flex items-center gap-1"
          >
            Name
            {sortBy === "name" &&
              (sortDirection === "asc" ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              ))}
          </Button>

          <Button
            variant={sortBy === "usages" ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort("usages")}
            className="flex items-center gap-1"
          >
            Usages
            {sortBy === "usages" &&
              (sortDirection === "asc" ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              ))}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAndSortedTags.map((tag) => (
          <Card
            key={tag.id}
            className="group hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <TagBadge tag={tag} variant="auto" />
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/home/tags/${tag.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openEditDialog(tag)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Tag
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Tag
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-0">
                            <span>Are you sure you want to delete </span>
                            <TagBadge variant="auto" tag={tag} />
                            <span>
                              ? This action cannot be undone and will remove the
                              tag from all the
                            </span>
                            <span className="text-foreground">
                              {` ${tag.usages} `}
                            </span>
                            <span>sessions that use it.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTag.mutate({ id: tag.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Usages</span>
                <Badge variant="secondary">{tag.usages}</Badge>
              </div>

              {tag.allowedCategories && tag.allowedCategories.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Categories
                  </span>
                  <Badge variant="outline">
                    {tag.allowedCategories.length}
                  </Badge>
                </div>
              )}

              <Link href={`/home/tags/${tag.id}`}>
                <Button variant="outline" className="w-full h-8" size="sm">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedTags.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No tags found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No tags match "${searchQuery}". Try adjusting your search.`
                    : "Create your first tag to start organizing your time tracking sessions."}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tag
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag label and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                placeholder="Tag label..."
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <ColorPicker
                initialColor={newTagColor}
                onSelect={setNewTagColor}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTag}
              disabled={!newTagLabel.trim() || updateTag.isPending}
            >
              {updateTag.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
