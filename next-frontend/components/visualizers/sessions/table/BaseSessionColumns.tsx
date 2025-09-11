import type { ScheduledSessionWithId } from "@/api/definitions";
import type { ColumnDef } from "@tanstack/react-table";
import { differenceInMinutes, format } from "date-fns";
import { DownloadIcon, Edit, Trash2 } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import { useDeleteScheduledSession } from "@/components/hooks/session/fixed/useDeleteSession";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Button } from "@/components/shadcn/button";
import { DataTableColumnHeader } from "@/components/shadcn/column-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { EditScheduledSession } from "@/components/visualizers/sessions/form/EditScheduledSessionForm";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { formatTime } from "@/lib/utils";

interface DeleteSessionIconProps {
  sessionId: string;
}

const DeleteSessionIcon: FC<DeleteSessionIconProps> = (props) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const deleteSession = useDeleteScheduledSession();

  return (
    <AlertDialog onOpenChange={setIsDeleteAlertOpen} open={isDeleteAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button
          className="group cursor-pointer p-0 m-0 aspect-square h-6 w-6 md:h-8 md:w-8"
          variant="ghost"
        >
          <Trash2 className="h-3 w-3 md:h-4 md:w-4 group-hover:text-red-500 group-hover:scale-110 group-hover:transition" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this session? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () =>
              await deleteSession.mutateAsync(props.sessionId, {
                onSuccess: () => {
                  setIsDeleteAlertOpen(false);
                },
              })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const EditSessionButton: FC<{ session: ScheduledSessionWithId; }> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog modal={false} onOpenChange={setIsDialogOpen} open={isDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className="group cursor-pointer p-0 m-0 aspect-square h-6 w-6 md:h-8 md:w-8"
          variant="ghost"
        >
          <Edit className="h-3 w-3 md:h-4 md:w-4 group-hover:scale-110 group-hover:transition" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <EditScheduledSession
          onCancel={() => {
            setIsDialogOpen(false);
          }}
          onDelete={() => {
            setIsDialogOpen(false);
          }}
          onSave={() => {
            setIsDialogOpen(false);
          }}
          session={props.session}
        />
      </DialogContent>
    </Dialog>
  );
};

const downloadJSON = (data: ScheduledSessionWithId[], filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

export const BaseSessionTableColumns: ColumnDef<ScheduledSessionWithId>[] = [
  {
    accessorKey: "download",
    header: (data) => {
      const rows = data.table.getRowModel().rows.map((row) => row.original);
      return (
        <Button
          className="p-0 m-0 h-6 w-6 md:h-8 md:w-8"
          onClick={() => downloadJSON(rows, "export.json")}
          variant="ghost"
        >
          <DownloadIcon className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "category",
    cell: (data) => {
      return (
        <CategoryBadge
          color={data.row.original.category.color}
          name={data.row.original.category.name}
        />
      );
    },
    header: "Category",
  },
  {
    accessorKey: "tags",
    cell: (data) => {
      const { tags } = data.row.original;

      return (
        <div className="flex flex-wrap gap-1 max-w-[120px] md:max-w-none">
          {tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag.id} tag={tag} variant="auto" />
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +
              {tags.length - 2}
            </span>
          )}
        </div>
      );
    },
    header: "Tags",
  },
  {
    accessorKey: "description",
    cell: (data) => {
      const desc = data.row.original.description;
      return (
        <div
          className="max-w-[100px] md:max-w-[200px] truncate text-xs md:text-sm"
          title={desc ?? undefined}
        >
          {desc}
        </div>
      );
    },
    header: "Desc.",
  },
  {
    accessorKey: "startTime",
    cell: ({ row: { original } }) => (
      <div className="text-xs md:text-sm">
        <div className="md:hidden">{format(original.startTime, "dd/MM")}</div>
        <div className="md:hidden">{format(original.startTime, "HH:mm")}</div>
        <div className="hidden md:block">
          {format(original.startTime, "dd-MM-yyyy HH:mm")}
        </div>
      </div>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start" />
    ),
  },
  {
    accessorKey: "endTime",
    cell: ({ row: { original } }) => (
      <div className="text-xs md:text-sm">
        <div className="md:hidden">{format(original.endTime, "dd/MM")}</div>
        <div className="md:hidden">{format(original.endTime, "HH:mm")}</div>
        <div className="hidden md:block">
          {format(original.endTime, "dd-MM-yyyy HH:mm")}
        </div>
      </div>
    ),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End" />
    ),
  },
  {
    accessorFn: (session) =>
      differenceInMinutes(session.endTime, session.startTime),
    cell: (test) => {
      const time = test.cell.getValue<number>();
      return (
        <div className="text-xs md:text-sm font-mono">{formatTime(time)}</div>
      );
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    id: "duration-column",
  },
  {
    cell: (data) => (
      <div className="flex gap-1">
        <EditSessionButton session={data.row.original} />
        <DeleteSessionIcon sessionId={data.row.original.id} />
      </div>
    ),
    header: "",
    id: "actions",
  },
];
