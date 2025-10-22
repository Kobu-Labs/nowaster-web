/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// INFO: disabled because of axios call

import { parseResponseToResult } from "@/api/baseApi";
import { CategoryResponseSchema } from "@/api/definitions";
import { env } from "@/env";
import axios from "axios";
import type { Metadata } from "next";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ id: string; }>;
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const { data } = await axios.get(
    `${env.NEXT_PUBLIC_API_URL}/category/${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const request = await parseResponseToResult(
    data,
    CategoryResponseSchema.readById,
  );

  if (request.isErr) {
    return {
      title: "Category not found",
    };
  }

  return {
    title: `[${request.value.name}]`,
  };
}

export default function PageLayout({ children }: RootLayoutProps) {
  return children;
}
