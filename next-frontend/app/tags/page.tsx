"use client";

import { useState } from "react";
import { TagDetails } from "@/api/definitions";
import { useQuery } from "@tanstack/react-query";
import { Check, Edit, Plus } from "lucide-react";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import { Badge } from "@/components/shadcn/badge";
import { Dialog, DialogContent } from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import FuzzySearch from "fuzzy-search";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { TagCreateForm } from "@/components/visualizers/tags/TagCreateForm";
import { Separator } from "@/components/shadcn/separator";
import { TagDetailsOverview } from "@/components/visualizers/tags/TagDetailsOverview";
import { cn } from "@/lib/utils";
import { TagEditForm } from "@/components/visualizers/tags/TagEditForm";

const fuzzyFindStrategy = (
  category: TagDetails,
  searchTerm: string,
): boolean => {
  const searcher = new FuzzySearch([category.label], []);
  const result = searcher.search(searchTerm);
  return result.length !== 0;
};

export default function TagsManagement() {
  const { data: tags } = useQuery({
    ...queryKeys.tags.all,
    retry: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false);
  const [editTagDialogOpen, setEditTagDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagDetails | null>(null);

  if (!tags || tags.isErr) {
    return <div>Something bad happenned</div>;
  }
  const filteredTags = tags.value.filter((tag) =>
    fuzzyFindStrategy(tag, searchQuery),
  );

  return (
    <div className="p-8 gap-8 flex-grow grid grid-cols-7 items-start justify-center">
      <div className="flex justify-center flex-grow items-center flex-col col-span-2">
        <Card className="w-full ">
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
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
                {(addTagDialogOpen || editTagDialogOpen) && (
                  <div
                    className={cn(
                      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    )}
                  />
                )}
                <DialogContent
                  className="border-none p-0 w-fit"
                  onInteractOutside={() => false}
                >
                  <TagCreateForm onSave={() => setAddTagDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <Dialog
                open={editTagDialogOpen}
                onOpenChange={setEditTagDialogOpen}
                modal={false}
              >
                <DialogContent className="border-none p-0 w-fit">
                  {selectedTag && (
                    <TagEditForm
                      tag={selectedTag}
                      onEdit={() => setEditTagDialogOpen(false)}
                      onDelete={() => setEditTagDialogOpen(false)}
                    />
                  )}
                </DialogContent>
              </Dialog>
              <Button
                className="w-full sm:w-auto"
                onClick={() => setAddTagDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> New Tag
              </Button>
            </div>
            <Separator className="my-4" />
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {filteredTags.map((tag) => (
                  <Button
                    key={tag.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md  border w-full",
                      tag.id === selectedTag?.id && "border-accent-foreground",
                    )}
                    onClick={() => setSelectedTag(tag)}
                    variant="ghost"
                  >
                    <div className="flex items-center space-x-3">
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          tag.id === selectedTag?.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <TagBadge value={tag.label} />
                      <Badge variant="outline" className="text-xs">
                        {tag.usages}
                        {" sessions"}
                      </Badge>
                    </div>
                    <Button
                      className="hover:bg-slate-400"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditTagDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      {selectedTag && (
        <div className="col-span-5">
          <TagDetailsOverview tag={selectedTag} />
        </div>
      )}
    </div>
  );
}
