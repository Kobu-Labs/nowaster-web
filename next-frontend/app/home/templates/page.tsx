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
            <Skeleton className="h-8 w-48 bg-linear-to-r from-pink-800/40 to-purple-800/40" />
            <Skeleton className="h-4 w-96 bg-pink-900/30" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                className="overflow-hidden border-pink-900/20 bg-linear-to-br from-pink-950/10 to-purple-950/5"
                key={i}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32 bg-linear-to-r from-pink-800/30 to-purple-800/30" />
                      <Skeleton className="h-4 w-20 bg-pink-900/30" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-purple-900/30" />
                      <Skeleton className="h-4 w-3/4 bg-pink-900/20" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16 bg-purple-900/25" />
                      <Skeleton className="h-4 w-16 bg-pink-900/25" />
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
          className="max-w-md mx-auto border-red-800/30 bg-linear-to-r from-red-950/50 to-pink-950/20"
          variant="destructive"
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-300">
            Failed to load templates:
            {q.error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <TemplateDashboard />;
};

export default TemplatesPage;
