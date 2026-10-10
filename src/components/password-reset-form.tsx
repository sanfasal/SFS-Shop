"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { errorMessage } from "@/lib/api-error";
import { forgotPassword, resetPassword } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

const iconClass =
  "pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground";
const inputClass = "h-10 pl-9";

type Errors = {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

// Two steps: ask for the email and send a code, then take the code and a new
// password. `onDone` receives the email so sign-in can be prefilled.
export function PasswordResetForm({
  initialEmail = "",
  onStepChange,
  onBack,
  onDone,
}: {
  initialEmail?: string;
  onStepChange?: (step: "request" | "reset") => void;
  onBack: () => void;
  onDone: (email: string) => void;
}) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  // Seconds until "Resend code" is allowed again.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function goTo(next: "request" | "reset") {
    setStep(next);
    setErrors({});
    onStepChange?.(next);
  }

  async function sendCode() {
    await forgotPassword(email.trim());
    setCooldown(RESEND_SECONDS);
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return setErrors({ email: "Email is required." });
    if (!EMAIL_PATTERN.test(email.trim())) return setErrors({ email: "Enter a valid email address." });

    setErrors({});
    setSubmitting(true);
    try {
      await sendCode();
      toast.success("If this email has an account, a 6-digit code is on its way.");
      goTo("reset");
    } catch (err) {
      setErrors({ form: errorMessage(err, "Couldn't send the code. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setErrors({});
    try {
      await sendCode();
      toast.success("A new code is on its way.");
    } catch (err) {
      setErrors({ form: errorMessage(err, "Couldn't resend the code.") });
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!/^\d{6}$/.test(otp)) next.otp = "Enter the 6-digit code from your email.";
    if (!password) next.password = "New password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    else if (password.length > 100) next.password = "Password must be 100 characters or fewer.";
    if (password && password !== confirmPassword) next.confirmPassword = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), otp, newPassword: password, confirmPassword });
      toast.success("Password reset. Sign in with your new password.");
      onDone(email.trim());
    } catch (err) {
      const message = errorMessage(err, "Couldn't reset your password.");
      // Put a rejected code under the code field; anything else under the form.
      setErrors(/otp|code|expired/i.test(message) ? { otp: message } : { form: message });
    } finally {
      setSubmitting(false);
    }
  }

  const backButton = (
    <Button
      type="button"
      variant="link"
      className="h-auto self-center p-0 text-sm"
      onClick={step === "reset" ? () => goTo("request") : onBack}
      disabled={submitting}
    >
      <ArrowLeft className="size-4" />
      {step === "reset" ? "Use a different email" : "Back to sign in"}
    </Button>
  );

  if (step === "request") {
    return (
      <form onSubmit={handleRequest} noValidate aria-busy={submitting} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-email" className="sr-only">
            Email
          </Label>
          <div className="relative">
            <Mail className={iconClass} aria-hidden />
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

        <Button type="submit" disabled={submitting} className="mt-2 h-10 w-full text-sm font-semibold">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending code...
            </>
          ) : (
            "Send reset code"
          )}
        </Button>
        {backButton}
      </form>
    );
  }

  return (
    <form onSubmit={handleReset} noValidate aria-busy={submitting} className="flex flex-col gap-4">
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        If <span className="font-medium text-foreground">{email.trim()}</span> has an account,
        we&apos;ve emailed it a 6-digit code. It may take a minute to arrive.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-otp" className="sr-only">
          Reset code
        </Label>
        <div className="relative">
          <KeyRound className={iconClass} aria-hidden />
          <Input
            id="reset-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            className={`${inputClass} font-mono tracking-[0.3em] placeholder:font-sans placeholder:tracking-normal`}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={submitting}
            aria-invalid={Boolean(errors.otp)}
          />
        </div>
        {errors.otp && <p className="text-sm text-destructive">{errors.otp}</p>}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            disabled={cooldown > 0 || submitting}
            onClick={handleResend}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password" className="sr-only">
          New password
        </Label>
        <div className="relative">
          <Lock className={iconClass} aria-hidden />
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            placeholder="New password (at least 6 characters)"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.password)}
          />
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm" className="sr-only">
          Confirm new password
        </Label>
        <div className="relative">
          <Lock className={iconClass} aria-hidden />
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            placeholder="Confirm new password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <Button type="submit" disabled={submitting} className="mt-2 h-10 w-full text-sm font-semibold">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Resetting...
          </>
        ) : (
          "Reset password"
        )}
      </Button>
      {backButton}
    </form>
  );
}
