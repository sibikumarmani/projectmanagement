"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const milestoneSchema = z.object({
  milestoneCode: z.string().min(1, "Milestone code is required"),
  milestoneName: z.string().min(2, "Milestone name is required"),
  wbsId: z.string(),
  plannedDate: z.string().min(1, "Planned date is required"),
  actualDate: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

export type MilestoneFormValues = z.infer<typeof milestoneSchema>;

type MilestoneFormProps = {
  onSubmit: (values: MilestoneFormValues) => Promise<void> | void;
  onCancel: () => void;
  wbsOptions: Array<{ id: string; label: string }>;
  initialValues?: MilestoneFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: MilestoneFormValues = {
  milestoneCode: "",
  milestoneName: "",
  wbsId: "",
  plannedDate: "",
  actualDate: "",
  status: "PLANNED",
};

const statusOptions = ["PLANNED", "IN_PROGRESS", "COMPLETED", "AT_RISK"] as const;

export function MilestoneForm({
  onSubmit,
  onCancel,
  wbsOptions,
  initialValues,
  submitLabel = "Save Milestone",
  isSubmitting = false,
  error,
}: MilestoneFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Milestone Code</span>
        <input {...register("milestoneCode")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.milestoneCode?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Milestone Name</span>
        <input {...register("milestoneName")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.milestoneName?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">WBS</span>
        <select {...register("wbsId")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0">
          <option value="">Project-level milestone</option>
          {wbsOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
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

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Planned Date</span>
        <input {...register("plannedDate")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.plannedDate?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Actual Date</span>
        <input {...register("actualDate")} className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0" type="date" />
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
