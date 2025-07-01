import { SessionTemplateApi } from "@/api";
import { Button } from "@/components/shadcn/button";
import { CreateTemplateFormDialog } from "@/components/visualizers/sessions/templates/form/TemplateForm";
import { TemplateOverview } from "@/components/visualizers/sessions/templates/TemplateOverview";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus } from "lucide-react";
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
  if (q.data.length === 0) {
    return (
      <div className="w-full m-4">
        <CreateTemplateFormDialog open={open} setIsOpen={setOpen} />
        <h3 className="text-lg font-medium">Templates</h3>
        <p className="text-sm text-muted-foreground">
          Manage your recurring session templates
        </p>
        <div className="text-center py-48 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No templates created yet</p>
          <Button onClick={() => setOpen(true)} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 m-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your recurring session templates
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add template
        </Button>

        <CreateTemplateFormDialog open={open} setIsOpen={setOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {q.data.map((template) => (
          <TemplateOverview template={template} key={template.id} />
        ))}
      </div>
    </div>
  );
};
