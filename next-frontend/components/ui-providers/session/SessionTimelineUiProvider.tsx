import { ScheduledSessionWithId } from "@/api/definitions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { HoverPercentageBar } from "@/components/ui-providers/HoverPercentageBar";
import { SessionCard } from "@/components/visualizers/categories/SessionCard";
import { EditScheduledSession } from "@/components/visualizers/sessions/EditScheduledSessionForm";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/ScheduledSessionCreationForm";
import { sessionToNonIntersection } from "@/lib/sessions/intervals";
import { cn } from "@/lib/utils";
import {
  addHours,
  addMilliseconds,
  differenceInMilliseconds,
  format,
} from "date-fns";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { SessionPrecursor } from "@/validation/session/creation";

interface SessionTimelineUiProviderProps {
  sessions: ScheduledSessionWithId[];
  startDate: Date;
  endDate: Date;
  onSessionsChange?: (sessions: ScheduledSessionWithId[]) => void;
}

export function SessionTimelineUiProvider({
  sessions,
  startDate,
  endDate,
  onSessionsChange,
}: SessionTimelineUiProviderProps) {
  const [selectedSession, setSelectedSession] =
    useState<ScheduledSessionWithId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] =
    useState<ScheduledSessionWithId | null>(null);
  const [sessionToCreate, setSessionToCreate] =
    useState<SessionPrecursor | null>();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);

  const groupedSessions = useMemo(() => {
    return sessionToNonIntersection(sessions);
  }, [sessions]);

  useEffect(() => {
    if (onSessionsChange) {
      onSessionsChange(sessions);
    }
  }, [sessions, onSessionsChange]);

  const totalDuration = differenceInMilliseconds(endDate, startDate);
  const calculateWidth = (
    sessionStartDate: Date,
    sessionEndDate: Date,
  ): number => {
    // Ensure dates are within the timeline bounds
    const clampedStartDate =
      sessionStartDate < startDate ? startDate : sessionStartDate;
    const clampedEndDate = sessionEndDate > endDate ? endDate : sessionEndDate;

    const duration = differenceInMilliseconds(clampedEndDate, clampedStartDate);
    return (duration / totalDuration) * 100;
  };

  // Function to calculate left position percentage based on start date
  const calculateLeft = (sessionStartDate: Date): number => {
    // If session starts before timeline, clamp to timeline start
    if (sessionStartDate < startDate) return 0;

    const offset = differenceInMilliseconds(sessionStartDate, startDate);
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
      return;
    }

    // Only start drag if clicking directly on the timeline background (not on an session)
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
      // Only create session if drag distance is significant
      if (Math.abs(dragEnd - dragStart) > 1) {
        const startPercent = Math.min(dragStart, dragEnd);
        const endPercent = Math.max(dragStart, dragEnd);

        const sessionStartDate = percentToDate(startPercent);
        const sessionEndDate = percentToDate(endPercent);

        // Create new session
        const newSession: SessionPrecursor = {
          startTime: sessionStartDate,
          category: undefined,
          description: null,
          endTime: sessionEndDate,
          session_type: "fixed",
          tags: [],
        };
        setSessionToCreate(newSession);
        setIsCreateDialogOpen(true);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Function to edit an session
  const handleEditSession = (session: ScheduledSessionWithId) => {
    setSessionToEdit({ ...session });
    setIsEditDialogOpen(true);
  };

  // Function to save edited session
  const handleSaveEditedSession = () => {
    if (!sessionToEdit) return;

    setIsEditDialogOpen(false);
    setSessionToEdit(null);
  };

  // Function to delete an session
  const handleDeleteSession = () => {
    if (!sessionToEdit) return;

    setIsEditDialogOpen(false);
    setSessionToEdit(null);
    setSelectedSession(null);
  };

  const getMarkerSetp = () => {
    const diffInHours = Math.floor(totalDuration / (1000 * 60 * 60));
    return Math.floor(diffInHours / 5);
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    if (groupedSessions.length === 0) return null;
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
        {sessions.map((session) => {
          const width = calculateWidth(session.startTime, session.endTime);
          const left = calculateLeft(session.startTime);

          // Skip if session is completely outside the timeline
          if (width <= 0 || left >= 100 || left + width <= 0) return null;

          return (
            <SessionCard
              key={session.id}
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
              session={session}
              className={cn(
                "absolute overflow-hidden rounded-md cursor-pointer transition-all",
                "hover:z-50 hover:border-green-200 hover:border-2",
                selectedSession?.id === session.id
                  ? "ring-2 ring-offset-2 ring-black dark:ring-white"
                  : "opacity-80 hover:opacity-100",
                (isDragging || isEditDialogOpen || isCreateDialogOpen) &&
                  "pointer-events-none",
              )}
              style={{
                minWidth:
                  hoveredSession === session.id ? `${width}%` : undefined,
                width: hoveredSession === session.id ? undefined : `${width}%`,
                left: `${left}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEditSession(session);
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
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
            {groupedSessions.length === 0 && (
              <div className="h-36  flex items-center justify-center text-gray-500">
                No sessions available
              </div>
            )}
            {groupedSessions.map((group, index) => (
              <TimelineRow sessions={group} key={index} />
            ))}
          </div>
        </HoverPercentageBar>
      </div>

      {/* Session details section */}
      {selectedSession && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="space-y-2">
            <SessionCard session={selectedSession} />
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditSession(selectedSession)}
              >
                Edit Session
              </Button>
            </div>
          </div>
        </div>
      )}

      {sessionToCreate && (
        <Dialog
          modal={false}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <DialogContent className="w-full max-w-[60%]">
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
            </DialogHeader>
            <ScheduledSessionCreationForm
              precursor={sessionToCreate}
              onSave={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Session Dialog */}
      <Dialog
        modal={false}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="w-full max-w-[60%]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          {sessionToEdit && (
            <EditScheduledSession
              session={sessionToEdit}
              onSave={handleSaveEditedSession}
              onDelete={handleDeleteSession}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
