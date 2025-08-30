import { useQuery } from "@tanstack/react-query";
import { StatisticsApi } from "@/api";
import { categoryColors } from "@/state/categories";
import { tagColors } from "@/state/tags";
import { useSetAtom } from "jotai";

export const useColors = () => {
  const setTagColors = useSetAtom(tagColors);
  const setCategoryColors = useSetAtom(categoryColors);

  const query = useQuery({
    queryFn: async () => {
      const data = await StatisticsApi.getColors();

      const tagColors: Record<string, string> = {};
      const category_colors: Record<string, string> = {};

      data.category_colors.forEach(([color, categoryName]) => {
        category_colors[categoryName] = color;
      });

      data.tag_colors.forEach(([color, tagLabel]) => {
        tagColors[tagLabel] = color;
      });
      setTagColors(tagColors);
      setCategoryColors(category_colors);
      return data;
    },
    queryKey: ["colors"],
  });

  return query;
};
