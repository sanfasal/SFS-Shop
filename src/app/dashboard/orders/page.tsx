"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { InvoiceActions } from "@/components/dashboard/invoice-actions";
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
import { OrderForm } from "@/components/order-form";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import { fetchAllCustomers } from "@/lib/customers";
import { currency, formatDate } from "@/lib/format";
import {
  ORDER_STATUSES,
  deleteOrder,
  fetchOrders,
  orderLabel,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { fetchAllProducts } from "@/lib/products";

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
              <TableHead className="w-48 pr-4 text-right">Actions</TableHead>
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
                    <div className="flex items-center justify-end gap-1">
                      <InvoiceActions order={order.id} compact />
                      <RowActions
                        onView={() => setViewing(order)}
                        onEdit={() => {
                          setEditing(order);
                          setFormOpen(true);
                        }}
                        onDelete={() => setDeleting(order)}
                      />
                    </div>
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
              reloadCustomers={customers.reload}
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
