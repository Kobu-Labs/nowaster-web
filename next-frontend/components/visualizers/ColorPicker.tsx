"use client";
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
import { Dices, LucidePipette } from "lucide-react";

type ColorPickerProps = {
  onSelect: (color: string) => void;
  initialColor?: string;
  value?: string;
};

export const ColorPicker: FC<ColorPickerProps> = (props) => {
  const [internalColor, setInternalColors] = useState(
    props.initialColor ?? randomColor(),
  );

  const isControlled = props.value !== undefined;
  const color = isControlled ? props.value : internalColor;
  const [inputColor, setInputColor] = useState(color);

  const handleColorChange = (color: string) => {
    props.onSelect(color);
    setInputColor(color);

    if (!isControlled) {
      setInternalColors(color);
    }
  };

  const handleInputChange = (value: string) => {
    if (isHexColor(value)) {
      if (!isControlled) {
        setInternalColors(internalColor);
      }
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
            backgroundColor: color + "80",
            border: "3px solid " + color,
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
              color={color}
              onChange={handleColorChange}
            />
            <div className="flex items-center justify-center mt-2 gap-2">
              <Input
                value={inputColor}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-32"
              />
              <Button onClick={() => handleColorChange(randomColor())}>
                <Dices />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
