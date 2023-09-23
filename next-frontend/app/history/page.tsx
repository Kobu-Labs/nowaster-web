"use client";

import { ScheduledSessionApi } from "@/api";
import { DataTable } from "@/components/DataTable";
import { columns } from "@/components/session-data-table/columns";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function HistoryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions", "history"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(),
  });

  if (isLoading || isError) {
    return <div >Something bad happenned</div>;
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>;
  }

  return (
    <Card >
      <CardContent className="m-8" >
        <DataTable columns={columns} data={data.value} />
      </CardContent>
    </Card>
  );
}
