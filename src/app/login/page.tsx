"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Tag, Truck } from "lucide-react";
import { cn } from "cn";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { LogoLoader } from "@/components/logo-loader";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  DOOR_OPEN_MS,
  clearLoginDoorsClose,
  isLoginDoorsClosePending,
  markDashboardEntrance,
} from "@/lib/login-transition";

// The page's background, drawn at full page width inside each door so the two
// halves line up into one picture until they slide apart.
function Backdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 -z-10 bg-linear-to-br from-primary/5 via-background to-primary/25",
        className
      )}
    >
      <div className="absolute -top-24 left-1/4 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -top-24 right-0 size-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 size-96 rounded-full bg-primary/15 blur-3xl" />
    </div>
  );
}

const doorClass =
  "relative isolate overflow-hidden transition-transform ease-in-out will-change-transform motion-reduce:transition-none";

export default function LoginPage() {
  const { isAuthenticated, pending } = useAuth();
  const hydrated = useHydrated();
  const router = useRouter();
  // Set once this page's form has accepted credentials, so the login plays the
  // door animation instead of redirecting straight away.
  const [signedInHere, setSignedInHere] = useState(false);
  if (pending === "login" && !signedInHere) setSignedInHere(true);

  // Arriving from a dashboard logout: start with the doors open, then shut them.
  const [doorsStartOpen, setDoorsStartOpen] = useState(isLoginDoorsClosePending);

  useEffect(() => {
    if (!doorsStartOpen) return;
    clearLoginDoorsClose();
    // Wait for the open position to be painted so the close animates.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setDoorsStartOpen(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [doorsStartOpen]);

  // Keeps the "Logging out..." loader behind the doors until they've shut.
  const [loggingOut, setLoggingOut] = useState(isLoginDoorsClosePending);

  useEffect(() => {
    if (!loggingOut) return;
    const timer = setTimeout(() => setLoggingOut(false), DOOR_OPEN_MS);
    return () => clearTimeout(timer);
  }, [loggingOut]);

  const signingIn = isAuthenticated && signedInHere;
  const opening = signingIn || doorsStartOpen;

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    if (!signedInHere) {
      // Already logged in when arriving here.
      router.replace("/");
      return;
    }
    markDashboardEntrance();
    router.prefetch("/");
    const timer = setTimeout(() => router.replace("/"), DOOR_OPEN_MS);
    return () => clearTimeout(timer);
  }, [hydrated, isAuthenticated, signedInHere, router]);

  if (!hydrated || (isAuthenticated && !signedInHere)) return <div className="flex-1" />;

  return (
    // Two "doors": after sign-in the left half slides out left and the right
    // half slides out right, then the dashboard rises from the center.
    <main className="relative grid flex-1 overflow-hidden lg:grid-cols-2">
      {/* Revealed as the doors part; stays until the dashboard replaces this page. */}
      {(signingIn || loggingOut) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80">
          <LogoLoader label={signingIn ? "Signing in..." : "Logging out..."} />
        </div>
      )}

      {/* Decorative panel, hidden on small screens. */}
      <section
        aria-hidden
        style={{ transitionDuration: `${DOOR_OPEN_MS}ms` }}
        className={cn(
          doorClass,
          "hidden lg:flex lg:items-center lg:justify-center",
          opening && "-translate-x-full shadow-2xl"
        )}
      >
        <Backdrop className="left-0 w-[200%]" />
        <div className="relative flex flex-col items-center gap-8 px-10 text-center">
          <div className="relative">
            <Logo size="xl" />
            <span className="absolute -top-5 -left-8 flex size-14 -rotate-12 items-center justify-center rounded-2xl bg-background text-primary shadow-lg">
              <Tag className="size-6" />
            </span>
            <span className="absolute -right-10 top-10 flex size-14 rotate-12 items-center justify-center rounded-2xl bg-background text-primary shadow-lg">
              <ShoppingBag className="size-6" />
            </span>
            <span className="absolute -bottom-6 -left-6 flex size-12 rotate-6 items-center justify-center rounded-2xl bg-background text-primary shadow-lg">
              <Truck className="size-5" />
            </span>
          </div>
          <div className="max-w-sm space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Manage your store in one place
            </h2>
            <p className="text-muted-foreground">
              Products, orders, customers and settings — all from the sfs-shop
              dashboard.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{ transitionDuration: `${DOOR_OPEN_MS}ms` }}
        className={cn(
          doorClass,
          "flex items-center justify-center px-6 py-10",
          opening && "translate-x-full shadow-2xl"
        )}
      >
        <Backdrop className="right-0 w-full lg:w-[200%]" />
        <div className="relative flex w-full max-w-md flex-col gap-8 rounded-3xl bg-background/60 p-8 shadow-xl shadow-primary/10 ring-1 ring-white/60 backdrop-blur-xl sm:p-10 dark:bg-background/40 dark:ring-white/10">
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo size="lg" />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back! Sign in to your sfs-shop admin account.
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
