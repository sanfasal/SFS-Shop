"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { CustomerForm } from "@/components/dashboard/customer-form";
import { ProductImage } from "@/components/product-image";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import {
  customerLabel,
  fetchAllCustomers,
  type Customer,
  type CustomerCreateInput,
} from "@/lib/customers";
import { currency } from "@/lib/format";
import { createOrder, fetchOrderById, updateOrder } from "@/lib/orders";
import { fetchAllProducts, type Product } from "@/lib/products";

// "New order" dialog usable outside the dashboard (e.g. from the shop page).
// Customers and products load only while it's open, so stock is fresh each time.
export function CreateOrderDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
        </DialogHeader>
        {open && (
          <CreateOrderBody
            onSaved={async () => {
              onOpenChange(false);
              await onCreated?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateOrderBody({ onSaved }: { onSaved: () => Promise<void> }) {
  const customers = useApiData(fetchAllCustomers, "Couldn't load customers.");
  const products = useApiData(fetchAllProducts, "Couldn't load products.");

  const error = customers.error ?? products.error;
  if (error) return <p className="py-6 text-center text-sm text-destructive">{error}</p>;
  if (!customers.data || !products.data) {
    return <p className="py-6 text-center text-muted-foreground">Loading...</p>;
  }

  return (
    <OrderForm
      orderId={null}
      customers={customers.data}
      reloadCustomers={customers.reload}
      products={products.data}
      onSaved={onSaved}
    />
  );
}

type Line = { key: number; productId: string; quantity: string };

let nextLineKey = 0;
function newLine(productId = "", quantity = "1"): Line {
  return { key: nextLineKey++, productId, quantity };
}

export function OrderForm({
  orderId,
  customers,
  reloadCustomers,
  products,
  onSaved,
}: {
  orderId: number | null;
  customers: Customer[];
  reloadCustomers: () => Promise<Customer[] | null>;
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
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

  // After adding a customer from here, refresh the list and select them. The
  // create endpoint returns no id, so pick the newest customer with that phone number.
  async function handleCustomerCreated(saved: CustomerCreateInput) {
    setCustomerFormOpen(false);
    const list = await reloadCustomers();
    const created = list
      ?.filter((c) => c.phone === saved.phone)
      .reduce<Customer | null>((newest, c) => (!newest || c.id > newest.id ? c : newest), null);
    if (created) setCustomerId(String(created.id));
  }

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

  const customerById = new Map(customers.map((c) => [String(c.id), c]));
  const customerItems = customers.filter((c) => c.isActive || String(c.id) === customerId);

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
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label required>Customer</Label>
            <Button type="button" variant="ghost" size="xs" onClick={() => setCustomerFormOpen(true)}>
              <UserPlus />
              New customer
            </Button>
          </div>
          <CustomerPicker
            customers={customerItems}
            value={customerById.get(customerId) ?? null}
            onChange={(customer) => setCustomerId(customer ? String(customer.id) : "")}
          />
          {customers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No customers yet. Use “New customer” to add one.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label required>Items</Label>
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
                    <SelectTrigger
                      className="min-w-0 flex-1 data-[size=default]:h-10"
                      aria-label="Product"
                    >
                      <SelectValue className="min-w-0">
                        {(value: string | null) => {
                          const selected = value ? productById.get(value) : undefined;
                          return selected ? (
                            <ProductOption product={selected} />
                          ) : (
                            <span className="text-muted-foreground">Choose a product</span>
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {productItems.map((item) => {
                        const option = productById.get(item.value);
                        return (
                          <SelectItem key={item.value} value={item.value} className="py-1.5">
                            {option ? <ProductOption product={option} /> : item.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    aria-label="Quantity"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    className="h-10 w-20"
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
      {/* Outside the order <form>: React events bubble through portals, so a nested
          form would also submit the order. */}
      <Dialog open={customerFormOpen} onOpenChange={setCustomerFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
          </DialogHeader>
          {customerFormOpen && (
            <CustomerForm customer={null} onSaved={handleCustomerCreated} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Phone numbers match ignoring spaces, dashes and other separators.
const digits = (text: string) => text.replace(/\D/g, "");

function matchesCustomer(customer: Customer, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (customer.fullName?.toLowerCase().includes(q)) return true;
  const qDigits = digits(q);
  return qDigits !== "" && digits(customer.phone ?? "").includes(qDigits);
}

// Customer picker you can type into to search by name or phone.
function CustomerPicker({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}) {
  return (
    <Combobox.Root
      items={customers}
      value={value}
      onValueChange={(customer) => onChange(customer as Customer | null)}
      itemToStringLabel={(customer: Customer) => customerLabel(customer)}
      isItemEqualToValue={(a: Customer, b: Customer) => a.id === b.id}
      filter={matchesCustomer}
      autoHighlight
    >
      <div className="relative">
        <Combobox.Input
          aria-label="Customer"
          placeholder="Search by name or phone"
          className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent pr-9 pl-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        <Combobox.Trigger
          aria-label="Show customers"
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <ChevronDownIcon className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-50">
          <Combobox.Popup className="max-h-[min(18rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Combobox.Empty className="px-2 py-3 text-center text-sm text-muted-foreground empty:hidden">
              No customers found.
            </Combobox.Empty>
            <Combobox.List>
              {(customer: Customer) => (
                <Combobox.Item
                  key={customer.id}
                  value={customer}
                  className="relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">{customerLabel(customer)}</span>
                  {customer.fullName && customer.phone && (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {customer.phone}
                    </span>
                  )}
                  <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

// Product row for the item picker: thumbnail, name and unit price.
function ProductOption({ product }: { product: Product }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-2.5">
      <ProductImage
        product={product}
        className="size-7 shrink-0 rounded-md object-cover ring-1 ring-foreground/10"
      />
      <span className="min-w-0 flex-1 truncate">{product.productName}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {currency.format(product.price)}
      </span>
    </span>
  );
}
