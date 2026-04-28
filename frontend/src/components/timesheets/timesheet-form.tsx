"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useEffectEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const timesheetSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  projectId: z.string().min(1, "Project is required"),
  entryMode: z.enum(["ALLOCATED", "NON_ALLOCATED"]),
  activityId: z.string().min(1, "Activity is required"),
  workDate: z.string().min(1, "Work date is required"),
  regularHours: z.coerce.number().min(0, "Regular hours cannot be negative"),
  overtimeHours: z.coerce.number().min(0, "Overtime hours cannot be negative"),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().optional(),
}).refine((values) => values.regularHours > 0 || values.overtimeHours > 0, {
  message: "Enter regular or overtime hours greater than zero",
  path: ["regularHours"],
});

export type TimesheetFormValues = z.infer<typeof timesheetSchema>;
type TimesheetFormInput = z.input<typeof timesheetSchema>;

type SelectOption = {
  value: string;
  label: string;
};

type TimesheetFormProps = {
  onSubmit: (values: TimesheetFormValues) => Promise<void> | void;
  onCancel: () => void;
  onFilterChange?: (filters: { userId: string; projectId: string; entryMode: "ALLOCATED" | "NON_ALLOCATED" }) => void;
  initialValues?: TimesheetFormValues;
  employeeOptions: SelectOption[];
  projectOptions: SelectOption[];
  activityOptions: SelectOption[];
  activityHint?: string | null;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: TimesheetFormInput = {
  userId: "",
  projectId: "",
  entryMode: "NON_ALLOCATED",
  activityId: "",
  workDate: "",
  regularHours: 8,
  overtimeHours: 0,
  status: "SUBMITTED",
  remarks: "",
};

const statusOptions = ["DRAFT", "SUBMITTED", "APPROVED", "POSTED"] as const;

export function TimesheetForm({
  onSubmit,
  onCancel,
  onFilterChange,
  initialValues,
  employeeOptions,
  projectOptions,
  activityOptions,
  activityHint,
  submitLabel = "Save Timesheet",
  isSubmitting = false,
  error,
}: TimesheetFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TimesheetFormInput, unknown, TimesheetFormValues>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  const userId = useWatch({ control, name: "userId" });
  const projectId = useWatch({ control, name: "projectId" });
  const entryMode = useWatch({ control, name: "entryMode" });
  const selectedActivityId = useWatch({ control, name: "activityId" });
  const emitFilterChange = useEffectEvent((filters: { userId: string; projectId: string; entryMode: "ALLOCATED" | "NON_ALLOCATED" }) => {
    onFilterChange?.(filters);
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  useEffect(() => {
    emitFilterChange({ userId: userId ?? "", projectId: projectId ?? "", entryMode: entryMode ?? "ALLOCATED" });
  }, [entryMode, projectId, userId]);

  useEffect(() => {
    const activityStillExists = activityOptions.some((option) => option.value === selectedActivityId);
    if (!activityStillExists) {
      setValue("activityId", "");
    }
  }, [activityOptions, selectedActivityId, setValue]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Employee</span>
        <select {...register("userId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          <option value="">Select an employee</option>
          {employeeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.userId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Project</span>
        <select {...register("projectId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          <option value="">Select a project</option>
          {projectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.projectId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Entry Type</span>
        <select {...register("entryMode")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          <option value="ALLOCATED">Allocated Activity</option>
          <option value="NON_ALLOCATED">Non-Allocated Activity</option>
        </select>
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

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Activity</span>
        <select {...register("activityId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" disabled={!userId || !projectId}>
          <option value="">{userId && projectId ? "Select an activity" : "Select employee and project first"}</option>
          {activityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.activityId?.message}</span>
        {activityHint ? <span className="mt-2 block text-xs text-[color:var(--foreground-subtle)]">{activityHint}</span> : null}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Work Date</span>
        <input {...register("workDate")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.workDate?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Regular Hours</span>
        <input {...register("regularHours", { valueAsNumber: true })} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="number" min={0} step="0.5" />
        <span className="mt-2 block text-xs text-rose-600">{errors.regularHours?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Overtime Hours</span>
        <input {...register("overtimeHours", { valueAsNumber: true })} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="number" min={0} step="0.5" />
        <span className="mt-2 block text-xs text-rose-600">{errors.overtimeHours?.message}</span>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Remarks</span>
        <textarea {...register("remarks")} className="min-h-28 w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
      </label>

      {error ? <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-line pt-4">
        <button className="rounded-full border border-line bg-[color:var(--surface-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
