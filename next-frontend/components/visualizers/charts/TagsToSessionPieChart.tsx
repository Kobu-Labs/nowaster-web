import React from "react";
import { FC } from "react";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";
import { SessionPieChart } from "@/components/visualizers/charts/SessionPieChart";

type TagsToSessionPieChartProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const TagsToSessionPieChart: FC<TagsToSessionPieChartProps> = (props) => {
  return (
    <Card>
      <CardHeader>
        <h3>Most common tags</h3>
      </CardHeader>
      <CardContent>
        <SessionPieChart
          filter={props.filter}
          groupingFn={(sessions) => sessions.tags.length ? sessions.tags.map(tag => tag.label) : "-"}
        />
      </CardContent>
    </Card>
  );
};
