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
import { cn, randomColor } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import {
  CategoryWithIdSchema,
  ScheduledSession,
  ScheduledSessionWithId,
  TagWithIdSchema,
} from "@/api/definitions";
import { useCreateScheduledSession } from "@/components/hooks/session/fixed/useCreateSession";
import { z } from "zod";

interface ResponsiveTimelineProps {
  activities: ScheduledSessionWithId[];
  hourStep?: number; // Allow custom hour step
  onActivitiesChange?: (activities: ScheduledSessionWithId[]) => void;
}

export const sessionPrecursor = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  category: CategoryWithIdSchema.nullish(),
  description: z.string().nullable(),
  tags: z.array(TagWithIdSchema),
  session_type: z.literal("fixed"),
});

type SessionPrecursor = z.infer<typeof sessionPrecursor>;

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

export function SessionTimeline({
  activities: initialActivities,
  hourStep: customHourStep,
  onActivitiesChange,
}: ResponsiveTimelineProps) {
  const [activities, setActivities] =
    useState<ScheduledSessionWithId[]>(initialActivities);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [hourStep, setHourStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<SessionPrecursor | null>(
    null,
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  // Function to determine hour step based on viewport width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setHourStep(6); // Every 6 hours on very small screens
      } else if (width < 640) {
        setHourStep(4); // Every 4 hours on small screens
      } else if (width < 768) {
        setHourStep(3); // Every 3 hours on medium screens
      } else if (width < 1024) {
        setHourStep(2); // Every 2 hours on larger screens
      } else {
        setHourStep(1); // Every hour on very large screens
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Notify parent component when activities change
  useEffect(() => {
    if (onActivitiesChange) {
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

  // Use custom hour step if provided
  const effectiveHourStep = customHourStep || hourStep;

  // Function to convert time string (HH:MM) to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Function to convert minutes since midnight to time string (HH:MM)
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Function to calculate width percentage based on activity duration
  const calculateWidth = (startTime: string, endTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;

    // 24 hours = 1440 minutes, so percentage is (duration / 1440) * 100
    return (duration / 1440) * 100;
  };

  // Function to calculate left position percentage based on start time
  const calculateLeft = (startTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    return (startMinutes / 1440) * 100;
  };

  // Function to convert percentage position to time
  const percentToTime = (percent: number): string => {
    const minutes = Math.floor((percent / 100) * 1440);
    return minutesToTime(minutes);
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

  const createSession = useCreateScheduledSession();

  // Function to handle mouse up after drag
  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      // Only create activity if drag distance is significant
      if (Math.abs(dragEnd - dragStart) > 1) {
        const startPercent = Math.min(dragStart, dragEnd);
        const endPercent = Math.max(dragStart, dragEnd);

        const startTime = percentToTime(startPercent);
        const endTime = percentToTime(endPercent);

        // Create new activity
        const newActivity: SessionPrecursor = {
          startTime: new Date(),
          endTime: new Date(),
          category: undefined,
          description: null,
          tags: [],
          session_type: "fixed",
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
  const handleEditActivity = (activity: Activity) => {
    setActivityToEdit({ ...activity });
    setIsEditDialogOpen(true);
  };

  // Function to save edited activity
  const handleSaveActivity = () => {
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

  // Generate hour markers for the timeline
  const hourMarkers = Array.from(
    { length: Math.ceil(25 / effectiveHourStep) },
    (_, i) => {
      const hour = (i * effectiveHourStep) % 24;
      const formattedHour = hour.toString().padStart(2, "0") + ":00";
      return (
        <div
          key={`hour-${i}`}
          className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-700"
          style={{ left: `${(hour / 24) * 100}%` }}
        >
          <span className="absolute -top-6 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">
            {formattedHour}
          </span>
        </div>
      );
    },
  );

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
            {/* Hour markers */}
            {hourMarkers}

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

                return (
                  <Tooltip key={activity.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute h-16 rounded-md cursor-pointer transition-all",
                          activity.color,
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
                          {activity.title}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.startTime} - {activity.endTime}
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
                  <h3 className="text-lg font-medium">{activity.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.startTime} - {activity.endTime}
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
                  <Label htmlFor="startTime" className="text-right">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={activityToEdit.startTime}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        startTime: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={activityToEdit.endTime}
                    onChange={(e) =>
                      setActivityToEdit({
                        ...activityToEdit,
                        endTime: e.target.value,
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
                <Button onClick={handleSaveActivity}>Save</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
