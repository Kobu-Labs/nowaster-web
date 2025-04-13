"use client";

import { useTheme } from "next-themes";
import { ComponentProps, FC } from "react";
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
  const { theme } = useTheme();
  return (
    <Image
      {...props}
      src={theme === "light" ? props.lightUrl : props.darkUrl}
    />
  );
};
