"use client";

import { CommonTagsPresenter } from "@/components/presenters/CommonTagsPresenter";
import { AverageDurationProvider } from "@/components/providers/AverageDurationProvider";
import { BaseSessionTableColumns } from "@/components/providers/session-table/BaseColumns";
import { BaseSessionTable } from "@/components/providers/session-table/BaseSessionTable";
import { SessionCountKpiCardProvider } from "@/components/providers/SessionCountKpiCardProvider";
import { TotalTimeKpiCardProvider } from "@/components/providers/TotalTimeKpiCardProvider";
import { CategoryLabel } from "@/stories/CategoryLabel/CategoryLabel";
import { FilteredAreaChart } from "@/stories/FilteredAreaChart/FilteredAreaChart";

export default function Page(props: { params: { detail: string } }) {
  const category = props.params.detail;

  return (
    <div>
      <div className="mt-8 pl-8 ">
        <h2 className="flex gap-4 text-3xl font-bold tracking-tight">Details page for
          <CategoryLabel label={props.params.detail} />
        </h2>
      </div>
      <div className="m-8 grid grid-cols-4 gap-8">
        <SessionCountKpiCardProvider filter={{ category: category }} />
        <TotalTimeKpiCardProvider filter={{ category: category }} />
        <AverageDurationProvider filter={{ category: category }} />
        <CommonTagsPresenter
          filter={{ category: category }}
        />
        <div className="col-span-full">
          <FilteredAreaChart
            initialGranularity="perDayInMonth"
            filter={{ category: category }}
          />
        </div>
        <div className="col-span-full">
          <BaseSessionTable
            filter={{ category: category }}
            columns={BaseSessionTableColumns} />
        </div>
      </div>
    </div >
  );

}
