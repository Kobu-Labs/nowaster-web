"use client";

import { useCategories } from "@/components/hooks/category/useCategory";
import { CategoryHintRow } from "@/components/ui-providers/avatar/CategoryHintRow";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Skeleton } from "@/components/shadcn/skeleton";
import { type FC } from "react";

export const AvatarHintsSection: FC = () => {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Category hints</h2>
        <p className="text-sm text-muted-foreground">
          Assign hints to categories to control what labels appear in your
          avatar generation prompt.
        </p>
      </div>

      {isLoading
        ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-10 w-full" key={i} />
              ))}
            </div>
          )
        : !categories || categories.length === 0
            ? (
                <p className="text-sm text-muted-foreground">
                  No categories yet. Start a session to create one.
                </p>
              )
            : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Category</TableHead>
                        <TableHead>Hints</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <CategoryHintRow
                          categoryId={cat.id}
                          categoryName={cat.name}
                          key={cat.id}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
    </div>
  );
};
