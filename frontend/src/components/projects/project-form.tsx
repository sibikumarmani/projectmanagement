"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const projectSchema = z
  .object({
    projectCode: z.string().min(3, "Project code is required"),
    projectName: z.string().min(3, "Project name is required"),
    clientName: z.string().min(2, "Client is required"),
    projectManager: z.string().min(2, "Project manager is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    budgetAmount: z.coerce.number().positive("Budget must be greater than zero"),
  })
  .refine((values) => new Date(values.endDate) >= new Date(values.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;
type ProjectFormInput = z.input<typeof projectSchema>;

type ProjectFormProps = {
  onSubmit: (values: ProjectFormValues) => Promise<void> | void;
  onCancel: () => void;
  initialValues?: ProjectFormValues;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
};

const defaultValues: ProjectFormInput = {
  projectCode: "",
  projectName: "",
  clientName: "",
  projectManager: "",
  startDate: "",
  endDate: "",
  budgetAmount: 0,
};

export function ProjectForm({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = "Save",
  isSubmitting = false,
  error,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      {[
        { name: "projectCode", label: "Project Code", type: "text" },
        { name: "projectName", label: "Project Name", type: "text" },
        { name: "clientName", label: "Client", type: "text" },
        { name: "projectManager", label: "Project Manager", type: "text" },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "endDate", label: "End Date", type: "date" },
        { name: "budgetAmount", label: "Budget Amount", type: "number" },
      ].map((field) => (
        <label key={field.name} className={`block ${field.name === "budgetAmount" ? "md:col-span-2" : ""}`}>
          <span className="mb-2 block text-sm font-semibold text-brand-strong">{field.label}</span>
          <input
            {...register(field.name as keyof ProjectFormValues, field.type === "number" ? { valueAsNumber: true } : undefined)}
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none ring-0"
            min={field.type === "number" ? 0 : undefined}
            step={field.type === "number" ? "0.01" : undefined}
            type={field.type}
          />
          <span className="mt-2 block text-xs text-rose-600">{errors[field.name as keyof ProjectFormValues]?.message}</span>
        </label>
      ))}

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
