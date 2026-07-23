import { InviteLandingPage } from "@/components/visualizers/communities/InviteLandingPage";

type PageProps = {
  params: Promise<{ code: string; }>;
};

export default async function Page({ params }: PageProps) {
  const { code } = await params;
  return <InviteLandingPage code={code} />;
}
