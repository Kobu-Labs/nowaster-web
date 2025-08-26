"use client";
import { Card, CardContent } from "@/components/shadcn/card";
import { HexColorPicker } from "react-colorful";
import { FC, useState, useRef, useCallback } from "react";
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

  // INFO: the following mechanism allows users to drag the color picker, 
  // without spamming backend with requests
  const isDragging = useRef(false);
  const [tempColor, setTempColor] = useState(color);
  const pendingColorRef = useRef<string | null>(null);

  const handleColorChange = useCallback(
    (newColor: string) => {
      setTempColor(newColor);
      setInputColor(newColor);

      if (!isDragging.current) {
        // Not dragging, apply immediately
        props.onSelect(newColor);
        if (!isControlled) {
          setInternalColors(newColor);
        }
      } else {
        // Store the pending color to apply when drag ends
        pendingColorRef.current = newColor;
      }
    },
    [props, isControlled],
  );

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && pendingColorRef.current) {
      // Apply the final color when drag ends
      props.onSelect(pendingColorRef.current);
      if (!isControlled) {
        setInternalColors(pendingColorRef.current);
      }
      pendingColorRef.current = null;
    }
    isDragging.current = false;
  }, [props, isControlled]);

  const handleInputChange = (value: string) => {
    if (isHexColor(value)) {
      if (!isControlled) {
        setInternalColors(value);
      }
      setTempColor(value);
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
            backgroundColor: tempColor + "80",
            border: "3px solid " + tempColor,
          }}
        >
          <LucidePipette />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0 border-none">
        <Card className="w-fit">
          <CardContent onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <HexColorPicker
              className="pt-4"
              color={tempColor}
              onChange={handleColorChange}
              onMouseDown={handleMouseDown}
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
