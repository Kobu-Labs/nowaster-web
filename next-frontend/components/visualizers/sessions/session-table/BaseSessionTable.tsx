import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTable } from "@/components/ui-providers/DataTable";
import { ScheduledSessionRequest, ScheduledSessionWithId } from "@kobu-labs/nowaster-js-typing";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";

type BaseSessionTableProps = {
  columns: ColumnDef<ScheduledSessionWithId>[],
  filter?: Partial<ScheduledSessionRequest["readMany"]>,
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
