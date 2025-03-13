import { TagDetails } from "@/api/definitions";
import { Card, CardContent } from "@/components/shadcn/card";
import { SessionAverageDurationProvider } from "@/components/visualizers/charts/SessionAverageDurationCard";
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart";
import { SessionCountCard } from "@/components/visualizers/charts/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/charts/TotalSessionTimeCard";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/session-table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/session-table/BaseSessionTable";
import { SessionFilterPrecursor } from "@/state/chart-filter";
import { FC } from "react";

type TagsDetailsPageProps = {
  tag: TagDetails;
};

export const TagDetailsOverview: FC<TagsDetailsPageProps> = ({ tag }) => {
  const filter: SessionFilterPrecursor = {
    settings: {
      tags: {
        label: {
          mode: "some",
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
