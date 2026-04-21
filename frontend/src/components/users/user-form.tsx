"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const userSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().trim().optional(),
  roleName: z.string().min(2, "Role is required"),
  active: z.boolean(),
  emailVerified: z.boolean(),
}).superRefine((values, context) => {
  if (values.password && values.password.length > 0 && values.password.length < 8) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 8 characters",
      path: ["password"],
    });
  }
});

export type UserFormValues = z.infer<typeof userSchema>;
type UserFormInput = z.input<typeof userSchema>;

type UserFormProps = {
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel: () => void;
  initialValues?: UserFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  isEditing?: boolean;
};

const defaultValues: UserFormInput = {
  fullName: "",
  email: "",
  password: "",
  roleName: "USER",
  active: true,
  emailVerified: true,
};

const roleOptions = ["ADMIN", "PROJECT_MANAGER", "PLANNING_ENGINEER", "SITE_ENGINEER", "COST_CONTROLLER", "FINANCE_USER", "MANAGEMENT_VIEWER", "USER"];

export function UserForm({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save",
  isSubmitting = false,
  error,
  isEditing = false,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Full Name</span>
        <input {...register("fullName")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" type="text" />
        <span className="mt-2 block text-xs text-rose-600">{errors.fullName?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Email</span>
        <input {...register("email")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" type="email" />
        <span className="mt-2 block text-xs text-rose-600">{errors.email?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">{isEditing ? "New Password (Optional)" : "Password"}</span>
        <input
          {...register("password")}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
          placeholder={isEditing ? "Leave blank to keep the current password" : "Minimum 8 characters"}
          type="password"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.password?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Role</span>
        <select {...register("roleName")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0">
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.roleName?.message}</span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3">
        <input {...register("active")} className="h-4 w-4" type="checkbox" />
        <span className="text-sm font-semibold text-brand-strong">Active user</span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3">
        <input {...register("emailVerified")} className="h-4 w-4" type="checkbox" />
        <span className="text-sm font-semibold text-brand-strong">Email verified</span>
      </label>

      {error ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
        <button
          className="rounded-full border border-line bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
