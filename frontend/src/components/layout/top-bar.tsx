"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Camera, ChevronDown, KeyRound, LogOut, Palette, SunMedium, MoonStar, UserCircle2, X } from "lucide-react";
import {
  applyThemeSettings,
  DEFAULT_ACCENT_COLOR,
  getStoredAccentColor,
  getStoredThemeMode,
  THEME_ACCENT_PRESETS,
  type ThemeMode,
} from "@/lib/theme";

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
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredThemeMode());
  const [accentColor, setAccentColor] = useState(() => getStoredAccentColor());
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarImage ?? null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themePanelRef = useRef<HTMLDivElement | null>(null);
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
      if (!themePanelRef.current?.contains(event.target as Node)) {
        setIsThemePanelOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsThemePanelOpen(false);
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

  useEffect(() => {
    applyThemeSettings(theme, accentColor, false);
  }, [accentColor, theme]);

  function updateTheme(nextTheme: ThemeMode, nextAccentColor = accentColor) {
    setTheme(nextTheme);
    setAccentColor(nextAccentColor);
    applyThemeSettings(nextTheme, nextAccentColor);
  }

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
      <header
        className="topbar-shade relative z-30 overflow-visible border-b text-white backdrop-blur-xl"
        style={{ borderColor: "var(--topbar-border)" }}
      >
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Application</p>
            <h1 className="display-font truncate text-2xl font-semibold text-white">{appName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative z-50" ref={themePanelRef}>
              <button
                aria-label="Open theme settings"
                className="topbar-button inline-flex h-12 items-center gap-2 rounded-2xl px-3 text-sm font-semibold backdrop-blur transition hover:brightness-110"
                onClick={() => setIsThemePanelOpen((current) => !current)}
                type="button"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              <div
                className={`topbar-panel absolute right-0 top-[calc(100%+0.35rem)] w-[18rem] rounded-[24px] p-4 backdrop-blur transition ${
                  isThemePanelOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Appearance</p>
                  <h3 className="mt-2 display-font text-lg font-semibold text-brand-strong">Theme settings</h3>
                  <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
                    Pick a mode and accent color that stays readable across pages.
                  </p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                      theme === "light" ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => updateTheme("light")}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <SunMedium className="h-4 w-4" />
                      Light
                    </span>
                  </button>
                  <button
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                      theme === "dark" ? "btn-primary" : "btn-secondary"
                    }`}
                    onClick={() => updateTheme("dark")}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MoonStar className="h-4 w-4" />
                      Dark
                    </span>
                  </button>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-brand-strong">Accent color</p>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--foreground-muted)]">
                      <span>Custom</span>
                      <input
                        aria-label="Choose custom accent color"
                        className="h-10 w-10 cursor-pointer rounded-xl border border-[color:var(--line-strong)]"
                        onChange={(event) => updateTheme(theme, event.target.value || DEFAULT_ACCENT_COLOR)}
                        type="color"
                        value={accentColor}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {THEME_ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                          accentColor === preset.value ? "pill-brand" : "btn-secondary"
                        }`}
                        onClick={() => updateTheme(theme, preset.value)}
                        type="button"
                      >
                        <span className="mb-2 flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-white/50"
                            style={{ backgroundColor: preset.value }}
                          />
                          {preset.label}
                        </span>
                        <span className="block text-xs font-medium text-[color:var(--foreground-muted)]">{preset.value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-50" ref={menuRef}>
              <button
                className="topbar-button flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 text-left backdrop-blur transition hover:brightness-110"
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full topbar-shade text-sm font-bold text-white">
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
                className={`topbar-panel absolute right-0 top-[calc(100%+0.35rem)] z-50 w-56 rounded-2xl p-2 backdrop-blur transition ${
                  isMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
                }`}
              >
                <div className="border-b border-line px-3 py-2">
                  <p className="truncate text-sm font-semibold text-brand-strong">{userName}</p>
                  <p className="truncate text-xs text-[color:var(--foreground-muted)]">{userRole ?? "Signed in user"}</p>
                </div>
                <button
                  className="topbar-panel-item mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
                  onClick={() => openModal("profile")}
                  type="button"
                >
                  <UserCircle2 className="h-4 w-4 text-brand" />
                  <span>My Profile</span>
                </button>
                <button
                  className="topbar-panel-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
                  onClick={() => openModal("password")}
                  type="button"
                >
                  <KeyRound className="h-4 w-4 text-brand" />
                  <span>Change Password</span>
                </button>
                <button
                  className="topbar-panel-item topbar-panel-item-brand mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition"
                  onClick={onLogout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {activeModal ? (
        <div className="overlay-scrim fixed inset-0 z-[90] flex items-center justify-center px-4 py-6">
          <section className="app-dialog w-full max-w-xl rounded-[30px]">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  {activeModal === "profile" ? "My Profile" : "Security"}
                </p>
                <h2 className="mt-2 display-font text-2xl font-semibold text-brand-strong">
                  {activeModal === "profile" ? "View and update your profile" : "Change your password"}
                </h2>
              </div>
              <button
                aria-label="Close dialog"
                className="btn-secondary rounded-full p-3 text-[color:var(--foreground-muted)]"
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
                      <div className="topbar-shade flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg">
                        {avatarLabel}
                      </div>
                    )}
                    <button
                      className="btn-secondary absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-brand shadow-md transition hover:bg-[color:var(--brand-soft)]"
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
                      className="btn-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-[color:var(--surface-muted)]"
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
                    <p className="text-xs leading-5 text-[color:var(--foreground-muted)]">
                      Choose an image, then save your profile to store it in the database.
                    </p>
                  </div>
                </div>

                {profileError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</p> : null}
                {profileFeedback ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileFeedback}</p> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-brand-strong">Full Name</label>
                    <input
                      {...profileForm.register("fullName")}
                      className="field w-full rounded-2xl px-4 py-3"
                      type="text"
                    />
                    <p className="mt-2 text-xs text-rose-600">{profileForm.formState.errors.fullName?.message}</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-strong">Email</label>
                    <input className="field field-readonly w-full rounded-2xl px-4 py-3" readOnly type="email" value={userEmail ?? ""} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-strong">Role</label>
                    <input className="field field-readonly w-full rounded-2xl px-4 py-3" readOnly type="text" value={userRole ?? ""} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-brand-strong">User Code</label>
                    <input className="field field-readonly w-full rounded-2xl px-4 py-3" readOnly type="text" value={userCode ?? ""} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold"
                    onClick={closeModal}
                    type="button"
                  >
                    Close
                  </button>
                  <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">
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
                  <label className="mb-2 block text-sm font-semibold text-brand-strong">Current Password</label>
                  <input
                    {...passwordForm.register("currentPassword")}
                    className="field w-full rounded-2xl px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.currentPassword?.message}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-strong">New Password</label>
                  <input
                    {...passwordForm.register("newPassword")}
                    className="field w-full rounded-2xl px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.newPassword?.message}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-brand-strong">Confirm New Password</label>
                  <input
                    {...passwordForm.register("confirmPassword")}
                    className="field w-full rounded-2xl px-4 py-3"
                    type="password"
                  />
                  <p className="mt-2 text-xs text-rose-600">{passwordForm.formState.errors.confirmPassword?.message}</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    className="btn-secondary rounded-full px-5 py-3 text-sm font-semibold"
                    onClick={closeModal}
                    type="button"
                  >
                    Close
                  </button>
                  <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">
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
