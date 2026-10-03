"use client";

import { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { useApiData } from "@/hooks/use-api-data";
import { currency, formatDate } from "@/lib/format";
import { fetchOrderById, orderLabel, type Order } from "@/lib/orders";

export function OrderDetailDialog({
  order,
  onOpenChange,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order {order ? orderLabel(order) : ""}</DialogTitle>
        </DialogHeader>
        {order && <OrderDetail key={order.id} orderId={order.id} />}
      </DialogContent>
    </Dialog>
  );
}

function OrderDetail({ orderId }: { orderId: number }) {
  const load = useCallback(() => fetchOrderById(orderId), [orderId]);
  const { data: order, loading, error } = useApiData(load, "Couldn't load the order.");

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (loading || !order) {
    return <p className="py-6 text-center text-muted-foreground">Loading order...</p>;
  }

  const items = order.items ?? [];
  const subTotal =
    order.subTotal ??
    items.reduce((sum, item) => sum + (item.lineTotal ?? (item.unitPrice ?? 0) * item.quantity), 0);
  const total = order.totalAmount ?? Math.max(0, subTotal - order.discountAmount);

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <DetailItem label="Customer">{order.customerName || `#${order.customerId}`}</DetailItem>
        <DetailItem label="Date">{formatDate(order.orderDate ?? order.createdDate)}</DetailItem>
        <DetailItem label="Status">
          <OrderStatusBadge status={order.status} />
        </DetailItem>
      </dl>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-3">Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="pr-3 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No items on this order.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id ?? index}>
                  <TableCell className="pl-3 font-medium">
                    {item.productName || `Product #${item.productId}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.unitPrice == null ? "—" : currency.format(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="pr-3 text-right font-medium tabular-nums">
                    {item.lineTotal != null
                      ? currency.format(item.lineTotal)
                      : item.unitPrice != null
                        ? currency.format(item.unitPrice * item.quantity)
                        : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{currency.format(subTotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Discount</span>
          <span className="tabular-nums">−{currency.format(order.discountAmount)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{currency.format(total)}</span>
        </div>
      </div>

      {order.note && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">Note</p>
          <p className="whitespace-pre-wrap">{order.note}</p>
        </div>
      )}
    </div>
  );
}

export function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}
