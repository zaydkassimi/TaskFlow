"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { usersApi } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/errors";
import type {
  CreateUserRequest,
  Role,
  UpdateUserRequest,
  User,
} from "@/lib/api/types";
import { ROLES } from "@/lib/api/types";
import { formatDate, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

const ROLE_TONE: Record<Role, "primary" | "neutral" | "success"> = {
  ADMIN: "primary",
  MANAGER: "success",
  MEMBER: "neutral",
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

const ROLE_FILTERS: { value: Role | ""; label: string }[] = [
  { value: "", label: "All" },
  ...ROLES.map((role) => ({ value: role as Role | "", label: ROLE_LABEL[role] })),
];

interface UserModalState {
  mode: "create" | "edit";
  user: User | null;
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "MEMBER");
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        const body: CreateUserRequest = {
          firstName,
          lastName,
          email,
          password,
          role,
          enabled,
        };
        await usersApi.create(body);
      } else if (user) {
        const body: UpdateUserRequest = {
          firstName,
          lastName,
          email,
          role,
          enabled,
        };
        await usersApi.update(user.id, body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "create" ? "Create user" : `Edit ${fullName(user)}`}
      description={
        mode === "create"
          ? "Add a new user to the workspace."
          : "Update the user's details and access."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={busy}>
            {busy
              ? "Saving…"
              : mode === "create"
                ? "Create user"
                : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="user-firstName" required>
            <Input
              id="user-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Field>
          <Field label="Last name" htmlFor="user-lastName" required>
            <Input
              id="user-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="user-email" required>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        {mode === "create" ? (
          <Field
            label="Password"
            htmlFor="user-password"
            required
            hint="At least 8 characters."
          >
            <Input
              id="user-password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role" htmlFor="user-role" required>
            <Select<Role>
              id="user-role"
              value={role}
              onChange={(v) => setRole(v)}
              options={ROLES.map((r) => ({
                value: r,
                label: ROLE_LABEL[r],
              }))}
            />
          </Field>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              Account enabled
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function UsersManager() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [modal, setModal] = useState<UserModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(
    () => usersApi.list({ page, size: 20, role, search }),
    [page, role, search],
  );
  const { data, error, loading, reload } = useApi(fetcher);

  function applyFilters() {
    setPage(0);
    setSearch(searchInput);
  }

  async function handleToggleEnabled(target: User) {
    setBusy(true);
    try {
      await usersApi.setStatus(target.id, !target.enabled);
      reload();
    } catch {
      reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setBusy(true);
    try {
      await usersApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch {
      setDeleteTarget(null);
      reload();
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return <PageSpinner label="Loading users…" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Manage accounts, roles and access."
        action={
          <Button onClick={() => setModal({ mode: "create", user: null })}>
            <PlusIcon className="h-4 w-4" />
            Create user
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              <SearchInput
                placeholder="Search by name or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </form>
            <div className="overflow-x-auto">
              <SegmentedControl
                size="sm"
                ariaLabel="Filter by role"
                value={role}
                onChange={(value) => {
                  setRole(value);
                  setPage(0);
                }}
                options={ROLE_FILTERS}
              />
            </div>
          </div>

          {data && data.content.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No users found"
                description="Try a different search, or create a new user account."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.content.map((item) => {
                    const isSelf = user?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 transition-colors hover:bg-surface/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={item} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">
                                {fullName(item)}
                                {isSelf ? (
                                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                    (you)
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={ROLE_TONE[item.role]}>
                            {ROLE_LABEL[item.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-sm">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                item.enabled
                                  ? "bg-success"
                                  : "bg-muted-foreground",
                              )}
                              aria-hidden="true"
                            />
                            <span
                              className={
                                item.enabled
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {item.enabled ? "Active" : "Disabled"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <DropdownMenu
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  aria-label={`Actions for ${fullName(item)}`}
                                >
                                  <MoreHorizontalIcon className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  setModal({ mode: "edit", user: item })
                                }
                              >
                                <PencilIcon className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={busy || isSelf}
                                onClick={() => handleToggleEnabled(item)}
                              >
                                {item.enabled ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={busy || isSelf}
                                onClick={() => setDeleteTarget(item)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data && data.totalPages > 1 ? (
            <div className="px-4 py-3">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={setPage}
                disabled={loading}
              />
            </div>
          ) : null}
        </div>
      )}

      {modal ? (
        <UserFormModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget ? fullName(deleteTarget) : "user"}?`}
        description="This action cannot be undone. The account will be permanently removed."
        confirmLabel="Delete user"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
