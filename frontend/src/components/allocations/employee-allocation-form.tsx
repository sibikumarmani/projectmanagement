"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const allocationSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  projectId: z.string().min(1, "Project is required"),
  activityId: z.string().min(1, "Activity is required"),
  allocationDate: z.string().min(1, "Allocation date is required"),
  allocationPercentage: z.coerce.number().int().min(1, "Allocation % must be between 1 and 100").max(100, "Allocation % must be between 1 and 100"),
  active: z.boolean(),
  remarks: z.string().optional(),
});

export type EmployeeAllocationFormValues = z.infer<typeof allocationSchema>;
type EmployeeAllocationFormInput = z.input<typeof allocationSchema>;

type SelectOption = {
  value: string;
  label: string;
};

type EmployeeAllocationFormProps = {
  onSubmit: (values: EmployeeAllocationFormValues) => Promise<void> | void;
  onCancel: () => void;
  onProjectChange?: (projectId: string) => void;
  initialValues?: EmployeeAllocationFormValues;
  employeeOptions: SelectOption[];
  projectOptions: SelectOption[];
  activityOptions: SelectOption[];
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: EmployeeAllocationFormInput = {
  userId: "",
  projectId: "",
  activityId: "",
  allocationDate: "",
  allocationPercentage: 100,
  active: true,
  remarks: "",
};

export function EmployeeAllocationForm({
  onSubmit,
  onCancel,
  onProjectChange,
  initialValues,
  employeeOptions,
  projectOptions,
  activityOptions,
  submitLabel = "Save Allocation",
  isSubmitting = false,
  error,
}: EmployeeAllocationFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmployeeAllocationFormInput, unknown, EmployeeAllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  const selectedProjectId = useWatch({ control, name: "projectId" });
  const selectedActivityId = useWatch({ control, name: "activityId" });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

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
        <select
          {...register("projectId", {
            onChange: (event) => {
              onProjectChange?.(event.target.value);
            },
          })}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
        >
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
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Activity</span>
        <select {...register("activityId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" disabled={!selectedProjectId}>
          <option value="">{selectedProjectId ? "Select an activity" : "Select a project first"}</option>
          {activityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.activityId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Allocation Date</span>
        <input {...register("allocationDate")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.allocationDate?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Allocation %</span>
        <input {...register("allocationPercentage", { valueAsNumber: true })} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="number" min={1} max={100} />
        <span className="mt-2 block text-xs text-rose-600">{errors.allocationPercentage?.message}</span>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
        <input {...register("active")} className="h-4 w-4" type="checkbox" />
        <span className="text-sm font-semibold text-brand-strong">Allocation active</span>
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
