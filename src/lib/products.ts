import { apiClient } from "@/lib/api-client";

export type Product = {
  id: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  description: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
};

export type ProductCreateInput = {
  productCode: string;
  productName: string;
  categoryId: number;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type ProductUpdateInput = ProductCreateInput & {
  isActive: boolean;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export async function fetchProducts(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<PagedResult<Product>> {
  const { data } = await apiClient.get<PagedResult<Product>>("/api/Product/GetAll", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  });
  return data;
}

export async function fetchProductById(id: number): Promise<Product> {
  const { data } = await apiClient.get<Product>("/api/Product/GetById", {
    params: { id },
  });
  return data;
}

export async function createProduct(input: ProductCreateInput): Promise<void> {
  await apiClient.post("/api/Product/Post", input);
}

export async function updateProduct(id: number, input: ProductUpdateInput): Promise<void> {
  await apiClient.put(`/api/Product/Update/${id}`, input);
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete("/api/Product/Delete", { params: { id } });
}

export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  // Override the client's JSON default, otherwise axios serializes FormData to JSON.
  const { data } = await apiClient.post<{ url: string }>("/api/ImageUpload", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

const PLACEHOLDER_COLORS = [
  "#e2e8f0",
  "#fecaca",
  "#bbf7d0",
  "#bfdbfe",
  "#fde68a",
  "#ddd6fe",
  "#fbcfe8",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProductImage(product: Pick<Product, "productName" | "imageUrl">) {
  if (product.imageUrl) return product.imageUrl;

  const color =
    PLACEHOLDER_COLORS[hashString(product.productName) % PLACEHOLDER_COLORS.length];
  const initial = (product.productName.trim()[0] ?? "?").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" fill="rgba(0,0,0,0.35)" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
