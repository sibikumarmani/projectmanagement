"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const riskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  activityId: z.string().min(1, "Activity is required"),
  riskNo: z.string().min(3, "Risk number is required"),
  title: z.string().min(3, "Title is required"),
  category: z.string().min(2, "Category is required"),
  owner: z.string().min(2, "Owner is required"),
  probability: z.coerce.number().int().min(1, "Probability must be between 1 and 5").max(5, "Probability must be between 1 and 5"),
  impact: z.coerce.number().int().min(1, "Impact must be between 1 and 5").max(5, "Impact must be between 1 and 5"),
  status: z.enum(["OPEN", "UNDER_REVIEW", "MITIGATION_IN_PROGRESS", "CLOSED", "ESCALATED"]),
  targetDate: z.string().min(1, "Target date is required"),
});

export type RiskFormValues = z.infer<typeof riskSchema>;
type RiskFormInput = z.input<typeof riskSchema>;

type SelectOption = {
  value: string;
  label: string;
};

type RiskFormProps = {
  onSubmit: (values: RiskFormValues) => Promise<void> | void;
  onCancel: () => void;
  onProjectChange?: (projectId: string) => void;
  initialValues?: RiskFormValues;
  projectOptions: SelectOption[];
  activityOptions: SelectOption[];
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: RiskFormInput = {
  projectId: "",
  activityId: "",
  riskNo: "",
  title: "",
  category: "",
  owner: "",
  probability: 1,
  impact: 1,
  status: "OPEN",
  targetDate: "",
};

const statusOptions: Array<{ value: RiskFormValues["status"]; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "MITIGATION_IN_PROGRESS", label: "Mitigation In Progress" },
  { value: "CLOSED", label: "Closed" },
  { value: "ESCALATED", label: "Escalated" },
];

export function RiskForm({
  onSubmit,
  onCancel,
  onProjectChange,
  initialValues,
  projectOptions,
  activityOptions,
  submitLabel = "Save",
  isSubmitting = false,
  error,
}: RiskFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RiskFormInput, unknown, RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  const selectedProjectId = useWatch({ control, name: "projectId" });
  const selectedActivityId = useWatch({ control, name: "activityId" });
  const probability = useWatch({ control, name: "probability" });
  const impact = useWatch({ control, name: "impact" });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  useEffect(() => {
    const activityStillExists = activityOptions.some((option) => option.value === selectedActivityId);
    if (!activityStillExists) {
      setValue("activityId", "");
    }
  }, [activityOptions, selectedActivityId, setValue]);

  const severity = Number(probability ?? 0) * Number(impact ?? 0);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Risk No</span>
        <input {...register("riskNo")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.riskNo?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Owner</span>
        <input {...register("owner")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.owner?.message}</span>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Title</span>
        <input {...register("title")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.title?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Category</span>
        <input {...register("category")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.category?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
        <select {...register("status")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.status?.message}</span>
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
        <select
          {...register("activityId")}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
          disabled={!selectedProjectId}
        >
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
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Probability</span>
        <input
          {...register("probability", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
          max={5}
          min={1}
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.probability?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Impact</span>
        <input
          {...register("impact", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
          max={5}
          min={1}
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.impact?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Severity</span>
        <input
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-muted)] px-4 py-3 text-[color:var(--foreground-subtle)] outline-none ring-0"
          readOnly
          value={Number.isFinite(severity) ? severity : 0}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Target Date</span>
        <input
          {...register("targetDate")}
          className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
          type="date"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.targetDate?.message}</span>
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
