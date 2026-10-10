"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
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
import { CustomerDetailDialog } from "@/components/dashboard/customer-detail-dialog";
import { CustomerForm } from "@/components/dashboard/customer-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TablePagination } from "@/components/dashboard/table-pagination";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { useApiData } from "@/hooks/use-api-data";
import { customerLabel, deleteCustomer, fetchCustomers, type Customer } from "@/lib/customers";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;
const COLUMNS = 6;

const STATUS_ITEMS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadCustomers = useCallback(
    () =>
      fetchCustomers({
        page,
        pageSize: PAGE_SIZE,
        search,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
    [page, search, statusFilter]
  );
  const customers = useApiData(loadCustomers, "Couldn't load customers.");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const rows = customers.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Customers"
        description="Keep track of the people who buy from your shop."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add customer
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            items={STATUS_ITEMS}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter((value as string | null) ?? "all");
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
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-32 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.error ? (
              <TableErrorRow
                columns={COLUMNS}
                message={customers.error}
                onRetry={customers.reload}
              />
            ) : customers.loading && !customers.data ? (
              <TableLoadingRows columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No customers found." />
            ) : (
              rows.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="pl-4 font-medium">{customer.fullName || "—"}</TableCell>
                  <TableCell className="tabular-nums">{customer.phone || "—"}</TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">
                    {customer.address || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={customer.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.createdDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onView={() => setViewing(customer)}
                      onEdit={() => {
                        setEditing(customer);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(customer)}
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
          totalCount={customers.data?.totalCount ?? 0}
          onPageChange={setPage}
        />
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <CustomerForm
              key={editing?.id ?? "new"}
              customer={editing}
              onSaved={async () => {
                setFormOpen(false);
                await customers.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <CustomerDetailDialog
        customer={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting ? customerLabel(deleting) : "customer"}?`}
        description="This permanently removes the customer."
        successMessage="Customer deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteCustomer(deleting.id);
          await customers.reload();
        }}
      />
    </>
  );
}
