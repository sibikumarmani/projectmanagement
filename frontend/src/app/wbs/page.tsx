"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { WbsForm, type WbsFormValues } from "@/components/wbs/wbs-form";
import { projectApi, wbsApi } from "@/lib/api";
import type { ProjectRecord, WbsRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

function extractApiError(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  if (typeof data?.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }
  return fallbackMessage;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WbsPage() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const hasValidSelectedProject = Boolean(selectedProjectId) && !selectedProjectId.startsWith("p");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wbsRows, setWbsRows] = useState<WbsRecord[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isWbsLoading, setIsWbsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWbs, setEditingWbs] = useState<WbsRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setIsProjectsLoading(true);
        const response = await projectApi.getProjects();
        if (cancelled) {
          return;
        }

        const mappedProjects = (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
          ...project,
          id: String(project.id),
        }));

        setProjects(mappedProjects);

        const selectedStillExists = mappedProjects.some((project) => project.id === selectedProjectId);
        if (!selectedStillExists && mappedProjects.length > 0) {
          setSelectedProjectId(mappedProjects[0].id);
        }

        setError(null);
      } catch {
        if (!cancelled) {
          setError("Projects could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsProjectsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, setSelectedProjectId]);

  useEffect(() => {
    if (!hasValidSelectedProject) {
      return;
    }

    let cancelled = false;

    async function loadWbs() {
      try {
        setIsWbsLoading(true);
        const response = await wbsApi.getWbs(selectedProjectId);
        if (cancelled) {
          return;
        }

        setWbsRows(
          (response.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
            ...wbs,
            id: String(wbs.id),
            projectId: String(wbs.projectId),
          })),
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("WBS data could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsWbsLoading(false);
        }
      }
    }

    void loadWbs();

    return () => {
      cancelled = true;
    };
  }, [hasValidSelectedProject, selectedProjectId]);

  async function refreshWbs() {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setWbsRows([]);
      return;
    }

    const response = await wbsApi.getWbs(selectedProjectId);
    setWbsRows(
      (response.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
        ...wbs,
        id: String(wbs.id),
        projectId: String(wbs.projectId),
      })),
    );
  }

  function openAddModal() {
    setFormError(null);
    setEditingWbs(null);
    setIsModalOpen(true);
  }

  function openEditModal(wbs: WbsRecord) {
    setFormError(null);
    setEditingWbs(wbs);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingWbs(null);
    setIsModalOpen(false);
  }

  async function handleSaveWbs(values: WbsFormValues) {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setFormError("Select a valid project first.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingWbs) {
        await wbsApi.updateWbs(selectedProjectId, editingWbs.id, values);
      } else {
        await wbsApi.createWbs(selectedProjectId, values);
      }

      closeModal();
      await refreshWbs();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "WBS could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="WBS structure"
      subtitle="Load WBS directly from the database, switch by project, and maintain the hierarchy through popup-based add and edit actions."
    >
      <SectionCard
        title="WBS tree register"
        eyebrow="Hierarchy"
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-full border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700"
              disabled={isProjectsLoading || projects.length === 0}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              value={selectedProjectId}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectCode} - {project.projectName}
                </option>
              ))}
            </select>
            <button
              className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
              disabled={!selectedProjectId || selectedProjectId.startsWith("p")}
              onClick={openAddModal}
              type="button"
            >
              Add WBS
            </button>
          </div>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isProjectsLoading || (hasValidSelectedProject && isWbsLoading) ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading WBS data...</div>
        ) : (
          <DataTable
            rows={hasValidSelectedProject ? wbsRows : []}
            columns={[
              { key: "wbsCode", header: "Code" },
              {
                key: "wbsName",
                header: "WBS",
                render: (row) => <span style={{ paddingLeft: `${(row.levelNo - 1) * 16}px` }}>{row.wbsName}</span>,
              },
              { key: "levelNo", header: "Level" },
              { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
              { key: "budgetAmount", header: "Budget", render: (row) => formatCurrency(row.budgetAmount) },
              { key: "actualAmount", header: "Actual", render: (row) => formatCurrency(row.actualAmount) },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button
                    className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-brand-strong"
                    onClick={() => openEditModal(row)}
                    type="button"
                  >
                    Edit
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8">
          <div className="panel w-full max-w-3xl rounded-[32px] p-6 shadow-2xl shadow-slate-900/20">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  {editingWbs ? "Edit WBS" : "New WBS"}
                </p>
                <h2 className="display-font text-2xl font-semibold text-brand-strong">
                  {editingWbs ? "Update WBS details" : "Add WBS details"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {editingWbs
                    ? "Update the selected WBS and save the changes to the database."
                    : "Create a new WBS row under the selected project and save it to the database."}
                </p>
              </div>
              <button
                className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={closeModal}
                type="button"
              >
                Close
              </button>
            </div>

            <WbsForm
              error={formError}
              initialValues={
                editingWbs
                  ? {
                      wbsCode: editingWbs.wbsCode,
                      wbsName: editingWbs.wbsName,
                      levelNo: editingWbs.levelNo,
                      progressPercent: editingWbs.progressPercent,
                      budgetAmount: editingWbs.budgetAmount,
                      actualAmount: editingWbs.actualAmount,
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              onCancel={closeModal}
              onSubmit={handleSaveWbs}
              submitLabel={editingWbs ? "Update WBS" : "Save WBS"}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
