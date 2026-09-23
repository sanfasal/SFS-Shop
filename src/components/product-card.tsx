"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/products";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type ProductCardProps = {
  product: Product;
  isAuthenticated: boolean;
  onOpen: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductCard({
  product,
  isAuthenticated,
  onOpen,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const outOfStock = isAuthenticated && product.quantity === 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
      className="group relative cursor-pointer gap-3 overflow-hidden rounded-2xl py-0 ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5 hover:ring-foreground/15"
    >
      <ProductImage
        product={product}
        className="aspect-4/3 w-full object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-105 group-hover:brightness-95"
      />

      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        {product.categoryName}
      </span>

      {outOfStock && (
        <span className="absolute right-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-white shadow-sm">
          Out of stock
        </span>
      )}

      <CardHeader className="gap-0.5 px-4 pt-1">
        <CardTitle className="line-clamp-1">{product.productName}</CardTitle>
        <p className="truncate text-xs text-muted-foreground">{product.productCode}</p>
      </CardHeader>

      <CardContent className="flex items-baseline justify-between">
        <p className="text-lg font-semibold tracking-tight">
          {currency.format(product.price)}
        </p>
        {isAuthenticated && (
          <p className="text-xs text-muted-foreground">Qty: {product.quantity}</p>
        )}
      </CardContent>

      {isAuthenticated && (
        <CardFooter className="gap-2 border-t-0 bg-transparent px-4 pb-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
