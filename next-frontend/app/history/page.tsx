"use client"

import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns"
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable"

export default function HistoryPage() {
  return (
    <div className="grow m-8">
      <BaseSessionTable columns={BaseSessionTableColumns} />
    </div>
  )
}
