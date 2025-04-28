"use client";

import type React from "react";

import {
  useState,
  useEffect,
  useRef,
  FC,
  PropsWithChildren,
  useMemo,
} from "react";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import {
  format,
  addHours,
  differenceInMilliseconds,
  addMilliseconds,
  areIntervalsOverlapping,
} from "date-fns";
import {
  CategoryWithIdSchema,
  ScheduledSessionWithId,
  TagWithIdSchema,
} from "@/api/definitions";
import { z } from "zod";
import { SessionCard } from "@/components/visualizers/categories/SessionCard";
import { EditScheduledSession } from "@/components/visualizers/sessions/EditScheduledSessionForm";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/ScheduledSessionCreationForm";

interface DateTimelineProps {
  activities: ScheduledSessionWithId[];
  startDate: Date;
  endDate: Date;
  onActivitiesChange?: (activities: ScheduledSessionWithId[]) => void;
  markerStep?: number; // in hours
}

export const sessionPrecursor = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  category: CategoryWithIdSchema.optional(),
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
});

const hasIntersection = (
  session1: ScheduledSessionWithId,
  session2: ScheduledSessionWithId,
): boolean => {
  return areIntervalsOverlapping(
    {
      start: session1.startTime,
      end: session1.endTime,
    },
    {
      start: session2.startTime,
      end: session2.endTime,
    },
    { inclusive: true },
  );
};

const sessionToNonIntersection = (
  sessions: ScheduledSessionWithId[],
): ScheduledSessionWithId[][] => {
  const groupedSessions: ScheduledSessionWithId[][] = [];

  sessions.forEach((session) => {
    let nextGroup;
    for (const group of groupedSessions) {
      const hasOverlap = group.some((s) => hasIntersection(s, session));
      if (!hasOverlap) {
        nextGroup = group;
        break;
      }
    }

    if (nextGroup) {
      nextGroup.push(session);
    } else {
      groupedSessions.push([session]);
    }
  });

  return groupedSessions;
};
// add props with children
type HoverPercentageBarProps = {
  formatter: (percentage: number) => string;
};
const HoverPercentageBar: FC<PropsWithChildren<HoverPercentageBarProps>> = (
  props,
) => {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    setPercentage(Math.min(100, Math.max(0, (x / rect.width) * 100)));
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setPercentage(null);
  };

  return (
    <div
      className="relative w-full h-full border rounded-2xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hoverX !== null && (
        <>
          <div
            className="absolute top-0 bottom-0 w-0 border-2 border-dashed"
            style={{ left: hoverX }}
          />
          <div
            className="absolute top-0 bottom-0 text-nowrap"
            style={{ left: hoverX + 10 }}
          >
            {percentage && props.formatter(percentage)}
          </div>
        </>
      )}
      {props.children}
    </div>
  );
};

