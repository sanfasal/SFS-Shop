import { apiClient } from "@/lib/api-client";

export type Role = {
  id: number;
  name: string;
  createdDate: string;
};

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>("/api/Role/GetAll");
  return data;
}

export async function createRole(name: string): Promise<void> {
  await apiClient.post("/api/Role/Post", { name });
}

export async function updateRole(id: number, name: string): Promise<void> {
  await apiClient.put(`/api/Role/Update/${id}`, { name });
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete("/api/Role/Delete", { params: { id } });
}
