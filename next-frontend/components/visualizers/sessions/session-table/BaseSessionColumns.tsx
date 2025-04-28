import { ScheduledSessionWithId } from "@/api/definitions";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInMinutes, format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { FC, useState } from "react";

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
import { EditScheduledSession } from "@/components/visualizers/sessions/EditScheduledSessionForm";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { formatTime } from "@/lib/utils";

type DeleteSessionIconProps = {
  sessionId: string;
};

const DeleteSessionIcon: FC<DeleteSessionIconProps> = (props) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const deleteSession = useDeleteScheduledSession();

  return (
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogTrigger>
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
            onClick={async () =>
              await deleteSession.mutateAsync(props.sessionId, {
                onSuccess: () => setIsDeleteAlertOpen(false),
              })
            }
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const EditSessionButton: FC<{ session: ScheduledSessionWithId }> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger>
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
          session={props.session}
          onCancel={() => setIsDialogOpen(false)}
          onSave={() => setIsDialogOpen(false)}
          onDelete={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export const BaseSessionTableColumns: ColumnDef<ScheduledSessionWithId>[] = [
  {
    accessorKey: "category",
    header: "Category",
    cell: (data) => {
      return <CategoryLabel category={data.row.original.category} />;
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: (data) => {
      const tags = data.row.original.tags;

      return (
        <div className="flex">
          {tags.map((tag) => (
            <TagBadge tag={tag} variant="auto" key={tag.id} />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Time" />
    ),
    cell: ({ row: { original } }) =>
      format(original.startTime, "dd-MM-yyyy HH:mm"),
  },
  {
    accessorKey: "endTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Time" />
    ),
    cell: ({ row: { original } }) =>
      format(original.endTime, "dd-MM-yyyy HH:mm"),
  },
  {
    id: "duration-column",
    accessorFn: (session) =>
      differenceInMinutes(session.endTime, session.startTime),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: (test) => {
      const time = test.cell.getValue<number>();
      return <div>{formatTime(time)}</div>;
    },
  },
  {
    id: "actions",
    cell: (data) => (
      <>
        <EditSessionButton session={data.row.original} />
        <DeleteSessionIcon sessionId={data.row.original.id} />
      </>
    ),
  },
];
