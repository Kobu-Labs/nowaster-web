import { DataTableColumnHeader } from "@/components/ui/column-header";
import { getFormattedTimeDifference } from "@/lib/utils";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";
import { SessionTag } from "@/stories/SessionTag/SessionTag";
import { ScheduledSession } from "@/validation/models";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export const BaseSessionTableColumns: ColumnDef<ScheduledSession>[] = [
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
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row: { original } }) => {
      const time = getFormattedTimeDifference(original.startTime, original.endTime);

      return <div>{time}</div>;
    }
  }
];
