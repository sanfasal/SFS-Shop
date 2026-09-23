"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct as deleteProductRequest,
  fetchProducts,
  updateProduct as updateProductRequest,
  type Product,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/products";

type UseProductsOptions = {
  page: number;
  pageSize: number;
  search?: string;
};

export function useProducts({ page, pageSize, search }: UseProductsOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({ page, pageSize, search });
      setProducts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch {
      setError("Couldn't load products. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching effect; setState calls in `load` happen after the API call resolves, not synchronously
    load();
  }, [load]);

  async function addProduct(input: ProductCreateInput) {
    await createProduct(input);
    await load();
  }

  async function updateProduct(id: number, input: ProductUpdateInput) {
    await updateProductRequest(id, input);
    await load();
  }

  async function deleteProduct(id: number) {
    await deleteProductRequest(id);
    await load();
  }

  return {
    products,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: load,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
