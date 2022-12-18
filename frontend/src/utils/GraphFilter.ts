import { GraphDataSingle } from "../pages/StatsPage";

type FilterCriteria = {
  startDate?: Date;
  endDate?: Date;
  maxDuration?: number;
  minDuration?: number;
  name?: string;
};

export const filterPieGraphProps = (
  props: GraphDataSingle[],
  criteria: FilterCriteria,
  setFilteredData: (data: GraphDataSingle[]) => void
): GraphDataSingle[] => {
  const filteredData = props.filter((chartProp) => {
    if (
      criteria.startDate &&
      chartProp.startDate.getDate() <= criteria.startDate.getDate() - 1
    ) {
      return false;
    }

    if (
      criteria.endDate &&
      chartProp.endDate.getDate() >= criteria.endDate.getDate() + 1
    ) {
      return false;
    }

    if (
      criteria.maxDuration &&
      chartProp.duration / 3600 > criteria.maxDuration
    ) {
      return false;
    }

    if (
      criteria.minDuration &&
      chartProp.duration / 3600 < criteria.minDuration
    ) {
      return false;
    }

    if (criteria.name && !chartProp.name.includes(criteria.name)) {
      return false;
    }

    return true;
  });

  setFilteredData(filteredData);

  return filteredData;
};
