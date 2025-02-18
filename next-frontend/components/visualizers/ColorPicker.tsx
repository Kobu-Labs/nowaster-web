import { Card, CardContent } from "@/components/shadcn/card";
import { HexColorPicker } from "react-colorful";
import { FC, useState } from "react";
import { isHexColor, randomColor } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { LucidePipette, RotateCcw } from "lucide-react";

type ColorPickerProps = {
  onSelect: (color: string) => void;
  initialColor?: string;
};

export const ColorPicker: FC<ColorPickerProps> = (props) => {
  const initialColor = props.initialColor ?? randomColor();
  const [colors, setColors] = useState(initialColor);
  const [inputColor, setInputColor] = useState(initialColor);

  const handleColorChange = (color: string) => {
    setColors(color);
    setInputColor(color);
    props.onSelect(color);
  };

  const handleInputChange = (value: string) => {
    if (isHexColor(value)) {
      setColors(value);
      props.onSelect(value);
    }
    setInputColor(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          style={{
            backgroundColor: colors + "80",
            border: "3px solid " + colors,
          }}
        >
          <LucidePipette />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0 border-none">
        <Card className="w-fit">
          <CardContent>
            <HexColorPicker
              className="pt-4"
              color={colors}
              onChange={handleColorChange}
            />
            <div className="flex items-center justify-center mt-2 gap-2">
              <Input
                value={inputColor}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleColorChange(randomColor())}>
                <RotateCcw />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
