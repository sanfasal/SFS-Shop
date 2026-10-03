"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Tag, Truck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { useHydrated } from "@/hooks/use-hydrated";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || isAuthenticated) return <div className="flex-1" />;

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* Decorative panel, hidden on small screens. */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-linear-to-br from-primary/5 via-background to-primary/25 lg:flex lg:items-center lg:justify-center"
      >
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />

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

      <section className="flex items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-sm flex-col gap-8">
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
