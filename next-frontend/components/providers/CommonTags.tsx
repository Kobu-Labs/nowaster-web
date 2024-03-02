import React from "react";
import { FC } from "react";
import { PieChartSessionProvider } from "@/components/providers/PieChartSessionProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";

type CommonTagsPresenterProps = {
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const CommonTagsPresenter: FC<CommonTagsPresenterProps> = (props) => {
  return (
    <Card>
      <CardHeader>
        <h3>Most common tags</h3>
      </CardHeader>
      <CardContent>
        <PieChartSessionProvider
          filter={props.filter}
          groupingFn={(sessions) => sessions.tags.length ? sessions.tags.map(tag => tag.label) : "-"}
        />
      </CardContent>
    </Card>
  );
};
