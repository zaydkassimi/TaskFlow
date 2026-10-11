"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usersApi } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/errors";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { fullName, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LockIcon, ShieldIcon, UserIcon } from "@/components/icons";

const ROLE_TONE = {
  ADMIN: "primary",
  MANAGER: "success",
  MEMBER: "neutral",
} as const;

type Tab = "profile" | "security" | "account";

const TABS: { value: Tab; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "security", label: "Security", icon: LockIcon },
  { value: "account", label: "Account details", icon: ShieldIcon },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await usersApi.updateMe({ firstName, lastName, email });
      await refresh();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, security and account details."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_1fr] lg:items-start">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 lg:flex-col lg:items-start">
            <Avatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {fullName(user)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
              {user?.role ? (
                <Badge tone={ROLE_TONE[user.role]} className="mt-2">
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </Badge>
              ) : null}
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-1.5">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTab(item.value)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary-strong"
                      : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-6">
          {tab === "profile" ? (
            <Section
              title="Personal information"
              description="Update your name and contact email."
            >
              <form
                onSubmit={handleUpdateProfile}
                className="flex max-w-lg flex-col gap-4"
              >
                {profileError ? (
                  <Alert tone="danger">{profileError}</Alert>
                ) : null}
                {profileSaved ? (
                  <Alert tone="success">Profile updated successfully.</Alert>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" htmlFor="profile-firstName" required>
                    <Input
                      id="profile-firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Last name" htmlFor="profile-lastName" required>
                    <Input
                      id="profile-lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <Field label="Email" htmlFor="profile-email" required>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="self-start"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </Section>
          ) : null}

          {tab === "security" ? (
            <Section
              title="Password"
              description="Use at least 8 characters with a mix of letters, numbers and symbols."
            >
              <form
                onSubmit={handleChangePassword}
                className="flex max-w-lg flex-col gap-4"
              >
                {passwordError ? (
                  <Alert tone="danger">{passwordError}</Alert>
                ) : null}
                {passwordSaved ? (
                  <Alert tone="success">Password updated successfully.</Alert>
                ) : null}
                <Field label="Current password" htmlFor="currentPassword" required>
                  <PasswordInput
                    id="currentPassword"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field label="New password" htmlFor="newPassword" required>
                  <PasswordInput
                    id="newPassword"
                    autoComplete="new-password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field
                  label="Confirm new password"
                  htmlFor="confirmPassword"
                  required
                >
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="self-start"
                >
                  {savingPassword ? "Updating…" : "Update password"}
                </Button>
              </form>
            </Section>
          ) : null}

          {tab === "account" ? (
            <Section
              title="Account details"
              description="Read-only information about your account."
            >
              <div className="flex max-w-lg flex-col divide-y divide-border">
                <DetailRow label="Full name" value={fullName(user)} />
                <DetailRow label="Email" value={user?.email ?? "—"} />
                <DetailRow
                  label="Role"
                  value={
                    user?.role
                      ? user.role.charAt(0) +
                        user.role.slice(1).toLowerCase()
                      : "—"
                  }
                />
                <DetailRow
                  label="Account status"
                  value={user?.enabled ? "Active" : "Disabled"}
                />
                <DetailRow
                  label="Member since"
                  value={formatDate(user?.createdAt)}
                />
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
