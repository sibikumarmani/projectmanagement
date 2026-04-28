"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { projectApi } from "@/lib/api";
import type { ProjectRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type ProjectCreateDraft = {
  projectCode: string;
  projectName: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
};

const emptyProjectCreateDraft = (): ProjectCreateDraft => ({
  projectCode: "",
  projectName: "",
  clientName: "",
  projectManager: "",
  startDate: "",
  endDate: "",
  budgetAmount: 0,
});

function toProjectRecord(project: Omit<ProjectRecord, "id"> & { id: number | string }): ProjectRecord {
  return {
    ...project,
    id: String(project.id),
  };
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

export default function ProjectsPage() {
  const router = useRouter();
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectCreateDraft>(emptyProjectCreateDraft);

  async function loadProjects() {
    try {
      setIsLoading(true);
      const response = await projectApi.getProjects();
      const loadedProjects = (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map(toProjectRecord);
      setProjects(loadedProjects);
      setError(null);
    } catch (loadError: unknown) {
      setError(extractApiError(loadError, "Projects could not be loaded from the database."));
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

        const loadedProjects = (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map(toProjectRecord);
        setProjects(loadedProjects);
        setError(null);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(extractApiError(loadError, "Projects could not be loaded from the database."));
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

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      [
        project.projectCode,
        project.projectName,
        project.clientName,
        project.projectManager,
        project.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, searchTerm]);

  function openProject(projectId: string) {
    setSelectedProjectId(projectId);
    router.push(`/projects/${projectId}`);
  }

  function openAddProjectModal() {
    setProjectDraft(emptyProjectCreateDraft());
    setCreateError(null);
    setIsAddProjectOpen(true);
  }

  function closeAddProjectModal() {
    if (isCreatingProject) {
      return;
    }

    setIsAddProjectOpen(false);
    setCreateError(null);
  }

  function validateProjectDraft() {
    if (!projectDraft.projectCode.trim()) {
      return "Project code is required.";
    }
    if (!projectDraft.projectName.trim()) {
      return "Project name is required.";
    }
    if (!projectDraft.clientName.trim()) {
      return "Client is required.";
    }
    if (!projectDraft.projectManager.trim()) {
      return "Project manager is required.";
    }
    if (!projectDraft.startDate || !projectDraft.endDate) {
      return "Start and end dates are required.";
    }
    if (new Date(projectDraft.endDate) < new Date(projectDraft.startDate)) {
      return "Project end date must be on or after the start date.";
    }

    return null;
  }

  async function handleCreateProject() {
    const validationError = validateProjectDraft();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    try {
      setIsCreatingProject(true);
      setCreateError(null);
      await projectApi.createProject({
        ...projectDraft,
        budgetAmount: Number(projectDraft.budgetAmount),
      });
      await loadProjects();
      setIsAddProjectOpen(false);
      setProjectDraft(emptyProjectCreateDraft());
    } catch (saveError: unknown) {
      setCreateError(extractApiError(saveError, "Project could not be created."));
    } finally {
      setIsCreatingProject(false);
    }
  }

  return (
    <AppShell
      title="Projects"
      subtitle="Browse the full project register, search quickly, and open any project in a dedicated detail page for editing."
    >
      <SectionCard
        title="Project summary register"
        eyebrow="Portfolio"
        action={
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={openAddProjectModal} type="button">
            Add Project
          </button>
        }
      >
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Search Projects</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, name, client, manager, or status"
              type="search"
              value={searchTerm}
            />
          </label>
          <div className="rounded-[22px] border border-line bg-white/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Visible Projects</p>
            <p className="mt-2 text-3xl font-semibold text-brand-strong">{filteredProjects.length}</p>
            <p className="mt-1 text-sm text-slate-600">Double-click a project card to open the full edit page.</p>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-line bg-white/50 px-4 py-10 text-sm text-slate-600">
            No projects matched your search.
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "projectCode",
                header: "Project",
                render: (project) => (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{project.projectCode}</p>
                    <p className="mt-1 font-semibold text-brand-strong">{project.projectName}</p>
                  </div>
                ),
              },
              { key: "clientName", header: "Client" },
              { key: "projectManager", header: "Manager" },
              { key: "startDate", header: "Start" },
              { key: "endDate", header: "End" },
              {
                key: "budgetAmount",
                header: "Budget",
                render: (project) => formatCurrency(project.budgetAmount),
              },
              {
                key: "actualAmount",
                header: "Actual",
                render: (project) => formatCurrency(project.actualAmount),
              },
              {
                key: "progressPercent",
                header: "Progress",
                render: (project) => `${project.progressPercent}%`,
              },
              {
                key: "status",
                header: "Status",
                render: (project) => (
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-[0_6px_14px_rgba(24,50,71,0.08)]">
                    {formatStatus(project.status)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Action",
                render: (project) => {
                  const isLastViewed = project.id === selectedProjectId;

                  return (
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-full bg-brand-strong px-4 py-2 text-xs font-semibold text-white"
                        onClick={() => openProject(project.id)}
                        type="button"
                      >
                        Open
                      </button>
                      {isLastViewed ? <span className="text-xs font-semibold text-brand">Last opened</span> : null}
                    </div>
                  );
                },
              },
            ]}
            rows={filteredProjects}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        description="Enter the project header details here, then save it directly into the summary register."
        eyebrow="Project"
        onClose={closeAddProjectModal}
        open={isAddProjectOpen}
        title="Add Project"
        widthClassName="sm:max-w-3xl"
      >
        {createError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Code</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, projectCode: event.target.value }))}
              value={projectDraft.projectCode}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Client</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, clientName: event.target.value }))}
              value={projectDraft.clientName}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Name</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, projectName: event.target.value }))}
              value={projectDraft.projectName}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Manager</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, projectManager: event.target.value }))}
              value={projectDraft.projectManager}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Budget Amount</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              min={0}
              onChange={(event) => setProjectDraft((current) => ({ ...current, budgetAmount: Number(event.target.value) }))}
              step="0.01"
              type="number"
              value={projectDraft.budgetAmount}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">Start Date</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, startDate: event.target.value }))}
              type="date"
              value={projectDraft.startDate}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-strong">End Date</span>
            <input
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setProjectDraft((current) => ({ ...current, endDate: event.target.value }))}
              type="date"
              value={projectDraft.endDate}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-slate-700" onClick={closeAddProjectModal} type="button">
            Cancel
          </button>
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCreatingProject}
            onClick={() => void handleCreateProject()}
            type="button"
          >
            {isCreatingProject ? "Saving..." : "Save Project"}
          </button>
        </div>
      </SidebarDrawer>
    </AppShell>
  );
}
