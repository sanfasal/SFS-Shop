"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api-error";
import { downloadOrderInvoice, printOrderInvoice } from "@/lib/invoice";
import type { Order } from "@/lib/orders";

export function InvoiceActions({
  order,
  compact = false,
}: {
  order: Order | number;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function run(mode: "print" | "pdf") {
    setBusy(true);
    try {
      if (mode === "pdf") await downloadOrderInvoice(order);
      else await printOrderInvoice(order);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't prepare the invoice."));
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    const iconClass = "text-muted-foreground hover:bg-primary/10 hover:text-primary";
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Print invoice"
          title="Print invoice"
          disabled={busy}
          onClick={() => run("print")}
          className={iconClass}
        >
          <Printer />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Download invoice PDF"
          title="Download invoice PDF"
          disabled={busy}
          onClick={() => run("pdf")}
          className={iconClass}
        >
          <Download />
        </Button>
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => run("print")}>
        <Printer />
        Print
      </Button>
      <Button size="sm" disabled={busy} onClick={() => run("pdf")}>
        <Download />
        Download PDF
      </Button>
    </div>
  );
}
