import { ScheduledSessionApi } from "@/api";
import { DataTable } from "@/components/visualizers/DataTable";
import { ScheduledSession } from "@/validation/models";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";

type BaseSessionTableProps = {
  columns: ColumnDef<ScheduledSession>[],
  filter?: GetSessionsRequest,
}

export const BaseSessionTable: FC<BaseSessionTableProps> = (props) => {
  const { data } = useQuery({
    queryKey: ["sessions", props.filter],
    queryFn: async () => await ScheduledSessionApi.getSessions(props.filter),
    select: (data) => {
      return data.isOk ? data.value : [];
    }
  });

  return <DataTable columns={props.columns} data={data || []} />;
};
