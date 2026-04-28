"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, ChevronDown, KeyRound, LogOut, UserCircle2, X } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type TopBarProps = {
  appName: string;
  userName: string;
  userRole?: string;
  avatarLabel: string;
  userEmail?: string;
  userCode?: string;
  avatarImage?: string | null;
  onProfileSave: (payload: { fullName: string; avatarImage: string | null }) => Promise<void>;
  onPasswordChange: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
  onLogout: () => void;
};

type ModalView = "profile" | "password" | null;

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function TopBar({
  appName,
  userName,
  userRole,
  avatarLabel,
  userEmail,
  userCode,
  avatarImage,
  onProfileSave,
  onPasswordChange,
  onLogout,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarImage ?? null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: userName,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    profileForm.reset({ fullName: userName });
  }, [profileForm, userName]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setActiveModal(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleProfileSubmit(values: ProfileFormValues) {
    setProfileError(null);
    setProfileFeedback(null);

    try {
      await onProfileSave({
        fullName: values.fullName,
        avatarImage: avatarPreview,
      });
      setProfileFeedback("Profile updated successfully.");
    } catch (error: unknown) {
      setProfileError(readErrorMessage(error, "Could not update your profile."));
    }
  }

  async function handlePasswordSubmit(values: PasswordFormValues) {
    setPasswordError(null);
    setPasswordFeedback(null);

    try {
      await onPasswordChange({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setPasswordFeedback("Password updated successfully.");
    } catch (error: unknown) {
      setPasswordError(readErrorMessage(error, "Could not change your password."));
    }
  }

  function openModal(view: Exclude<ModalView, null>) {
    setIsMenuOpen(false);
    setProfileError(null);
    setProfileFeedback(null);
    setPasswordError(null);
    setPasswordFeedback(null);
    if (view === "profile") {
      setAvatarPreview(avatarImage ?? null);
    }
    setActiveModal(view);
  }

  function closeModal() {
    setActiveModal(null);
    setProfileError(null);
    setProfileFeedback(null);
    setPasswordError(null);
    setPasswordFeedback(null);
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
        setProfileFeedback("Profile image selected. Save profile to store it.");
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <>
      <header className="relative z-30 overflow-visible border-b border-white/20 bg-[linear-gradient(135deg,#14324a,#1e5168_52%,#1f8aa0)] text-white backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Application</p>
            <h1 className="display-font truncate text-2xl font-semibold text-white">{appName}</h1>
          </div>

          <div className="relative z-50" ref={menuRef}>
            <button
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-left shadow-[0_12px_24px_rgba(9,25,39,0.16)] backdrop-blur transition hover:border-white/25 hover:bg-white/14"
              onClick={() => setIsMenuOpen((current) => !current)}
              type="button"
            >
              {avatarImage ? (
                <Image
                  alt={`${userName} profile`}
                  className="h-11 w-11 shrink-0 rounded-full border border-white/20 object-cover"
                  src={avatarImage}
                  height={44}
                  width={44}
                  unoptimized
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22b5c8,#127388)] text-sm font-bold text-white">
                  {avatarLabel}
                </div>
              )}
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="truncate text-xs text-white/70">{userRole ?? "Signed in user"}</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.35rem)] z-50 w-56 rounded-2xl border border-slate-200/80 bg-white/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur transition ${
                isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-[#183247]">{userName}</p>
                <p className="truncate text-xs text-slate-500">{userRole ?? "Signed in user"}</p>
              </div>
              <button
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#183247] transition hover:bg-slate-50"
                onClick={() => openModal("profile")}
                type="button"
              >
                <UserCircle2 className="h-4 w-4 text-[#138a9e]" />
                <span>My Profile</span>
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#183247] transition hover:bg-slate-50"
                onClick={() => openModal("password")}
                type="button"
              >
                <KeyRound className="h-4 w-4 text-[#138a9e]" />
                <span>Change Password</span>
              </button>
              <button
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#138a9e] transition hover:bg-[#eaf8fa]"
                onClick={onLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {activeModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <section className="w-full max-w-xl rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,249,250,0.96))] shadow-[0_28px_70px_rgba(24,50,71,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#dbe7ea] px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#138a9e]">
                  {activeModal === "profile" ? "My Profile" : "Security"}
                </p>
                <h2 className="mt-2 display-font text-2xl font-semibold text-[#183247]">
                  {activeModal === "profile" ? "View and update your profile" : "Change your password"}
                </h2>
              </div>
              <button
                aria-label="Close dialog"
                className="rounded-full border border-[color:var(--line-strong)] bg-white/90 p-3 text-[color:var(--foreground-muted)]"
                onClick={closeModal}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeModal === "profile" ? (
              <form className="space-y-5 px-5 py-5 sm:px-6 sm:py-6" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative">
                    {avatarPreview ? (
                      <Image
                        alt={`${userName} profile`}
                        className="h-24 w-24 rounded-full object-cover shadow-lg"
                        src={avatarPreview}
                        height={96}
                        width={96}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22b5c8,#127388)] text-2xl font-bold text-white shadow-lg">
                        {avatarLabel}
                      </div>
                    )}
                    <button
                      className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white text-[#138a9e] shadow-md transition hover:bg-[#eaf8fa]"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      ref={fileInputRef}
                      type="file"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      className="inline-flex rounded-full border border-[#c7d9df] bg-white px-4 py-2 text-sm font-semibold text-[#183247] transition hover:bg-slate-50"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      Upload Profile Image
                    </button>
                    {avatarPreview ? (
                      <button
                        className="ml-0 inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 sm:ml-3"
                        onClick={() => {
                          setAvatarPreview(null);
                          setProfileFeedback("Profile image removed. Save profile to store the change.");
                        }}
                        type="button"
                      >
                        Remove Image
                      </button>
                    ) : null}
                    <p className="text-xs leading-5 text-slate-500">Choose an image, then save your profile to store it in the database.</p>
                  </div>
                </div>

                {profileError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</p> : null}
                {profileFeedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileFeedback}</p> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[#183247]">Full Name</label>
                    <input
                      {...profileForm.register("fullName")}
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                      type="text"
                    />
                    <p className="mt-2 text-xs text-rose-600">{profileForm.formState.errors.fullName?.message}</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#183247]">Email</label>
                    <input className="w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-slate-500" readOnly type="email" value={userEmail ?? ""} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#183247]">Role</label>
                    <input className="w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-slate-500" readOnly type="text" value={userRole ?? ""} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#183247]">User Code</label>
                    <input className="w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-slate-500" readOnly type="text" value={userCode ?? ""} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    onClick={closeModal}
                    type="button"
                  >
                    Close
                  </button>
                  <button className="topbar-shade rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                    {profileForm.formState.isSubmitting ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            ) : null}

            {activeModal === "password" ? (
              <form className="space-y-5 px-5 py-5 sm:px-6 sm:py-6" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                {passwordError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{passwordError}</p> : null}
                {passwordFeedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordFeedback}</p> : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#183247]">Current Password</label>
                  <input
                    {...passwordForm.register("currentPassword")}
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.currentPassword?.message}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#183247]">New Password</label>
                  <input
                    {...passwordForm.register("newPassword")}
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.newPassword?.message}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#183247]">Confirm New Password</label>
                  <input
                    {...passwordForm.register("confirmPassword")}
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.confirmPassword?.message}</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                    onClick={closeModal}
                    type="button"
                  >
                    Close
                  </button>
                  <button className="topbar-shade rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                    {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function readErrorMessage(error: unknown, fallback: string) {
  return typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
    ? String((error.response.data as { message: string }).message)
    : fallback;
}
