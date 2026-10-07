"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/components/auth-provider";

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { pending } = useAuth();

  return (
    // Hide the dialog once credentials are accepted so the full-screen
    // "Signing in..." overlay takes over.
    // Only the close button or Esc dismisses it, so a stray click can't lose typed credentials.
    <Dialog
      open={open && pending !== "login"}
      onOpenChange={onOpenChange}
      disablePointerDismissal
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log in</DialogTitle>
          <DialogDescription>
            Log in to add, edit, or remove products.
          </DialogDescription>
        </DialogHeader>
        <LoginForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
