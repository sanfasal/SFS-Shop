"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useApiData } from "@/hooks/use-api-data";
import { fetchCurrentUser, onUserChanged, type User } from "@/lib/users";

// The signed-in user's record (name, photo...), or null when signed out or
// while loading. Reloads when the signed-in email changes or any user is
// updated in this tab (Users page, Settings), so the header stays current.
export function useCurrentUser(): User | null {
  const { isAuthenticated, email } = useAuth();
  const load = useCallback(
    () => (isAuthenticated ? fetchCurrentUser() : Promise.resolve(null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- email is a reload trigger
    [isAuthenticated, email]
  );
  const { data, reload } = useApiData(load, "Couldn't load your profile.");
  useEffect(() => onUserChanged(() => void reload()), [reload]);
  return isAuthenticated ? data : null;
}
