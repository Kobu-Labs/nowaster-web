import { ScheduledSessionApi } from "@/api";
import { DataTableColumnHeader } from "@/components/ui/column-header";
import { useToast } from "@/components/ui/use-toast";
import { formatTime } from "@/lib/utils";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";
import { SessionTag } from "@/stories/SessionTag/SessionTag";
import { ScheduledSession, WithId } from "@/validation/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInMinutes, format } from "date-fns";
import { Trash2 } from "lucide-react";
import { FC } from "react";

type DeleteSessionIconProps = {
  sessionId: string
}

const DeleteSessionIcon: FC<DeleteSessionIconProps> = (props) => {
  const { toast } = useToast();
  const { mutate: deleteSession } = useMutation({
    mutationFn: async () => await ScheduledSessionApi.deleteSingle({ id: props.sessionId }),
    onSuccess: (result) => {
      if (result.isErr) {
        toast({
          title: "Session deletion failed",
          description: result.error.message,
          variant: "destructive",
        });

      } else {
        toast({
          title: "Session deleted succesfully",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
      }
    },
  });
  const queryClient = useQueryClient();

  return (
    <div onClick={() => deleteSession()} className="cursor-pointer">
      <Trash2 />
    </div>
  );
};

export const BaseSessionTableColumns: ColumnDef<WithId<ScheduledSession>>[] = [
  {
    accessorKey: "category",
    header: "Category",
    cell: (data) => {
      return <CategoryLabel label={data.row.original.category} />;
    }
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: (data) => {
      const tags = data.row.original.tags;

      return (
        <div className="flex">
          {tags.map(tag => <SessionTag value={tag.label} />)}
        </div>
      );
    }
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="startTime" />,
    cell: ({ row: { original } }) => format(original.startTime, "dd-MM-yyyy HH:mm")
  },
  {
    accessorKey: "endTime",
    header: ({ column }) => <DataTableColumnHeader column={column} title="endTime" />,
    cell: ({ row: { original } }) => format(original.endTime, "dd-MM-yyyy HH:mm"),
  },
  {
    id: "duration-column",
    accessorFn: (session) => differenceInMinutes(session.endTime, session.startTime),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: (test) => {
      const time = test.cell.getValue<number>();
      return <div>{formatTime(time)}</div>;
    }
  },
  {
    id: "delete-column",
    cell: (stuff) => (
      <DeleteSessionIcon sessionId={stuff.row.original.id} />
    )
  },
];
