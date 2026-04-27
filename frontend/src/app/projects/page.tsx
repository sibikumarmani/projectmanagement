"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/common/section-card";
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
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredProjects.map((project) => {
              const isLastViewed = project.id === selectedProjectId;

              return (
                <button
                  key={project.id}
                  className={`rounded-[24px] border px-5 py-5 text-left transition ${
                    isLastViewed ? "border-brand-strong bg-brand-strong/10" : "border-line bg-white/75 hover:border-brand hover:bg-white"
                  }`}
                  onDoubleClick={() => openProject(project.id)}
                  type="button"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{project.projectCode}</p>
                      <h3 className="mt-2 text-xl font-semibold text-brand-strong">{project.projectName}</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{formatStatus(project.status)}</span>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Client: {project.clientName}</p>
                    <p>Manager: {project.projectManager}</p>
                    <p>Start: {project.startDate}</p>
                    <p>End: {project.endDate}</p>
                    <p>Budget: {formatCurrency(project.budgetAmount)}</p>
                    <p>Actual: {formatCurrency(project.actualAmount)}</p>
                    <p>Progress: {project.progressPercent}%</p>
                    <p>{isLastViewed ? "Last opened project" : "Double-click to edit"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {isAddProjectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-line bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Project</p>
                <h2 className="mt-2 text-2xl font-semibold text-brand-strong">Add Project</h2>
                <p className="mt-1 text-sm text-slate-600">Enter the project header details here, then save it to the summary list.</p>
              </div>
              <button className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-600" onClick={closeAddProjectModal} type="button">
                Close
              </button>
            </div>

            {createError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</p> : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Code</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
                  onChange={(event) => setProjectDraft((current) => ({ ...current, projectCode: event.target.value }))}
                  value={projectDraft.projectCode}
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
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Client</span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none"
                  onChange={(event) => setProjectDraft((current) => ({ ...current, clientName: event.target.value }))}
                  value={projectDraft.clientName}
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
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
