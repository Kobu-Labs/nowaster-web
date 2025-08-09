"use client";

import { CategoryWithId } from "@/api/definitions";
import { useCategories } from "@/components/hooks/category/useCategory";
import { useCategoryStats } from "@/components/hooks/category/useCategoryStats";
import { useCreateCategory } from "@/components/hooks/category/useCreateCategory";
import { useDeleteCategory } from "@/components/hooks/category/useDeleteCategory";
import { useUpdateCategory } from "@/components/hooks/category/useUpdateCategory";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { formatTime, randomColor } from "@/lib/utils";
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

type SortOption = "name" | "sessions" | "time" | "recent";
type SortDirection = "asc" | "desc";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("sessions");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithId | null>(
    null,
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(randomColor());

  const categoriesQuery = useCategories();
  const statsQuery = useCategoryStats();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const filteredAndSortedCategories = useMemo(() => {
    if (!categoriesQuery.data) return [];

    const filtered = categoriesQuery.data.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "sessions":
        comparison = a.sessionCount - b.sessionCount;
        break;
      case "time":
        // Assuming totalTime exists or calculate from sessionCount
        comparison = a.sessionCount * 60 - b.sessionCount * 60;
        break;
      case "recent":
        // This would require lastUsedAt field
        comparison = 0; // Placeholder
        break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [categoriesQuery.data, searchQuery, sortBy, sortDirection]);

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory.mutate(
        {
          name: newCategoryName.trim(),
          color: newCategoryColor,
        },
        {
          onSuccess: () => {
            setNewCategoryName("");
            setNewCategoryColor(randomColor());
            setShowCreateDialog(false);
          },
        },
      );
    }
  };

  const handleUpdateCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          name: newCategoryName.trim(),
          color: newCategoryColor,
        },
        {
          onSuccess: () => {
            setEditingCategory(null);
            setNewCategoryName("");
            setNewCategoryColor(randomColor());
          },
        },
      );
    }
  };

  const openEditDialog = (category: CategoryWithId) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
  };

  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("desc");
    }
  };

  if (categoriesQuery.isPending || statsQuery.isPending) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (categoriesQuery.isError || statsQuery.isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Categories
            </CardTitle>
            <CardDescription>
              There was an error loading your categories or statistics. Please
              try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const totalCategories = stats?.total_categories ?? 0;
  const totalTimeMinutes = stats?.total_time_minutes ?? 0;
  const mostUsedCategory = stats?.most_used_category;
  const mostUsedCategoryCount = categoriesQuery.data.find(
    (cat) => cat.id === mostUsedCategory?.id,
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage and analyze your time tracking categories
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your time tracking sessions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name..."
                />
              </div>
              <div>
                <Label htmlFor="color" className="mr-2">
                  Color
                </Label>
                <ColorPicker
                  initialColor={newCategoryColor}
                  onSelect={setNewCategoryColor}
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
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || createCategory.isPending}
              >
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Categories
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Active categories in your workspace
            </p>
          </CardContent>
        </Card>

        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(totalTimeMinutes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total time tracked across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="group flex grow flex-col hover:gradient-card hover:transition-all duration-300 ease-in-out hover:text-accent-foreground  hover:border-pink-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Used Category
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostUsedCategory ? (
                <div>
                  <CategoryBadge
                    color={mostUsedCategory.color}
                    name={mostUsedCategory.name}
                  />
                  <div className="text-xs flex gap-2">
                    <p className="text-muted-foreground">
                      Category with the most sessions, being
                    </p>

                    <p className="text-foreground">
                      {mostUsedCategoryCount?.sessionCount}
                    </p>
                  </div>
                </div>
              ) : (
                "None"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
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
            variant={sortBy === "sessions" ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort("sessions")}
            className="flex items-center gap-1"
          >
            Sessions
            {sortBy === "sessions" &&
              (sortDirection === "asc" ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              ))}
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAndSortedCategories.map((category) => (
          <Card
            key={category.id}
            className="group hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <CategoryBadge color={category.color} name={category.name} />
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/home/category/${category.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openEditDialog(category)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Category
                    </DropdownMenuItem>
                    <AlertDialog>
                      {category.sessionCount > 0 ? (
                        <TooltipProvider delayDuration={0}>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger>
                              <AlertDialogTrigger disabled>
                                <DropdownMenuItem
                                  disabled
                                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Category
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              This category cannot be deleted, as it has
                              sessions associated with it
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Category
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      )}

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-0">
                            <span>Are you sure you want to delete </span>
                            <CategoryBadge
                              color={category.color}
                              name={category.name}
                            />
                            <span>
                              ? This action cannot be undone and will remove the
                              category from all associated sessions.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteCategory.mutate({ id: category.id })
                            }
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
                <span className="text-sm text-muted-foreground">Sessions</span>
                <Badge variant="secondary">{category.sessionCount}</Badge>
              </div>

              <Link href={`/home/category/${category.id}`}>
                <Button variant="outline" className="w-full h-8" size="sm">
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedCategories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No categories found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `No categories match "${searchQuery}". Try adjusting your search.`
                    : "Create your first category to start organizing your time tracking sessions."}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <ColorPicker
                initialColor={newCategoryColor}
                onSelect={setNewCategoryColor}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={!newCategoryName.trim() || updateCategory.isPending}
            >
              {updateCategory.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
