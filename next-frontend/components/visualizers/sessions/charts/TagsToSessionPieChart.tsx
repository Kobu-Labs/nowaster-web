import { SessionFilterPrecursor } from "@/state/chart-filter";
import { FC } from "react";

import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { SessionPieChart } from "@/components/visualizers/sessions/charts/SessionPieChart";

type TagsToSessionPieChartProps = {
  filter?: SessionFilterPrecursor;
};

export const TagsToSessionPieChart: FC<TagsToSessionPieChartProps> = (
  props,
) => {
  return (
    <Card>
      <CardHeader>
        <h3>Most common tags</h3>
      </CardHeader>
      <CardContent>
        <SessionPieChart
          filter={props.filter}
          groupingFn={(sessions) =>
            sessions.tags.length ? sessions.tags.map((tag) => tag.label) : "-"
          }
        />
      </CardContent>
    </Card>
  );
};
