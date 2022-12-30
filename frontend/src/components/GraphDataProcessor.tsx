import { PieChartProp } from "./PieGraph";

export const processPieChartData = (data: PieChartProp[], threshold: number): PieChartProp[] => {
  
  const total = data.reduce((sum, { value }) => sum + value, 0); 
  const actualThreshold = total * threshold;

  const other: PieChartProp = { name: "Other", value: 0, fill: "#26A269"};
  const processedData: PieChartProp[] = [];
  
  data.forEach(item => {
    if (item.value < actualThreshold) {
      other.value += item.value;
    } else {
      processedData.push(item);
    }
  });

  if (other.value > 0) {
    processedData.push(other);
  }
  return processedData;
};

  