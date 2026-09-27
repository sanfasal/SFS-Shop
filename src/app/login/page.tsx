"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/login-form";
import { ModeToggle } from "@/components/mode-toggle";
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
    <main className="relative flex flex-1 items-center justify-center bg-muted/40 px-6 py-10">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <Store className="size-5" />
          </span>
          sfs-shop admin
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Sign in to manage your store.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

