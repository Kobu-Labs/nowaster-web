import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import React from "react";
import { FC } from "react";
import { PieChartSessionProvider } from "../providers/PieChartSessionProvider";
import { Card, CardContent, CardHeader } from "../ui/card";

type CommonTagsPresenterProps = {
  filter?: GetSessionsRequest
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
