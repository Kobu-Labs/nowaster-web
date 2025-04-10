import { FC } from "react";
import { ScheduledSessionApi } from "@/api";
import { ScheduledSessionWithId } from "@/api/definitions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInMinutes, format } from "date-fns";
import { Trash2 } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTableColumnHeader } from "@/components/shadcn/column-header";
import { useToast } from "@/components/shadcn/use-toast";
import { CategoryLabel } from "@/components/visualizers/categories/CategoryLabel";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";

type DeleteSessionIconProps = {
  sessionId: string
}

const DeleteSessionIcon: FC<DeleteSessionIconProps> = (props) => {
  const { toast } = useToast();
  const { mutate: deleteSession } = useMutation({
    mutationFn: async () =>
      await ScheduledSessionApi.deleteSingle({ id: props.sessionId }),
    onSuccess: async (result) => {
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
        await queryClient.invalidateQueries({ queryKey: queryKeys.sessions._def });
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
            <TagBadge value={tag.label} key={tag.id}/>
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
    id: "delete-column",
    cell: (stuff) => <DeleteSessionIcon sessionId={stuff.row.original.id} />,
  },
];
