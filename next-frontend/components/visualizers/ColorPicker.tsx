"use client";
import { Card, CardContent } from "@/components/shadcn/card";
import { HexColorPicker } from "react-colorful";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
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
  initialColor?: string;
  onSelect: (color: string) => void;
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
  const pendingColorRef = useRef<null | string>(null);

  const handleColorChange = useCallback(
    (newColor: string) => {
      setTempColor(newColor);
      setInputColor(newColor);

      if (isDragging.current) {
        // Store the pending color to apply when drag ends
        pendingColorRef.current = newColor;
      } else {
        // Not dragging, apply immediately
        props.onSelect(newColor);
        if (!isControlled) {
          setInternalColors(newColor);
        }
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
          style={{
            backgroundColor: `${tempColor}80`,
            border: `3px solid ${tempColor}`,
          }}
          variant="outline"
        >
          <LucidePipette />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0 border-none">
        <Card className="w-fit">
          <CardContent onMouseLeave={handleMouseUp} onMouseUp={handleMouseUp}>
            <HexColorPicker
              className="pt-4"
              color={tempColor}
              onChange={handleColorChange}
              onMouseDown={handleMouseDown}
            />
            <div className="flex items-center justify-center mt-2 gap-2">
              <Input
                className="w-32"
                onChange={(e) => { handleInputChange(e.target.value); }}
                value={inputColor}
              />
              <Button onClick={() => { handleColorChange(randomColor()); }}>
                <Dices />
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
