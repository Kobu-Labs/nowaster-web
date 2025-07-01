import { SessionTemplateApi } from "@/api";
import { Button } from "@/components/shadcn/button";
import { CreateTemplateFormDialog } from "@/components/visualizers/sessions/templates/form/TemplateForm";
import { TemplateOverview } from "@/components/visualizers/sessions/templates/TemplateOverview";
import { useQuery } from "@tanstack/react-query";
import { FC, useState } from "react";

export const TemplateDashboard: FC = () => {
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

  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your recurring session templates
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add template</Button>
        <CreateTemplateFormDialog open={open} setIsOpen={setOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {q.data.map((template) => {
          return <TemplateOverview template={template} key={template.id} />;
        })}
      </div>
    </div>
  );
};
