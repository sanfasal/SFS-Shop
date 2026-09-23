import { apiClient, getAuthToken } from "@/lib/api-client";

export type User = {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
};

export type UserUpdateInput = {
  fullName: string | null;
  email: string;
  roleId: number;
  isActive: boolean;
  password?: string | null;
};

const ID_KEYS = [
  "id",
  "userId",
  "nameid",
  "sub",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

function extractId(data: unknown): number | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const key of ID_KEYS) {
    const id = Number(obj[key]);
    if (Number.isInteger(id) && id > 0) return id;
  }
  // /Me may return a list of claims: [{ type, value }]
  if (Array.isArray(data)) {
    for (const claim of data as { type?: string; value?: unknown }[]) {
      if (claim.type && ID_KEYS.includes(claim.type)) {
        const id = Number(claim.value);
        if (Number.isInteger(id) && id > 0) return id;
      }
    }
  }
  return null;
}

function decodeTokenPayload(token: string): unknown {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")),
    );
  } catch {
    return null;
  }
}

async function resolveCurrentUserId(): Promise<number> {
  const token = getAuthToken();
  const fromToken = token ? extractId(decodeTokenPayload(token)) : null;
  if (fromToken) return fromToken;

  const { data } = await apiClient.get("/api/Auth/Me");
  const fromMe = extractId(data);
  if (fromMe) return fromMe;

  throw new Error("Couldn't determine the signed-in user.");
}

export async function fetchUserById(id: number): Promise<User> {
  const { data } = await apiClient.get<User>("/api/User/GetById", {
    params: { id },
  });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  return fetchUserById(await resolveCurrentUserId());
}

export async function updateUser(
  id: number,
  input: UserUpdateInput,
): Promise<void> {
  await apiClient.put(`/api/User/Update/${id}`, input);
}
