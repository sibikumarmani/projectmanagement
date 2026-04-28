"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const verifySchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().regex(/^\d{6}$/, "Reset code must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type VerifyFormValues = z.infer<typeof verifySchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type AuthView = "login" | "register" | "verify" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, hasHydrated, setAuth } = useAppStore();
  const [view, setView] = useState<AuthView>("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, hasHydrated, router]);

  function resetMessages() {
    setServerError(null);
    setServerSuccess(null);
  }

  function openVerifyView(email: string, message?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    setPendingEmail(normalizedEmail);
    verifyForm.setValue("email", normalizedEmail);
    verifyForm.setValue("code", "");
    setView("verify");
    if (message) {
      setServerSuccess(message);
    }
  }

  function openForgotPasswordView(email = "", message?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    forgotPasswordForm.setValue("email", normalizedEmail);
    forgotPasswordForm.setValue("code", "");
    forgotPasswordForm.setValue("newPassword", "");
    forgotPasswordForm.setValue("confirmPassword", "");
    setView("forgot");
    if (message) {
      setServerSuccess(message);
    }
  }

  async function handleResendVerificationCode() {
    const email = verifyForm.getValues("email").trim().toLowerCase();
    await resendVerificationCode(email, "Enter your registered email to resend the verification code.");
  }

  async function resendVerificationCode(email: string, emptyEmailMessage: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setServerError(emptyEmailMessage);
      return;
    }

    resetMessages();
    setIsResendingCode(true);
    try {
      const response = await authApi.resendVerificationCode({ email: normalizedEmail });
      const dispatch = response.data.data;
      openVerifyView(dispatch.email, dispatch.message);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data
          ? String((error.response.data as { message: string }).message)
          : "Could not resend the verification code.";
      setServerError(message);
    } finally {
      setIsResendingCode(false);
    }
  }

  async function routeUnverifiedUser(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    try {
      const response = await authApi.verificationStatus({ email: normalizedEmail });
      const status = response.data.data;
      if (status.registered && !status.emailVerified) {
        openVerifyView(
          normalizedEmail,
          "Your email is not verified yet. Enter your verification code below, or regenerate a new code if needed.",
        );
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="app-dialog w-full max-w-5xl overflow-hidden rounded-none">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="topbar-shade px-8 py-10 text-white">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Secure Access</p>
            <h1 className="display-font text-4xl font-semibold">PMS Login</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
              Register with a unique user code, verify your email with a one-time code, and then access planning,
              milestone, and cost-control modules.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { key: "register", label: "1. Register", desc: "Create your account with a unique user ID and email." },
                ...(pendingEmail
                  ? [{ key: "verify", label: "2. Verify", desc: "Enter the 6-digit code sent to your email inbox." }]
                  : []),
                { key: "login", label: pendingEmail ? "3. Sign in" : "2. Sign in", desc: "Login after verification and start using the application." },
              ].map((step) => (
                <button
                  key={step.key}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    view === step.key
                      ? "border-white/40 bg-white/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => {
                    resetMessages();
                    setView(step.key as AuthView);
                    if (step.key === "verify") {
                      verifyForm.setValue("email", pendingEmail);
                      verifyForm.setValue("code", "");
                    }
                  }}
                  type="button"
                >
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="mt-1 text-sm text-white/70">{step.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="page-surface px-8 py-10">
            <div className="mb-6 flex gap-2 rounded-full bg-[color:var(--brand-tint)] p-1 text-sm font-semibold text-[color:var(--foreground-muted)]">
              {(["login", "register", ...(pendingEmail ? ["verify"] : []), ...(view === "forgot" ? ["forgot"] : [])] as AuthView[]).map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-4 py-2 transition ${
                    view === tab ? "topbar-shade text-white" : "text-[color:var(--foreground-muted)]"
                  }`}
                  onClick={() => {
                    resetMessages();
                    setView(tab);
                    if (tab === "verify") {
                      verifyForm.setValue("email", pendingEmail);
                      verifyForm.setValue("code", "");
                    }
                  }}
                  type="button"
                >
                  {tab === "login" ? "Sign In" : tab === "register" ? "Register" : tab === "verify" ? "Verify Email" : "Forgot Password"}
                </button>
              ))}
            </div>

            {serverError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{serverError}</p> : null}
            {serverSuccess ? <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{serverSuccess}</p> : null}

            {view === "login" ? (
              <form
                className="space-y-4"
                onSubmit={loginForm.handleSubmit(async (values) => {
                  resetMessages();
                  try {
                    const response = await authApi.login(values);
                    const auth = response.data.data;
                    setAuth({
                      accessToken: auth.accessToken,
                      refreshToken: auth.refreshToken,
                      user: auth.user,
                    });
                    router.replace("/dashboard");
                  } catch (error: unknown) {
                    if (await routeUnverifiedUser(values.email)) {
                      return;
                    }

                    const message =
                      typeof error === "object" &&
                      error !== null &&
                      "response" in error &&
                      typeof error.response === "object" &&
                      error.response !== null &&
                      "data" in error.response &&
                      typeof error.response.data === "object" &&
                      error.response.data !== null &&
                      "message" in error.response.data
                        ? String((error.response.data as { message: string }).message)
                        : "Login failed. Check your credentials and backend status.";
                    if (message === "Email is not verified") {
                      await routeUnverifiedUser(values.email);
                      return;
                    }
                    setServerError(message);
                  }
                })}
              >
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3" placeholder="Email" {...loginForm.register("email")} />
                <p className="-mt-2 text-xs text-rose-600">{loginForm.formState.errors.email?.message}</p>
                <input
                  className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3"
                  placeholder="Password"
                  type="password"
                  {...loginForm.register("password")}
                />
                <p className="-mt-2 text-xs text-rose-600">{loginForm.formState.errors.password?.message}</p>
                <button className="topbar-shade w-full rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                  {loginForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
                </button>
                <button
                  className="w-full rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                  onClick={() => openForgotPasswordView(loginForm.getValues("email"))}
                  type="button"
                >
                  Forgot Password
                </button>
              </form>
            ) : null}

            {view === "register" ? (
              <form
                className="space-y-4"
                onSubmit={registerForm.handleSubmit(async (values) => {
                  resetMessages();
                  try {
                    const response = await authApi.register(values);
                    const registration = response.data.data;
                    openVerifyView(
                      registration.email,
                      `${registration.message} User ID ${registration.userCode} has been reserved for this account.`,
                    );
                  } catch (error: unknown) {
                    const message =
                      typeof error === "object" &&
                      error !== null &&
                      "response" in error &&
                      typeof error.response === "object" &&
                      error.response !== null &&
                      "data" in error.response &&
                      typeof error.response.data === "object" &&
                      error.response.data !== null &&
                      "message" in error.response.data
                        ? String((error.response.data as { message: string }).message)
                        : "Registration failed.";
                    setServerError(message);
                  }
                })}
              >
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3" placeholder="Full name" {...registerForm.register("fullName")} />
                <p className="-mt-2 text-xs text-rose-600">{registerForm.formState.errors.fullName?.message}</p>
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3" placeholder="Email" {...registerForm.register("email")} />
                <p className="-mt-2 text-xs text-rose-600">{registerForm.formState.errors.email?.message}</p>
                <input
                  className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3"
                  placeholder="Password"
                  type="password"
                  {...registerForm.register("password")}
                />
                <p className="-mt-2 text-xs text-rose-600">{registerForm.formState.errors.password?.message}</p>
                <input
                  className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3"
                  placeholder="Confirm password"
                  type="password"
                  {...registerForm.register("confirmPassword")}
                />
                <p className="-mt-2 text-xs text-rose-600">{registerForm.formState.errors.confirmPassword?.message}</p>
                <button className="topbar-shade w-full rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                  {registerForm.formState.isSubmitting ? "Creating Account..." : "Register"}
                </button>
              </form>
            ) : null}

            {view === "verify" ? (
              <form
                className="space-y-4"
                onSubmit={verifyForm.handleSubmit(async (values) => {
                  resetMessages();
                  try {
                    const response = await authApi.verifyEmail(values);
                    const auth = response.data.data;
                    setAuth({
                      accessToken: auth.accessToken,
                      refreshToken: auth.refreshToken,
                      user: auth.user,
                    });
                    router.replace("/dashboard");
                  } catch (error: unknown) {
                    const message =
                      typeof error === "object" &&
                      error !== null &&
                      "response" in error &&
                      typeof error.response === "object" &&
                      error.response !== null &&
                      "data" in error.response &&
                      typeof error.response.data === "object" &&
                      error.response.data !== null &&
                      "message" in error.response.data
                        ? String((error.response.data as { message: string }).message)
                        : "Email verification failed.";
                    setServerError(message);
                  }
                })}
              >
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3" placeholder="Email" {...verifyForm.register("email")} />
                <p className="-mt-2 text-xs text-rose-600">{verifyForm.formState.errors.email?.message}</p>
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3 tracking-[0.35em]" placeholder="123456" {...verifyForm.register("code")} />
                <p className="-mt-2 text-xs text-rose-600">{verifyForm.formState.errors.code?.message}</p>
                <button className="topbar-shade w-full rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                  {verifyForm.formState.isSubmitting ? "Verifying..." : "Verify Email"}
                </button>
                <button
                  className="w-full rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                  onClick={() => void handleResendVerificationCode()}
                  type="button"
                >
                  {isResendingCode ? "Resending Code..." : "Regenerate Verification Code"}
                </button>
              </form>
            ) : null}

            {view === "forgot" ? (
              <form
                className="space-y-4"
                onSubmit={forgotPasswordForm.handleSubmit(async (values) => {
                  resetMessages();
                  try {
                    const response = await authApi.resetPassword(values);
                    const result = response.data.data;
                    loginForm.setValue("email", values.email);
                    loginForm.setValue("password", values.newPassword);
                    setView("login");
                    setServerSuccess(result.message);
                  } catch (error: unknown) {
                    const message =
                      typeof error === "object" &&
                      error !== null &&
                      "response" in error &&
                      typeof error.response === "object" &&
                      error.response !== null &&
                      "data" in error.response &&
                      typeof error.response.data === "object" &&
                      error.response.data !== null &&
                      "message" in error.response.data
                        ? String((error.response.data as { message: string }).message)
                        : "Password reset failed.";
                    setServerError(message);
                  }
                })}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                  <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3" placeholder="Email" {...forgotPasswordForm.register("email")} />
                  <button
                    className="rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                    onClick={async () => {
                      const email = forgotPasswordForm.getValues("email").trim().toLowerCase();
                      if (!email) {
                        setServerError("Enter your registered email to receive a reset code.");
                        return;
                      }

                      resetMessages();
                      setIsSendingResetCode(true);
                      try {
                        const response = await authApi.forgotPassword({ email });
                        const result = response.data.data;
                        forgotPasswordForm.setValue("email", result.email);
                        setServerSuccess(result.message);
                      } catch (error: unknown) {
                        const message =
                          typeof error === "object" &&
                          error !== null &&
                          "response" in error &&
                          typeof error.response === "object" &&
                          error.response !== null &&
                          "data" in error.response &&
                          typeof error.response.data === "object" &&
                          error.response.data !== null &&
                          "message" in error.response.data
                            ? String((error.response.data as { message: string }).message)
                            : "Could not send reset code.";
                        setServerError(message);
                      } finally {
                        setIsSendingResetCode(false);
                      }
                    }}
                    type="button"
                  >
                    {isSendingResetCode ? "Sending..." : "Send Reset Code"}
                  </button>
                </div>
                <p className="-mt-2 text-xs text-rose-600">{forgotPasswordForm.formState.errors.email?.message}</p>
                <input className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3 tracking-[0.35em]" placeholder="123456" {...forgotPasswordForm.register("code")} />
                <p className="-mt-2 text-xs text-rose-600">{forgotPasswordForm.formState.errors.code?.message}</p>
                <input
                  className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3"
                  placeholder="New password"
                  type="password"
                  {...forgotPasswordForm.register("newPassword")}
                />
                <p className="-mt-2 text-xs text-rose-600">{forgotPasswordForm.formState.errors.newPassword?.message}</p>
                <input
                  className="w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-4 py-3"
                  placeholder="Confirm password"
                  type="password"
                  {...forgotPasswordForm.register("confirmPassword")}
                />
                <p className="-mt-2 text-xs text-rose-600">{forgotPasswordForm.formState.errors.confirmPassword?.message}</p>
                <button className="topbar-shade w-full rounded-full px-5 py-3 text-sm font-semibold text-white" type="submit">
                  {forgotPasswordForm.formState.isSubmitting ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
