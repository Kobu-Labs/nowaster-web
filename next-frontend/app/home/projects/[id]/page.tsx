import ProjectDetailPage from "@/app/home/projects/[id]/ProjectDetailPage";

type PageProps = {
  params: Promise<{ id: string; }>;
};

export const metadata = {
  description: "View and manage project tasks",
  title: "Project Details",
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetailPage projectId={id} />;
}
