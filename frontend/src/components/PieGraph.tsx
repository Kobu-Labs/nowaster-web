import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';
import { formatTime } from '../stories/TimerRecorded';

export type PieChartProp = {
  name: string;
  value: number;
  fill?: string;
};

type PieGraphProps = {
  data: PieChartProp[];
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  payload,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  payload: PieChartProp;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const formattedValue = formatTime(Math.round(payload.value * 3600));

  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      <tspan x={x} dy={-10}>
        {payload.name}
      </tspan>
      <tspan x={x} dy={20}>
        {formattedValue}
      </tspan>
    </text>
  );
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 text-gray-900 text-x1">
        <p className="label">{`${payload[0].name}`}</p>
        <p className="desc">{`${formatTime(Math.round(payload[0].value! * 3600))}`}</p>
      </div>
    );
  }
  return null;
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
          label={renderCustomizedLabel}
          labelLine={false}
        >
          {props.data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || ''} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip/>} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieGraph;
