"use client";

import { useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
} from "@/lib/categories";
import { formatDate } from "@/lib/format";

const COLUMNS = 5;

export default function CategoriesPage() {
  const categories = useApiData(fetchCategories, "Couldn't load categories.");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const query = search.trim().toLowerCase();
  const rows = (categories.data ?? []).filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group products so shoppers can browse them."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add category
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.error ? (
              <TableErrorRow
                columns={COLUMNS}
                message={categories.error}
                onRetry={categories.reload}
              />
            ) : categories.loading && !categories.data ? (
              <TableLoadingRows columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No categories found." />
            ) : (
              rows.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="pl-4 font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={category.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(category.createdDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onEdit={() => {
                        setEditing(category);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(category)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {categories.data && (
          <p className="border-t px-4 py-3 text-sm text-muted-foreground">
            {rows.length} of {categories.data.length} categories
          </p>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <CategoryForm
              key={editing?.id ?? "new"}
              category={editing}
              onSaved={async () => {
                setFormOpen(false);
                await categories.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="Products in this category may stop working. Move them to another category first."
        successMessage="Category deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteCategory(deleting.id);
          await categories.reload();
        }}
      />
    </>
  );
}

function CategoryForm({
  category,
  onSaved,
}: {
  category: Category | null;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const input = { name: name.trim(), description: description.trim() || null };
      if (category) {
        await updateCategory(category.id, { ...input, isActive });
        toast.success("Category updated");
      } else {
        await createCategory(input);
        toast.success("Category added");
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the category."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {category && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <Label htmlFor="category-active">Active</Label>
          <Switch id="category-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : category ? "Save changes" : "Add category"}
        </Button>
      </DialogFooter>
    </form>
  );
}
