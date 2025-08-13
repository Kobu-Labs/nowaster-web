import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { endOfDay } from "date-fns";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session History",
  description: "View your session history",
};

export default function HistoryPage() {
  return (
    <div className="m-8 grow">
      <BaseSessionTable
        filter={{
          settings: {},
          data: {
            endTimeTo: { value: endOfDay(new Date()) },
          },
        }}
      />
    </div>
  );
}
