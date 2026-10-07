"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api-error";
import {
  createCustomer,
  updateCustomer,
  type Customer,
  type CustomerCreateInput,
} from "@/lib/customers";

export function CustomerForm({
  customer,
  onSaved,
}: {
  customer: Customer | null;
  // Receives the saved values; the create endpoint doesn't return the new id.
  onSaved: (saved: CustomerCreateInput) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(customer?.fullName ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [isActive, setIsActive] = useState(customer?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const input = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      };
      if (customer) {
        await updateCustomer(customer.id, { ...input, isActive });
        toast.success("Customer updated");
      } else {
        await createCustomer(input);
        toast.success("Customer added");
      }
      await onSaved(input);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the customer."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customer-name">Full name</Label>
        <Input
          id="customer-name"
          autoComplete="off"
          maxLength={150}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input
          id="customer-phone"
          type="tel"
          autoComplete="off"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customer-address">Address</Label>
        <Textarea
          id="customer-address"
          rows={3}
          maxLength={500}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      {customer && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <Label htmlFor="customer-active">Active</Label>
          <Switch id="customer-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : customer ? "Save changes" : "Add customer"}
        </Button>
      </DialogFooter>
    </form>
  );
}
