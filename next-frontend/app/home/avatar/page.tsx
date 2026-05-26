"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useAvatarEnable } from "@/components/hooks/avatar/useAvatarEnable";
import { useCategories } from "@/components/hooks/category/useCategory";
import { CategoryHintRow } from "@/components/ui-providers/avatar/CategoryHintRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useToast } from "@/components/shadcn/use-toast";
import { ChevronUp, Sparkles } from "lucide-react";
import { type FC, useState } from "react";

const ExplainerBanner: FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) return null;

  return (
    <Alert className="relative pr-10">
      <Sparkles className="h-4 w-4" />
      <AlertTitle>Dynamic Avatar</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        <p>
          Your avatar is generated weekly from your tracked activity. The more
          you track, the more detailed it becomes.
        </p>
        <p>
          <strong>Hints</strong> let you guide the generation: instead of using
          a raw category name, you can attach custom labels that better describe
          your work (e.g. replace &quot;Work&quot; with &quot;coding&quot; or
          &quot;music&quot;). Multiple hints on one category all inherit the
          full time logged in that category.
        </p>
      </AlertDescription>
      <button
        aria-label="Dismiss explainer"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        onClick={() => setCollapsed(true)}
        type="button"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </Alert>
  );
};

const AvatarPage: FC = () => {
  const { data: avatar, isLoading: avatarLoading } = useAvatar();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const enable = useAvatarEnable();
  const { toast } = useToast();

  const isEnabled = avatar?.isEnabled ?? false;

  const handleEnable = async () => {
    try {
      await enable.mutateAsync();
    } catch {
      toast({
        description: "Failed to enable avatar",
        title: "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-3xl py-10 mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Avatar</h1>
        <p className="text-muted-foreground">
          Manage how your activity shapes your avatar.
        </p>
      </div>

      <ExplainerBanner />

      {!avatarLoading && !isEnabled && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
          <p className="text-sm text-muted-foreground">
            Avatar generation is currently disabled. Enable it in settings or
            start here.
          </p>
          <Button disabled={enable.isPending} onClick={handleEnable} size="sm">
            Enable avatar
          </Button>
        </div>
      )}

      {isEnabled && (
        <>
          <Separator />

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Category hints</h2>
              <p className="text-sm text-muted-foreground">
                Assign hints to categories to control what labels appear in your
                avatar generation prompt.
              </p>
            </div>

            {categoriesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton className="h-10 w-full" key={i} />
                ))}
              </div>
            ) : !categories || categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet. Start a session to create one.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="py-2 pl-4 pr-4 text-left text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="py-2 pl-0 pr-4 text-left text-sm font-medium text-muted-foreground">
                        Hints
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map((cat) => (
                      <CategoryHintRow
                        categoryId={cat.id}
                        categoryName={cat.name}
                        key={cat.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AvatarPage;
