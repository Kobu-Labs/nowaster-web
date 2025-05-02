import { TagDetails } from "@/api/definitions";
import { Card, CardContent } from "@/components/shadcn/card";
import { SessionBaseAreaChart } from "@/components/visualizers/sessions/charts/SessionBaseAreChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/sessions/kpi/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { FC } from "react";

type TagsDetailsPageProps = {
  tag: TagDetails;
};

export const TagDetailsOverview: FC<TagsDetailsPageProps> = ({ tag }) => {
  const filter: SessionFilterPrecursor = {
    settings: {
      tags: {
        id: {
          mode: "all",
        },
      },
    },
    data: {
      tags: [tag],
    },
  };

  return (
    <div className="grid grid-cols-3 w-full flex-grow gap-4">
      <TotalSessionTimeCard filter={filter} />
      <SessionAverageDurationProvider filter={filter} />
      <SessionCountCard filter={filter} />

      <Card className={"flex grow flex-col col-span-full h-[350px]"}>
        <CardContent className="grow">
          <SessionBaseAreaChart
            groupingOpts={{
              granularity: "days-in-month",
              allKeys: true,
            }}
            filter={filter}
          />
        </CardContent>
      </Card>
      <div className="col-span-full">
        <BaseSessionTable columns={BaseSessionTableColumns} filter={filter} />
      </div>
    </div>
  );
};
