"use client";

import { BaseSessionTableColumns } from "@/components/providers/session-table/BaseColumns";
import { BaseSessionTable } from "@/components/providers/session-table/BaseSessionTable";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <Card >
      <CardContent className="m-8" >
        <BaseSessionTable columns={BaseSessionTableColumns} />
      </CardContent>
    </Card>
  );
}
