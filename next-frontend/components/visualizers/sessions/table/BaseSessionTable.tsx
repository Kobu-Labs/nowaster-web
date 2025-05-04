"use client";
import { ScheduledSessionWithId } from "@/api/definitions";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FC } from "react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import {
  DataTable,
  ManagedTableProps,
} from "@/components/ui-providers/DataTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";

type SessionTableProps = Omit<
  ManagedTableProps<ScheduledSessionWithId, typeof BaseSessionTableColumns>,
  "data"
> & {
  filter?: SessionFilterPrecursor;
};

export const SessionTable: FC<SessionTableProps> = (props) => {
  const { data, isPending } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    placeholderData: keepPreviousData,
  });

  return (
    <DataTable
      columns={BaseSessionTableColumns}
      data={data ?? []}
      options={{
        loading: isPending,
        getRowId: (val) => val.id,
        ...props.options,
      }}
    />
  );
};
