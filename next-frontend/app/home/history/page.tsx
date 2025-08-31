import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { endOfDay } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "View your session history",
  title: "Session History",
};

export default function HistoryPage() {
  return (
    <div className="m-8 grow">
      <BaseSessionTable
        filter={{
          data: {
            endTimeTo: { value: endOfDay(new Date()) },
          },
          settings: {},
        }}
      />
    </div>
  );
}
