"use client";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import type { User } from "@/lib/users";

// Account menu header: avatar, name and email of the signed-in user.
export function AccountLabel({ user, email }: { user: User | null; email: string | null }) {
  return (
    <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
      <UserAvatar user={user} className="size-10" />
      <div className="min-w-0">
        {user?.fullName && (
          <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
        )}
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </DropdownMenuLabel>
  );
}
