import Link from "next/link";
import { FC } from "react";

type CategoryLabelProps = {
  label: string
}

export const CategoryLabel: FC<CategoryLabelProps> = (props) => {
  return (
    <Link href={`/session/${props.label}`}>
      <p className={"underline hover:scale-110 hover:text-pink-300 hover:transition "}>
        {props.label}
      </p>
    </Link>);
};
