interface RootLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: RootLayoutProps) {
  return children;
}

import { handleResponse } from "@/api/baseApi";
import { CategoryResponseSchema } from "@/api/definitions";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import type { Metadata } from "next";
import { env } from "process";

type Props = {
  params: Promise<{ detail: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const { detail: id } = await params;

  const t = await auth();
  const token = await t.getToken();

  const { data } = await axios.get(
    env.NEXT_PUBLIC_API_URL + "/category/" + id,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const request = await handleResponse(data, CategoryResponseSchema.readById);

  if (request.isErr) {
    return {
      title: "Category not found",
    };
  }

  return {
    title: `[${request.value.name}]`,
  };
}
