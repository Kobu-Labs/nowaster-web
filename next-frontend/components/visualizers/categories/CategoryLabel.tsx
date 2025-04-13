import { FC } from "react";
import Link from "next/link";
import { CategoryWithId } from "@/api/definitions";

type CategoryLabelProps = {
    category:CategoryWithId
}

export const CategoryLabel: FC<CategoryLabelProps> = (props) => {
  return (
    <Link href={`/home/session/${props.category.id}`}>
      <p
        className={
          "underline hover:scale-110 hover:text-pink-300 hover:transition "
        }
      >
        {props.category.name}
      </p>
    </Link>
  );
};
