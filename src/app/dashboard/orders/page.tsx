"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { OrderDetailDialog } from "@/components/dashboard/order-detail-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { TablePagination } from "@/components/dashboard/table-pagination";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import { fetchAllCustomers, type Customer } from "@/lib/customers";
import { currency, formatDate } from "@/lib/format";
import {
  ORDER_STATUSES,
  createOrder,
  deleteOrder,
  fetchOrderById,
  fetchOrders,
  orderLabel,
  updateOrder,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { fetchAllProducts, type Product } from "@/lib/products";

const PAGE_SIZE = 10;
const ALL = "all";
const COLUMNS = 6;

const STATUS_ITEMS = [
  { value: ALL, label: "All statuses" },
  ...ORDER_STATUSES.map((status) => ({ value: status, label: status })),
];

export default function OrdersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadOrders = useCallback(
    () =>
      fetchOrders({
        page,
        pageSize: PAGE_SIZE,
        search,
        status: statusFilter === ALL ? undefined : statusFilter,
        fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
        // Include the whole last day.
        toDate: toDate ? `${toDate}T23:59:59` : undefined,
      }),
    [page, search, statusFilter, fromDate, toDate]
  );
  const orders = useApiData(loadOrders, "Couldn't load orders.");
  const customers = useApiData(fetchAllCustomers, "Couldn't load customers.");
  const products = useApiData(fetchAllProducts, "Couldn't load products.");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order ${orderLabel(order)} marked ${status.toLowerCase()}`);
      await orders.reload();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the order status."));
    }
  }

  const rows = orders.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Record sales and track whether they've been paid."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            New order
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search order or customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            items={STATUS_ITEMS}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter((value as string | null) ?? ALL);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="From date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              aria-label="To date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.error ? (
              <TableErrorRow columns={COLUMNS} message={orders.error} onRetry={orders.reload} />
            ) : orders.loading && !orders.data ? (
              <TableLoadingRows columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No orders found." />
            ) : (
              rows.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="pl-4">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                      {orderLabel(order)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customerName ||
                      customers.data?.find((c) => c.id === order.customerId)?.fullName ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.orderDate ?? order.createdDate)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {order.totalAmount == null ? "—" : currency.format(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Select
                      items={ORDER_STATUSES.map((s) => ({ value: s, label: s }))}
                      value={order.status}
                      onValueChange={(value) => value && changeStatus(order, value as OrderStatus)}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Status of order ${orderLabel(order)}`}
                        className="border-transparent px-1 dark:bg-transparent"
                      >
                        <OrderStatusBadge status={order.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onView={() => setViewing(order)}
                      onEdit={() => {
                        setEditing(order);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(order)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          totalCount={orders.data?.totalCount ?? 0}
          onPageChange={setPage}
        />
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit order ${orderLabel(editing)}` : "New order"}
            </DialogTitle>
          </DialogHeader>
          {formOpen && (
            <OrderForm
              key={editing?.id ?? "new"}
              orderId={editing?.id ?? null}
              customers={customers.data ?? []}
              products={products.data ?? []}
              onSaved={async () => {
                setFormOpen(false);
                await orders.reload();
                // Stock levels change when an order is saved.
                await products.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <OrderDetailDialog
        order={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete order ${deleting ? orderLabel(deleting) : ""}?`}
        description="This permanently removes the order and its items."
        successMessage="Order deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteOrder(deleting.id);
          await orders.reload();
        }}
      />
    </>
  );
}

type Line = { key: number; productId: string; quantity: string };

let nextLineKey = 0;
function newLine(productId = "", quantity = "1"): Line {
  return { key: nextLineKey++, productId, quantity };
}

