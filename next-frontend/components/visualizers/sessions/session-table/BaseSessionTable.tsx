"use client";
import { ScheduledSessionWithId } from "@/api/definitions";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTable } from "@/components/ui-providers/DataTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";

type BaseSessionTableProps = {
  columns?: ColumnDef<ScheduledSessionWithId>[];
  filter?: SessionFilterPrecursor;
};

export const BaseSessionTable: FC<BaseSessionTableProps> = (props) => {
  const { data, isLoading } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    select: (data) => {
      return data.isOk ? data.value : [];
    },
  });

  return (
    <DataTable
      loading={isLoading}
      columns={props.columns ?? BaseSessionTableColumns}
      data={data ?? []}
    />
  );
};
