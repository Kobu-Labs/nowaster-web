import { PieChart, Pie, Tooltip, LabelList } from "recharts";

type PieGraphProps = {
    data: {
      name: string;
      value: number;
      fill?: string;
    }[];
  };

const PieGraph = (props: PieGraphProps) => {
    return ( 
        <div>
        <PieChart width={730} height={500}>
          <Pie
            data={props.data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={220}
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
      </div>
     );
};

export default PieGraph;