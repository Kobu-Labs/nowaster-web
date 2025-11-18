import { parseResponseToResult } from "@/api/baseApi";
import { ProjectResponseSchema } from "@/api/definitions";
import { env } from "@/env";
import axios from "axios";
import type { Metadata } from "next";
import { cookies } from "next/headers";

type LayoutProps = {
  children: React.ReactNode;
};

type Props = {
  params: Promise<{ id: string; }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data } = await axios.get(
    `${env.NEXT_PUBLIC_API_URL}/project/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const request = await parseResponseToResult(
    data,
    ProjectResponseSchema.readById,
  );

  if (request.isErr) {
    return {
      title: "Project not found",
    };
  }

  return {
    description: "View project details and tasks",
    title: `Projects | ${request.value.name}`,
  };
}

export default function ProjectLayout({ children }: LayoutProps) {
  return children;
}
