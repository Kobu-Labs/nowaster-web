import { useAuth } from "@/components/hooks/useAuth";
import { Skeleton } from "@/components/shadcn/skeleton";
import { hasSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { refreshTokens } from "@/api/baseApi";

export function AuthGuard({ children }: { children: React.ReactNode; }) {
  const { isLoaded, setTokens, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      if (isLoaded && !user && hasSession()) {
        try {
          const tokens = await refreshTokens();
          setTokens(tokens.accessToken, tokens.refreshToken);
        } catch {
          router.push("/");
        }
      }
    };

    if (isLoaded && !user && !hasSession()) {
      router.push("/");
    } else {
      void refreshTokenIfNeeded();
    }
  }, [isLoaded, user, router, setTokens]);

  // Don't render protected content until auth is loaded and user exists
  if (!isLoaded || !user) {
    return (
      <div className="flex grow p-8">
        <div className="flex-1 space-y-6">
          {/* KPI Cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="rounded-lg border bg-card p-6" key={i}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart area skeleton */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            <Skeleton className="h-64 w-full" />
          </div>

          {/* Table skeleton */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 pb-4">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="px-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="flex items-center justify-between py-2" key={i}>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 pt-4">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
