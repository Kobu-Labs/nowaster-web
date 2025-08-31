import type { ScheduledSessionWithId } from "@/api/definitions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { HoverPercentageBar } from "@/components/ui-providers/HoverPercentageBar";
import { SessionCard } from "@/components/visualizers/sessions/SessionCard";
import { EditScheduledSession } from "@/components/visualizers/sessions/form/EditScheduledSessionForm";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/form/ScheduledSessionCreationForm";
import { sessionToNonIntersection } from "@/lib/sessions/intervals";
import { cn } from "@/lib/utils";
import type { SessionPrecursor } from "@/validation/session/creation";
import {
  addHours,
  addMilliseconds,
  differenceInMilliseconds,
  format,
} from "date-fns";
import type { FC } from "react";
import { useMemo, useRef, useState } from "react";

interface SessionTimelineUiProviderProps {
  endDate: Date;
  sessions: ScheduledSessionWithId[];
  startDate: Date;
}

export function SessionTimelineUiProvider({
  endDate,
  sessions,
  startDate,
}: SessionTimelineUiProviderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    end: number;
    origin: number;
    start: number;
  } | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit]
    = useState<null | ScheduledSessionWithId>(null);
  const [sessionToCreate, setSessionToCreate]
    = useState<null | SessionPrecursor>();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredSession, setHoveredSession] = useState<null | string>(null);

  const groupedSessions = useMemo(() => {
    return sessionToNonIntersection(sessions);
  }, [sessions]);

  const totalDuration = differenceInMilliseconds(endDate, startDate);
  const calculateWidth = (
    sessionStartDate: Date,
    sessionEndDate: Date,
  ): number => {
    // Ensure dates are within the timeline bounds
    const clampedStartDate
      = sessionStartDate < startDate ? startDate : sessionStartDate;
    const clampedEndDate = sessionEndDate > endDate ? endDate : sessionEndDate;

    const duration = differenceInMilliseconds(clampedEndDate, clampedStartDate);
    return (duration / totalDuration) * 100;
  };

  // Function to calculate left position percentage based on start date
  const calculateLeft = (sessionStartDate: Date): number => {
    // If session starts before timeline, clamp to timeline start
    if (sessionStartDate < startDate) {
      return 0;
    }

    const offset = differenceInMilliseconds(sessionStartDate, startDate);
    return (offset / totalDuration) * 100;
  };

  // Function to convert percentage position to date
  const percentToDate = (percent: number): Date => {
    const milliseconds = (percent / 100) * totalDuration;
    return addMilliseconds(startDate, milliseconds);
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
      setDragStart({ end: percent, origin: percent, start: percent });
    }
  };

  const handleMouseExit = () => {
    setIsDragging(false);
  };

  // Function to handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;

    // Clamp percent between 0 and 100
    const clampedPercent = Math.max(0, Math.min(100, percent));

    if (dragStart) {
      // Calculate start and end based on origin and current position
      const start = Math.min(dragStart.origin, clampedPercent);
      const end = Math.max(dragStart.origin, clampedPercent);
      setDragStart({ end, origin: dragStart.origin, start });
    } else {
      setDragStart({
        end: clampedPercent,
        origin: clampedPercent,
        start: clampedPercent,
      });
    }
  };

  // Function to handle mouse up after drag
  const handleMouseUp = () => {
    if (
      isDragging
      && dragStart !== null // Only create session if drag distance is significant
      && dragStart.end - dragStart.start > 1
    ) {
      const sessionStartDate = percentToDate(dragStart.start);
      const sessionEndDate = percentToDate(dragStart.end);

      const newSession: SessionPrecursor = {
        category: undefined,
        description: null,
        endTime: sessionEndDate,
        session_type: "fixed",
        startTime: sessionStartDate,
        tags: [],
      };
      setSessionToCreate(newSession);
      setIsCreateDialogOpen(true);
    }

    setIsDragging(false);
    setDragStart(null);
  };

  // Function to edit an session
  const handleEditSession = (session: ScheduledSessionWithId) => {
    setSessionToEdit({ ...session });
    setIsEditDialogOpen(true);
  };

  // Function to save edited session
  const handleSaveEditedSession = () => {
    if (!sessionToEdit) {
      return;
    }

    setIsEditDialogOpen(false);
    setSessionToEdit(null);
  };

  // Function to delete an session
  const handleDeleteSession = () => {
    if (!sessionToEdit) {
      return;
    }

    setIsEditDialogOpen(false);
    setSessionToEdit(null);
  };

  const getMarkerSetp = () => {
    const diffInHours = Math.floor(totalDuration / (1000 * 60 * 60));
    return Math.floor(diffInHours / 5);
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    if (groupedSessions.length === 0) {
      return null;
    }
    const markerStep = getMarkerSetp();
    // Calculate how many markers to show based on the timeline duration and marker step
    const totalHours = totalDuration / (1000 * 60 * 60);
    const numMarkers = Math.ceil(totalHours / markerStep) + 1;

    return Array.from({ length: numMarkers }, (_, i) => {
      const markerDate = addHours(startDate, i * markerStep);

      // Skip if marker is beyond the end date
      if (markerDate > endDate) {
        return null;
      }

      const percent = calculateLeft(markerDate);
      const formattedTime = format(markerDate, "MMM d, HH:mm");

      return (
        <div
          className={cn(
            "absolute top-0 bottom-0 border-l border-pink-muted",
            (i === 0 || i === numMarkers - 1) && "border-0",
          )}
          key={`marker-${i}`}
          style={{ left: `${percent}%` }}
        >
          <span
            className={cn(
              "absolute -top-6 -translate-x-1/4 text-xs text-white whitespace-nowrap overflow-hidden",

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
  const dragSelectionStyle
    = isDragging && dragStart !== null
      ? {
          backgroundColor: "#330e29",
          border: "2px dashed #630e20",
          bottom: "5%",
          height: "90%",
          left: `${dragStart.start}%`,
          opacity: 0.6,
          pointerEvents: "none" as const,
          position: "absolute" as const,
          width: `${dragStart.end - dragStart.start}%`,
          zIndex: 5,
        }
      : null;

  const timeFormatter = (percentage: number) => {
    const totalDurationMs = differenceInMilliseconds(endDate, startDate);
    const elapsedMs = (percentage / 100) * totalDurationMs;
    const result = addMilliseconds(startDate, elapsedMs);
    return format(result, "MMM d, HH:mm");
  };

  const TimelineRow: FC<{ sessions: ScheduledSessionWithId[]; }> = ({
    sessions,
  }) => {
    return (
      <div className="flex items-center h-36 bg-transparent rounded-md cursor-crosshair">
        {sessions.map((session) => {
          const width = calculateWidth(session.startTime, session.endTime);
          const left = calculateLeft(session.startTime);

          // Skip if session is completely outside the timeline
          if (width <= 0 || left >= 100 || left + width <= 0) {
            return null;
          }

          return (
            <SessionCard
              className={cn(
                "absolute overflow-hidden rounded-md cursor-pointer transition-all",
                "hover:z-50 hover:border-pink-primary/50 hover:border-2",
                "opacity-80 hover:opacity-100",
                (isDragging || isEditDialogOpen || isCreateDialogOpen)
                && "pointer-events-none",
                hoveredSession === session.id && "gradient-card-solid",
              )}
              key={session.id}
              onClick={(e) => {
                e.stopPropagation();
                handleEditSession(session);
              }}
              onMouseEnter={() => {
                setHoveredSession(session.id);
              }}
              onMouseLeave={() => {
                setHoveredSession(null);
              }}
              session={session}
              style={{
                left: `${left}%`,
                minWidth:
                  hoveredSession === session.id ? `${width}%` : undefined,
                width: hoveredSession === session.id ? undefined : `${width}%`,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="relative mt-8 px-4 pb-4 h-full">
        {/* Time markers */}
        {generateTimeMarkers()}

        {/* Timeline bar */}
        <HoverPercentageBar formatter={timeFormatter}>
          <div
            className="h-full relative cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseExit}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={timelineRef}
          >
            {/* Timeline background for click detection */}
            <div className="timeline-bg absolute inset-0"></div>

            {/* Drag selection area */}
            {dragSelectionStyle && <div style={dragSelectionStyle}></div>}
            {groupedSessions.length === 0 && (
              <div className="h-36 flex items-center justify-center">
                No sessions available
              </div>
            )}
            {groupedSessions.map((group, index) => (
              <TimelineRow key={index} sessions={group} />
            ))}
          </div>
        </HoverPercentageBar>
      </div>

      {sessionToCreate && (
        <Dialog
          modal={false}
          onOpenChange={setIsCreateDialogOpen}
          open={isCreateDialogOpen}
        >
          <DialogContent className="w-fit max-w-fit">
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
            </DialogHeader>
            <ScheduledSessionCreationForm
              onCreate={() => setIsCreateDialogOpen(false)}
              precursor={sessionToCreate}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Session Dialog */}
      <Dialog
        modal={false}
        onOpenChange={setIsEditDialogOpen}
        open={isEditDialogOpen}
      >
        <DialogContent className="w-full max-w-[60%]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          {sessionToEdit && (
            <EditScheduledSession
              onCancel={() => {
                setIsEditDialogOpen(false);
              }}
              onDelete={handleDeleteSession}
              onSave={handleSaveEditedSession}
              session={sessionToEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
