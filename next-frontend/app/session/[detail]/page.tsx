"use client";

import { ClampedSessionAreaChart } from "@/components/ClampedSessionAreaChart";
import { CommonTagsPresenter } from "@/components/presenters/CommonTagsPresenter";
import { AverageDurationProvider } from "@/components/providers/AverageDurationProvider";
import { BaseSessionTableColumns } from "@/components/providers/session-table/BaseColumns";
import { BaseSessionTable } from "@/components/providers/session-table/BaseSessionTable";
import { SessionCountKpiCardProvider } from "@/components/providers/SessionCountKpiCardProvider";
import { TotalTimeKpiCardProvider } from "@/components/providers/TotalTimeKpiCardProvider";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";

export default function Page(props: { params: { detail: string } }) {

  return (
    <div>
      <div className="mt-8 pl-8 ">
        <h2 className="flex gap-4 text-3xl font-bold tracking-tight">Details page for
          <CategoryLabel label={props.params.detail} />
        </h2>
      </div>
      <div className="m-8 grid grid-cols-4 gap-8">
        <SessionCountKpiCardProvider filter={{ category: props.params.detail }} />
        <TotalTimeKpiCardProvider filter={{ category: props.params.detail }} />
        <AverageDurationProvider filter={{ category: props.params.detail }} />
        <CommonTagsPresenter
          filter={{ category: props.params.detail }}
        />
        <div className="col-span-full">
          <ClampedSessionAreaChart
            granularity="month"
            filter={{ category: props.params.detail }}
          />
        </div>
        <div className="col-span-full">
          <BaseSessionTable
            filter={{ category: props.params.detail }}
            columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div>
  );

}
