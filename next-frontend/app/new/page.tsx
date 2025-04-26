"use client";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { DataTable } from "@/components/ui-providers/DataTable";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/ScheduledSessionCreationForm";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { useQuery } from "@tanstack/react-query";
import { subHours } from "date-fns";
import { useMemo } from "react";

const NewSessionPage = () => {
  const filter = useMemo(
    () => ({
      endTimeTo: { value: new Date() },
      endTimeFrom: { value: subHours(new Date(), 48) },
    }),
    [],
  );
  const pastSessionQuery = useQuery({
    ...queryKeys.sessions.filtered({
      settings: {},
      data: filter,
    }),
    select: (data) => {
      if (data.isErr) {
        throw new Error(data.error.message);
      }
      return data.value.slice(0, 20);
    },
  });

  return (
    <div className="my-8 flex flex-col h-fit grow justify-center items-center gap-4">
      <div className="max-w-3xl mx-auto">
        <ScheduledSessionCreationForm />
      </div>
      <div className="max-w-[60%] w-full">
        <Separator className="w-full" />
        <h2 className="text-bold text-xl my-4">
          Some of the last sessions you had in the past 48 hours!
        </h2>
        <ScrollArea className="h-[600px]" type="always">
          <DataTable
            loading={pastSessionQuery.isLoading}
            columns={BaseSessionTableColumns}
            data={pastSessionQuery.data ?? []}
          />
          <ScrollBar />
        </ScrollArea>
      </div>
    </div>
  );
};
export default NewSessionPage;
