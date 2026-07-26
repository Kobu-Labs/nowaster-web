"use client";

import type { FC } from "react";
import { useState } from "react";

import { YearDatePicker } from "@/components/ui-providers/date-pickers/YearDatePicker";
import { useActivityHeatmap } from "@/components/hooks/use-activity-heatmap";
import { DayDetailDialog } from "@/components/visualizers/sessions/activity/DayDetailDialog";
import { HeatmapGrid } from "@/components/visualizers/sessions/activity/HeatmapGrid";

// The grid itself plus its year picker and the day-detail dialog it opens on
// click - reads year/data state from ActivityHeatmapProvider via context.
export const ActivityHeatmap: FC = () => {
  const { selectedYear, setSelectedYear } = useActivityHeatmap();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Activity</h2>
        <YearDatePicker
          initialDate={new Date(selectedYear, 0, 1)}
          onSelected={(range) => { setSelectedYear(range.from.getFullYear()); }}
        />
      </div>

      <div className="flex justify-center">
        <HeatmapGrid desktopCellSize={19} onDaySelect={setSelectedDate} />
      </div>

      <DayDetailDialog
        date={selectedDate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
          }
        }}
      />
    </div>
  );
};
