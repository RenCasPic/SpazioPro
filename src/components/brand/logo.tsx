import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const mark = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";

  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-serif tracking-tight", text, className)}>
      <span
        className={cn(
          "grid place-items-center rounded-[7px] bg-ink text-white",
          mark,
        )}
        aria-hidden
      >
        <span className="block h-1/2 w-1/2 rounded-[3px] border-2 border-clay" />
      </span>
      <span className="text-ink">
        Spazio<span className="text-clay">Pro</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}
