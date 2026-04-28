"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { UserForm, type UserFormValues } from "@/components/users/user-form";
import { useIsClient } from "@/hooks/use-is-client";
import { userApi } from "@/lib/api";
import type { UserRecord, UserResetCodeRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function extractApiError(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  if (typeof data?.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  if (Array.isArray(data?.errors) && typeof data.errors[0]?.defaultMessage === "string") {
    return data.errors[0].defaultMessage;
  }

  return fallbackMessage;
}

function formatRole(roleName: string) {
  return roleName
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No reset code generated yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function UsersPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isResetCodeModalOpen, setIsResetCodeModalOpen] = useState(false);
  const [isLoadingResetCode, setIsLoadingResetCode] = useState(false);
  const [resetCodeError, setResetCodeError] = useState<string | null>(null);
  const [selectedResetCode, setSelectedResetCode] = useState<UserResetCodeRecord | null>(null);

  async function loadUsers() {
    const response = await userApi.getUsers();
    setUsers(
      (response.data.data as Array<Omit<UserRecord, "id"> & { id: number | string }>).map((user) => ({
        ...user,
        id: String(user.id),
      })),
    );
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    async function fetchUsers() {
      try {
        setIsLoading(true);
        const response = await userApi.getUsers();
        if (cancelled) {
          return;
        }

        setUsers(
          (response.data.data as Array<Omit<UserRecord, "id"> & { id: number | string }>).map((user) => ({
            ...user,
            id: String(user.id),
          })),
        );
        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(extractApiError(error, "Users could not be loaded from the database."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  async function handleSave(values: UserFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);

      if (!editingUser && (!values.password || values.password.trim().length === 0)) {
        setFormError("Password is required for a new user.");
        return;
      }

      const payload = {
        fullName: values.fullName,
        email: values.email,
        roleName: values.roleName,
        active: values.active,
        emailVerified: values.emailVerified,
        avatarImage: values.avatarImage ?? null,
        ...(values.password && values.password.trim().length > 0 ? { password: values.password } : {}),
      };

      if (editingUser) {
        await userApi.updateUser(editingUser.id, payload);
      } else {
        await userApi.createUser({
          ...payload,
          password: values.password ?? "",
        });
      }

      setIsModalOpen(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "User could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingUser(null);
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRecord) {
    setFormError(null);
    setEditingUser(user);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingUser(null);
    setIsModalOpen(false);
  }

  async function openResetCodeModal(user: UserRecord) {
    try {
      setIsLoadingResetCode(true);
      setResetCodeError(null);
      setIsResetCodeModalOpen(true);

      const response = await userApi.getLatestResetCode(user.id);
      const data = response.data.data as Omit<UserResetCodeRecord, "userId"> & { userId: number | string };
      setSelectedResetCode({
        ...data,
        userId: String(data.userId),
      });
    } catch (error: unknown) {
      setSelectedResetCode(null);
      setResetCodeError(extractApiError(error, "Reset code could not be loaded."));
    } finally {
      setIsLoadingResetCode(false);
    }
  }

  function closeResetCodeModal() {
    setIsResetCodeModalOpen(false);
    setResetCodeError(null);
    setSelectedResetCode(null);
  }

  return (
    <AppShell
      title="User management"
      subtitle="Manage application users, maintain role assignments, and inspect the latest password reset code from one operational screen."
    >
      <SectionCard
        title="User directory"
        eyebrow="Administration"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={openCreateModal}
            type="button"
          >
            Add User
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading users...</div>
        ) : (
          <DataTable
            rows={users}
            columns={[
              {
                key: "avatarImage",
                header: "Image",
                render: (row) =>
                  row.avatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`${row.fullName} avatar`}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-[color:var(--line-strong)]"
                      src={row.avatarImage}
                    />
                  ) : (
                    <div className="topbar-shade flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white">
                      {row.fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase() || "US"}
                    </div>
                  ),
              },
              { key: "userCode", header: "User Code" },
              { key: "fullName", header: "Full Name" },
              { key: "email", header: "Email" },
              {
                key: "roleName",
                header: "Role",
                render: (row) => formatRole(row.roleName),
              },
              {
                key: "active",
                header: "Status",
                render: (row) => (
                  <span className="rounded-full bg-[color:var(--surface-raised)] px-3 py-1 text-xs font-semibold">
                    {row.active ? "Active" : "Inactive"}
                  </span>
                ),
              },
              {
                key: "emailVerified",
                header: "Email",
                render: (row) => (
                  <span className="rounded-full bg-[color:var(--surface-raised)] px-3 py-1 text-xs font-semibold">
                    {row.emailVerified ? "Verified" : "Pending"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => openEditModal(row)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => void openResetCodeModal(row)}
                      type="button"
                    >
                      View Reset Code
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingUser ? "Edit User" : "New User"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingUser ? editingUser.fullName : "Create a new system user"}
        widthClassName="sm:max-w-3xl"
      >
            <UserForm
              error={formError}
              initialValues={
                editingUser
                  ? {
                      fullName: editingUser.fullName,
                      email: editingUser.email,
                      password: "",
                      roleName: editingUser.roleName,
                      active: editingUser.active,
                      emailVerified: editingUser.emailVerified,
                      avatarImage: editingUser.avatarImage ?? null,
                    }
                  : undefined
              }
              isEditing={Boolean(editingUser)}
              isSubmitting={isSaving}
              onCancel={closeModal}
              onSubmit={handleSave}
              submitLabel={editingUser ? "Update User" : "Create User"}
            />
      </SidebarDrawer>

      <SidebarDrawer
        eyebrow="Reset Code"
        onClose={closeResetCodeModal}
        open={isResetCodeModalOpen}
        title={selectedResetCode?.fullName ?? "Password reset code"}
        widthClassName="sm:max-w-2xl"
      >
            {isLoadingResetCode ? (
              <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading reset code...</div>
            ) : resetCodeError ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{resetCodeError}</p>
            ) : selectedResetCode ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-[color:var(--surface-glass)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">User</p>
                    <p className="mt-2 text-sm font-semibold text-brand-strong">{selectedResetCode.userCode}</p>
                    <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">{selectedResetCode.email}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-[color:var(--surface-glass)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">Expiry</p>
                    <p className="mt-2 text-sm font-semibold text-brand-strong">{formatTimestamp(selectedResetCode.expiresAt)}</p>
                    <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                      {selectedResetCode.consumed === null ? "No code status available" : selectedResetCode.consumed ? "Consumed" : "Not consumed"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-[color:var(--surface-glass)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">Latest Reset Code</p>
                  <p className="mt-3 font-mono text-3xl font-semibold tracking-[0.35em] text-brand-strong">
                    {selectedResetCode.available ? selectedResetCode.resetCode : "N/A"}
                  </p>
                  {!selectedResetCode.available ? (
                    <p className="mt-3 text-sm text-[color:var(--foreground-muted)]">No password reset code has been generated for this user yet.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
      </SidebarDrawer>
    </AppShell>
  );
}
