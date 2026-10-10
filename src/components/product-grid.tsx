"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Plus, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { CreateOrderDialog } from "@/components/order-form";
import { ProductCard } from "@/components/product-card";
import { ProductFormDialog } from "@/components/product-form-dialog";
import { useApiData } from "@/hooks/use-api-data";
import { useProducts } from "@/hooks/use-products";
import { fetchCategories } from "@/lib/categories";
import {
  createProduct,
  deleteProduct,
  getProductImage,
  updateProduct,
  type Product,
  type ProductUpdateInput,
} from "@/lib/products";

// Fetched once per search from the server; category tabs and pagination
// below are then derived client-side from what was loaded.
const FETCH_SIZE = 100;
const PAGE_SIZE = 12;
const ALL_CATEGORIES = "all";

// Category tabs: round thumbnail on top, name underneath. The active tab's
// colors are marked important so the base tab styles and hover can't override them.
// The base underline (::after) sits 5px below the tab and would make the
// scrollable list overflow vertically, so it's hidden here.
const categoryTabClass =
  "group/cat h-auto after:hidden w-20 flex-none flex-col items-center justify-start gap-2 rounded-xl border-0 bg-transparent px-1 py-1 text-xs font-medium whitespace-normal text-foreground/70 shadow-none hover:text-primary dark:text-muted-foreground dark:hover:text-primary data-active:border-transparent! data-active:bg-transparent! data-active:font-semibold data-active:text-primary! data-active:shadow-none!";

const categoryThumbClass =
  "flex size-16 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-transparent ring-offset-2 ring-offset-background transition-shadow group-hover/cat:ring-primary/40 group-data-active/cat:ring-primary";

const categoryImageClass =
  "size-full object-cover transition-transform duration-300 group-hover/cat:scale-110 motion-reduce:transition-none";

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
  const [orderOpen, setOrderOpen] = useState(false);

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

  // Categories have no image of their own, so each tab shows a photo from one
  // of its products (the first one that has a photo), or a letter tile if none do.
  const categories = useMemo(() => {
    const byId = new Map<number, { id: number; name: string; image: string | null }>();
    for (const product of allProducts) {
      const entry = byId.get(product.categoryId) ?? {
        id: product.categoryId,
        name: product.categoryName,
        image: null,
      };
      entry.image ??= product.imageUrl || null;
      byId.set(product.categoryId, entry);
    }
    return Array.from(byId.values(), (c) => ({
      ...c,
      image: c.image ?? getProductImage({ productName: c.name, imageUrl: null }),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  const filteredProducts =
    category === ALL_CATEGORIES
      ? allProducts
      : allProducts.filter((product) => String(product.categoryId) === category);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const products = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="sr-only">Products</h1>
      {/* Stacked on small screens; on wide screens categories sit left of the toolbar. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 sm:justify-end lg:w-auto lg:flex-none">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              aria-label="Search products"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 rounded-full pl-9"
            />
          </div>
          {manage && (
            <Button variant="outline" aria-label="Create order" onClick={() => setOrderOpen(true)}>
              <ShoppingCart />
              <span className="hidden sm:inline">Create order</span>
            </Button>
          )}
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
          className="min-w-0 lg:order-first lg:flex-1"
          value={category}
          onValueChange={(value) => {
            setCategory(value as string);
            setPage(1);
          }}
        >
          <TabsList className="h-auto w-full flex-nowrap justify-start gap-2 overflow-x-auto bg-transparent p-1 group-data-horizontal/tabs:h-auto sm:flex-wrap">
            <TabsTrigger value={ALL_CATEGORIES} className={categoryTabClass}>
              <span className={categoryThumbClass}>
                <LayoutGrid className="size-6! text-primary" />
              </span>
              <span className="line-clamp-2 w-full text-center leading-normal">All</span>
            </TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={String(c.id)} className={categoryTabClass}>
                <span className={categoryThumbClass}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided URLs or a generated data: URI */}
                  <img
                    src={c.image}
                    alt=""
                    className={categoryImageClass}
                    // Broken photo URL: fall back to the letter tile.
                    onError={(e) => {
                      e.currentTarget.src = getProductImage({ productName: c.name, imageUrl: null });
                    }}
                  />
                </span>
                <span className="line-clamp-2 w-full text-center leading-normal">{c.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

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
          {/* Saving an order changes stock, so refresh the cards afterwards. */}
          <CreateOrderDialog open={orderOpen} onOpenChange={setOrderOpen} onCreated={refetch} />
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
