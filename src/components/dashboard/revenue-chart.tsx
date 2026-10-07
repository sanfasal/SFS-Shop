"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "cn";
import { currency } from "@/lib/format";
import type { Order } from "@/lib/orders";

const DAYS = 30;
const HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

export type DailyRevenue = { date: Date; total: number; orders: number };

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Revenue per day for the last 30 days (today included), skipping cancelled orders. */
export function dailyRevenue(orders: Order[], today = new Date()): DailyRevenue[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (DAYS - 1));
  const days = Array.from({ length: DAYS }, (_, i) => ({
    date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    total: 0,
    orders: 0,
  }));
  const byKey = new Map(days.map((d) => [dayKey(d.date), d]));

  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    const raw = order.orderDate ?? order.createdDate;
    if (!raw) continue;
    const bucket = byKey.get(dayKey(new Date(raw)));
    if (!bucket) continue;
    bucket.total += order.totalAmount ?? (order.subTotal ?? 0) - (order.discountAmount ?? 0);
    bucket.orders += 1;
  }
  return days;
}

// Round the axis max up to a clean 1 / 2 / 2.5 / 5 × 10ⁿ step.
function niceMax(value: number, ticks: number) {
  if (value <= 0) return { max: ticks, step: 1 };
  const rough = value / ticks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  return { max: step * ticks, step };
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function RevenueChart({ data, view }: { data: DailyRevenue[]; view: "chart" | "table" }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  if (view === "table") {
    return (
      <div className="max-h-60 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 text-right font-medium">Orders</th>
              <th className="py-1.5 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d) => (
              <tr key={d.date.toISOString()} className="border-t">
                <td className="py-1.5">{shortDate.format(d.date)}</td>
                <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                <td className="py-1.5 text-right tabular-nums">{currency.format(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const { max, step } = niceMax(Math.max(...data.map((d) => d.total)), 4);
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : 0);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const linePath = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.total)}`).join("");
  const areaPath = `${linePath}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const yTicks = Array.from({ length: 5 }, (_, i) => i * step);
  // Weekly x labels, always including today.
  const xTicks = data.map((_, i) => i).filter((i) => (data.length - 1 - i) % 7 === 0);

  function indexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left - PAD.left) / (innerW || 1);
    return Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))));
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = active ?? data.length - 1;
    const next = current + (event.key === "ArrowRight" ? 1 : -1);
    setActive(Math.min(data.length - 1, Math.max(0, next)));
  }

  const point = active !== null ? data[active] : null;
  const last = data[data.length - 1];

  return (
    <div ref={wrapRef} className="relative h-60 w-full">
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label="Daily revenue for the last 30 days. Use the left and right arrow keys to read each day."
          tabIndex={0}
          className="touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md"
          onPointerMove={(e) => setActive(indexFromPointer(e))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? data.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKeyDown}
        >
          {/* Gridlines and y-axis */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {compactCurrency.format(tick)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === data.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[11px]"
            >
              {i === data.length - 1 ? "Today" : shortDate.format(data[i].date)}
            </text>
          ))}

          <path d={areaPath} className="fill-chart-series" fillOpacity={0.1} />
          <path
            d={linePath}
            fill="none"
            className="stroke-chart-series"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Crosshair */}
          {point && active !== null && (
            <g pointerEvents="none">
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                className="stroke-muted-foreground/50"
                strokeWidth={1}
              />
              <circle
                cx={x(active)}
                cy={y(point.total)}
                r={4.5}
                className="fill-chart-series stroke-card"
                strokeWidth={2}
              />
            </g>
          )}

          {/* End marker on today; the card header carries the period total. */}
          {active === null && (
            <circle
              cx={x(data.length - 1)}
              cy={y(last.total)}
              r={4.5}
              className="fill-chart-series stroke-card"
              strokeWidth={2}
            />
          )}
        </svg>
      )}

      {point && active !== null && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md",
            // Flip to the left of the crosshair on the right half.
            x(active) > width / 2 ? "-translate-x-[calc(100%+12px)]" : "translate-x-3"
          )}
          style={{ left: x(active) }}
        >
          <p className="text-xs text-muted-foreground">{shortDate.format(point.date)}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full bg-chart-series" />
            <span className="text-base font-semibold tabular-nums">
              {currency.format(point.total)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {point.orders} {point.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}

      {/* Screen readers get the selected day announced. */}
      <p className="sr-only" aria-live="polite">
        {point ? `${shortDate.format(point.date)}: ${currency.format(point.total)}, ${point.orders} orders` : ""}
      </p>
    </div>
  );
}
