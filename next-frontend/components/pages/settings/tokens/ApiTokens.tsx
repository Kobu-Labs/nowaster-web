"use client";

import { useState, type FC } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Textarea } from "@/components/shadcn/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  useCreateToken,
  useRevokeToken,
  useTokens,
} from "@/components/hooks/useTokens";
import { Copy, Key, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/shadcn/use-toast";
import { Skeleton } from "@/components/shadcn/skeleton";

export const ApiTokens: FC = () => {
  const { data: tokens, isLoading } = useTokens();
  const createMutation = useCreateToken();
  const revokeMutation = useRevokeToken();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("30");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const handleCreate = async () => {
    const expiresInDays = expiresIn === "never" ? null : parseInt(expiresIn);
    const result = await createMutation.mutateAsync({
      name,
      description: description || null,
      expiresInDays,
    });
    setCreatedToken(result.token);
    setName("");
    setDescription("");
    setExpiresIn("30");
  };

  const handleCopy = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      toast({ title: "Token copied to clipboard" });
    }
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setCreatedToken(null);
  };

  const handleRevoke = (tokenId: string) => {
    revokeMutation.mutate(tokenId);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!createdToken ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Token</DialogTitle>
                  <DialogDescription>
                    Create a new personal access token for API access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="My API Token"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration">Expiration</Label>
                    <Select value={expiresIn} onValueChange={setExpiresIn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Token Created</DialogTitle>
                  <DialogDescription className="text-destructive font-medium">
                    Save this token - it won't be shown again!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Your API Token</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={createdToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {!tokens || tokens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No API tokens yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <Card key={token.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{token.name}</h3>
                      {token.revokedAt ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : token.expiresAt &&
                        new Date(token.expiresAt) < new Date() ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    {token.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {token.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Created: {formatDate(token.createdAt)}</div>
                      <div>Last used: {formatDate(token.lastUsedAt)}</div>
                      <div>
                        {token.expiresAt
                          ? `Expires: ${formatDate(token.expiresAt)}`
                          : "Never expires"}
                      </div>
                    </div>
                  </div>
                  {!token.revokedAt && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke API Token?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently revoke "{token.name}".
                                Applications using this token will no longer be
                                able to access the API.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleRevoke(token.id)}
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
