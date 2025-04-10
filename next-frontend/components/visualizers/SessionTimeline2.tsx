"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import {
  format,
  addHours,
  differenceInMilliseconds,
  addMilliseconds,
} from "date-fns";
import {
  CategoryWithIdSchema,
  ScheduledSessionWithId,
  TagWithIdSchema,
} from "@/api/definitions";
import { z } from "zod";

interface DateTimelineProps {
  activities: ScheduledSessionWithId[];
  startDate: Date;
  endDate: Date;
  onActivitiesChange?: (activities: ScheduledSessionWithId[]) => void;
  markerStep?: number; // in hours
}

// Available color options
const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-cyan-500", label: "Cyan" },
];

export const sessionPrecursor = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
});

type SessionPrecursor = z.infer<typeof sessionPrecursor>;
export function SessionTimeline({
  activities: initialActivities,
  startDate,
  endDate,
  onActivitiesChange,
  markerStep = 2, // Default to 2-hour markers
}: DateTimelineProps) {
  const [activities, setActivities] =
    useState<ScheduledSessionWithId[]>(initialActivities);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<SessionPrecursor | null>(
    null,
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate total duration of the timeline in milliseconds
  const totalDuration = differenceInMilliseconds(endDate, startDate);

  // Notify parent component when activities change
  useEffect(() => {
    if (onActivitiesChange) {
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

  // Function to calculate width percentage based on activity duration
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
    return format(date, "MMM d, yyyy h:mm a");
  };

  // Function to format date for input
  const formatDateTimeForInput = (date: Date): string => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Function to handle mouse down on timeline
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    // Only start drag if clicking directly on the timeline background (not on an activity)
    if ((e.target as HTMLElement).classList.contains("timeline-bg")) {
      const rect = timelineRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;

      setIsDragging(true);
      setDragStart(percent);
      setDragEnd(percent);
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
        setActivityToEdit(newActivity);
        setIsEditDialogOpen(true);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Function to edit an activity
  const handleEditActivity = (activity: SessionPrecursor) => {
    setActivityToEdit({ ...activity });
    setIsEditDialogOpen(true);
  };

  // Function to save edited activity
  const handleSaveEditedActivity = () => {
    if (!activityToEdit) return;

    const updatedActivities = activities.map((activity) =>
      activity.id === activityToEdit.id ? activityToEdit : activity,
    );

    setActivities(updatedActivities);
    setIsEditDialogOpen(false);
    setActivityToEdit(null);
  };

  // Function to delete an activity
  const handleDeleteActivity = () => {
    if (!activityToEdit) return;

    const updatedActivities = activities.filter(
      (activity) => activity.id !== activityToEdit.id,
    );

    setActivities(updatedActivities);
    setIsEditDialogOpen(false);
    setActivityToEdit(null);
    setSelectedActivity(null);
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    // Calculate how many markers to show based on the timeline duration and marker step
    const totalHours = totalDuration / (1000 * 60 * 60);
    const numMarkers = Math.ceil(totalHours / markerStep) + 1;

    return Array.from({ length: numMarkers }, (_, i) => {
      const markerDate = addHours(startDate, i * markerStep);

      // Skip if marker is beyond the end date
      if (markerDate > endDate) return null;

      const percent = calculateLeft(markerDate);
      const formattedTime = format(markerDate, "MMM d, h:mm a");

      return (
        <div
          key={`marker-${i}`}
          className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-700"
          style={{ left: `${percent}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formattedTime}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  // Calculate drag selection area
  const dragSelectionStyle =
    isDragging && dragStart !== null && dragEnd !== null
      ? {
          left: `${Math.min(dragStart, dragEnd)}%`,
          width: `${Math.abs(dragEnd - dragStart)}%`,
          height: "100%",
          position: "absolute" as const,
          backgroundColor: "rgba(59, 130, 246, 0.3)",
          border: "2px dashed #3b82f6",
          zIndex: 5,
          pointerEvents: "none" as const,
        }
      : {};

  return (
    <Card>
      <CardContent className="p-6">
        <TooltipProvider>
          <div className="relative mt-8 mb-4 h-20">
            {/* Time markers */}
            {generateTimeMarkers()}

            {/* Timeline bar */}
            <div
              ref={timelineRef}
              className="absolute top-8 left-0 right-0 h-16 bg-gray-100 dark:bg-gray-800 rounded-md cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Timeline background for click detection */}
              <div className="timeline-bg absolute inset-0"></div>

              {/* Drag selection area */}
              {isDragging && <div style={dragSelectionStyle}></div>}

              {/* Activities */}
              {activities.map((activity) => {
                const width = calculateWidth(
                  activity.startTime,
                  activity.endTime,
                );
                const left = calculateLeft(activity.startTime);

                // Skip if activity is completely outside the timeline
                if (width <= 0 || left >= 100 || left + width <= 0) return null;

                return (
                  <Tooltip key={activity.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute h-16 rounded-md cursor-pointer transition-all",
                          selectedActivity === activity.id
                            ? "ring-2 ring-offset-2 ring-black dark:ring-white"
                            : "opacity-80 hover:opacity-100",
                        )}
                        style={{
                          width: `${width}%`,
                          left: `${left}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(
                            activity.id === selectedActivity
                              ? null
                              : activity.id,
                          );
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleEditActivity(activity);
                        }}
                      >
                        <div className="p-2 text-white truncate text-xs md:text-sm">
                          {activity.category.name}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{activity.category.name}</p>
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(activity.startTime)} -{" "}
                          {formatDateTime(activity.endTime)}
                        </p>
                        <p className="text-xs italic">Double-click to edit</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Activity details section */}
        {selectedActivity && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            {activities
              .filter((activity) => activity.id === selectedActivity)
              .map((activity) => (
                <div key={activity.id} className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {activity.category.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(activity.startTime)} -{" "}
                    {formatDateTime(activity.endTime)}
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditActivity(activity)}
                    >
                      Edit Activity
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Edit Activity Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
            </DialogHeader>
            {activityToEdit && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={activityToEdit.title}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        title: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={activityToEdit.description}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        description: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formatDateTimeForInput(activityToEdit.startDate)}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        startDate: e.target.value
                          ? new Date(e.target.value)
                          : activityToEdit.startDate,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formatDateTimeForInput(activityToEdit.endDate)}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        endDate: e.target.value
                          ? new Date(e.target.value)
                          : activityToEdit.endDate,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <Select
                    value={activityToEdit.color}
                    onValueChange={(value) =>
                      setActivityToEdit({ ...activityToEdit, color: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full mr-2 ${color.value}`}
                            ></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleDeleteActivity}>
                Delete
              </Button>
              <div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEditedActivity}>Save</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
