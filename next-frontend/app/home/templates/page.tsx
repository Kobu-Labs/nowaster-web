"use client";

import { SessionTemplateApi } from "@/api";
import { TemplateDashboard } from "@/components/visualizers/sessions/templates/TemplateDashboard";
import { useQuery } from "@tanstack/react-query";

const NewSessionPage = () => {
  const q = useQuery({
    queryFn: async () => {
      return await SessionTemplateApi.readMany();
    },
    queryKey: ["session-templates"],
  });

  if (q.isPending) {
    return <div>Loading...</div>;
  }

  if (q.isError) {
    return <div>Error: {q.error.message}</div>;
  }

  return <TemplateDashboard />;
};

export default NewSessionPage;
