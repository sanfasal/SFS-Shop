import type { Product } from "@/lib/products";

const MAX_BARS = 6;

export type CategoryCount = { name: string; count: number };

/** Product counts per category, largest first; extra categories fold into "Other". */
export function productsByCategory(products: Product[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const name = product.categoryName || "Uncategorized";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const sorted = [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  if (sorted.length <= MAX_BARS) return sorted;
  const other = sorted.slice(MAX_BARS - 1).reduce((sum, c) => sum + c.count, 0);
  return [...sorted.slice(0, MAX_BARS - 1), { name: "Other", count: other }];
}

// Horizontal bars from a shared left baseline: 20px thick, 4px rounded tip,
// value at the tip. Labels and values use text tokens, never the bar color.
export function CategoryChart({ data }: { data: CategoryCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <ul className="flex flex-col gap-3" aria-label="Products per category">
      {data.map((d) => (
        <li
          key={d.name}
          className="group grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-3"
          title={`${d.name}: ${d.count} ${d.count === 1 ? "product" : "products"}`}
        >
          <span className="truncate text-sm text-muted-foreground">{d.name}</span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-5 rounded-r-[4px] bg-chart-series transition-opacity group-hover:opacity-80"
              style={{ width: `calc((100% - 2.5rem) * ${d.count / max})` }}
            />
            <span className="text-sm font-medium tabular-nums">{d.count}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
