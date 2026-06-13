import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-800",
        {
          "bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200":
            variant === "default",
          "bg-red-500 text-zinc-50 shadow-sm hover:bg-red-600 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-800":
            variant === "destructive",
          "border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800":
            variant === "outline",
          "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700":
            variant === "secondary",
          "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50":
            variant === "ghost",
          "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50":
            variant === "link",
        },
        {
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-10 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}

export { Button };
