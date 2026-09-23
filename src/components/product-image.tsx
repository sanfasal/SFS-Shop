"use client";

import { useState } from "react";
import { getProductImage, type Product } from "@/lib/products";

export function ProductImage({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? getProductImage({ productName: product.productName, imageUrl: null })
    : getProductImage(product);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- image source is arbitrary user-provided URLs or a generated data: URI, neither of which next/image can optimize
    <img
      src={src}
      alt={product.productName}
      className={className ?? "aspect-4/3 w-full object-cover"}
      onError={() => setFailed(true)}
    />
  );
}
