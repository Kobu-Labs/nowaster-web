import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { endOfDay } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "View your session history",
  title: "Session History",
};

export default function HistoryPage() {
  return (
    <div className="flex grow flex-col p-4 md:p-8 gap-4 md:gap-8">
      <h2 className="text-3xl font-bold tracking-tight">Session History</h2>
      <div className="grid grid-cols-1">
        <div className="col-span-full">
          <BaseSessionTable
            filter={{
              data: {
                endTimeTo: { value: endOfDay(new Date()) },
              },
              settings: {},
            }}
          />
        </div>
      </div>
    </div>
  );
}
