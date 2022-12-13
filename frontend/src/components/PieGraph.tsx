import {
  PieChart,
  Pie,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";

type PieGraphProps = {
  data: {
    name: string;
    value: number;
    fill?: string;
  }[];
};

const PieGraph = (props: PieGraphProps) => {
  return (
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={props.data}
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
            style={{ fontSize: "1.3rem" }}
          />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieGraph;
