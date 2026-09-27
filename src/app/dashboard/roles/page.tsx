"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RowActions } from "@/components/dashboard/row-actions";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/dashboard/table-states";
import { useApiData } from "@/hooks/use-api-data";
import { errorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";
import { createRole, deleteRole, fetchRoles, updateRole, type Role } from "@/lib/roles";
import { fetchUsers } from "@/lib/users";

const COLUMNS = 4;

export default function RolesPage() {
  const roles = useApiData(fetchRoles, "Couldn't load roles.");
  const users = useApiData(fetchUsers, "Couldn't load users.");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);

  function userCount(roleId: number) {
    return users.data?.filter((u) => u.roleId === roleId).length;
  }

  const rows = roles.data ?? [];
  const deletingCount = deleting ? userCount(deleting.id) : undefined;

  return (
    <>
      <PageHeader
        title="Roles"
        description="Roles group users by what they're responsible for."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            Add role
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.error ? (
              <TableErrorRow columns={COLUMNS} message={roles.error} onRetry={roles.reload} />
            ) : roles.loading && !roles.data ? (
              <TableLoadingRows columns={COLUMNS} rows={3} />
            ) : rows.length === 0 ? (
              <TableEmptyRow columns={COLUMNS} message="No roles yet." />
            ) : (
              rows.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="pl-4 font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {userCount(role.id) ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(role.createdDate)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RowActions
                      onEdit={() => {
                        setEditing(role);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(role)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Rename role" : "Add role"}</DialogTitle>
          </DialogHeader>
          {formOpen && (
            <RoleForm
              key={editing?.id ?? "new"}
              role={editing}
              onSaved={async () => {
                setFormOpen(false);
                await roles.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "role"}?`}
        description={
          deletingCount
            ? `${deletingCount} user(s) have this role. Move them to another role first, or the delete may fail.`
            : "This can't be undone."
        }
        successMessage="Role deleted"
        onConfirm={async () => {
          if (!deleting) return;
          await deleteRole(deleting.id);
          await roles.reload();
        }}
      />
    </>
  );
}

function RoleForm({ role, onSaved }: { role: Role | null; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(role?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (role) {
        await updateRole(role.id, name.trim());
        toast.success("Role updated");
      } else {
        await createRole(name.trim());
        toast.success("Role added");
      }
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the role."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : role ? "Save" : "Add role"}
        </Button>
      </DialogFooter>
    </form>
  );
}
