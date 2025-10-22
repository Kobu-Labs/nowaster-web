import type { FC, PropsWithChildren } from "react";
import { useState } from "react";

type HoverPercentageBarProps = {
  formatter: (percentage: number) => string;
};

export const HoverPercentageBar: FC<
  PropsWithChildren<HoverPercentageBarProps>
> = (props) => {
  const [hoverX, setHoverX] = useState<null | number>(null);
  const [percentage, setPercentage] = useState<null | number>(null);

  const handlePointerMove = (
    clientX: number,
    currentTarget: HTMLDivElement,
  ) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    setHoverX(x);
    setPercentage(Math.min(100, Math.max(0, (x / rect.width) * 100)));
  };

  const handlePointerLeave = () => {
    setHoverX(null);
    setPercentage(null);
  };

  return (
    <div
      className="relative w-full h-full border rounded-2xl overflow-hidden py-4 bg-transparent/30"
      onMouseLeave={handlePointerLeave}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.currentTarget)}
      onTouchEnd={handlePointerLeave}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          handlePointerMove(e.touches[0]?.clientX ?? 0, e.currentTarget);
        }
      }}
    >
      {hoverX !== null && (
        <>
          <div
            className="absolute top-0 bottom-0 w-0 border-2 border-dashed"
            style={{ left: hoverX }}
          />
          <div
            className="absolute top-0 bottom-0 text-nowrap"
            style={{
              left: (percentage ?? 0) < 50 ? hoverX + 10 : hoverX - 10,
              transform: (percentage ?? 0) >= 50 ? "translateX(-100%)" : "none",
            }}
          >
            {percentage && props.formatter(percentage)}
          </div>
        </>
      )}
      {props.children}
    </div>
  );
};
