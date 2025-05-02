import { parseResponseToResult } from "@/api/baseApi";
import { CategoryResponseSchema } from "@/api/definitions";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import type { Metadata } from "next";
import { env } from "process";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: RootLayoutProps) {
  return children;
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const { id: id } = await params;

  const clerk = await auth();
  const token = await clerk.getToken();

  const { data } = await axios.get(
    env.NEXT_PUBLIC_API_URL + "/category/" + id,
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
