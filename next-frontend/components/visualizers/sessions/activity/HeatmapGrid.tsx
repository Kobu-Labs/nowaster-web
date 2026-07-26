"use client";

import type { FC, PointerEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { useIsMobile } from "@/components/shadcn/use-mobile";
import { useActivityHeatmap } from "@/components/hooks/use-activity-heatmap";
import type { HeatmapCell, HeatmapColumn } from "@/lib/activity-heatmap";
import { CURRENT_YEAR, splitWeeksByMonth } from "@/lib/activity-heatmap";
import { cn, formatTime } from "@/lib/utils";

type Hover = { cell: HeatmapCell; columnIndex: number; dayIndex: number; };

const DESKTOP_CELL_SIZE = 14;
const MIN_DESKTOP_CELL_SIZE = 8;
const MOBILE_CELL_SIZE = 20;
const MOBILE_GAP = 4;
const WEEKDAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 16;
// Gap between the weekday-label column and the grid itself (the root row's
// own `gap-2`), needed to work out how much width the grid actually gets.
const LABEL_GRID_GAP = 8;
// Upper bounds on what a calendar year can ever produce: at most 54 weeks
// (a 366-day year starting on Saturday), and at most 11 split columns (one
// per month boundary, if none happen to land on a Sunday).
const MAX_WEEKS = 54;
const MAX_MONTH_STARTS = 11;

const gapForCellSize = (cellSize: number) => Math.max(2, Math.round(cellSize / 3));

const TIER_COLORS = [
  "hsl(var(--pink-primary) / 0.08)",
  "hsl(var(--pink-primary) / 0.28)",
  "hsl(var(--pink-primary) / 0.48)",
  "hsl(var(--pink-primary) / 0.68)",
  "hsl(var(--pink-primary) / 0.85)",
  "hsl(var(--pink-primary) / 1)",
];

const getCellColor = (tier: number) =>
  tier < 0 ? "transparent" : (TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)] ?? TIER_COLORS[0]);

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Mon",
  3: "Wed",
  5: "Fri",
};

type HeatmapGridProps = {
  // Caps how large cells are allowed to grow on desktop when there's plenty
  // of room; the grid always shrinks below this to fit its container so it
  // never needs to scroll. Mobile always uses its own touch-sized default.
  desktopCellSize?: number;
  onDaySelect: (date: Date) => void;
  // Feature-flagged: leaves an actual gap between the last column of one
  // month and the first of the next, splitting any week that straddles a
  // month boundary so the gap lands on the real date. Off by default since
  // it's an aesthetic option, not every consumer wants it.
  showMonthSeparators?: boolean;
};

