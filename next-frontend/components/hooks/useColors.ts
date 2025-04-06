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
      if (data.isErr) {
        console.log("Error fetching colors", data.error.message);
        return [];
      }

      const tagColors: Record<string, string> = {};
      const category_colors: Record<string, string> = {};

      data.value.category_colors.forEach(([color, categoryName]) => {
        category_colors[categoryName] = color;
      });

      data.value.tag_colors.forEach(([color, tagLabel]) => {
        tagColors[tagLabel] = color;
      });
      setTagColors(tagColors);
      setCategoryColors(category_colors);
      return data.value;
    },
    queryKey: ["colors"],
  });

  return query;
};
