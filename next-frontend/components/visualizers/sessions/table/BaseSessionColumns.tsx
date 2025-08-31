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
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
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
          className="group cursor-pointer p-0 m-0 aspect-square"
          variant="ghost"
        >
          <Trash2 className="group-hover:text-red-500 group-hover:scale-110 group-hover:transition" />
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
                onSuccess: () => { setIsDeleteAlertOpen(false); },
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
          className="group cursor-pointer p-0 m-0 aspect-square"
          variant="ghost"
        >
          <Edit className="group-hover:scale-110 group-hover:transition" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <EditScheduledSession
          onCancel={() => { setIsDialogOpen(false); }}
          onDelete={() => { setIsDialogOpen(false); }}
          onSave={() => { setIsDialogOpen(false); }}
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
          className="p-0 m-0"
          onClick={() => { downloadJSON(rows, "export.json"); }}
          variant="ghost"
        >
          <DownloadIcon className="size-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "category",
    cell: (data) => {
      return <CategoryLabel category={data.row.original.category} />;
    },
    header: "Category",
  },
  {
    accessorKey: "tags",
    cell: (data) => {
      const { tags } = data.row.original;

      return (
        <div className="flex">
          {tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} variant="auto" />
          ))}
        </div>
      );
    },
    header: "Tags",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "startTime",
    cell: ({ row: { original } }) =>
      format(original.startTime, "dd-MM-yyyy HH:mm"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Time" />
    ),
  },
  {
    accessorKey: "endTime",
    cell: ({ row: { original } }) =>
      format(original.endTime, "dd-MM-yyyy HH:mm"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Time" />
    ),
  },
  {
    accessorFn: (session) =>
      differenceInMinutes(session.endTime, session.startTime),
    cell: (test) => {
      const time = test.cell.getValue<number>();
      return <div>{formatTime(time)}</div>;
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    id: "duration-column",
  },
  {
    cell: (data) => (
      <>
        <EditSessionButton session={data.row.original} />
        <DeleteSessionIcon sessionId={data.row.original.id} />
      </>
    ),
    id: "actions",
  },
];
