"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const billingSchema = z
  .object({
    milestoneId: z.string().min(1, "Milestone is required"),
    billingNo: z.string().min(3, "Billing number is required"),
    billingDate: z.string().min(1, "Billing date is required"),
    billedAmount: z.coerce.number().positive("Billed amount must be greater than zero"),
    certifiedAmount: z.coerce.number().min(0, "Certified amount cannot be negative"),
    status: z.enum(["DRAFT", "SUBMITTED", "CERTIFIED", "REJECTED", "PAID"]),
    remarks: z.string().max(500, "Remarks must be 500 characters or less").optional().or(z.literal("")),
  })
  .refine((values) => values.certifiedAmount <= values.billedAmount, {
    message: "Certified amount cannot exceed billed amount",
    path: ["certifiedAmount"],
  });

export type BillingFormValues = z.infer<typeof billingSchema>;
type BillingFormInput = z.input<typeof billingSchema>;

type BillingFormProps = {
  onSubmit: (values: BillingFormValues) => Promise<void> | void;
  onCancel: () => void;
  milestoneOptions: Array<{ id: string; label: string }>;
  initialValues?: BillingFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: BillingFormInput = {
  milestoneId: "",
  billingNo: "",
  billingDate: "",
  billedAmount: 0,
  certifiedAmount: 0,
  status: "DRAFT",
  remarks: "",
};

export function BillingForm({
  onSubmit,
  onCancel,
  milestoneOptions,
  initialValues,
  submitLabel = "Save Billing",
  isSubmitting = false,
  error,
}: BillingFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BillingFormInput, unknown, BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  const billedAmount = useWatch({ control, name: "billedAmount" });
  const certifiedAmount = useWatch({ control, name: "certifiedAmount" });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  const outstandingAmount = Number(billedAmount ?? 0) - Number(certifiedAmount ?? 0);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Billing No</span>
        <input {...register("billingNo")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" />
        <span className="mt-2 block text-xs text-rose-600">{errors.billingNo?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Billing Date</span>
        <input {...register("billingDate")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0" type="date" />
        <span className="mt-2 block text-xs text-rose-600">{errors.billingDate?.message}</span>
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Milestone</span>
        <select {...register("milestoneId")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0">
          <option value="">Select a milestone</option>
          {milestoneOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.milestoneId?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Billed Amount</span>
        <input
          {...register("billedAmount", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
          min={0}
          step="0.01"
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.billedAmount?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Certified Amount</span>
        <input
          {...register("certifiedAmount", { valueAsNumber: true })}
          className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
          min={0}
          step="0.01"
          type="number"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.certifiedAmount?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Status</span>
        <select {...register("status")} className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0">
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="CERTIFIED">Certified</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAID">Paid</option>
        </select>
        <span className="mt-2 block text-xs text-rose-600">{errors.status?.message}</span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Outstanding</span>
        <input
          className="w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-slate-500 outline-none ring-0"
          readOnly
          value={Number.isFinite(outstandingAmount) ? outstandingAmount.toFixed(2) : "0.00"}
        />
      </label>

      <label className="block md:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-brand-strong">Remarks</span>
        <textarea
          {...register("remarks")}
          className="min-h-28 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
        />
        <span className="mt-2 block text-xs text-rose-600">{errors.remarks?.message}</span>
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
