"use client";

import { AvatarApi } from "@/api";
import type {
  ActivityEntry,
  AvatarPreset,
  GenerationRun,
} from "@/api/definitions/models/avatar";
import type { User } from "@/api/definitions/models/user";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import { UserSearchPicker } from "@/components/ui-providers/UserSearchPicker";
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
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Switch } from "@/components/shadcn/switch";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CloudUpload,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { type FC, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) {
    return `${Math.floor(diff)}s ago`;
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }
  if (diff < 86_400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }
  return `${Math.floor(diff / 86_400)}d ago`;
}

// ---------------------------------------------------------------------------
// Generation section: regenerate for user + playground
// ---------------------------------------------------------------------------

const RegenerateSection: FC = () => {
  const [selectedUser, setSelectedUser] = useState<null | User>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const regenerate = useMutation({
    mutationFn: () =>
      AvatarApi.adminTriggerGeneration({ userId: selectedUser?.id ?? "" }),
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.recentRuns.queryKey,
      });
      toast({
        description: `Generation triggered for ${selectedUser?.username}`,
        title: "Done",
      });
    },
  });

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Regenerates and assigns a new avatar to the user.
      </p>
      <div className="flex gap-2">
        <UserSearchPicker
          onClear={() => setSelectedUser(null)}
          onSelectUser={setSelectedUser}
          selectedUser={selectedUser}
        />
        <Button
          disabled={!selectedUser || regenerate.isPending}
          onClick={() => regenerate.mutate()}
          size="sm"
          variant="outline"
        >
          {regenerate.isPending
            ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )
            : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
          Regenerate
        </Button>
      </div>
    </div>
  );
};

const GrantGenerationsSection: FC = () => {
  const [selectedUser, setSelectedUser] = useState<null | User>(null);
  const [amount, setAmount] = useState<string>("20");
  const { toast } = useToast();

  const grant = useMutation({
    mutationFn: () =>
      AvatarApi.adminGrantGenerations({
        amount: Number.parseInt(amount, 10),
        userId: selectedUser?.id ?? "",
      }),
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
    onSuccess: (updated) => {
      toast({
        description: `${selectedUser?.username} now has ${updated.availableGenerations} generation${updated.availableGenerations === 1 ? "" : "s"} available`,
        title: "Granted",
      });
    },
  });

  const parsedAmount = Number.parseInt(amount, 10);
  const isValidAmount = Number.isFinite(parsedAmount) && parsedAmount !== 0;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Adds (or subtracts) generations from a user&apos;s balance. They&apos;ll
        be notified.
      </p>
      <div className="flex gap-2">
        <UserSearchPicker
          onClear={() => setSelectedUser(null)}
          onSelectUser={setSelectedUser}
          selectedUser={selectedUser}
        />
        <Input
          className="w-24"
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          value={amount}
        />
        <Button
          disabled={!selectedUser || !isValidAmount || grant.isPending}
          onClick={() => grant.mutate()}
          size="sm"
          variant="outline"
        >
          {grant.isPending
            ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )
            : (
                <Plus className="mr-2 h-4 w-4" />
              )}
          Grant
        </Button>
      </div>
    </div>
  );
};

const ActivityDataPreview: FC<{ entries: ActivityEntry[]; }> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No activity data in the last 13 weeks.
      </p>
    );
  }

  const total = entries.reduce((s, e) => s + e.hours, 0);
  const sorted = [...entries].sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-1.5">
      {sorted.map((entry) => {
        const pct = total > 0 ? (entry.hours / total) * 100 : 0;
        return (
          <div className="flex items-center gap-2" key={entry.label}>
            <span
              className="w-28 shrink-0 truncate text-xs text-muted-foreground"
              title={entry.label}
            >
              {entry.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${pct.toFixed(1)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {entry.hours.toFixed(1)}
              h
            </span>
          </div>
        );
      })}
    </div>
  );
};

const WEEK_OPTIONS = [1, 4, 8, 13, 26, 52] as const;