function OrderForm({
  orderId,
  customers,
  products,
  onSaved,
}: {
  orderId: number | null;
  customers: Customer[];
  products: Product[];
  onSaved: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(orderId !== null);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>(() => [newLine()]);
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Editing: the list endpoint may not include items, so load the full order.
  useEffect(() => {
    if (orderId === null) return;
    let ignore = false;
    fetchOrderById(orderId)
      .then((order) => {
        if (ignore) return;
        setCustomerId(String(order.customerId));
        setLines(
          order.items?.length
            ? order.items.map((item) => newLine(String(item.productId), String(item.quantity)))
            : [newLine()]
        );
        setDiscount(String(order.discountAmount ?? 0));
        setNote(order.note ?? "");
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err, "Couldn't load the order."));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [orderId]);

  const productById = new Map(products.map((p) => [String(p.id), p]));
  const chosen = new Set(lines.map((line) => line.productId));

  const customerItems = customers
    .filter((c) => c.isActive || String(c.id) === customerId)
    .map((c) => ({ value: String(c.id), label: c.fullName }));

  const subTotal = lines.reduce((sum, line) => {
    const product = productById.get(line.productId);
    return sum + (product ? product.price * (Number(line.quantity) || 0) : 0);
  }, 0);
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subTotal - discountAmount);

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerId) return setError("Choose a customer.");
    const filled = lines.filter((line) => line.productId);
    if (filled.length === 0) return setError("Add at least one product.");
    if (filled.some((line) => !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1)) {
      return setError("Quantities must be whole numbers of 1 or more.");
    }
    if (discountAmount < 0) return setError("Discount can't be negative.");
    if (discountAmount > subTotal) return setError("Discount can't be more than the subtotal.");

    setError(null);
    setSubmitting(true);
    try {
      const input = {
        customerId: Number(customerId),
        discountAmount,
        note: note.trim() || null,
        items: filled.map((line) => ({
          productId: Number(line.productId),
          quantity: Number(line.quantity),
        })),
      };
      if (orderId !== null) {
        await updateOrder(orderId, input);
        toast.success("Order updated");
      } else {
        await createOrder(input);
        toast.success("Order created");
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the order."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-muted-foreground">Loading order...</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>Customer</Label>
        <Select
          items={customerItems}
          value={customerId || null}
          onValueChange={(value) => setCustomerId((value as string | null) ?? "")}
        >
          <SelectTrigger className="w-full" aria-label="Customer">
            <SelectValue placeholder="Choose a customer" />
          </SelectTrigger>
          <SelectContent>
            {customerItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {customers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No customers yet. Add one on the Customers page first.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Items</Label>
        <div className="flex flex-col gap-2">
          {lines.map((line) => {
            const product = productById.get(line.productId);
            // Hide products already on another line, and inactive ones not already chosen.
            const productItems = products
              .filter(
                (p) =>
                  String(p.id) === line.productId ||
                  (p.isActive && !chosen.has(String(p.id)))
              )
              .map((p) => ({ value: String(p.id), label: p.productName }));
            const lineTotal = product ? product.price * (Number(line.quantity) || 0) : 0;

            return (
              <div key={line.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <Select
                  items={productItems}
                  value={line.productId || null}
                  onValueChange={(value) =>
                    updateLine(line.key, { productId: (value as string | null) ?? "" })
                  }
                >
                  <SelectTrigger className="min-w-0 flex-1" aria-label="Product">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  aria-label="Quantity"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  className="w-20"
                />
                <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                  {product ? currency.format(lineTotal) : "—"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove item"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                </Button>
                {product && Number(line.quantity) > product.quantity && (
                  <p className="basis-full text-xs text-amber-600 dark:text-amber-400">
                    Only {product.quantity} in stock.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setLines((prev) => [...prev, newLine()])}
        >
          <Plus />
          Add item
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="order-discount">Discount</Label>
          <Input
            id="order-discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{currency.format(subTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span className="tabular-nums">−{currency.format(discountAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{currency.format(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="order-note">Note</Label>
        <Textarea
          id="order-note"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : orderId !== null ? "Save changes" : "Create order"}
        </Button>
      </DialogFooter>
    </form>
  );
}
