"use client";

import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/ScheduledSessionCreationForm";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { subHours } from "date-fns";
import { useMemo } from "react";

const NewSessionPage = () => {
  const filter = useMemo(
    () => ({
      data: {
        endTimeTo: { value: new Date() },
        endTimeFrom: { value: subHours(new Date(), 48) },
      },
      settings: {},
    }),
    [],
  );

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
          <BaseSessionTable filter={filter} />
          <ScrollBar />
        </ScrollArea>
      </div>
    </div>
  );
};
export default NewSessionPage;
