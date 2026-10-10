"use client";

import { useState, type FormEvent } from "react";
import { ListFilter, Plus, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/components/auth-provider";
import { ProfilePhotoInput } from "@/components/profile-photo-input";
import { UserAvatar } from "@/components/user-avatar";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { fetchRoles, type Role } from "@/lib/roles";
import { createUser, deleteUser, fetchUsers, updateUser, type User } from "@/lib/users";

const COLUMNS = 6;
const ALL = "all";

const STATUS_ITEMS = [
  { value: ALL, label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UsersPage() {
  const { email: currentEmail } = useAuth();
  const users = useApiData(fetchUsers, "Couldn't load users.");
  const roles = useApiData(fetchRoles, "Couldn't load roles.");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const roleItems = [
    { value: ALL, label: "All roles" },
    ...(roles.data ?? []).map((r) => ({ value: String(r.id), label: r.name })),
  ];

  const query = search.trim().toLowerCase();
  // Created range in local time, including the whole last day.
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;
  const activeFilterCount =
    Number(roleFilter !== ALL) + Number(statusFilter !== ALL) + Number(fromDate !== "" || toDate !== "");

  const rows = (users.data ?? []).filter((u) => {
    if (
      query &&
      ![u.username, u.fullName, u.email, u.roleName].some((field) =>
        field?.toLowerCase().includes(query)
      )
    ) {
      return false;
    }
    if (roleFilter !== ALL && String(u.roleId) !== roleFilter) return false;
    if (statusFilter !== ALL && u.isActive !== (statusFilter === "active")) return false;
    if (from !== null || to !== null) {
      const created = new Date(u.createdDate).getTime();
      if (Number.isNaN(created)) return false;
      if (from !== null && created < from) return false;
      if (to !== null && created > to) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to the dashboard."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add user
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-end gap-3 border-b p-4">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>
              <ListFilter />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-80 flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select
                  items={roleItems}
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter((value as string | null) ?? ALL)}
                >
                  <SelectTrigger className="w-full" aria-label="Filter by role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select
                  items={STATUS_ITEMS}
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter((value as string | null) ?? ALL)}
                >
                  <SelectTrigger className="w-full" aria-label="Filter by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Created</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    aria-label="Created from"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="date"
                    aria-label="Created to"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="min-w-0 flex-1"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
                disabled={activeFilterCount === 0}
                onClick={() => {
                  setRoleFilter(ALL);
                  setStatusFilter(ALL);
                  setFromDate("");
                  setToDate("");
                }}
              >
                <X />
                Clear filters
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.error ? (
              <TableErrorRow columns={COLUMNS} message={users.error} onRetry={users.reload} />
            ) : users.loading && !users.data ? (
              <TableLoadingRows columns={COLUMNS} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No users found." icon={UserRound} />
            ) : (
              rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.fullName || user.username}
                          {user.email === currentEmail && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.roleName || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge active={user.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onEdit={() => {
                        setEditing(user);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(user)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {users.data && (
          <p className="border-t px-4 py-3 text-sm text-muted-foreground">
            {rows.length} of {users.data.length} users
          </p>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <UserForm
              key={editing?.id ?? "new"}
              user={editing}
              roles={roles.data ?? []}
              onSaved={async () => {
                setFormOpen(false);
                await users.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.username ?? "user"}?`}
        description={
          deleting?.email === currentEmail
            ? "This is your own account. You'll lose access to the dashboard."
            : "They will no longer be able to sign in."
        }
        successMessage="User deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteUser(deleting.id);
          await users.reload();
        }}
      />
    </>
  );
}

function UserForm({
  user,
  roles,
  onSaved,
}: {
  user: User | null;
  roles: Role[];
  onSaved: () => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [roleId, setRoleId] = useState(user ? String(user.roleId) : "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [profile, setProfile] = useState(user?.profile ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roleItems = roles.map((r) => ({ value: String(r.id), label: r.name }));

  function validate() {
    if (!user && !username.trim()) return "Username is required.";
    if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
    if (!roleId) return "Choose a role.";
    if (!user && password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (user) {
        await updateUser(user.id, {
          fullName: fullName.trim() || null,
          email: email.trim(),
          roleId: Number(roleId),
          isActive,
          password: null,
          profile: profile || null,
        });
        toast.success("User updated");
      } else {
        await createUser({
          username: username.trim(),
          password,
          fullName: fullName.trim() || null,
          email: email.trim(),
          roleId: Number(roleId),
          profile: profile || null,
        });
        toast.success("User added");
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the user."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Profile photo</Label>
        <ProfilePhotoInput value={profile} onChange={setProfile} onUploadingChange={setUploading} />
      </div>
      {user ? (
        <p className="text-sm text-muted-foreground">
          Username: <span className="font-medium text-foreground">@{user.username}</span>
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-username" required>Username</Label>
          <Input
            id="user-username"
            maxLength={100}
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-fullname">Full name</Label>
        <Input
          id="user-fullname"
          maxLength={150}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-email" required>Email</Label>
        <Input
          id="user-email"
          type="email"
          maxLength={150}
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-role" required>Role</Label>
        <Select
          items={roleItems}
          value={roleId || null}
          onValueChange={(value) => setRoleId((value as string | null) ?? "")}
        >
          <SelectTrigger id="user-role" className="w-full">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {roleItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Only when creating: editing never touches the password, so a browser
          autofill can't silently change it. Users change their own in Settings. */}
      {!user && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-password" required>Password</Label>
          <PasswordInput
            id="user-password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}
      {user && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <Label htmlFor="user-active">Active</Label>
            <p className="text-xs text-muted-foreground">Inactive users can&apos;t sign in.</p>
          </div>
          <Switch id="user-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? "Saving..." : uploading ? "Uploading..." : user ? "Save changes" : "Add user"}
        </Button>
      </DialogFooter>
    </form>
  );
}
