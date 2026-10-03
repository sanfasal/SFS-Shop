import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "@/lib/products";

export const ORDER_STATUSES = ["Pending", "Paid", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
};

export type Order = {
  id: number;
  orderNo?: string | null;
  customerId: number;
  customerName?: string | null;
  orderDate?: string | null;
  createdDate?: string | null;
  subTotal?: number;
  discountAmount: number;
  totalAmount?: number;
  status: string;
  note: string | null;
  items?: OrderItem[];
};

export type OrderInput = {
  customerId: number;
  discountAmount: number;
  note: string | null;
  items: { productId: number; quantity: number }[];
};

export async function fetchOrders(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<PagedResult<Order>> {
  const { data } = await apiClient.get<PagedResult<Order>>("/api/Order/GetAll", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      customerId: params.customerId,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
    },
  });
  return data;
}

export async function fetchOrderById(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>("/api/Order/GetById", {
    params: { id },
  });
  return data;
}

export async function createOrder(input: OrderInput): Promise<void> {
  await apiClient.post("/api/Order/Post", input);
}

export async function updateOrder(id: number, input: OrderInput): Promise<void> {
  await apiClient.put(`/api/Order/Update/${id}`, input);
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  await apiClient.put(`/api/Order/UpdateStatus/${id}`, { status });
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete("/api/Order/Delete", { params: { id } });
}

export function orderLabel(order: Order) {
  return order.orderNo || `#${order.id}`;
}
