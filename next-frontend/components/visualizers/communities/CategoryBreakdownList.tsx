import type { CategoryBreakdown } from "@/api/definitions";
import { formatMinutesAsDuration } from "@/components/visualizers/communities/formatMinutes";
import { cn } from "@/lib/utils";
import type { FC } from "react";

type CategoryBreakdownListProps = {
  categories: CategoryBreakdown[];
};

export const CategoryBreakdownList: FC<CategoryBreakdownListProps> = ({
  categories,
}) => {
  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isEmpty = category.total_minutes === 0;
        return (
          <div className="space-y-1" key={category.tracked_category_id}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className={cn(isEmpty && "text-muted-foreground")}>
                  {category.name}
                  {isEmpty && " (no time yet)"}
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatMinutesAsDuration(category.total_minutes)}
                {" "}
                (
                {Math.round(category.percentage)}
                %)
              </span>
            </div>
            <div
              aria-label={`${category.name}, ${Math.round(category.percentage)} percent of tracked time`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(category.percentage)}
              className="h-2 w-full rounded-full bg-muted"
              role="progressbar"
            >
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  isEmpty ? "opacity-30" : "opacity-100",
                )}
                style={{
                  backgroundColor: category.color,
                  width: `${Math.max(category.percentage, isEmpty ? 2 : 0)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
