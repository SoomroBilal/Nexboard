"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-zinc-500">
          We hit an unexpected issue while loading this page. Try again, or return to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            Try Again
          </Button>
          <Button type="button" onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
