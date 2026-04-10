import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: [
    "bg-gradient-to-b from-[#ff8a2c] to-[#e85d00] border border-[rgba(255,200,140,0.45)]",
    "text-[#0a0a0c] font-semibold shadow-[0_4px_20px_rgba(255,107,0,0.35)]",
    "hover:from-[#ff9a40] hover:to-[#f06d10] hover:border-[rgba(255,210,160,0.55)]",
    "hover:shadow-[0_6px_28px_rgba(255,107,0,0.45)] active:brightness-95",
  ].join(" "),
  secondary: [
    "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] text-[#e8e8f0]",
    "hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,186,92,0.35)] hover:text-[#ffffff]",
    "hover:shadow-[0_0_16px_rgba(255,107,0,0.12)]",
  ].join(" "),
  ghost: [
    "bg-transparent border-none text-[#5c5c78]",
    "hover:text-[#e8e8f0]",
  ].join(" "),
  danger: [
    "bg-[rgba(255,51,102,0.12)] border border-[rgba(255,51,102,0.4)] text-[#ff3366]",
    "hover:bg-[rgba(255,51,102,0.2)] hover:border-[rgba(255,51,102,0.6)]",
  ].join(" "),
};

const sizes: Record<Size, string> = {
  sm: "telos-btn--sm",
  md: "telos-btn--md",
  lg: "telos-btn--lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "telos-btn font-ui font-medium cursor-pointer select-none",
        "transition-all duration-200",
        "inline-flex items-center justify-center gap-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
