"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import { StatusBadge, StockBadge } from "@/components/dashboard/status-badge";
import { TablePagination } from "@/components/dashboard/table-pagination";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { ProductImage } from "@/components/product-image";
import { useApiData } from "@/hooks/use-api-data";
import { fetchCategories } from "@/lib/categories";
import { currency, formatDate } from "@/lib/format";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type Product,
  type ProductUpdateInput,
} from "@/lib/products";

const PAGE_SIZE = 10;
const ALL = "all";
const COLUMNS = 8;

export default function DashboardProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadProducts = useCallback(
    () =>
      fetchProducts({
        page,
        pageSize: PAGE_SIZE,
        search,
        categoryId: categoryFilter === ALL ? undefined : Number(categoryFilter),
      }),
    [page, search, categoryFilter]
  );
  const products = useApiData(loadProducts, "Couldn't load products.");
  const categories = useApiData(fetchCategories, "Couldn't load categories.");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const categoryItems = [
    { value: ALL, label: "All categories" },
    ...(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  async function handleSubmit(values: ProductUpdateInput) {
    if (editing) {
      await updateProduct(editing.id, values);
      toast.success("Product updated");
    } else {
      await createProduct(values);
      toast.success("Product added");
    }
    await products.reload();
  }

  const rows = products.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalog, prices and stock."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add product
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            items={categoryItems}
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter((value as string | null) ?? ALL);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
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
              <TableHead className="pl-4">Product</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.error ? (
              <TableErrorRow
                columns={COLUMNS}
                message={products.error}
                onRetry={products.reload}
              />
            ) : products.loading && !products.data ? (
              <TableLoadingRows columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No products found." />
            ) : (
              rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        product={product}
                        className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border"
                      />
                      <p className="min-w-0 truncate font-medium">{product.productName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                      {product.productCode}
                    </span>
                  </TableCell>
                  <TableCell>{product.categoryName}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {currency.format(product.price)}
                  </TableCell>
                  <TableCell>
                    <StockBadge quantity={product.quantity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={product.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(product.createdDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onEdit={() => {
                        setEditing(product);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(product)}
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
          totalCount={products.data?.totalCount ?? 0}
          onPageChange={setPage}
        />
      </Card>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories.data ?? []}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.productName ?? "product"}?`}
        description="This permanently removes the product from your catalog."
        successMessage="Product deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteProduct(deleting.id);
          await products.reload();
        }}
      />
    </>
  );
}
