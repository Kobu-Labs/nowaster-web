"use client";

import { useTheme } from "next-themes";
import { ComponentProps, FC, useEffect, useState } from "react";
import Image from "next/image";

export const ThemedImage: FC<
  Omit<
    ComponentProps<typeof Image> & {
      lightUrl: string;
      darkUrl: string;
    },
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
      src={theme === "light" ? props.lightUrl : props.darkUrl}
    />
  );
};
