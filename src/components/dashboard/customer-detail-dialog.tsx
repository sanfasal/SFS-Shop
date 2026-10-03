"use client";

import { useCallback } from "react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailItem } from "@/components/dashboard/order-detail-dialog";
import { OrderStatusBadge, StatusBadge } from "@/components/dashboard/status-badge";
import { useApiData } from "@/hooks/use-api-data";
import { fetchCustomerById, type Customer } from "@/lib/customers";
import { currency, formatDate } from "@/lib/format";
import { fetchOrders, orderLabel } from "@/lib/orders";

const RECENT_ORDERS = 10;

export function CustomerDetailDialog({
  customer,
  onOpenChange,
}: {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={customer !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer?.fullName ?? "Customer"}</DialogTitle>
        </DialogHeader>
        {customer && <CustomerDetail key={customer.id} customerId={customer.id} />}
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetail({ customerId }: { customerId: number }) {
  const loadCustomer = useCallback(() => fetchCustomerById(customerId), [customerId]);
  const loadOrders = useCallback(
    () => fetchOrders({ page: 1, pageSize: RECENT_ORDERS, customerId }),
    [customerId]
  );
  const customer = useApiData(loadCustomer, "Couldn't load the customer.");
  const orders = useApiData(loadOrders, "Couldn't load this customer's orders.");

  if (customer.error) return <p className="text-sm text-destructive">{customer.error}</p>;
  if (customer.loading || !customer.data) {
    return <p className="py-6 text-center text-muted-foreground">Loading customer...</p>;
  }

  const c = customer.data;
  const totalOrders = orders.data?.totalCount ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <DetailItem label="Phone">{c.phone || "—"}</DetailItem>
        <DetailItem label="Status">
          <StatusBadge active={c.isActive} />
        </DetailItem>
        <DetailItem label="Customer since">{formatDate(c.createdDate)}</DetailItem>
        <div className="col-span-full">
          <DetailItem label="Address">
            <span className="whitespace-pre-wrap">{c.address || "—"}</span>
          </DetailItem>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          Orders
          {orders.data && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              {totalOrders > RECENT_ORDERS
                ? `(latest ${RECENT_ORDERS} of ${totalOrders})`
                : `(${totalOrders})`}
            </span>
          )}
        </p>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-3">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-3 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.error ? (
                <MessageRow className="text-destructive">{orders.error}</MessageRow>
              ) : orders.loading && !orders.data ? (
                <MessageRow>Loading orders...</MessageRow>
              ) : !orders.data?.items.length ? (
                <MessageRow>No orders yet.</MessageRow>
              ) : (
                orders.data.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                        {orderLabel(order)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.orderDate ?? order.createdDate)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="pr-3 text-right font-medium tabular-nums">
                      {order.totalAmount == null ? "—" : currency.format(order.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={4} className={cn("py-6 text-center text-muted-foreground", className)}>
        {children}
      </TableCell>
    </TableRow>
  );
}
