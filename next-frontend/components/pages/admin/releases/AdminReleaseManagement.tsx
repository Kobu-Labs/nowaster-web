"use client";

import {
  useAllReleases,
  useDeleteRelease,
  usePublishRelease,
  useUnpublishRelease,
} from "@/components/hooks/release/useReleases";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { type FC, useState } from "react";
import { CreateReleaseDialog } from "@/components/release/CreateReleaseDialog";
import { EditReleaseDialog } from "@/components/release/EditReleaseDialog";

export const AdminReleaseManagement: FC = () => {
  const { data: releases, isLoading } = useAllReleases();
  const publishRelease = usePublishRelease();
  const unpublishRelease = useUnpublishRelease();
  const deleteRelease = useDeleteRelease();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingReleaseId, setEditingReleaseId] = useState<null | string>(null);

  const handlePublish = async (releaseId: string) => {
    if (confirm("Are you sure you want to publish this release?")) {
      await publishRelease.mutateAsync(releaseId);
    }
  };

  const handleUnpublish = async (releaseId: string) => {
    if (confirm("Are you sure you want to unpublish this release?")) {
      await unpublishRelease.mutateAsync(releaseId);
    }
  };

  const handleDelete = async (releaseId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this release? This action cannot be undone.",
      )
    ) {
      await deleteRelease.mutateAsync(releaseId);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Release
        </Button>
      </div>

      <div className="grid gap-4">
        {releases?.map((release) => (
          <Card key={release.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle>{release.name}</CardTitle>
                    <Badge variant="secondary">{release.version}</Badge>
                    {release.released && (
                      <Badge
                        className="bg-green-500/10 text-green-500"
                        variant="outline"
                      >
                        Published
                      </Badge>
                    )}
                  </div>
                  {release.short_description && (
                    <CardDescription className="whitespace-pre">
                      {release.short_description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingReleaseId(release.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {release.released
                    ? (
                        <Button
                          onClick={() => handleUnpublish(release.id)}
                          size="sm"
                          variant="outline"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )
                    : (
                        <Button
                          onClick={() => handlePublish(release.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                  <Button
                    disabled={release.released}
                    onClick={() => handleDelete(release.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {release.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateReleaseDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />
      {editingReleaseId && (
        <EditReleaseDialog
          onOpenChange={(open) => !open && setEditingReleaseId(null)}
          open={!!editingReleaseId}
          releaseId={editingReleaseId}
        />
      )}
    </div>
  );
};
