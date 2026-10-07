"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  FolderTree,
  Package,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryChart, productsByCategory } from "@/components/dashboard/category-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { RevenueChart, dailyRevenue } from "@/components/dashboard/revenue-chart";
import { LOW_STOCK_THRESHOLD, StockBadge } from "@/components/dashboard/status-badge";
import { TableEmptyRow, TableErrorRow, TableLoadingRows } from "@/components/dashboard/table-states";
import { ProductImage } from "@/components/product-image";
import { useAuth } from "@/components/auth-provider";
import { useApiData } from "@/hooks/use-api-data";
import { fetchCategories } from "@/lib/categories";
import { currency, formatDate } from "@/lib/format";
import { fetchAllOrders } from "@/lib/orders";
import { fetchAllProducts, type Product } from "@/lib/products";
import { fetchUsers } from "@/lib/users";

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "brand",
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  loading: boolean;
  // "warning" flags a stat that needs attention (amber instead of brand teal).
  tone?: "brand" | "warning";
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardAction>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg ring-1",
              tone === "warning"
                ? "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
                : "bg-primary/10 text-primary ring-primary/20"
            )}
          >
            <Icon className="size-4" />
          </span>
        </CardAction>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-24" />
        ) : (
          <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ProductRows({
  products,
  loading,
  error,
  onRetry,
  empty,
  showDate,
}: {
  products: Product[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  empty: string;
  showDate?: boolean;
}) {
  if (error) return <TableErrorRow columns={3} message={error} onRetry={onRetry} />;
  if (loading) return <TableLoadingRows columns={3} rows={4} />;
  if (products.length === 0) return <TableEmptyRow columns={3} message={empty} />;
  return products.map((product) => (
    <TableRow key={product.id}>
      <TableCell className="pl-6">
        <div className="flex items-center gap-3">
          <ProductImage
            product={product}
            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{product.productName}</p>
            <p className="truncate text-xs text-muted-foreground">{product.categoryName}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{currency.format(product.price)}</TableCell>
      <TableCell className="pr-6 text-right">
        {showDate ? (
          <span className="text-muted-foreground">{formatDate(product.createdDate)}</span>
        ) : (
          <StockBadge quantity={product.quantity} />
        )}
      </TableCell>
    </TableRow>
  ));
}

export default function DashboardOverviewPage() {
  const { email } = useAuth();
  const products = useApiData(fetchAllProducts, "Couldn't load products.");
  const categories = useApiData(fetchCategories, "Couldn't load categories.");
  const users = useApiData(fetchUsers, "Couldn't load users.");
  const orders = useApiData(fetchAllOrders, "Couldn't load orders.");
  const [revenueView, setRevenueView] = useState<"chart" | "table">("chart");

  const all = products.data ?? [];
  const activeCount = all.filter((p) => p.isActive).length;
  const inventoryValue = all.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStock = all
    .filter((p) => p.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity);
  const recent = [...all]
    .sort((a, b) => Date.parse(b.createdDate) - Date.parse(a.createdDate))
    .slice(0, 5);

  const productsLoading = products.loading && !products.data;
  const revenue = dailyRevenue(orders.data ?? []);
  const revenueTotal = revenue.reduce((sum, d) => sum + d.total, 0);
  const revenueOrders = revenue.reduce((sum, d) => sum + d.orders, 0);
  const categoryCounts = productsByCategory(all);
  // Show a dash rather than misleading zeros when products failed to load.
  const stat = (value: string) => (products.error ? "—" : value);

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Welcome back${email ? `, ${email}` : ""}. Here's how the store looks today.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Products"
          value={stat(String(all.length))}
          hint={stat(`${activeCount} active · ${all.length - activeCount} inactive`)}
          icon={Package}
          loading={productsLoading}
        />
        <StatCard
          title="Inventory value"
          value={stat(currency.format(inventoryValue))}
          hint="Price × quantity across all products"
          icon={DollarSign}
          loading={productsLoading}
        />
        <StatCard
          title="Low stock"
          value={stat(String(lowStock.length))}
          hint={stat(`${all.filter((p) => p.quantity === 0).length} out of stock · ≤ ${LOW_STOCK_THRESHOLD} left`)}
          icon={AlertTriangle}
          loading={productsLoading}
          tone={lowStock.length > 0 ? "warning" : "brand"}
        />
        <StatCard
          title="Categories · Users"
          value={`${categories.data?.length ?? "—"} · ${users.data?.length ?? "—"}`}
          hint="Catalog groups and dashboard accounts"
          icon={FolderTree}
          loading={(categories.loading && !categories.data) || (users.loading && !users.data)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardDescription>Revenue · last 30 days</CardDescription>
            {orders.loading && !orders.data ? (
              <Skeleton className="mt-1 h-8 w-32" />
            ) : (
              <CardTitle className="text-3xl font-semibold">
                {orders.error ? "—" : currency.format(revenueTotal)}
              </CardTitle>
            )}
            <CardAction>
              <div className="flex rounded-lg bg-muted p-0.5" role="group" aria-label="Revenue view">
                {(["chart", "table"] as const).map((view) => (
                  <Button
                    key={view}
                    variant="ghost"
                    size="xs"
                    aria-pressed={revenueView === view}
                    onClick={() => setRevenueView(view)}
                    className="capitalize aria-pressed:bg-background aria-pressed:shadow-sm"
                  >
                    {view}
                  </Button>
                ))}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {orders.error ? (
              <div className="flex h-60 flex-col items-center justify-center gap-3 text-sm text-destructive">
                {orders.error}
                <Button variant="outline" size="sm" onClick={() => orders.reload()}>
                  Retry
                </Button>
              </div>
            ) : orders.loading && !orders.data ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <>
                <RevenueChart data={revenue} view={revenueView} />
                <p className="text-xs text-muted-foreground">
                  {revenueOrders} {revenueOrders === 1 ? "order" : "orders"} · cancelled orders
                  excluded
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by category</CardTitle>
            <CardDescription>How your catalog is spread out.</CardDescription>
          </CardHeader>
          <CardContent>
            {products.error ? (
              <p className="text-sm text-destructive">{products.error}</p>
            ) : productsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : categoryCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              <CategoryChart data={categoryCounts} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 overflow-hidden pb-0">
          <CardHeader className="border-b pb-4">
            <CardTitle>Needs restocking</CardTitle>
            <CardDescription>Products with {LOW_STOCK_THRESHOLD} or fewer left.</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                View all
                <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="pr-6 text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ProductRows
                products={lowStock.slice(0, 5)}
                loading={productsLoading}
                error={products.error}
                onRetry={products.reload}
                empty="Everything is well stocked."
              />
            </TableBody>
          </Table>
        </Card>

        <Card className="gap-0 overflow-hidden pb-0">
          <CardHeader className="border-b pb-4">
            <CardTitle>Recently added</CardTitle>
            <CardDescription>The newest products in your catalog.</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                View all
                <ArrowRight />
              </Button>
            </CardAction>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="pr-6 text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ProductRows
                products={recent}
                loading={productsLoading}
                error={products.error}
                onRetry={products.reload}
                empty="No products yet."
                showDate
              />
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
