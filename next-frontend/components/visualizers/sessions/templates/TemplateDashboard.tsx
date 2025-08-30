import { SessionTemplateApi } from "@/api";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { CreateTemplateFormDialog } from "@/components/visualizers/sessions/templates/form/TemplateForm";
import { TemplateOverview } from "@/components/visualizers/sessions/templates/TemplateOverview";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Plus, Sparkles, Zap } from "lucide-react";
import { FC, useState } from "react";

export const TemplateDashboard: FC = () => {
  const q = useQuery({
    queryFn: async () => {
      return await SessionTemplateApi.readMany();
    },
    queryKey: ["session-templates"],
  });
  const [open, setOpen] = useState(false);

  if (q.isPending) {
    return <div>Loading...</div>;
  }

  if (q.isError) {
    return <div>Error: {q.error.message}</div>;
  }

  if (q.data.length === 0) {
    return (
      <div className="w-full px-4 py-8 max-w-6xl mx-auto">
        <CreateTemplateFormDialog open={open} setIsOpen={setOpen} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-pink-500/10 to-purple-500/10 rounded-full mb-4 border border-pink-200/20">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Session Templates
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Automate Your Recurring Sessions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create templates for activities you do regularly and let us generate
            your sessions automatically
          </p>
        </div>

        {/* Empty State */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-dashed border-2 border-pink-200/30 bg-linear-to-br from-pink-50/30 via-purple-50/20 to-pink-50/10 dark:from-pink-950/20 dark:via-purple-950/10 dark:to-pink-950/5">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-linear-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
                <Calendar className="relative w-16 h-16 text-pink-500 mx-auto" />
              </div>

              <h3 className="text-xl font-semibold mb-3">
                No templates created yet
              </h3>

              <p className="text-muted-foreground text-center mb-8 max-w-md">
                Templates help you maintain consistent routines by automatically
                scheduling recurring activities like workouts, study sessions,
                or meetings.
              </p>

              <Button
                onClick={() => setOpen(true)}
                size="lg"
                className="h-12 px-8 text-base font-medium bg-linear-to-r from-pink-500 to-purple-600 text-white border-0 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/30 relative overflow-hidden group transition-transform duration-300 ease-in-out"
              >
                {/* Base gradient background */}
                <div className="absolute inset-0 bg-linear-to-r from-pink-500 to-purple-600 transition-opacity duration-300 ease-in-out" />

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />
                <Plus className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">
                  Create Your First Template
                </span>
              </Button>
            </CardContent>
          </Card>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center border-pink-100/50 bg-linear-to-br from-pink-50/50 to-purple-50/30 dark:border-pink-900/20 dark:from-pink-950/30 dark:to-purple-950/20">
              <CardContent className="pt-6 pb-8">
                <div className="w-12 h-12 bg-linear-to-br from-pink-500/10 to-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-pink-500" />
                </div>
                <h4 className="font-semibold mb-2">Automated Scheduling</h4>
                <p className="text-sm text-muted-foreground">
                  Set your pattern once and we&apos;ll create all future sessions
                  automatically
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-pink-100/50 bg-linear-to-br from-purple-50/50 to-pink-50/30 dark:border-purple-900/20 dark:from-purple-950/30 dark:to-pink-950/20">
              <CardContent className="pt-6 pb-8">
                <div className="w-12 h-12 bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="font-semibold mb-2">Flexible Intervals</h4>
                <p className="text-sm text-muted-foreground">
                  Daily, weekly, bi-weekly, or monthly - choose what works for
                  you
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-purple-100/50 bg-linear-to-br from-pink-50/30 to-purple-50/50 dark:border-pink-900/20 dark:from-pink-950/20 dark:to-purple-950/30">
              <CardContent className="pt-6 pb-8">
                <div className="w-12 h-12 bg-linear-to-br from-pink-500/10 to-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="font-semibold mb-2">Multiple Sessions</h4>
                <p className="text-sm text-muted-foreground">
                  Include multiple activities in one template for complex
                  routines
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 max-w-6xl mx-auto">
      <CreateTemplateFormDialog open={open} setIsOpen={setOpen} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-linear-to-r from-pink-500/10 to-purple-500/10 rounded-full border border-pink-200/20">
            <Sparkles className="w-3 h-3 text-pink-500" />
            <span className="text-xs font-medium bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent uppercase tracking-wide">
              {q.data.length} Template{q.data.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Session Templates
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage your recurring sessions and automate your routine activities
          </p>
        </div>

        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-12 px-6 bg-linear-to-r from-pink-500 to-purple-600 text-white border-0 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25 relative overflow-hidden group transition-transform duration-300 ease-in-out"
        >
          {/* Base gradient background */}
          <div className="absolute inset-0 bg-linear-to-r from-pink-500 to-purple-600 transition-opacity duration-300 ease-in-out" />

          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />

          <Plus className="w-5 h-5 mr-2 relative z-10" />
          <span className="relative z-10">Add Template</span>
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {q.data.map((template) => (
          <TemplateOverview template={template} key={template.id} />
        ))}
      </div>

      {/* Stats Footer */}
      {q.data.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {q.data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Templates
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {q.data.reduce((sum, t) => sum + t.sessions.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold bg-linear-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {Math.round(
                  (q.data.reduce(
                    (sum, t) =>
                      sum +
                      t.sessions.reduce(
                        (sessionSum, s) =>
                          sessionSum +
                          (s.end_minute_offset - s.start_minute_offset),
                        0,
                      ),
                    0,
                  ) /
                    60) *
                    10,
                ) / 10}
              </div>
              <div className="text-sm text-muted-foreground">Per Cycle</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
