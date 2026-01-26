"use client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { SandboxApi } from "@/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  Clock,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { SandboxLifecycle } from "@/api/sandboxApi";
import { useState } from "react";
import { useAuth } from "@/components/hooks/useAuth";

const SandboxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [resetStatus, setResetStatus] = useState<null | string>(null);

  const {
    data: lifecycles,
    error,
    isLoading,
  } = useQuery({
    queryFn: SandboxApi.getLifecycles,
    queryKey: ["admin", "sandbox", "lifecycles"],
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      SandboxApi.resetSandbox({
        triggeredBy: user?.username ?? "unknown",
        triggeredType: "user",
      }),
    onError: (error: Error) => {
      setResetStatus(`Reset failed: ${error.message}`);
    },
    onSuccess: async (data) => {
      setResetStatus(
        `Reset successful! Old lifecycle: ${data.old?.sandboxLifecycleId ?? "none"}, New lifecycle: ${data.new.sandboxLifecycleId}`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "sandbox", "lifecycles"],
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": {
        return (
          <Badge className="bg-green-500 hover:bg-green-600" variant="default">
            <PlayCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      }
      case "recycled": {
        return (
          <Badge variant="secondary">
            <RefreshCw className="mr-1 h-3 w-3" />
            Recycled
          </Badge>
        );
      }
      case "terminated": {
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Terminated
          </Badge>
        );
      }
      default: {
        return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) {
      return "—";
    }
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  const formatDuration = (hours: null | number) => {
    if (hours === null) {
      return "—";
    }
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes}m`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  };

  const getTriggerDisplay = (by: string, type: string) => {
    if (type === "user") {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs">
              {by.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{by}</div>
            <div className="text-xs text-muted-foreground">user</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{type}</div>
          <div className="text-xs text-muted-foreground">{by}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Sandbox Management</h1>
          <p className="text-muted-foreground">
            Monitor sandbox environment lifecycles and metrics.
          </p>
        </div>
        <Button
          className="gap-2"
          disabled={resetMutation.isPending}
          onClick={() => resetMutation.mutate()}
          variant="destructive"
        >
          <RotateCcw className="h-4 w-4" />
          {resetMutation.isPending ? "Resetting..." : "Reset Sandbox"}
        </Button>
      </div>

      {resetStatus && (
        <Card
          className={
            resetStatus.includes("failed")
              ? "border-destructive"
              : "border-green-500"
          }
        >
          <CardContent className="pt-6">
            <p
              className={
                resetStatus.includes("failed")
                  ? "text-destructive"
                  : "text-green-600"
              }
            >
              {resetStatus}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Lifecycles
            </CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load sandbox data"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Sandbox Lifecycles</CardTitle>
          </div>
          <CardDescription>
            History of sandbox environment lifecycles with usage metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading lifecycles...</div>
                </div>
              )
            : !lifecycles || lifecycles.length === 0
                ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No sandbox lifecycles found
                      </p>
                    </div>
                  )
                : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Torndown By</TableHead>
                            <TableHead>Unique Users</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Ended</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lifecycles.map((lifecycle: SandboxLifecycle) => {
                            const durationHours = lifecycle.endedAt
                              ? (lifecycle.endedAt.getTime()
                                - lifecycle.startedAt.getTime())
                              / (1000 * 60 * 60)
                              : null;

                            return (
                              <TableRow key={lifecycle.sandboxLifecycleId}>
                                <TableCell className="font-medium">
                                  {lifecycle.sandboxLifecycleId}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(lifecycle.status)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {getTriggerDisplay(
                                    lifecycle.createdBy,
                                    lifecycle.createdType,
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {lifecycle.torndownBy
                                    ? getTriggerDisplay(
                                        lifecycle.torndownBy,
                                        lifecycle.torndownType ?? "—",
                                      )
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {lifecycle.uniqueUsers}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(lifecycle.startedAt)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDate(lifecycle.endedAt)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatDuration(durationHours)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SandboxPage;
