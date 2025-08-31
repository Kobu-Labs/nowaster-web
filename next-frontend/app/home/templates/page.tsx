"use client";

import { SessionTemplateApi } from "@/api";
import { TemplateDashboard } from "@/components/visualizers/sessions/templates/TemplateDashboard";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Alert, AlertDescription } from "@/components/shadcn/alert";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

const TemplatesPage = () => {
  const q = useQuery({
    queryFn: async () => {
      return await SessionTemplateApi.readMany();
    },
    queryKey: ["session-templates"],
  });

  if (q.isPending) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-linear-to-r from-pink-200/60 to-purple-200/60 dark:from-pink-800/40 dark:to-purple-800/40" />
            <Skeleton className="h-4 w-96 bg-pink-100/70 dark:bg-pink-900/30" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                className="overflow-hidden border-pink-100/30 bg-linear-to-br from-pink-50/20 to-purple-50/10 dark:border-pink-900/20 dark:from-pink-950/10 dark:to-purple-950/5"
                key={i}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32 bg-linear-to-r from-pink-200/50 to-purple-200/50 dark:from-pink-800/30 dark:to-purple-800/30" />
                      <Skeleton className="h-4 w-20 bg-pink-100/70 dark:bg-pink-900/30" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-purple-100/70 dark:bg-purple-900/30" />
                      <Skeleton className="h-4 w-3/4 bg-pink-100/50 dark:bg-pink-900/20" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16 bg-purple-100/60 dark:bg-purple-900/25" />
                      <Skeleton className="h-4 w-16 bg-pink-100/60 dark:bg-pink-900/25" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Alert
          className="max-w-md mx-auto border-red-200/50 bg-linear-to-r from-red-50/80 to-pink-50/40 dark:border-red-800/30 dark:from-red-950/50 dark:to-pink-950/20"
          variant="destructive"
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            Failed to load templates: {q.error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <TemplateDashboard />;
};

export default TemplatesPage;
