import { getInitials } from "@/lib/utils";
import type { FC } from "react";

type ProjectAvatarProps = {
  color: string;
  imageUrl?: null | string;
  name: string;
  size?: number;
};

export const ProjectAvatar: FC<ProjectAvatarProps> = ({
  color,
  imageUrl,
  name,
  size = 40,
}) => {
  const initials = getInitials(name).slice(0, 2);

  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        backgroundColor: imageUrl ? "transparent" : color,
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: size,
        width: size,
      }}
    >
      {!imageUrl && <span style={{ fontSize: size / 2.5 }}>{initials}</span>}
    </div>
  );
};
