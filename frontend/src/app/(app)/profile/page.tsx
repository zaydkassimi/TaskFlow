"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usersApi } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/errors";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { fullName } from "@/lib/format";

export default function ProfilePage() {
  const { user, refresh } = useAuth();

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
      <PageHeader title="Profile" description="Manage your personal information." />

      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <Avatar user={user} size="lg" />
        <div>
          <p className="text-lg font-semibold text-foreground">
            {fullName(user)}
          </p>
          <p className="text-sm capitalize text-muted-foreground">
            {user?.role.toLowerCase() ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Update your name and contact email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              {profileError ? <Alert tone="danger">{profileError}</Alert> : null}
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
              <Button type="submit" disabled={savingProfile} className="self-start">
                {savingProfile ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use at least 8 characters with a mix of letters, numbers and symbols.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {passwordError ? <Alert tone="danger">{passwordError}</Alert> : null}
              {passwordSaved ? (
                <Alert tone="success">Password updated successfully.</Alert>
              ) : null}
              <Field label="Current password" htmlFor="currentPassword" required>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="New password" htmlFor="newPassword" required>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm new password" htmlFor="confirmPassword" required>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" disabled={savingPassword} className="self-start">
                {savingPassword ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}