import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors dark:border-zinc-800",
        {
          "border-transparent bg-zinc-900 text-zinc-50 shadow dark:bg-zinc-50 dark:text-zinc-900":
            variant === "default",
          "border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50":
            variant === "secondary",
          "border-transparent bg-red-500 text-zinc-50 shadow dark:bg-red-900 dark:text-zinc-50":
            variant === "destructive",
          "text-zinc-950 dark:text-zinc-50": variant === "outline",
          "border-transparent bg-emerald-500 text-white shadow": variant === "success",
          "border-transparent bg-amber-500 text-white shadow": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
