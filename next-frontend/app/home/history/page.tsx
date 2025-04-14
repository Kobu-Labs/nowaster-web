import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Session History",
  description: "View your session history",
};

export default function HistoryPage() {
  return (
    <div className="m-8 grow">
      <BaseSessionTable />
    </div>
  );
}
