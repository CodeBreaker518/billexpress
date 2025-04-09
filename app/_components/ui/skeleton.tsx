import { cn } from "@bill/_lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} {...props} />;
}

export { Skeleton };
