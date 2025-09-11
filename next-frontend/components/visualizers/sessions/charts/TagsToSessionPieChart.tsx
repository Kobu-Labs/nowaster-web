import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { type FC, useContext } from "react";

import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import {
  ActiveIndexContext,
  AmountByCategory,
  SessionPieChart,
} from "@/components/visualizers/sessions/charts/SessionPieChart";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { cn, formatTime } from "@/lib/utils";
import { useIsMobile } from "@/components/shadcn/use-mobile";

interface TagsToSessionPieChartProps {
  filter?: SessionFilterPrecursor;
  renderLegeng?: boolean;
}

export const TagsToSessionPieChart: FC<TagsToSessionPieChartProps> = (
  props,
) => {
  const isMobile = useIsMobile();

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
                }}
          renderLegend={(values: {
            data: AmountByCategory<{
              color: string;
              name: string;
            }>[];
          }) => {
            /* eslint-disable react-hooks/rules-of-hooks */
            const context = useContext(ActiveIndexContext);
            if (!props.renderLegeng) {
              return null;
            }

            return (
              <div className="flex flex-col items-center flex-grow w-full gap-1">
                {values.data.map((val, i) => (
                  <div
                    className={cn(
                      "flex items-center justify-between w-full rounded px-2",
                      context?.index === i && "bg-pink-muted",
                    )}
                    key={val.key}
                    onClick={() =>
                      isMobile
                      && context?.setIndex(i === context.index ? null : i)}
                    onMouseEnter={() => context?.setIndex(i)}
                    onMouseLeave={() => context?.setIndex(null)}
                  >
                    {val.metadata && (
                      <TagBadge
                        colors={val.metadata.color}
                        value={val.metadata.name}
                        variant="manual"
                      />
                    )}
                    <p>{formatTime(val.value)}</p>
                  </div>
                ))}
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};
