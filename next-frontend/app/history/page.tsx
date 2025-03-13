"use client";

import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";

export default function HistoryPage() {
  return (
    <div className="m-8 grow">
      <BaseSessionTable columns={BaseSessionTableColumns} />
    </div>
  );
}
