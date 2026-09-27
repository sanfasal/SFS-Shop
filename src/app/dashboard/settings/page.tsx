"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { errorMessage } from "@/lib/api-error";
import { fetchCurrentUser, updateUser, type User } from "@/lib/users";

type ProfileValues = {
  fullName: string;
  email: string;
};

type ProfileErrors = {
  fullName?: string;
  email?: string;
  form?: string;
};

type PasswordValues = {
  password: string;
  confirmPassword: string;
};

type PasswordErrors = {
  password?: string;
  confirmPassword?: string;
  form?: string;
};

function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};

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

  return errors;
}

function validatePassword(values: PasswordValues): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  } else if (values.password.length > 100) {
    errors.password = "Password must be 100 characters or fewer.";
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

  const [profile, setProfile] = useState<ProfileValues>({ fullName: "", email: "" });
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState<PasswordValues>({
    password: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);

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
        setProfile({ fullName: result.fullName ?? "", email: result.email });
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

    const email = profile.email.trim();
    const fullName = profile.fullName.trim() || null;

    setSavingProfile(true);
    try {
      await updateUser(user.id, {
        fullName,
        email,
        roleId: user.roleId,
        isActive: user.isActive,
        password: null,
      });
      setUser({ ...user, fullName, email });
      setAuthEmail(email);
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
      // Send the saved profile, not unsaved edits from the Profile tab.
      await updateUser(user.id, {
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        isActive: user.isActive,
        password: passwords.password,
      });
      setPasswords({ password: "", confirmPassword: "" });
      toast.success("Password updated.");
    } catch (err) {
      setPasswordErrors({ form: errorMessage(err, "Couldn't change your password.") });
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
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your name and email.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleProfileSubmit}
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
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, email: e.target.value }))
                      }
                      aria-invalid={Boolean(profileErrors.email)}
                      aria-describedby={profileErrors.email ? "email-error" : undefined}
                    />
                    {profileErrors.email && (
                      <p id="email-error" className="text-sm text-destructive">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>

                  {profileErrors.form && (
                    <p className="text-sm text-destructive">{profileErrors.form}</p>
                  )}

                  <Button type="submit" disabled={savingProfile} className="w-full">
                    {savingProfile ? "Saving..." : "Save profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Choose a new password for your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handlePasswordSubmit}
                  noValidate
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password">New password</Label>
                    <PasswordInput
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      value={passwords.password}
                      onChange={(e) =>
                        setPasswords((prev) => ({ ...prev, password: e.target.value }))
                      }
                      aria-invalid={Boolean(passwordErrors.password)}
                      aria-describedby={
                        passwordErrors.password ? "password-error" : undefined
                      }
                    />
                    {passwordErrors.password && (
                      <p id="password-error" className="text-sm text-destructive">
                        {passwordErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <PasswordInput
                      id="confirmPassword"
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
