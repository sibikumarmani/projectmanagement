"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const materialRequestSchema = z
  .object({
    requestNo: z.string().min(3, "Request number is required"),
    projectId: z.string().min(1, "Project is required"),
    activityId: z.string().min(1, "Activity is required"),
    requestedBy: z.string().min(2, "Requester name is required"),
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED"]),
    requestedQty: z.coerce.number().positive("Requested quantity must be greater than zero"),
    approvedQty: z.coerce.number().min(0, "Approved quantity cannot be negative"),
  })
  .refine((values) => values.approvedQty <= values.requestedQty, {
    message: "Approved quantity cannot exceed requested quantity",
    path: ["approvedQty"],
  });

export type MaterialRequestFormValues = z.infer<typeof materialRequestSchema>;
type MaterialRequestFormInput = z.input<typeof materialRequestSchema>;

type SelectOption = {
  value: string;
  label: string;
};

type MaterialRequestFormProps = {
  onSubmit: (values: MaterialRequestFormValues) => Promise<void> | void;
  onCancel: () => void;
  onProjectChange?: (projectId: string) => void;
  initialValues?: MaterialRequestFormValues;
  projectOptions: SelectOption[];
  activityOptions: SelectOption[];
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: MaterialRequestFormInput = {
  requestNo: "",
  projectId: "",
  activityId: "",
  requestedBy: "",
  status: "DRAFT",
  requestedQty: 0,
  approvedQty: 0,
};

const statusOptions: Array<{ value: MaterialRequestFormValues["status"]; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "PARTIALLY_RECEIVED", label: "Partially Received" },
  { value: "FULLY_RECEIVED", label: "Fully Received" },
];

export function MaterialRequestForm({
  onSubmit,
  onCancel,
  onProjectChange,
  initialValues,
  projectOptions,
  activityOptions,
  submitLabel = "Save",
  isSubmitting = false,
  error,
}: MaterialRequestFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MaterialRequestFormInput, unknown, MaterialRequestFormValues>({
    resolver: zodResolver(materialRequestSchema),
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
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Request No</span>
        <input {...register("requestNo")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.requestNo?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Requested By</span>
        <input {...register("requestedBy")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.requestedBy?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Project</span>
        <select
          {...register("projectId", {
            onChange: (event) => {
              onProjectChange?.(event.target.value);
            },
          })}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
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
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
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
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
        <select {...register("status")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.status?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Requested Qty</span>
        <input
          {...register("requestedQty", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
          min={0}
          step="0.01"
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.requestedQty?.message}</span>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Approved Qty</span>
        <input
          {...register("approvedQty", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
          min={0}
          step="0.01"
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.approvedQty?.message}</span>
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
