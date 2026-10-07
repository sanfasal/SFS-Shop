"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, User } from "lucide-react";
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
import { LanguageToggle } from "@/components/language-toggle";
import { LoginDialog } from "@/components/login-dialog";
import { Logo } from "@/components/logo";
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
        <Link href="/" aria-label="sfs-shop home" className="flex items-center">
          <Logo />
        </Link>

        <div className="flex items-center gap-1">
          <LanguageToggle />
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
                <DropdownMenuItem onClick={() => logout()} disabled={pending !== null}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
