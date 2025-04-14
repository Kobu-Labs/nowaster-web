import { randomColor } from "@/lib/utils";
import { tagColors } from "@/state/tags";
import { useRecoilState } from "recoil";

export const useTagColors = () => {
  const [colors, setColors] = useRecoilState(tagColors);

  const setColor = ({ key, color }: { key: string; color: string }) => {
    if (colors[key] !== color) {
      setColors({ ...colors, [key]: color });
    }
  };

  const upsertColors = (keys: string[]) => {
    const newColors = { ...colors };
    let hasNew = false;
    keys.forEach((key) => {
      if (!newColors[key]) {
        newColors[key] = randomColor();
        hasNew = true;
      }
    });
    if (hasNew) {
      setColors(newColors);
    }
  };

  return {
    setColor: setColor,
    colors: colors,
    upsertColors,
  };
};
