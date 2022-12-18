import {
  PieChart,
  Pie,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { formatTime } from "../stories/Timer";

export type PieChartProp = {
  name: string;
  value: number;
  fill?: string;
};

type PieGraphProps = {
  data: PieChartProp[];
};

const PieGraph = (props: PieGraphProps) => {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={props.data.map((pieGraphProp) => {
            return {
              ...pieGraphProp,
              value: pieGraphProp.value / (60 * 60),
            };
          })}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="80%"
          fill="#8884d8"
        >
          <LabelList
            dataKey="name"
            position="outside"
            style={{ fontSize: "1.3rem" }}
          />
          <LabelList
            dataKey="value"
            position="inside"
            formatter={(seconds: number) => formatTime(seconds * 3600)}
            style={{ fontSize: "1.3rem" }}
          />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieGraph;
