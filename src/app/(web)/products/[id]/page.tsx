"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { useAuth } from "@/components/auth-provider";
import { useDocumentTitle, useLanguage } from "@/lib/i18n";
import { fetchProductById, type Product } from "@/lib/products";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ProductDetailPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const invalidId = !Number.isFinite(id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (invalidId) return;

    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching effect; kicks off an async request right after, not a synchronous derived-state computation
    setLoading(true);
    setFetchError(false);

    fetchProductById(id)
      .then((result) => {
        if (!ignore) setProduct(result);
      })
      .catch(() => {
        if (!ignore) setFetchError(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, invalidId]);

  const error = invalidId ? t("invalidProduct") : fetchError ? t("productLoadError") : null;

  // Product names come from the API untranslated; fall back to "Products" while loading.
  useDocumentTitle(product?.productName ?? t("products"));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/" />}
      >
        <ArrowLeft className="size-4" />
        {t("backToProducts")}
      </Button>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <p className="text-muted-foreground">{t("loadingProduct")}</p>
      ) : product ? (
        <div className="flex flex-col gap-4">
          <ProductImage
            product={product}
            className="aspect-4/3 w-full rounded-xl object-cover"
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.productName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {product.categoryName} · {product.productCode}
            </p>
          </div>
          <p className="text-foreground">
            {product.description || t("noDescription")}
          </p>
          <div className="flex items-baseline justify-between border-t pt-4">
            <p className="text-2xl font-semibold">
              {currency.format(product.price)}
            </p>
            {isAuthenticated && (
              <p className="text-sm text-muted-foreground">{t("quantity")}: {product.quantity}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
