"use client";
import { ScheduledSessionWithId } from "@/api/definitions";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { FC } from "react";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { DataTable } from "@/components/ui-providers/DataTable";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";

type BaseSessionTableProps = {
  columns?: ColumnDef<ScheduledSessionWithId>[];
  filter?: SessionFilterPrecursor;
};

export const BaseSessionTable: FC<BaseSessionTableProps> = (props) => {
  const { data, isPending } = useQuery({
    ...queryKeys.sessions.filtered(props.filter),
    placeholderData: keepPreviousData,
  });

  return (
    <DataTable
      loading={isPending}
      columns={props.columns ?? BaseSessionTableColumns}
      data={data ?? []}
    />
  );
};
