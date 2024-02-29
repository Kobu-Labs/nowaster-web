import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTable } from "@/components/visualizers/DataTable";
import { ScheduledSession, WithId } from "@/validation/models";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";

type BaseSessionTableProps = {
  columns: ColumnDef<WithId<ScheduledSession>>[],
  filter?: GetSessionsRequest,
}

export const BaseSessionTable: FC<BaseSessionTableProps> = (props) => {
  const { data } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    select: (data) => {
      return data.isOk ? data.value : [];
    }
  });

  return <DataTable columns={props.columns} data={data || []} />;
};
