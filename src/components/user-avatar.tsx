"use client";

import { useState } from "react";
import { User as UserIcon } from "lucide-react";
import { cn } from "cn";
import type { User } from "@/lib/users";

// Round avatar: the user's profile photo, else their initials, else a person
// icon (no user loaded yet). Size it with `className`; style the non-photo
// look with `fallbackClassName`.
export function UserAvatar({
  user,
  className,
  fallbackClassName = "bg-primary/10 text-primary",
}: {
  user: Pick<User, "username" | "fullName" | "profile"> | null;
  className?: string;
  fallbackClassName?: string;
}) {
  // Remember which URL failed, so a new photo gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = user?.profile || null;

  if (src && src !== failedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided URL
      <img
        src={src}
        alt=""
        className={cn("size-9 shrink-0 rounded-full object-cover ring-1 ring-foreground/10", className)}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  const initials = user ? (user.fullName || user.username).trim().slice(0, 2) : "";
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase",
        fallbackClassName,
        className
      )}
    >
      {initials || <UserIcon className="size-[55%]" />}
    </span>
  );
}
