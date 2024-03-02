"use client";

import { Card, CardContent } from "@/components/shadcn/card";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";

export default function HistoryPage() {
  return (
    <Card >
      <CardContent className="m-8" >
        <BaseSessionTable columns={BaseSessionTableColumns} />
      </CardContent>
    </Card>
  );
}
