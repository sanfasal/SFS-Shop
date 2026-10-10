"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { ConfirmLogoutDialog } from "@/components/confirm-logout-dialog";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginDialog } from "@/components/login-dialog";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { useCurrentUser } from "@/hooks/use-current-user";

export function SiteHeader() {
  const { isAuthenticated, logout, pending } = useAuth();
  const currentUser = useCurrentUser();
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="h-1 bg-brand-gradient" />
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" aria-label="sfs-shop home" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ModeToggle />
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Account"
                aria-expanded={logoutOpen}
                onClick={() => setLogoutOpen(true)}
                disabled={pending !== null}
                // Brand ring around the photo while the account dialog is open.
                className="rounded-full aria-expanded:bg-transparent aria-expanded:ring-2 aria-expanded:ring-primary aria-expanded:ring-offset-2 aria-expanded:ring-offset-background"
              >
                <UserAvatar user={currentUser} className="size-8" />
              </Button>
              <ConfirmLogoutDialog
                open={logoutOpen}
                onOpenChange={setLogoutOpen}
                onConfirm={() => logout()}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log in"
                title="Log in"
                onClick={() => setLoginOpen(true)}
              >
                <User className="size-5" />
              </Button>
              <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
