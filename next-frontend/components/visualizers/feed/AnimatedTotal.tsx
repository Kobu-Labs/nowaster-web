"use client";

import { useEffect, useState } from "react";
import type { FC } from "react";

type AnimatedTotalProps = {
  minutes: number;
};

export const AnimatedTotal: FC<AnimatedTotalProps> = ({ minutes }) => {
  const [displayMinutes, setDisplayMinutes] = useState(0);

  useEffect(() => {
    let startTime: number;
    const duration = 1500; // 1.5 seconds animation

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOut * minutes);

      setDisplayMinutes(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [minutes]);

  const formatTime = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const remainingMinutes = Math.floor(mins % 60);

    if (hours === 0) {
      return `${remainingMinutes} minutes`;
    }
    if (remainingMinutes === 0) {
      return `${hours} hours`;
    }
    return `${hours} hours ${remainingMinutes} minutes`;
  };

  return (
    <span className="relative inline-block">
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-sm opacity-40" />
      <span
        className="relative font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient"
        style={{ backgroundSize: "150% 150%" }}
      >
        {formatTime(displayMinutes)}
      </span>
    </span>
  );
};
