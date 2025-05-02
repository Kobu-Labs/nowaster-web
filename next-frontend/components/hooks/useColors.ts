import { useQuery } from "@tanstack/react-query";
import { StatisticsApi } from "@/api";
import { categoryColors } from "@/state/categories";
import { tagColors } from "@/state/tags";
import { useSetRecoilState } from "recoil";

export const useColors = () => {
  const setTagColors = useSetRecoilState(tagColors);
  const setCategoryColors = useSetRecoilState(categoryColors);

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
