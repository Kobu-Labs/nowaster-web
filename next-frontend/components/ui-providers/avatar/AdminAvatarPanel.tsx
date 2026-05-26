"use client";

import { AvatarApi } from "@/api";
import type { AvatarPreset } from "@/api/definitions/models/avatar";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { type FC, useState } from "react";

// ---------------------------------------------------------------------------
// Regenerate for user
// ---------------------------------------------------------------------------

const RegenerateSection: FC = () => {
  const [userId, setUserId] = useState("");
  const { toast } = useToast();

  const regenerate = useMutation({
    mutationFn: () => AvatarApi.adminTriggerGeneration({ userId }),
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
    onSuccess: () =>
      toast({ description: `Generation triggered for ${userId}`, title: "Done" }),
  });

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Regenerate for user</h3>
      <div className="flex gap-2">
        <Input
          className="max-w-xs"
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          value={userId}
        />
        <Button
          disabled={!userId.trim() || regenerate.isPending}
          onClick={() => regenerate.mutate()}
          size="sm"
          variant="outline"
        >
          {regenerate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Regenerate
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Preset management
// ---------------------------------------------------------------------------

const CreatePresetDialog: FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: () =>
      AvatarApi.adminCreatePreset({
        name,
        referenceImageUrl: refUrl,
        thumbnailUrl: thumbUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.avatar.presetsAll.queryKey });
      setOpen(false);
      setName("");
      setThumbUrl("");
      setRefUrl("");
    },
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed to create preset",
        title: "Error",
        variant: "destructive",
      }),
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New preset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create preset</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <div className="space-y-1">
            <Label>Thumbnail URL</Label>
            <Input
              onChange={(e) => setThumbUrl(e.target.value)}
              value={thumbUrl}
            />
          </div>
          <div className="space-y-1">
            <Label>Reference image URL</Label>
            <Input onChange={(e) => setRefUrl(e.target.value)} value={refUrl} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!name || !thumbUrl || !refUrl || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PresetRow: FC<{ preset: AvatarPreset }> = ({ preset }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleActive = useMutation({
    mutationFn: () =>
      AvatarApi.adminUpdatePreset({ id: preset.id, isActive: !preset.isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.presetsAll.queryKey,
      }),
    onError: (e) =>
      toast({ description: e instanceof Error ? e.message : "Failed", title: "Error", variant: "destructive" }),
  });

  const deletePreset = useMutation({
    mutationFn: () => AvatarApi.adminDeletePreset({ id: preset.id }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.presetsAll.queryKey,
      }),
    onError: (e) =>
      toast({ description: e instanceof Error ? e.message : "Failed", title: "Error", variant: "destructive" }),
  });

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-sm font-medium">{preset.name}</td>
      <td className="py-3 pr-4">
        <Badge variant={preset.isActive ? "default" : "outline"}>
          {preset.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="py-3 pr-4">
        <Switch
          checked={preset.isActive}
          disabled={toggleActive.isPending}
          onCheckedChange={() => toggleActive.mutate()}
        />
      </td>
      <td className="py-3">
        <Button
          disabled={deletePreset.isPending}
          onClick={() => deletePreset.mutate()}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </td>
    </tr>
  );
};

const PresetsSection: FC = () => {
  const { data: presets, isLoading } = useQuery(queryKeys.avatar.presetsAll);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Presets</h3>
        <CreatePresetDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="h-10 w-full" key={i} />
          ))}
        </div>
      ) : !presets || presets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No presets yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 pl-4 pr-4 text-left text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="py-2 pr-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="py-2 pr-4 text-left text-sm font-medium text-muted-foreground">
                  Active
                </th>
                <th className="py-2 pr-4 text-left text-sm font-medium text-muted-foreground" />
              </tr>
            </thead>
            <tbody className="pl-4">
              {presets.map((preset) => (
                <PresetRow key={preset.id} preset={preset} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Panel root
// ---------------------------------------------------------------------------

export const AdminAvatarPanel: FC = () => (
  <div className="space-y-8">
    <RegenerateSection />
    <Separator />
    <PresetsSection />
  </div>
);
