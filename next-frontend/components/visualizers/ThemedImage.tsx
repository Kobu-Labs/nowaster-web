"use client";

import { useTheme } from "next-themes";
import type { ComponentProps, FC } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";

export const ThemedImage: FC<
  Omit<
    {
      darkUrl: string;
      lightUrl: string;
    } & ComponentProps<typeof Image>,
    "src"
  >
> = (props) => {
  const [mounted, setMounted] = useState(false);

  // INFO: avoid hydration mismatch https://www.npmjs.com/package/next-themes#avoid-hydration-mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const { theme } = useTheme();

  if (!mounted) {
    return null;
  }

  return (
    <Image
      {...props}
      alt="image"
      src={theme === "light" ? props.lightUrl : props.darkUrl}
    />
  );
};
