import { apiClient } from "@/lib/api-client";
import type { PagedResult } from "@/lib/products";

export type Customer = {
  id: number;
  fullName: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
};

export type CustomerCreateInput = {
  fullName: string;
  phone: string | null;
  address: string | null;
};

export type CustomerUpdateInput = CustomerCreateInput & {
  isActive: boolean;
};

export async function fetchCustomers(params: {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
}): Promise<PagedResult<Customer>> {
  const { data } = await apiClient.get<PagedResult<Customer>>("/api/Customer/GetAll", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      isActive: params.isActive,
    },
  });
  return data;
}

// The API caps pageSize at 100, so walk every page to fill pickers.
export async function fetchAllCustomers(): Promise<Customer[]> {
  const first = await fetchCustomers({ page: 1, pageSize: 100 });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      fetchCustomers({ page: i + 2, pageSize: 100 })
    )
  );
  return [first, ...rest].flatMap((result) => result.items);
}

export async function fetchCustomerById(id: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>("/api/Customer/GetById", {
    params: { id },
  });
  return data;
}

export async function createCustomer(input: CustomerCreateInput): Promise<void> {
  await apiClient.post("/api/Customer/Post", input);
}

export async function updateCustomer(id: number, input: CustomerUpdateInput): Promise<void> {
  await apiClient.put(`/api/Customer/Update/${id}`, input);
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete("/api/Customer/Delete", { params: { id } });
}
