"use client";

import Link from "next/link";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { currency } from "@/lib/format";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  // Passed only for logged-in admins: shows stock and edit/delete controls.
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

// Full-bleed photo card: price tag on top, name and "view details" button
// over a dark fade at the bottom.
export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const manage = Boolean(onEdit || onDelete);
  const href = `/products/${product.id}`;
  const outOfStock = product.quantity === 0;

  return (
    <div className="group relative isolate aspect-3/5 overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-black/5 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:ring-white/10">
      {/* The photo itself opens the product too; the button below is the accessible link. */}
      <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 -z-10">
        <ProductImage
          product={product}
          className="size-full transform-gpu object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </Link>

      {/* Price tag tucked into the top-left corner: square against the card's
          edges (the card clips it to its own rounded corner), rounded inside. */}
      <span className="pointer-events-none absolute top-0 left-0 rounded-br-2xl bg-red-500 px-3.5 py-1.5 text-sm font-bold text-white shadow-md">
        តម្លៃ {currency.format(product.price)}
      </span>

      {/* Status chips under the price tag */}
      <div className="pointer-events-none absolute top-11 left-3 flex flex-col items-start gap-1.5">
        {outOfStock && (
          <span className="rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            អស់ពីស្តុក
          </span>
        )}
        {manage && !product.isActive && (
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-black">
            Inactive
          </span>
        )}
      </div>

      {/* Admin controls */}
      {manage && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {onEdit && (
            <button
              type="button"
              aria-label={`Edit ${product.productName}`}
              title="Edit"
              onClick={() => onEdit(product)}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-[#036c5b]"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label={`Delete ${product.productName}`}
              title="Delete"
              onClick={() => onDelete(product)}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Bottom fade with name, code and the details button */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-linear-to-t from-black/85 via-black/55 to-transparent p-3 pt-16">
        <div className="min-w-0 text-white drop-shadow">
          <p className="line-clamp-2 leading-snug font-semibold">{product.productName}</p>
          <p className="mt-0.5 truncate text-xs text-white/75">
            Code: {product.productCode}
            {manage && <span className="ml-2">· Qty: {product.quantity}</span>}
          </p>
        </div>
        <Link
          href={href}
          className="pointer-events-auto flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition-[filter,translate] hover:brightness-110 active:translate-y-px"
        >
          មើលលម្អិត
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
