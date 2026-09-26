"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/components/auth-provider";

type Errors = {
  email?: string;
  password?: string;
  form?: string;
};

function validate(email: string, password: string): Errors {
  const errors: Errors = {};

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

type LoginFormProps = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      let message = "Couldn't sign in. Is the API running?";
      if (axios.isAxiosError(err)) {
        if (typeof err.response?.data === "string" && err.response.data) {
          message = err.response.data;
        } else if (err.response?.status === 401) {
          message = "Invalid email or password.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
