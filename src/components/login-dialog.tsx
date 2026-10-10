"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOGIN_VIEW_TEXT, LoginForm, type LoginView } from "@/components/login-form";
import { useAuth } from "@/components/auth-provider";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { pending } = useAuth();
  // Sign in, or one of the forgot/reset password steps.
  const [view, setView] = useState<LoginView>("login");

  function handleOpenChange(next: boolean) {
    // The form remounts on the sign-in step next time, so match it.
    if (!next) setView("login");
    onOpenChange(next);
  }

  return (
    // Hide the dialog once credentials are accepted so the full-screen
    // "Signing in..." overlay takes over.
    // Only the close button or Esc dismisses it, so a stray click can't lose typed credentials.
    <Dialog
      open={open && pending !== "login"}
      onOpenChange={handleOpenChange}
      disablePointerDismissal
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{view === "login" ? "Log in" : LOGIN_VIEW_TEXT[view].title}</DialogTitle>
          <DialogDescription>
            {view === "login"
              ? "Log in to add, edit, or remove products."
              : LOGIN_VIEW_TEXT[view].description}
          </DialogDescription>
        </DialogHeader>
        <LoginForm onSuccess={() => handleOpenChange(false)} onViewChange={setView} />
      </DialogContent>
    </Dialog>
  );
}
