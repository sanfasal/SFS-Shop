import { apiClient } from "@/lib/api-client";

export type Category = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
};

export type CategoryCreateInput = {
  name: string;
  description?: string | null;
};

export type CategoryUpdateInput = CategoryCreateInput & {
  isActive: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/api/Category/GetAll");
  return data;
}

export async function createCategory(input: CategoryCreateInput): Promise<void> {
  await apiClient.post("/api/Category/Post", input);
}

export async function updateCategory(id: number, input: CategoryUpdateInput): Promise<void> {
  await apiClient.put(`/api/Category/Update/${id}`, input);
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete("/api/Category/Delete", { params: { id } });
}