const PlaygroundSection: FC = () => {
  const [selectedUser, setSelectedUser] = useState<null | User>(null);
  const [weeks, setWeeks] = useState<number>(13);
  const [result, setResult] = useState<GenerationRun | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const trimmedId = selectedUser?.id ?? "";

  const { data: activityData, isLoading: activityLoading } = useQuery({
    ...queryKeys.avatar.playgroundData(trimmedId, weeks),
    enabled: trimmedId.length > 0,
  });

  const generate = useMutation({
    mutationFn: () => AvatarApi.adminPlaygroundGenerate(trimmedId),
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
    onSuccess: (run) => {
      setResult(run);
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.recentRuns.queryKey,
      });
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Generates using a user&apos;s activity data without updating their
        avatar.
      </p>
      <div className="flex gap-2">
        <UserSearchPicker
          onClear={() => {
            setSelectedUser(null);
            setResult(null);
          }}
          onSelectUser={(user) => {
            setSelectedUser(user);
            setResult(null);
          }}
          selectedUser={selectedUser}
        />
        <Button
          disabled={!trimmedId || generate.isPending}
          onClick={() => generate.mutate()}
          size="sm"
        >
          {generate.isPending
            ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )
            : (
                <Zap className="mr-2 h-4 w-4" />
              )}
          {generate.isPending ? "Generating…" : "Generate"}
        </Button>
      </div>

      {trimmedId && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Activity data
            </p>
            <div className="flex gap-0.5">
              {WEEK_OPTIONS.map((w) => (
                <button
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    weeks === w
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  key={w}
                  onClick={() => setWeeks(w)}
                  type="button"
                >
                  {w}
                  w
                </button>
              ))}
            </div>
          </div>
          {activityLoading
            ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton className="h-3 w-full rounded" key={i} />
                  ))}
                </div>
              )
            : (
                <ActivityDataPreview entries={activityData ?? []} />
              )}
        </div>
      )}

      {generate.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for Leonardo — this can take a few minutes…
        </div>
      )}

      {result && (
        <div className="flex items-start gap-4 rounded-lg border p-4">
          {result.imageUrl
            ? (
                <>
                  <button
                    className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-md"
                    onClick={() => setResultDialogOpen(true)}
                    type="button"
                  >
                    <Image
                      alt="Generated avatar"
                      className="object-cover transition-opacity group-hover:opacity-80"
                      fill
                      quality={100}
                      src={result.imageUrl}
                      unoptimized
                    />
                  </button>
                  <AvatarDialog
                    imageUrl={result.imageUrl}
                    latestRun={result}
                    onOpenChange={setResultDialogOpen}
                    open={resultDialogOpen}
                  />
                </>
              )
            : (
                <div className="flex h-40 w-40 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  {result.status === "failed" ? "Failed" : "No image"}
                </div>
              )}
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status</span>
              <Badge
                variant={
                  result.status === "success" ? "default" : "destructive"
                }
              >
                {result.status}
              </Badge>
            </div>
            {result.errorMessage && (
              <p className="text-destructive">{result.errorMessage}</p>
            )}
            <p className="text-muted-foreground">
              User:
              {result.userId}
            </p>
            <p className="text-muted-foreground">
              {formatRelative(result.createdAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const GENERATION_TABS = ["playground", "regenerate", "grant"] as const;

const GenerationSection: FC = () => {
  const [tab, setTab] = useState<(typeof GENERATION_TABS)[number]>("playground");

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Generation</h3>
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {GENERATION_TABS.map((t) => (
          <button
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            key={t}
            onClick={() => setTab(t)}
            type="button"
          >
            {t === "playground" && "Playground"}
            {t === "regenerate" && "Regenerate for user"}
            {t === "grant" && "Grant generations"}
          </button>
        ))}
      </div>
      {tab === "playground" && <PlaygroundSection />}
      {tab === "regenerate" && <RegenerateSection />}
      {tab === "grant" && <GrantGenerationsSection />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recent runs gallery
// ---------------------------------------------------------------------------

const RunCard: FC<{ run: GenerationRun; }> = ({ run }) => {
  const [open, setOpen] = useState(false);
  const { imageUrl } = run;
  const thumbUrl = run.thumbUrl ?? imageUrl;

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg border bg-muted/20">
        <button
          className="relative aspect-square w-full overflow-hidden bg-muted"
          disabled={!imageUrl}
          onClick={() => imageUrl && setOpen(true)}
          type="button"
        >
          {thumbUrl
            ? (
                <Image
                  alt="Generated avatar"
                  className="object-cover transition-opacity group-hover:opacity-80"
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                  src={thumbUrl}
                  unoptimized
                />
              )
            : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {run.status === "failed" ? "Failed" : run.status}
                </div>
              )}
        </button>
        <div className="space-y-0.5 p-2">
          <div className="flex items-center justify-between">
            <Badge
              className="text-[10px]"
              variant={
                run.status === "success"
                  ? "default"
                  : run.status === "failed"
                    ? "destructive"
                    : "secondary"
              }
            >
              {run.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatRelative(run.createdAt)}
            </span>
          </div>
          <p
            className="truncate text-[11px] text-muted-foreground"
            title={run.userId}
          >
            {run.userId.slice(0, 16)}
            …
          </p>
        </div>
      </div>

      {imageUrl && (
        <AvatarDialog
          imageUrl={imageUrl}
          latestRun={run}
          onOpenChange={setOpen}
          open={open}
        />
      )}
    </>
  );
};

const RecentRunsSection: FC = () => {
  const { data: runs, isLoading } = useQuery(queryKeys.avatar.recentRuns);

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Recent generations</h3>
      {isLoading
        ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton className="aspect-square w-full rounded-lg" key={i} />
              ))}
            </div>
          )
        : !runs || runs.length === 0
            ? (
                <p className="text-sm text-muted-foreground">No runs yet.</p>
              )
            : (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                  {runs.map((run) => (
                    <RunCard key={run.id} run={run} />
                  ))}
                </div>
              )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Presets gallery
// ---------------------------------------------------------------------------

type PendingUpload = { file: File; name: string; };

const UploadPresetsDialog: FC = () => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const upload = useMutation({
    mutationFn: () => AvatarApi.adminUploadPresetImages(files),
    onSuccess: (presets) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.avatar.presetsAll.queryKey,
      });
      setOpen(false);
      setFiles([]);
      toast({
        description: `${presets.length} default avatar${presets.length === 1 ? "" : "s"} uploaded`,
        title: "Done",
      });
    },
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Upload failed",
        title: "Error",
        variant: "destructive",
      }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = [...e.target.files ?? []];
    setFiles((prev) => {
      const existing = new Set(prev.map(({ file }) => file.name));
      const additions = selected
        .filter((file) => !existing.has(file.name))
        .map((file) => ({ file, name: file.name.replace(/\.[^.]+$/, "") }));
      return [...prev, ...additions];
    });
    e.target.value = "";
  };

  const canUpload
    = files.length > 0
      && !upload.isPending
      && files.every(({ name }) => name.trim().length > 0);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New default avatar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload default avatars</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <button
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-8 text-center transition-colors hover:border-muted-foreground/50"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to select images
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              JPG, PNG, WebP — name each one below before uploading
            </p>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
          </button>
          {files.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {files.map(({ file, name }, i) => (
                <div
                  className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                  key={file.name}
                >
                  <Input
                    className="h-7 flex-1 text-sm"
                    disabled={upload.isPending}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFiles((prev) =>
                        prev.map((entry, j) =>
                          j === i ? { ...entry, name: newName } : entry,
                        ),
                      );
                    }}
                    value={name}
                  />
                  <Button
                    className="h-6 w-6 shrink-0"
                    disabled={upload.isPending}
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, j) => j !== i))}
                    size="icon"
                    variant="ghost"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button disabled={!canUpload} onClick={() => upload.mutate()}>
            {upload.isPending
              ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )
              : (
                  <CloudUpload className="mr-2 h-4 w-4" />
                )}
            {files.length > 0
              ? `Upload ${files.length} file${files.length === 1 ? "" : "s"}`
              : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PresetCard: FC<{ preset: AvatarPreset; }> = ({ preset }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(preset.name);
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.avatar.presetsAll.queryKey,
    });

  const renamePreset = useMutation({
    mutationFn: (name: string) =>
      AvatarApi.adminUpdatePreset({ id: preset.id, name }),
    onSuccess: () => {
      void invalidate();
      setIsEditingName(false);
    },
    onError: (e) => {
      setNameDraft(preset.name);
      toast({
        description: e instanceof Error ? e.message : "Rename failed",
        title: "Error",
        variant: "destructive",
      });
    },
  });

  const handleNameSubmit = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === preset.name) {
      setNameDraft(preset.name);
      setIsEditingName(false);
      return;
    }
    renamePreset.mutate(trimmed);
  };

  const toggleActive = useMutation({
    mutationFn: () =>
      AvatarApi.adminUpdatePreset({
        id: preset.id,
        isActive: !preset.isActive,
      }),
    onSuccess: invalidate,
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
  });

  const deletePreset = useMutation({
    mutationFn: () => AvatarApi.adminDeletePreset({ id: preset.id }),
    onSuccess: invalidate,
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Failed",
        title: "Error",
        variant: "destructive",
      }),
  });

  const uploadToLeonardo = useMutation({
    mutationFn: () => AvatarApi.adminUploadPresetToLeonardo({ id: preset.id }),
    onSuccess: () => {
      invalidate();
      toast({
        description: `"${preset.name}" synced to Leonardo`,
        title: "Done",
      });
    },
    onError: (e) =>
      toast({
        description: e instanceof Error ? e.message : "Upload failed",
        title: "Error",
        variant: "destructive",
      }),
  });

  const hasLeonardoId = Boolean(preset.leonardoInitImageId);
  const anyPending
    = toggleActive.isPending
      || deletePreset.isPending
      || uploadToLeonardo.isPending
      || renamePreset.isPending;

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <button
          className="group relative aspect-square w-full overflow-hidden bg-muted"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Image
            alt={preset.name}
            className="object-cover transition-opacity group-hover:opacity-80"
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
            src={preset.thumbnailUrl}
            unoptimized
          />
          <div className="absolute left-1.5 top-1.5 flex gap-1">
            <Badge
              className="text-[10px] px-1.5 py-0"
              variant={preset.isActive ? "default" : "outline"}
            >
              {preset.isActive ? "Active" : "Inactive"}
            </Badge>
            {hasLeonardoId && (
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white border-emerald-600">
                <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                Synced
              </Badge>
            )}
          </div>
        </button>

        <div className="space-y-2 p-2">
          {isEditingName
            ? (
                <Input
                  autoFocus
                  className="h-7 text-sm"
                  disabled={renamePreset.isPending}
                  onBlur={handleNameSubmit}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNameSubmit();
                    } else if (e.key === "Escape") {
                      setNameDraft(preset.name);
                      setIsEditingName(false);
                    }
                  }}
                  value={nameDraft}
                />
              )
            : (
                <Button
                  className="h-auto w-full justify-start gap-1 p-0 text-left text-sm font-medium hover:text-primary"
                  onClick={() => setIsEditingName(true)}
                  title={preset.name}
                  variant="ghost"
                >
                  <span className="truncate">{preset.name}</span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Button>
              )}

          <div className="flex items-center gap-1">
            <Switch
              checked={preset.isActive}
              className="scale-75"
              disabled={anyPending}
              onCheckedChange={() => toggleActive.mutate()}
            />

            <Button
              className="h-7 flex-1 text-xs"
              disabled={anyPending}
              onClick={() => uploadToLeonardo.mutate()}
              size="sm"
              title="Upload reference image to Leonardo"
              variant="outline"
            >
              {uploadToLeonardo.isPending
                ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )
                : (
                    <CloudUpload className="mr-1 h-3 w-3" />
                  )}
              {hasLeonardoId ? "Re-sync" : "Sync"}
            </Button>

            <Button
              className="h-7 w-7"
              disabled={anyPending}
              onClick={() => deletePreset.mutate()}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <AvatarDialog
        imageUrl={preset.referenceImageUrl}
        onOpenChange={setOpen}
        open={open}
        username={preset.name}
      />
    </>
  );
};

const PresetsSection: FC = () => {
  const { data: presets, isLoading } = useQuery(queryKeys.avatar.presetsAll);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Default Avatars</h3>
        <UploadPresetsDialog />
      </div>

      {isLoading
        ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton className="aspect-square w-full rounded-lg" key={i} />
              ))}
            </div>
          )
        : !presets || presets.length === 0
            ? (
                <p className="text-sm text-muted-foreground">No default avatars yet.</p>
              )
            : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {presets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} />
                  ))}
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
    <GenerationSection />
    <Separator />
    <RecentRunsSection />
    <Separator />
    <PresetsSection />
  </div>
);
