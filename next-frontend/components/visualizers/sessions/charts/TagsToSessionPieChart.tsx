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
          getKey={(session) =>
            session.tags.length
              ? session.tags.map((tag) => ({
                key: tag.label,
                metadata: { color: tag.color, name: tag.label },
              }))
              : {
                key: "-",
                metadata: { color: "#f129c1", name: "-" },
              }
          }
        />
      </CardContent>
    </Card>
  );
};
