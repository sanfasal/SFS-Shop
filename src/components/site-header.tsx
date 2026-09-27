"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import { LoginDialog } from "@/components/login-dialog";
import { ModeToggle } from "@/components/mode-toggle";

// The admin dashboard runs as a separate server (see package.json dev:dashboard).
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3001";

export function SiteHeader() {
  const { isAuthenticated, email, logout, pending } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="h-1 bg-brand-gradient" />
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
            <Store className="size-4" />
          </span>
          sfs-shop
        </Link>

        <div className="flex items-center gap-1">
          <ModeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" aria-label="Account menu" />}
              >
                <User className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                    {email}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<a href={DASHBOARD_URL} target="_blank" rel="noreferrer" />}
                >
                  <LayoutDashboard className="size-4" />
                  Open dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} disabled={pending !== null}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
                <LogIn />
                Log in
              </Button>
              <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
