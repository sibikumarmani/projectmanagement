"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/project-form";
import { projectApi } from "@/lib/api";
import type { ProjectRecord } from "@/lib/types";

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

  if (Array.isArray(data?.errors) && typeof data.errors[0]?.defaultMessage === "string") {
    return data.errors[0].defaultMessage;
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

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivatingProjectId, setDeactivatingProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);

  async function loadProjects() {
    try {
      setIsLoading(true);
      const response = await projectApi.getProjects();
      setProjects(
        (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
          ...project,
          id: String(project.id),
        })),
      );
      setError(null);
    } catch {
      setError("Projects could not be loaded from the database.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        setIsLoading(true);
        const response = await projectApi.getProjects();
        if (cancelled) {
          return;
        }

        setProjects(
          (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
            ...project,
            id: String(project.id),
          })),
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Projects could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateProject(values: ProjectFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);
      if (editingProject) {
        await projectApi.updateProject(editingProject.id, values);
      } else {
        await projectApi.createProject(values);
      }
      setIsModalOpen(false);
      setEditingProject(null);
      await loadProjects();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Project could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivateProject(projectId: string) {
    try {
      setDeactivatingProjectId(projectId);
      await projectApi.deactivateProject(projectId);
      await loadProjects();
    } catch {
      setError("Project could not be deactivated.");
    } finally {
      setDeactivatingProjectId(null);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingProject(null);
    setIsModalOpen(true);
  }

  function openEditModal(project: ProjectRecord) {
    setFormError(null);
    setEditingProject(project);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingProject(null);
    setIsModalOpen(false);
  }

  return (
    <AppShell
      title="Project setup"
      subtitle="Create projects, assign accountable managers, and keep the portfolio register synced directly from the database."
    >
      <SectionCard
        title="Project register"
        eyebrow="Portfolio"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={openCreateModal}
            type="button"
          >
            Add Project
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading projects...</div>
        ) : (
          <DataTable
            rows={projects}
            columns={[
              { key: "projectCode", header: "Code" },
              { key: "projectName", header: "Project" },
              { key: "clientName", header: "Client" },
              { key: "projectManager", header: "Manager" },
              { key: "startDate", header: "Start" },
              { key: "endDate", header: "End" },
              {
                key: "budgetAmount",
                header: "Budget",
                render: (row) => formatCurrency(row.budgetAmount),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{formatStatus(row.status)}</span>,
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => openEditModal(row)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={row.status === "CLOSED" || deactivatingProjectId === row.id}
                      onClick={() => void handleDeactivateProject(row.id)}
                      type="button"
                    >
                      {deactivatingProjectId === row.id ? "Deactivating..." : row.status === "CLOSED" ? "Deactivated" : "Deactivate"}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        description={
          editingProject
            ? "Update the project and save the changes directly to the database."
            : "Save a new project directly to the database and refresh the register immediately."
        }
        eyebrow={editingProject ? "Edit Project" : "New Project"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingProject ? "Update project details" : "Add project details"}
        widthClassName="sm:max-w-3xl"
      >
            <ProjectForm
              error={formError}
              initialValues={
                editingProject
                  ? {
                      projectCode: editingProject.projectCode,
                      projectName: editingProject.projectName,
                      clientName: editingProject.clientName,
                      projectManager: editingProject.projectManager,
                      startDate: editingProject.startDate,
                      endDate: editingProject.endDate,
                      budgetAmount: editingProject.budgetAmount,
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              onCancel={closeModal}
              onSubmit={handleCreateProject}
              submitLabel={editingProject ? "Update Project" : "Save Project"}
            />
      </SidebarDrawer>
    </AppShell>
  );
}
