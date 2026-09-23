import { apiClient } from "@/lib/api-client";

export type LoginResult = {
  token: string;
};

function extractToken(data: unknown): string | null {
  if (typeof data === "string" && data.length > 0) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["token", "accessToken", "access_token", "jwt", "jwtToken"]) {
      const value = obj[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }
  return null;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await apiClient.post("/api/Auth/Login", { email, password });
  const token = extractToken(data);
  if (!token) {
    throw new Error(
      `Login succeeded but no token was found in the response: ${JSON.stringify(data)}`
    );
  }
  return { token };
}
