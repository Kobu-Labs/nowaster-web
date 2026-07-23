import { CommunityDetailPage } from "@/components/visualizers/communities/CommunityDetailPage";

type PageProps = {
  params: Promise<{ id: string; }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CommunityDetailPage id={id} />;
}
