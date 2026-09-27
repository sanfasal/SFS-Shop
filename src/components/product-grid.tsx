"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { ProductCard } from "@/components/product-card";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { useApiData } from "@/hooks/use-api-data";
import { useProducts } from "@/hooks/use-products";
import { fetchCategories } from "@/lib/categories";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type Product,
  type ProductUpdateInput,
} from "@/lib/products";

// Fetched once per search from the server; category tabs and pagination
// below are then derived client-side from what was loaded.
const FETCH_SIZE = 100;
const PAGE_SIZE = 12;
const ALL_CATEGORIES = "all";

export function ProductGrid() {
  // Logged-in admins can manage the catalog right from the shop.
  const { isAuthenticated: manage } = useAuth();

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
    products: fetchedProducts,
    loading,
    error,
    refetch,
  } = useProducts({ page: 1, pageSize: FETCH_SIZE, search });

  // Inactive products are hidden from shoppers but shown to admins so they
  // can be edited back to active.
  const allProducts = useMemo(
    () => (manage ? fetchedProducts : fetchedProducts.filter((product) => product.isActive)),
    [fetchedProducts, manage]
  );

  const categoryList = useApiData(fetchCategories, "Couldn't load categories.");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  async function handleSubmit(values: ProductUpdateInput) {
    if (editing) {
      await updateProduct(editing.id, values);
      toast.success("Product updated");
    } else {
      await createProduct(values);
      toast.success("Product added");
    }
    await refetch();
  }

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        {manage && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={
                manage
                  ? (p) => {
                      setEditing(p);
                      setFormOpen(true);
                    }
                  : undefined
              }
              onDelete={manage ? setDeleting : undefined}
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

      {manage && (
        <>
          <ProductFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            product={editing}
            categories={categoryList.data ?? []}
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
              await refetch();
            }}
          />
        </>
      )}
    </div>
  );
}
