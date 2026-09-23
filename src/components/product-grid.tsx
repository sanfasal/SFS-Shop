"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/auth-provider";
import { useProducts } from "@/hooks/use-products";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { ProductCard } from "@/components/product-card";
import type { Product, ProductCreateInput } from "@/lib/products";

// Fetched once per search from the server; category tabs and pagination
// below are then derived client-side, since GetAll has no category filter
// and Category/GetAll requires auth we don't have wired up yet.
const FETCH_SIZE = 100;
const PAGE_SIZE = 9;
const ALL_CATEGORIES = "all";

export function ProductGrid() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const {
    products: allProducts,
    loading,
    error,
    refetch,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProducts({ page: 1, pageSize: FETCH_SIZE, search });

  const categories = useMemo(() => {
    const byId = new Map<number, string>();
    for (const product of allProducts) {
      byId.set(product.categoryId, product.categoryName);
    }
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [allProducts]);

  const filteredProducts =
    category === ALL_CATEGORIES
      ? allProducts
      : allProducts.filter((product) => String(product.categoryId) === category);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const products = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDetail(product: Product) {
    router.push(`/products/${product.id}`);
  }

  function openCreateForm() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function handleSubmit(values: ProductCreateInput) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        ...values,
        isActive: editingProduct.isActive,
      });
      toast.success("Product updated");
    } else {
      await addProduct(values);
      toast.success("Product added");
    }
  }

  function requestDelete(product: Product) {
    setPendingDelete(product);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(pendingDelete.id);
      toast.success("Product deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Couldn't delete the product. Is the API running?");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        {isAuthenticated && (
          <Button onClick={openCreateForm}>
            <Plus className="size-4" />
            Add product
          </Button>
        )}
      </div>

      <Tabs
        value={category}
        onValueChange={(value) => {
          setCategory(value as string);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value={ALL_CATEGORIES}>All</TabsTrigger>
          {categories.map((c) => (
            <TabsTrigger key={c.id} value={String(c.id)}>
              {c.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Input
        placeholder="Search products..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-sm"
      />

      {error ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : loading && allProducts.length === 0 ? (
        <p className="text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAuthenticated={isAuthenticated}
              onOpen={openDetail}
              onEdit={openEditForm}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.productName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. The product will be removed from your
              catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