export const HeatmapGrid: FC<HeatmapGridProps> = (props) => {
  const { displayYear, isPending, monthLabels, weeks } = useActivityHeatmap();
  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<null | number>(null);

  // Available width can change from a card resize, a sidebar toggle, or the
  // viewport itself - re-measure whenever it does, not just on mount.
  // Coalesced to one state update per animation frame - during a drag-resize
  // or a sidebar collapse animation, ResizeObserver can fire many times per
  // frame, and without this each tick would re-run the cell-size search loop
  // and column layout math, causing visible jank.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    let frame: null | number = null;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width === undefined) {
        return;
      }
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        setContainerWidth(width);
      });
    });
    observer.observe(el);
    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
    };
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledYearRef = useRef<null | number>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  // Unified render model: a plain week is just a column with no gap/label of
  // its own (labels for the non-split case come from the existing
  // week-indexed monthLabels), while splitWeeksByMonth produces columns with
  // accurate isMonthStart/monthLabel for the flag-on case.
  const columns: HeatmapColumn[] = useMemo(() => {
    if (props.showMonthSeparators) {
      return splitWeeksByMonth(weeks);
    }
    return weeks.map((cells, weekIndex) => ({
      cells,
      isMonthStart: false,
      monthLabel: monthLabels.find((label) => label.weekIndex === weekIndex)?.label ?? null,
    }));
  }, [monthLabels, props.showMonthSeparators, weeks]);

  const monthStartCount = useMemo(
    () => columns.filter((column) => column.isMonthStart).length,
    [columns],
  );

  // Picks the largest cell size (up to the desktop cap) whose total rendered
  // width - cells, inter-cell gaps, and month gaps all scaled together -
  // fits inside the measured container. This is what guarantees the grid
  // never needs its own horizontal scrollbar on desktop: it shrinks to fit
  // instead of overflowing.
  //
  // columnGap (horizontal, between columns) is stretched per-year to fill
  // the container; rowGap (vertical, between the 7 day-cells in a column,
  // and the weekday labels) is a fixed function of cellSize only. They must
  // stay independent - reusing one gap value for both would make the row
  // height depend on how much horizontal stretch a given year needed,
  // shifting everything below the card when switching years.
  const { cellSize, columnGap, monthGap, rowGap } = useMemo(() => {
    const maxCellSize = props.desktopCellSize ?? DESKTOP_CELL_SIZE;

    if (isMobile) {
      return { cellSize: MOBILE_CELL_SIZE, columnGap: MOBILE_GAP, monthGap: MOBILE_GAP * 2, rowGap: MOBILE_GAP };
    }
    if (containerWidth === null) {
      const fallbackGap = gapForCellSize(maxCellSize);
      return { cellSize: maxCellSize, columnGap: fallbackGap, monthGap: fallbackGap * 2, rowGap: fallbackGap };
    }

    const available = containerWidth - WEEKDAY_LABEL_WIDTH - LABEL_GRID_GAP;

    // Sized against the worst case a year can ever produce (54 weeks, every
    // one of the 11 month boundaries splitting) rather than this year's
    // actual column count. That keeps cell size - and therefore the grid's
    // height, since cells are square - constant across every year; only the
    // gap below is stretched per-year to fill the remaining width. Sizing to
    // the real column count instead would give thinner years bigger cells
    // and visibly shift everything below the card when switching years.
    const worstCaseColumns = props.showMonthSeparators ? MAX_WEEKS + MAX_MONTH_STARTS : MAX_WEEKS;
    const worstCaseGapUnits = props.showMonthSeparators
      ? (worstCaseColumns - 1) + MAX_MONTH_STARTS * 2
      : worstCaseColumns - 1;
    const minTotalWidthFor = (size: number) => worstCaseColumns * size + worstCaseGapUnits * gapForCellSize(size);

    const gapUnits = Math.max(0, columns.length - 1) + monthStartCount * 2;
    const gapToFill = (size: number) => (gapUnits > 0 ? (available - columns.length * size) / gapUnits : 0);

    // Picks the largest cell size whose worst-case spacing still fits, then
    // stretches this year's actual column gaps (month gaps staying
    // proportionally 2x a regular gap) to consume whatever's left over. The
    // vertical rowGap is unaffected by any of this - it's always just the
    // aesthetic minimum for the chosen (year-independent) cell size.
    for (let size = maxCellSize; size >= MIN_DESKTOP_CELL_SIZE; size--) {
      if (minTotalWidthFor(size) <= available) {
        const columnGap = gapToFill(size);
        return { cellSize: size, columnGap, monthGap: columnGap * 2, rowGap: gapForCellSize(size) };
      }
    }
    const columnGap = Math.max(0, gapToFill(MIN_DESKTOP_CELL_SIZE));
    return {
      cellSize: MIN_DESKTOP_CELL_SIZE,
      columnGap,
      monthGap: columnGap * 2,
      rowGap: gapForCellSize(MIN_DESKTOP_CELL_SIZE),
    };
  }, [columns.length, containerWidth, isMobile, monthStartCount, props.desktopCellSize, props.showMonthSeparators]);

  const columnStep = cellSize + columnGap;
  const rowStep = cellSize + rowGap;

  const columnOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cursor = 0;
    columns.forEach((column) => {
      if (column.isMonthStart) {
        cursor += monthGap;
      }
      offsets.push(cursor);
      cursor += columnStep;
    });
    return offsets;
  }, [columnStep, columns, monthGap]);

  const gridWidth = (columnOffsets.at(-1) ?? 0) + cellSize;

  // Centers each month's label over the full span of columns it owns
  // (from its own offset through the column right before the next month's
  // label starts), rather than pinning it to the left edge of that span.
  const monthLabelPositions = useMemo(() => {
    const labelColumnIndexes = columns
      .map((column, index) => (column.monthLabel ? index : null))
      .filter((index) => index !== null);

    return labelColumnIndexes.map((columnIndex, labelIndex) => {
      const nextLabelColumnIndex = labelColumnIndexes[labelIndex + 1] ?? columns.length;
      const spanStart = columnOffsets[columnIndex] ?? 0;
      const spanEnd = (columnOffsets[nextLabelColumnIndex - 1] ?? spanStart) + cellSize;
      return {
        center: (spanStart + spanEnd) / 2,
        columnIndex,
        label: columns[columnIndex]!.monthLabel!,
      };
    });
  }, [cellSize, columnOffsets, columns]);

  // Scrolls the current year's grid to bring today's column into view. Only
  // runs once per year, after a real container width has been measured -
  // columnOffsets otherwise get a new reference on every resize (the gap
  // stretches to fill available width), which would keep resetting the
  // user's manual scroll position back to today on every window resize or
  // sidebar toggle.
  useEffect(() => {
    if (
      displayYear !== CURRENT_YEAR
      || isPending
      || containerWidth === null
      || !scrollRef.current
      || scrolledYearRef.current === displayYear
    ) {
      return;
    }
    const container = scrollRef.current;
    const today = new Date();
    const todayColumnIndex = columns.findIndex((column) =>
      column.cells.some((cell) => cell.date?.toDateString() === today.toDateString()));
    if (todayColumnIndex === -1) {
      return;
    }
    container.scrollLeft = Math.max(
      0,
      (columnOffsets[todayColumnIndex] ?? 0) - container.clientWidth / 2,
    );
    scrolledYearRef.current = displayYear;
  }, [columnOffsets, columns, containerWidth, displayYear, isPending]);

  // Event delegation instead of a handler per cell - keeps the ~365 cell
  // elements themselves as plain, prop-stable divs.
  const resolveCellFromEvent = (event: PointerEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-column-index]",
    );
    if (!target) {
      return null;
    }
    const columnIndex = Number(target.dataset.columnIndex);
    const dayIndex = Number(target.dataset.dayIndex);
    const cell = columns[columnIndex]?.cells[dayIndex];
    if (!cell?.date) {
      return null;
    }
    return { cell, columnIndex, dayIndex };
  };

  const handlePointerOver = (event: PointerEvent<HTMLDivElement>) => {
    setHover(resolveCellFromEvent(event));
  };

  const handleClick = (event: PointerEvent<HTMLDivElement>) => {
    const target = resolveCellFromEvent(event);
    if (target && target.cell.minutes > 0 && target.cell.date) {
      props.onDaySelect(target.cell.date);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={hover !== null}>
        <div className="flex w-full min-w-0 gap-2" ref={containerRef}>
          <div
            className="flex shrink-0 flex-col text-[10px] text-muted-foreground"
            style={{
              gap: rowGap,
              marginTop: MONTH_LABEL_HEIGHT,
              width: WEEKDAY_LABEL_WIDTH,
            }}
          >
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div
                className="flex items-center"
                key={dayIndex}
                style={{ height: cellSize }}
              >
                {WEEKDAY_LABELS[dayIndex]}
              </div>
            ))}
          </div>

          <div className="overflow-x-auto" ref={scrollRef}>
            <div
              className="relative select-none"
              onClick={handleClick}
              onPointerLeave={() => { setHover(null); }}
              onPointerOver={handlePointerOver}
              style={{ width: gridWidth }}
            >
              <div
                className="relative text-[10px] text-muted-foreground"
                style={{ height: MONTH_LABEL_HEIGHT }}
              >
                {monthLabelPositions.map(({ center, columnIndex, label }) => (
                  <span
                    className="absolute -translate-x-1/2"
                    key={columnIndex}
                    style={{ left: center }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex" style={{ gap: columnGap }}>
                {columns.map((column, columnIndex) => (
                  <div
                    className="flex flex-col"
                    key={columnIndex}
                    style={{
                      gap: rowGap,
                      marginLeft: column.isMonthStart ? monthGap : undefined,
                    }}
                  >
                    {column.cells.map((cell, dayIndex) => (
                      <div
                        className={cn(
                          "rounded-[2px]",
                          cell.date !== null && cell.minutes > 0
                          && "cursor-pointer",
                        )}
                        data-column-index={columnIndex}
                        data-day-index={dayIndex}
                        key={dayIndex}
                        style={{
                          backgroundColor: getCellColor(cell.tier),
                          height: cellSize,
                          width: cellSize,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <TooltipTrigger asChild>
                <div
                  className="pointer-events-none absolute opacity-0"
                  style={{
                    height: cellSize,
                    left: columnOffsets[hover?.columnIndex ?? 0] ?? 0,
                    top:
                      MONTH_LABEL_HEIGHT
                      + (hover?.dayIndex ?? 0) * rowStep,
                    width: cellSize,
                  }}
                />
              </TooltipTrigger>
            </div>
          </div>
        </div>

        {hover?.cell.date && (
          <TooltipContent>
            {format(hover.cell.date, "MMM d, yyyy")}
            {": "}
            {hover.cell.minutes > 0
              ? formatTime(hover.cell.minutes)
              : "No sessions"}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
