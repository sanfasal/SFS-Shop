"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Contact,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  Users,
  X,
} from "lucide-react";
import { cn } from "cn";
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
import { ModeToggle } from "@/components/mode-toggle";
import { useHydrated } from "@/hooks/use-hydrated";

// The storefront runs as a separate server (see package.json dev:web).
const SHOP_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

const NAV_SECTIONS = [
  {
    label: "General",
    items: [{ href: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/customers", label: "Customers", icon: Contact },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/roles", label: "Roles", icon: ShieldCheck },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

function isActive(pathname: string, href: string) {
  // Links are the short addresses the dashboard port serves (see proxy.ts).
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, email, logout, pending } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();

  // Logged-out visitors (or anyone who just logged out) go to the login page.
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/login");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return <div className="flex-1" />;

  const current = ALL_ITEMS.find((item) => isActive(pathname, item.href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-5">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-white text-[#036c5b] shadow-sm dark:bg-primary dark:text-primary-foreground">
            <Store className="size-4" />
          </span>
          sfs-shop
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        >
          <X />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-xs font-medium tracking-wide text-white/55 uppercase">
              {section.label}
            </p>
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-white font-medium text-[#06584c] shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/10"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 p-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          <User className="size-4" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm">{email}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white hover:bg-white/10 hover:text-white"
          aria-label="Log out"
          onClick={logout}
          disabled={pending !== null}
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar-gradient text-white lg:block dark:border-r dark:border-white/5">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar-gradient text-white shadow-xl animate-in slide-in-from-left">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <p className="text-sm text-muted-foreground">
              Dashboard
              {current && current.href !== "/" && (
                <>
                  {" / "}
                  <span className="font-medium text-foreground">{current.label}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<a href={SHOP_URL} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink />
              <span className="hidden sm:inline">View shop</span>
            </Button>
            <ModeToggle />
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
                <DropdownMenuItem render={<Link href="/settings" />}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} disabled={pending !== null}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
