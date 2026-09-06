import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.985] disabled:opacity-45 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 shadow-[var(--shadow-card)]",
  accent: "bg-accent text-white hover:bg-accent-dark shadow-[var(--shadow-card)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink/25 hover:bg-surface-2",
  ghost: "text-ink-soft hover:bg-ink/[0.05] hover:text-ink",
  outline: "border border-line-strong bg-surface text-ink hover:border-ink/25 hover:bg-surface-2",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
