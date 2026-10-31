"use client";

import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ProfilePhotoInput } from "@/components/profile-photo-input";
import { ChangeEmailForm } from "@/components/change-email-form";
import { PasswordResetForm } from "@/components/password-reset-form";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/api-error";
import { changePassword } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PASSWORD_HINT, passwordProblem } from "@/lib/password";
import { fetchCurrentUser, updateUser, type User } from "@/lib/users";

type ProfileValues = {
  fullName: string;
  // Profile photo URL ("" for none).
  photo: string;
};

type ProfileErrors = {
  fullName?: string;
  form?: string;
};

type PasswordValues = {
  currentPassword: string;
  password: string;
  confirmPassword: string;
};

type PasswordErrors = {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};

  if (values.fullName.length > 150) {
    errors.fullName = "Full name must be 150 characters or fewer.";
  }

  return errors;
}

function validatePassword(values: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }

  const problem = passwordProblem(values.password);
  if (problem) errors.password = problem;

  if (!errors.password && values.password === values.currentPassword) {
    errors.password = "New password must be different from your current one.";
  }

  if (values.password && values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
}

export default function SettingsPage() {
  const { isAuthenticated, setEmail: setAuthEmail } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileValues>({ fullName: "", photo: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState<PasswordValues>({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);
  // Swaps the password form for the emailed-code reset flow.
  const [resettingPassword, setResettingPassword] = useState(false);

  function showPasswordReset(show: boolean) {
    setPasswords({ currentPassword: "", password: "", confirmPassword: "" });
    setPasswordErrors({});
    setResettingPassword(show);
  }

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
        setProfile({ fullName: result.fullName ?? "", photo: result.profile ?? "" });
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

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const validationErrors = validateProfile(profile);
    setProfileErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const fullName = profile.fullName.trim() || null;
    const photo = profile.photo || null;

    setSavingProfile(true);
    try {
      await updateUser(user.id, {
        fullName,
        // Email changes go through the verified flow on the Email tab.
        email: user.email,
        roleId: user.roleId,
        isActive: user.isActive,
        password: null,
        profile: photo,
      });
      setUser({ ...user, fullName, profile: photo });
      toast.success("Profile updated.");
    } catch (err) {
      setProfileErrors({ form: errorMessage(err, "Couldn't save your changes.") });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const validationErrors = validatePassword(passwords);
    setPasswordErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.password,
        confirmPassword: passwords.confirmPassword,
      });
      setPasswords({ currentPassword: "", password: "", confirmPassword: "" });
      toast.success("Password updated.");
    } catch (err) {
      const message = errorMessage(err, "Couldn't change your password.");
      // A rejected current password belongs under that field; anything else
      // (network, server) goes under the form.
      const wrongCurrent =
        isAxiosError(err) &&
        (err.response?.status === 400 || err.response?.status === 401) &&
        /current|old|incorrect|invalid|wrong/i.test(message);
      setPasswordErrors(
        wrongCurrent
          ? { currentPassword: "Current password is incorrect." }
          : { form: message }
      );
    } finally {
      setSavingPassword(false);
    }
  }

  let body;
  if (!isAuthenticated) {
    body = (
      <p className="text-sm text-muted-foreground">
        Log in to manage your account.
      </p>
    );
  } else if (loadError) {
    body = <p className="text-sm text-destructive">{loadError}</p>;
  } else if (loading || !user) {
    body = <p className="text-muted-foreground">Loading account...</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your own dashboard account." />

      {body || !user ? (
        <Card>
          <CardContent>{body}</CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="profile" className="gap-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your photo, name and email.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleProfileSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label>Profile photo</Label>
                    <ProfilePhotoInput
                      value={profile.photo}
                      onChange={(photo) => setProfile((prev) => ({ ...prev, photo }))}
                      onUploadingChange={setUploadingPhoto}
                    />
                  </div>

                  {/* Read-only account details; an admin changes these on the Users page. */}
                  <dl className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                    <div className="flex min-w-0 flex-col gap-1">
                      <dt className="text-xs text-muted-foreground">Role</dt>
                      <dd>
                        <Badge variant="outline">{user.roleName || "—"}</Badge>
                      </dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd>
                        <StatusBadge active={user.isActive} />
                      </dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <dt className="text-xs text-muted-foreground">Member since</dt>
                      <dd className="font-medium">{formatDate(user.createdDate)}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.username} disabled readOnly />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      autoComplete="name"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      aria-invalid={Boolean(profileErrors.fullName)}
                      aria-describedby={
                        profileErrors.fullName ? "fullName-error" : undefined
                      }
                    />
                    {profileErrors.fullName && (
                      <p id="fullName-error" className="text-sm text-destructive">
                        {profileErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled readOnly />
                    <p className="text-xs text-muted-foreground">
                      Change it on the Email tab — we&apos;ll send a code to confirm the new address.
                    </p>
                  </div>

                  {profileErrors.form && (
                    <p className="text-sm text-destructive">{profileErrors.form}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={savingProfile || uploadingPhoto}
                    className="w-full"
                  >
                    {savingProfile ? "Saving..." : uploadingPhoto ? "Uploading..." : "Save profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  Enter a new email and confirm it with the 6-digit code we send there.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangeEmailForm
                  currentEmail={user.email}
                  onChanged={(email) => {
                    setUser({ ...user, email });
                    setAuthEmail(email);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>{resettingPassword ? "Reset password" : "Password"}</CardTitle>
                <CardDescription>
                  {resettingPassword
                    ? "We'll email you a 6-digit code to set a new password."
                    : "Enter your current password, then choose a new one."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resettingPassword ? (
                  <PasswordResetForm
                    initialEmail={user.email}
                    backLabel="Back to change password"
                    successMessage="Password reset."
                    onBack={() => showPasswordReset(false)}
                    onDone={() => showPasswordReset(false)}
                  />
                ) : (
                <form
                  onSubmit={handlePasswordSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="currentPassword" required>Current password</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => showPasswordReset(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <PasswordInput
                      id="currentPassword"
                      placeholder="Enter your current password"
                      name="currentPassword"
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      aria-invalid={Boolean(passwordErrors.currentPassword)}
                      aria-describedby={
                        passwordErrors.currentPassword ? "currentPassword-error" : undefined
                      }
                    />
                    {passwordErrors.currentPassword && (
                      <p id="currentPassword-error" className="text-sm text-destructive">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password" required>New password</Label>
                    <p id="password-hint" className="text-xs text-muted-foreground">
                      {PASSWORD_HINT}
                    </p>
                    <PasswordInput
                      id="password"
                      placeholder="Choose a strong password"
                      name="password"
                      autoComplete="new-password"
                      value={passwords.password}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, password: e.target.value }))
                      }
                      aria-invalid={Boolean(passwordErrors.password)}
                      aria-describedby={
                        passwordErrors.password ? "password-hint password-error" : "password-hint"
                      }
                    />
                    {passwordErrors.password && (
                      <p id="password-error" className="text-sm text-destructive">
                        {passwordErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirmPassword" required>Confirm new password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      placeholder="Re-enter the new password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      aria-invalid={Boolean(passwordErrors.confirmPassword)}
                      aria-describedby={
                        passwordErrors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                    />
                    {passwordErrors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className="text-sm text-destructive"
                      >
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {passwordErrors.form && (
                    <p className="text-sm text-destructive">{passwordErrors.form}</p>
                  )}

                  <Button type="submit" disabled={savingPassword} className="w-full">
                    {savingPassword ? "Saving..." : "Change password"}
                  </Button>
                </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