export type SessionPrecursor = z.infer<typeof sessionPrecursor>;
export function SessionTimeline({
  activities,
  startDate,
  endDate,
  onActivitiesChange,
  markerStep, // Default to 2-hour markers
}: DateTimelineProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<ScheduledSessionWithId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] =
    useState<ScheduledSessionWithId | null>(null);
  const [activityToCreate, setActivityToCreate] =
    useState<SessionPrecursor | null>();
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = differenceInMilliseconds(endDate, startDate);
  const groupedActivities = useMemo(() => {
    return sessionToNonIntersection(activities);
  }, [activities]);

  useEffect(() => {
    if (onActivitiesChange) {
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

  const calculateWidth = (
    activityStartDate: Date,
    activityEndDate: Date,
  ): number => {
    // Ensure dates are within the timeline bounds
    const clampedStartDate =
      activityStartDate < startDate ? startDate : activityStartDate;
    const clampedEndDate =
      activityEndDate > endDate ? endDate : activityEndDate;

    const duration = differenceInMilliseconds(clampedEndDate, clampedStartDate);
    return (duration / totalDuration) * 100;
  };

  // Function to calculate left position percentage based on start date
  const calculateLeft = (activityStartDate: Date): number => {
    // If activity starts before timeline, clamp to timeline start
    if (activityStartDate < startDate) return 0;

    const offset = differenceInMilliseconds(activityStartDate, startDate);
    return (offset / totalDuration) * 100;
  };

  // Function to convert percentage position to date
  const percentToDate = (percent: number): Date => {
    const milliseconds = (percent / 100) * totalDuration;
    return addMilliseconds(startDate, milliseconds);
  };

  // Function to format date for display
  const formatDateTime = (date: Date): string => {
    return format(date, "MMM d, h:mm a");
  };

  // Function to handle mouse down on timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) {
      console.error("Timeline ref is not set");
      return;
    }

    // Only start drag if clicking directly on the timeline background (not on an activity)
    if ((e.target as HTMLElement).classList.contains("timeline-bg")) {
      console.log("Clicked on timeline background");
      const rect = timelineRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;

      setIsDragging(true);
      setDragStart(percent);
      setDragEnd(percent);
    } else {
      console.log("Clicked on an activity");
    }
  };

  // Function to handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;

    // Clamp percent between 0 and 100
    const clampedPercent = Math.max(0, Math.min(100, percent));

    setDragEnd(clampedPercent);
  };

  // Function to handle mouse up after drag
  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      // Only create activity if drag distance is significant
      if (Math.abs(dragEnd - dragStart) > 1) {
        const startPercent = Math.min(dragStart, dragEnd);
        const endPercent = Math.max(dragStart, dragEnd);

        const activityStartDate = percentToDate(startPercent);
        const activityEndDate = percentToDate(endPercent);

        // Create new activity
        const newActivity: SessionPrecursor = {
          startTime: activityStartDate,
          category: undefined,
          description: null,
          endTime: activityEndDate,
          session_type: "fixed",
          tags: [],
        };
        setActivityToCreate(newActivity);
        setIsCreateDialogOpen(true);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Function to edit an activity
  const handleEditActivity = (activity: ScheduledSessionWithId) => {
    setActivityToEdit({ ...activity });
    setIsEditDialogOpen(true);
  };

  // Function to save edited activity
  const handleSaveEditedActivity = () => {
    if (!activityToEdit) return;

    setIsEditDialogOpen(false);
    setActivityToEdit(null);
  };

  // Function to delete an activity
  const handleDeleteActivity = () => {
    if (!activityToEdit) return;

    setIsEditDialogOpen(false);
    setActivityToEdit(null);
    setSelectedActivity(null);
  };

  const getMarkerSetp = () => {
    if (!markerStep) {
      return 2; // Default to 2 hours if not provided
    }
    if (markerStep < 1) {
      return 1; // Minimum step of 1 hour
    }
    return markerStep;
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    const markerStep = getMarkerSetp();
    // Calculate how many markers to show based on the timeline duration and marker step
    const totalHours = totalDuration / (1000 * 60 * 60);
    const numMarkers = Math.ceil(totalHours / markerStep) + 1;

    return Array.from({ length: numMarkers }, (_, i) => {
      const markerDate = addHours(startDate, i * markerStep);

      // Skip if marker is beyond the end date
      if (markerDate > endDate) return null;

      const percent = calculateLeft(markerDate);
      const formattedTime = format(markerDate, "MMM d, HH:mm");

      return (
        <div
          key={`marker-${i}`}
          className={cn(
            "absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-700",
            (i === 0 || i === numMarkers - 1) && "border-0",
          )}
          style={{ left: `${percent}%` }}
        >
          <span
            className={cn(
              "absolute -top-6 -translate-x-1/4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-hidden",

              i === 0 && "left-2",
              i === numMarkers - 1 && "-right-5",
            )}
          >
            {formattedTime}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  // Calculate drag selection area
  const dragSelectionStyle =
    isDragging && dragStart !== null && dragEnd !== null
      ? {
          left: `${Math.min(dragStart, dragEnd)}%`,
          width: `${Math.abs(dragEnd - dragStart)}%`,
          bottom: "5%",
          height: "90%",
          position: "absolute" as const,
          backgroundColor: "rgba(59, 130, 246, 0.3)",
          border: "2px dashed #3b82f6",
          zIndex: 5,
          pointerEvents: "none" as const,
        }
      : {};

  const timeFormatter = (percentage: number) => {
    const totalDurationMs = differenceInMilliseconds(endDate, startDate);
    const elapsedMs = (percentage / 100) * totalDurationMs;
    const result = addMilliseconds(startDate, elapsedMs);
    return formatDateTime(result);
  };

  const TimelineRow: FC<{ sessions: ScheduledSessionWithId[] }> = ({
    sessions,
  }) => {
    return (
      <div className="flex items-center h-36 bg-transparent rounded-md cursor-crosshair">
        {/* Activities */}
        {sessions.map((activity) => {
          const width = calculateWidth(activity.startTime, activity.endTime);
          const left = calculateLeft(activity.startTime);

          // Skip if activity is completely outside the timeline
          if (width <= 0 || left >= 100 || left + width <= 0) return null;

          return (
            <SessionCard
              onMouseEnter={() => setHoveredSession(activity.id)}
              onMouseLeave={() => setHoveredSession(null)}
              session={activity}
              className={cn(
                "absolute overflow-hidden rounded-md cursor-pointer transition-all",
                "hover:z-50 hover:border-green-200 hover:border-2",
                selectedActivity?.id === activity.id
                  ? "ring-2 ring-offset-2 ring-black dark:ring-white"
                  : "opacity-80 hover:opacity-100",
                (isDragging || isEditDialogOpen || isCreateDialogOpen) &&
                  "pointer-events-none",
              )}
              style={{
                minWidth:
                  hoveredSession === activity.id ? `${width}%` : undefined,
                width: hoveredSession === activity.id ? undefined : `${width}%`,
                left: `${left}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEditActivity(activity);
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative mt-8 mb-4 h-full">
          {/* Time markers */}
          {generateTimeMarkers()}

          {/* Timeline bar */}
          <HoverPercentageBar formatter={timeFormatter}>
            <div
              className="h-full relative"
              ref={timelineRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Timeline background for click detection */}
              <div className="timeline-bg absolute inset-0"></div>

              {/* Drag selection area */}
              {isDragging && <div style={dragSelectionStyle}></div>}
              {groupedActivities.map((activity) => {
                return <TimelineRow sessions={activity} />;
              })}
            </div>
          </HoverPercentageBar>
        </div>

        {/* Activity details section */}
        {selectedActivity && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="space-y-2">
              <SessionCard session={selectedActivity} />
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditActivity(selectedActivity)}
                >
                  Edit Activity
                </Button>
              </div>
            </div>
          </div>
        )}

        {activityToCreate && (
          <Dialog
            modal={false}
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogContent className="w-full max-w-[60%]">
              <DialogHeader>
                <DialogTitle>Create Activity</DialogTitle>
              </DialogHeader>
              <ScheduledSessionCreationForm
                precursor={activityToCreate}
                onSave={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Activity Dialog */}
        <Dialog
          modal={false}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        >
          <DialogContent className="w-full max-w-[60%]">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
            </DialogHeader>
            {activityToEdit && (
              <EditScheduledSession
                session={activityToEdit}
                onSave={handleSaveEditedActivity}
                onDelete={handleDeleteActivity}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
