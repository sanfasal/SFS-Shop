"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/api-error";
import { confirmEmailChange, requestEmailChange } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

const iconClass =
  "pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground";
const inputClass = "h-10 pl-9";

type Errors = {
  email?: string;
  otp?: string;
  form?: string;
};

// Two steps: send a code to the new address, then confirm it with that code.
// `onChanged` receives the new email once the API has saved it.
export function ChangeEmailForm({
  currentEmail,
  onChanged,
}: {
  currentEmail: string;
  onChanged: (email: string) => void;
}) {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  // Seconds until "Resend code" is allowed again.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function goTo(next: "request" | "confirm") {
    setStep(next);
    setErrors({});
    setOtp("");
  }

  async function sendCode() {
    await requestEmailChange(email.trim());
    setCooldown(RESEND_SECONDS);
  }

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!value) return setErrors({ email: "Enter your new email." });
    if (!EMAIL_PATTERN.test(value)) return setErrors({ email: "Enter a valid email address." });
    if (value.length > 150) return setErrors({ email: "Email must be 150 characters or fewer." });
    if (value.toLowerCase() === currentEmail.toLowerCase()) {
      return setErrors({ email: "This is already your email." });
    }

    setErrors({});
    setSubmitting(true);
    try {
      await sendCode();
      toast.success(`A 6-digit code is on its way to ${value}.`);
      goTo("confirm");
    } catch (err) {
      const message = errorMessage(err, "Couldn't send the code. Please try again.");
      // "Email already taken" belongs under the field.
      setErrors(/email|taken|exist|use/i.test(message) ? { email: message } : { form: message });
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

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setErrors({ otp: "Enter the 6-digit code from your email." });

    setErrors({});
    setSubmitting(true);
    try {
      const value = email.trim();
      await confirmEmailChange(value, otp);
      toast.success("Email updated.");
      onChanged(value);
      setEmail("");
      goTo("request");
    } catch (err) {
      const message = errorMessage(err, "Couldn't change your email.");
      setErrors(/otp|code|expired/i.test(message) ? { otp: message } : { form: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "request") {
    return (
      <form onSubmit={handleRequest} noValidate aria-busy={submitting} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-email">Current email</Label>
          <Input id="current-email" value={currentEmail} disabled readOnly />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-email" required>New email</Label>
          <div className="relative">
            <Mail className={iconClass} aria-hidden />
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "new-email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="new-email-error" className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending code...
            </>
          ) : (
            "Send verification code"
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleConfirm} noValidate aria-busy={submitting} className="flex flex-col gap-5">
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        We&apos;ve emailed a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email.trim()}</span>. It may take a minute
        to arrive.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email-otp" required>Verification code</Label>
        <div className="relative">
          <KeyRound className={iconClass} aria-hidden />
          <Input
            id="email-otp"
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

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Confirming...
          </>
        ) : (
          "Confirm new email"
        )}
      </Button>
      <Button
        type="button"
        variant="link"
        className="h-auto self-center p-0 text-sm"
        onClick={() => goTo("request")}
        disabled={submitting}
      >
        <ArrowLeft className="size-4" />
        Use a different email
      </Button>
    </form>
  );
}
