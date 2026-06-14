import { cn } from "@/lib/utils";
import Image from "next/image";

function Avatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!props.src || typeof props.src !== "string") return null;

  return (
    <Image
      src={props.src}
      alt={props.alt || ""}
      fill
      sizes="40px"
      className={cn("aspect-square h-full w-full object-cover", className)}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-medium dark:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
