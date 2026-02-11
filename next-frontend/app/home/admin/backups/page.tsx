"use client";

import { AdminApi } from "@/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Badge } from "@/components/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  CheckCircle2,
  Clock,
  Database,
  Download,
  User,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { DbBackup } from "@/api/adminApi";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { formatSizeValue } from "@/lib/utils";
import { Button } from "@/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import baseApi from "@/api/baseApi";

const BackupsPage: React.FC = () => {
  const {
    data: backups,
    error,
    isLoading,
  } = useQuery({
    queryFn: AdminApi.getBackups,
    queryKey: ["admin", "backups"],
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "failed": {
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      }
      case "pending": {
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      }
      case "success": {
        return (
          <Badge className="bg-green-500 hover:bg-green-600" variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Success
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
      return "N/A";
    }
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  const formatSize = (sizeBytes: null | number) => {
    if (!sizeBytes) {
      return "N/A";
    }
    return formatSizeValue(sizeBytes);
  };

  const formatDuration = (seconds: null | number) => {
    if (seconds === null) {
      return "N/A";
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTriggerDisplay = (backup: DbBackup) => {
    if (backup.triggerType === "user" && backup.userUsername) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={backup.userAvatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">
              {backup.userUsername.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{backup.userUsername}</div>
            <div className="text-xs text-muted-foreground">user</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{backup.triggerType}</div>
          <div className="text-xs text-muted-foreground">
            {backup.triggerBy}
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = async (backupId: number) => {
    try {
      const response = await baseApi.get(
        `/admin/backups/${backupId}/download`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data as BlobPart]);
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"] as
        | string
        | undefined;
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `backup-${backupId}.dump`;

      link.setAttribute("download", filename);
      document.body.append(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download backup:", error);
      alert("Failed to download backup. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Database Backups</h1>
        <p className="text-muted-foreground">
          View and monitor database backup status and history.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Backups
            </CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load backup data"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Backup History</CardTitle>
          </div>
          <CardDescription>
            List of all database backups with their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading
            ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading backups...</div>
                </div>
              )
            : !backups || backups.length === 0
                ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Database className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No backups found</p>
                    </div>
                  )
                : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Finished</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead>Backup File</TableHead>
                            <TableHead>Error</TableHead>
                            <TableHead>Download</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {backups.map((backup: DbBackup) => (
                            <TableRow key={backup.id}>
                              <TableCell className="font-medium">{backup.id}</TableCell>
                              <TableCell>{getStatusBadge(backup.status)}</TableCell>
                              <TableCell className="text-sm">
                                {formatDate(backup.startedAt)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(backup.finishedAt)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDuration(backup.durationSeconds)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatSize(backup.backupSizeBytes)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {getTriggerDisplay(backup)}
                              </TableCell>
                              <TableCell
                                className="max-w-xs truncate text-sm"
                                title={backup.backupFile}
                              >
                                {backup.backupFile}
                              </TableCell>
                              <TableCell className="text-sm text-destructive">
                                {backup.errorMessage ?? "—"}
                              </TableCell>
                              <TableCell>
                                {backup.status === "success" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline">
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Download Backup File?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription
                                          asChild
                                          className="space-y-2"
                                        >
                                          <div>
                                            <p>
                                              You are about to download a database
                                              backup file.
                                            </p>
                                            <p className="font-semibold">
                                              Size:
                                              {" "}
                                              {formatSize(backup.backupSizeBytes)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              This may take some time depending on your
                                              connection speed and the file size.
                                            </p>
                                          </div>
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDownload(backup.id)}
                                        >
                                          Download
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupsPage;
