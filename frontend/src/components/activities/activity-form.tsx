"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const activitySchema = z.object({
  activityCode: z.string().min(1, "Activity code is required"),
  activityName: z.string().min(2, "Activity name is required"),
  wbsId: z.string().min(1, "WBS is required"),
  plannedStart: z.string().min(1, "Start date is required"),
  plannedEnd: z.string().min(1, "Finish date is required"),
  durationDays: z.coerce.number().int().min(1, "Duration must be at least 1 day"),
  progressPercent: z.coerce.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100"),
  status: z.string().min(1, "Status is required"),
  responsibleUser: z.string().min(2, "Responsible user is required"),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
type ActivityFormInput = z.input<typeof activitySchema>;

type ActivityFormProps = {
  onSubmit: (values: ActivityFormValues) => Promise<void> | void;
  onCancel: () => void;
  wbsOptions: Array<{ id: string; label: string }>;
  initialValues?: ActivityFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: ActivityFormInput = {
  activityCode: "",
  activityName: "",
  wbsId: "",
  plannedStart: "",
  plannedEnd: "",
  durationDays: 1,
  progressPercent: 0,
  status: "Not Started",
  responsibleUser: "",
};

const statusOptions = ["Not Started", "In Progress", "Delayed", "Completed"] as const;

export function ActivityForm({
  onSubmit,
  onCancel,
  wbsOptions,
  initialValues,
  submitLabel = "Save Activity",
  isSubmitting = false,
  error,
}: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityFormInput, unknown, ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Activity Code</span>
        <input {...register("activityCode")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.activityCode?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Activity Name</span>
        <input {...register("activityName")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.activityName?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">WBS</span>
        <select {...register("wbsId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          <option value="">Select WBS</option>
          {wbsOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.wbsId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
        <select {...register("status")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.status?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Planned Start</span>
        <input {...register("plannedStart")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.plannedStart?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Planned Finish</span>
        <input {...register("plannedEnd")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.plannedEnd?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Duration (Days)</span>
        <input {...register("durationDays", { valueAsNumber: true })} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" min={1} type="number" />
        <span className="mt-2 block text-xs text-rose-600">{errors.durationDays?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Progress %</span>
        <input
          {...register("progressPercent", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
          max={100}
          min={0}
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.progressPercent?.message}</span>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Responsible User</span>
        <input {...register("responsibleUser")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.responsibleUser?.message}</span>
      </label>

      {error ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
        <button
          className="rounded-full border border-line bg-[color:var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
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
