"use client";

import { useState } from "react";
import { TagDetails } from "@/api/definitions";
import { useQuery } from "@tanstack/react-query";
import { Edit, Plus, TagIcon, Trash2 } from "lucide-react";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Badge } from "@/components/shadcn/badge";
import { Dialog, DialogContent } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import FuzzySearch from "fuzzy-search";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { CreateTagForm } from "@/components/visualizers/tags/TagCreateForm";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";

const fuzzyFindStrategy = (
  category: TagDetails,
  searchTerm: string,
): boolean => {
  const searcher = new FuzzySearch([category.label], []);
  const result = searcher.search(searchTerm);
  return result.length !== 0;
};

export default function TagsManagement() {
  const { data: tags, isLoading } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  if (!tags || tags.isErr) {
    return <div>Something bad happenned</div>;
  }
  const filteredTags = tags.value.filter((tag) =>
    fuzzyFindStrategy(tag, searchQuery),
  );

  return (
    <div className="w-[80%] flex justify-center flex-grow items-center flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-white placeholder:text-gray-500"
          />
        </div>
        <Dialog
          open={addTagDialogOpen}
          onOpenChange={setAddTagDialogOpen}
          modal={false}
        >
          <DialogContent
            className="border-none p-0 w-fit"
            onInteractOutside={() => false}
          >
            <CreateTagForm onSave={() => setAddTagDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        <Button
          className="w-full sm:w-auto"
          onClick={() => setAddTagDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Tag
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading tags...</p>
        </div>
      ) : filteredTags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <TagIcon className="h-12 w-12  mb-4" />
            <p className="text-center">
              {searchQuery
                ? "No tags match your search"
                : "No tags found. Create your first tag to get started."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-mono">Your Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-md  border "
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full`}></div>
                      <TagBadge value={tag.label} />
                      <Badge variant="outline" className="text-xs">
                        {tag.usages}
                        {" sessions"}
                      </Badge>
                      <ScrollArea className="min-w-48 max-w-[80%]">
                        <div className="px-4 flex gap-2">
                          {tag.allowedCategories.map((c) => (
                            <CategoryLabel category={c} key={c.id} />
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={
                          1 > 0 ? "Cannot delete tags in use" : "Delete tag"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
