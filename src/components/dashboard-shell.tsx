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
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  ShoppingCart,
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
import { Logo } from "@/components/logo";
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

const COLLAPSED_KEY = "sfs-shop:sidebar-collapsed";

function readCollapsed() {
  try {
    return typeof window !== "undefined" && localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function isActive(pathname: string, href: string) {
  // Links are the short addresses the dashboard port serves (see proxy.ts).
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, email, logout, pending } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop only; the mobile drawer always shows full labels.
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const hydrated = useHydrated();

  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {
        // Storage unavailable (private mode); the toggle still works for this visit.
      }
      return !value;
    });
  }

  // Logged-out visitors (or anyone who just logged out) go to the login page.
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/login");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return <div className="flex-1" />;

  const current = ALL_ITEMS.find((item) => isActive(pathname, item.href));

  const renderSidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b border-white/10",
          compact ? "justify-center px-2" : "justify-between px-5"
        )}
      >
        <Link href="/" aria-label="sfs-shop home" onClick={() => setMobileOpen(false)}>
          <Logo />
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

      <nav className={cn("flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-3", compact ? "gap-3" : "gap-5")}>
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label} className="flex flex-col gap-1">
            {compact ? (
              index > 0 && <div className="mx-2 mb-2 border-t border-white/10" />
            ) : (
              <p className="px-3 pb-1 text-xs font-medium tracking-wide text-white/55 uppercase">
                {section.label}
              </p>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? label : undefined}
                  title={compact ? label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg py-2 text-sm transition-colors",
                    compact ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-white font-medium text-[#06584c] shadow-sm dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-1 dark:ring-white/10"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!compact && label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "flex items-center gap-3 border-t border-white/10",
          compact ? "flex-col p-3" : "p-4"
        )}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15"
          title={compact ? email ?? undefined : undefined}
        >
          <User className="size-4" />
        </span>
        {!compact && <p className="min-w-0 flex-1 truncate text-sm">{email}</p>}
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
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 bg-sidebar-gradient text-white transition-[width] duration-200 lg:block dark:border-r dark:border-white/5",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar-gradient text-white shadow-xl animate-in slide-in-from-left">
            {renderSidebar(false)}
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
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
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
