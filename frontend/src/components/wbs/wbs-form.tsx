"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const wbsSchema = z.object({
  wbsCode: z.string().min(1, "WBS code is required"),
  wbsName: z.string().min(2, "WBS name is required"),
  levelNo: z.coerce.number().int().min(1, "Level must be at least 1"),
  progressPercent: z.coerce.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100"),
  budgetAmount: z.coerce.number().min(0, "Budget cannot be negative"),
  actualAmount: z.coerce.number().min(0, "Actual cannot be negative"),
});

export type WbsFormValues = z.infer<typeof wbsSchema>;
type WbsFormInput = z.input<typeof wbsSchema>;

type WbsFormProps = {
  onSubmit: (values: WbsFormValues) => Promise<void> | void;
  onCancel: () => void;
  initialValues?: WbsFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: WbsFormInput = {
  wbsCode: "",
  wbsName: "",
  levelNo: 1,
  progressPercent: 0,
  budgetAmount: 0,
  actualAmount: 0,
};

export function WbsForm({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save WBS",
  isSubmitting = false,
  error,
}: WbsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WbsFormInput, unknown, WbsFormValues>({
    resolver: zodResolver(wbsSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {[
        { name: "wbsCode", label: "WBS Code", type: "text" },
        { name: "wbsName", label: "WBS Name", type: "text" },
        { name: "levelNo", label: "Level", type: "number" },
        { name: "progressPercent", label: "Progress %", type: "number" },
        { name: "budgetAmount", label: "Budget Amount", type: "number" },
        { name: "actualAmount", label: "Actual Amount", type: "number" },
      ].map((field) => (
        <label key={field.name} className="block">
          <span className="mb-2 block text-sm font-semibold text-brand-strong">{field.label}</span>
          <input
            {...register(field.name as keyof WbsFormValues, field.type === "number" ? { valueAsNumber: true } : undefined)}
            className="w-full rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3 outline-none ring-0"
            min={field.type === "number" ? 0 : undefined}
            step={field.type === "number" ? "0.01" : undefined}
            type={field.type}
          />
          <span className="mt-2 block text-xs text-rose-600">{errors[field.name as keyof WbsFormValues]?.message}</span>
        </label>
      ))}

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
