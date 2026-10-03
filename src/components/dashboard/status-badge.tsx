import { cn } from "cn";

export const LOW_STOCK_THRESHOLD = 5;

const TONES = {
  green: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-400 dark:ring-emerald-400/25",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-400 dark:ring-amber-400/25",
  red: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400 dark:ring-red-400/25",
  gray: "bg-muted text-muted-foreground ring-border",
} as const;

const DOTS = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-muted-foreground/60",
} as const;

// Soft pill with a status dot, used across the dashboard tables.
function Pill({ tone, children }: { tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone]
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[tone])} />
      {children}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>;
}

export function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) return <Pill tone="red">Out of stock</Pill>;
  if (quantity <= LOW_STOCK_THRESHOLD) return <Pill tone="amber">Low · {quantity}</Pill>;
  return <Pill tone="green">{quantity} in stock</Pill>;
}

const ORDER_TONES: Record<string, keyof typeof TONES> = {
  pending: "amber",
  paid: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <Pill tone={ORDER_TONES[status.toLowerCase()] ?? "gray"}>{status}</Pill>;
}
