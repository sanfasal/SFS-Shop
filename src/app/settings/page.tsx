"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/components/auth-provider";
import { fetchCurrentUser, updateUser, type User } from "@/lib/users";

type Errors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

type Values = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function validate(values: Values): Errors {
  const errors: Errors = {};

  if (values.fullName.length > 150) {
    errors.fullName = "Full name must be 150 characters or fewer.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  } else if (values.email.length > 150) {
    errors.email = "Email must be 150 characters or fewer.";
  }

  if (values.password) {
    if (values.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    } else if (values.password.length > 100) {
      errors.password = "Password must be 100 characters or fewer.";
    }
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }
  }

  return errors;
}

function errorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object") {
      const { title, errors } = data as {
        title?: string;
        errors?: Record<string, string[]>;
      };
      const first = errors && Object.values(errors).flat()[0];
      if (first) return first;
      if (title) return title;
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return "You're not allowed to do this. Try logging in again.";
    }
  } else if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export default function SettingsPage() {
  const { isAuthenticated, setEmail: setAuthEmail } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [values, setValues] = useState<Values>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching effect; kicks off an async request right after, not a synchronous derived-state computation
    setLoading(true);
    setLoadError(null);

    fetchCurrentUser()
      .then((result) => {
        if (ignore) return;
        setUser(result);
        setValues({
          fullName: result.fullName ?? "",
          email: result.email,
          password: "",
          confirmPassword: "",
        });
      })
      .catch((err) => {
        if (!ignore) {
          setLoadError(
            errorMessage(
              err,
              "Couldn't load your account. Is the API running?",
            ),
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  function setField(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const email = values.email.trim();
    const fullName = values.fullName.trim() || null;

    setSubmitting(true);
    try {
      await updateUser(user.id, {
        fullName,
        email,
        roleId: user.roleId,
        isActive: user.isActive,
        password: values.password || null,
      });
      setUser({ ...user, fullName, email });
      setValues((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setAuthEmail(email);
      toast.success("Account updated.");
    } catch (err) {
      setErrors({ form: errorMessage(err, "Couldn't save your changes.") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/" />}
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
          <CardDescription>Update your profile and password.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <p className="text-sm text-muted-foreground">
              Log in to manage your account.
            </p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : loading || !user ? (
            <p className="text-muted-foreground">Loading account...</p>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.username} disabled readOnly />
                <p className="text-xs text-muted-foreground">
                  Role: {user.roleName}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  value={values.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? "fullName-error" : undefined
                  }
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-destructive">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 border-t pt-5">
                <Label htmlFor="password">New password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                  value={values.password}
                  onChange={(e) => setField("password", e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  disabled={!values.password}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-sm text-destructive"
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.form && (
                <p className="text-sm text-destructive">{errors.form}</p>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
