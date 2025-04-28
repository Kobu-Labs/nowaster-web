import { FC, PropsWithChildren, useState } from "react";

type HoverPercentageBarProps = {
    formatter: (percentage: number) => string;
};

export const HoverPercentageBar: FC<
    PropsWithChildren<HoverPercentageBarProps>
> = (props) => {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x);
    setPercentage(Math.min(100, Math.max(0, (x / rect.width) * 100)));
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setPercentage(null);
  };

  return (
    <div
      className="relative w-full h-full border rounded-2xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hoverX !== null && (
        <>
          <div
            className="absolute top-0 bottom-0 w-0 border-2 border-dashed"
            style={{ left: hoverX }}
          />
          <div
            className="absolute top-0 bottom-0 text-nowrap"
            style={{ left: hoverX + 10 }}
          >
            {percentage && props.formatter(percentage)}
          </div>
        </>
      )}
      {props.children}
    </div>
  );
};
