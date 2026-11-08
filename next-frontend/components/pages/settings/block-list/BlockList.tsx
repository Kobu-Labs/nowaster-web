"use client";

import { type FC, type FormEvent, useState } from "react";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  useBlockRules,
  useCreateBlockRule,
  useDeleteBlockRule,
} from "@/components/hooks/useBlockRules";
import { blockRuleSchema } from "@/validation/block-rule";
import { Ban, Plus, Trash2 } from "lucide-react";

export const BlockList: FC = () => {
  const { data: rules, isError, isLoading } = useBlockRules();
  const createMutation = useCreateBlockRule();
  const deleteMutation = useDeleteBlockRule();

  const [pattern, setPattern] = useState("");
  const [validationError, setValidationError] = useState<null | string>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = blockRuleSchema.safeParse({ pattern });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? "Invalid domain");
      return;
    }
    setValidationError(null);
    createMutation.mutate(result.data, {
      onSuccess: () => setPattern(""),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          Failed to load your block list. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-2" onSubmit={handleSubmit}>
        <Label htmlFor="block-pattern">Add a domain</Label>
        <div className="flex gap-2">
          <Input
            aria-describedby={validationError ? "block-pattern-error" : undefined}
            aria-invalid={validationError !== null}
            id="block-pattern"
            onChange={(e) => setPattern(e.target.value)}
            placeholder="example.com"
            value={pattern}
          />
          <Button disabled={createMutation.isPending} type="submit">
            <Plus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Adding..." : "Add"}
          </Button>
        </div>
        {validationError && (
          <p className="text-sm text-destructive" id="block-pattern-error">
            {validationError}
          </p>
        )}
      </form>

      {!rules || rules.length === 0
        ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ban className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No blocked domains yet. Add one to get started.
                </p>
              </CardContent>
            </Card>
          )
        : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className="max-w-full truncate" variant="secondary">
                        {rule.pattern}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Added
                        {" "}
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      aria-label={`Remove ${rule.pattern} from block list`}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(rule.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
    </div>
  );
};
