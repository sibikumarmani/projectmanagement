"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { MilestoneForm, type MilestoneFormValues } from "@/components/milestones/milestone-form";
import { milestoneApi, projectApi, wbsApi } from "@/lib/api";
import type { MilestoneItem, ProjectRecord, WbsRecord } from "@/lib/types";
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

export default function MilestonesPage() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const hasValidSelectedProject = Boolean(selectedProjectId) && !selectedProjectId.startsWith("p");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wbsRows, setWbsRows] = useState<WbsRecord[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null);

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

    async function loadMilestoneData() {
      try {
        setIsMilestonesLoading(true);
        const [milestoneResponse, wbsResponse] = await Promise.all([
          milestoneApi.getMilestones(selectedProjectId),
          wbsApi.getWbs(selectedProjectId),
        ]);

        if (cancelled) {
          return;
        }

        const mappedWbs = (wbsResponse.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map(
          (wbs) => ({
            ...wbs,
            id: String(wbs.id),
            projectId: String(wbs.projectId),
          }),
        );
        const wbsCodeById = new Map(mappedWbs.map((wbs) => [wbs.id, wbs.wbsCode]));

        setWbsRows(mappedWbs);
        setMilestones(
          (
            milestoneResponse.data.data as Array<
              Omit<MilestoneItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
                id: number | string;
                projectId: number | string;
                wbsId: number | string | null;
              }
            >
          ).map((milestone) => {
            const normalizedWbsId = milestone.wbsId == null ? null : String(milestone.wbsId);
            return {
              ...milestone,
              id: String(milestone.id),
              projectId: String(milestone.projectId),
              wbsId: normalizedWbsId,
              wbsCode: normalizedWbsId ? (wbsCodeById.get(normalizedWbsId) ?? "Unknown") : null,
            };
          }),
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Milestone data could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsMilestonesLoading(false);
        }
      }
    }

    void loadMilestoneData();

    return () => {
      cancelled = true;
    };
  }, [hasValidSelectedProject, selectedProjectId]);

  async function refreshMilestones() {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setMilestones([]);
      setWbsRows([]);
      return;
    }

    const [milestoneResponse, wbsResponse] = await Promise.all([milestoneApi.getMilestones(selectedProjectId), wbsApi.getWbs(selectedProjectId)]);
    const mappedWbs = (wbsResponse.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
      ...wbs,
      id: String(wbs.id),
      projectId: String(wbs.projectId),
    }));
    const wbsCodeById = new Map(mappedWbs.map((wbs) => [wbs.id, wbs.wbsCode]));

    setWbsRows(mappedWbs);
    setMilestones(
      (
        milestoneResponse.data.data as Array<
          Omit<MilestoneItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
            id: number | string;
            projectId: number | string;
            wbsId: number | string | null;
          }
        >
      ).map((milestone) => {
        const normalizedWbsId = milestone.wbsId == null ? null : String(milestone.wbsId);
        return {
          ...milestone,
          id: String(milestone.id),
          projectId: String(milestone.projectId),
          wbsId: normalizedWbsId,
          wbsCode: normalizedWbsId ? (wbsCodeById.get(normalizedWbsId) ?? "Unknown") : null,
        };
      }),
    );
  }

  function openAddModal() {
    setFormError(null);
    setEditingMilestone(null);
    setIsModalOpen(true);
  }

  function openEditModal(milestone: MilestoneItem) {
    setFormError(null);
    setEditingMilestone(milestone);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingMilestone(null);
    setIsModalOpen(false);
  }

  async function handleSaveMilestone(values: MilestoneFormValues) {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setFormError("Select a valid project first.");
      return;
    }

    const payload = {
      milestoneCode: values.milestoneCode,
      milestoneName: values.milestoneName,
      wbsId: values.wbsId ? Number(values.wbsId) : null,
      plannedDate: values.plannedDate,
      actualDate: values.actualDate && values.actualDate.trim().length > 0 ? values.actualDate : null,
      status: values.status,
    };

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingMilestone) {
        await milestoneApi.updateMilestone(selectedProjectId, editingMilestone.id, payload);
      } else {
        await milestoneApi.createMilestone(selectedProjectId, payload);
      }

      closeModal();
      await refreshMilestones();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Milestone could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  const wbsOptions = wbsRows.map((wbs) => ({
    id: wbs.id,
    label: `${wbs.wbsCode} - ${wbs.wbsName}`,
  }));

  return (
    <AppShell
      title="Milestone tracking"
      subtitle="Load milestones from the database, filter them by selected project, and maintain project or WBS-linked milestones in a popup form."
    >
      <SectionCard
        title="Milestone register"
        eyebrow="Schedule Control"
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-full border border-line bg-[color:var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--foreground)]"
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
              Add Milestone
            </button>
          </div>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isProjectsLoading || (hasValidSelectedProject && isMilestonesLoading) ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading milestone data...</div>
        ) : (
          <DataTable
            rows={hasValidSelectedProject ? milestones : []}
            columns={[
              { key: "milestoneCode", header: "Code" },
              { key: "milestoneName", header: "Milestone" },
              { key: "wbsCode", header: "WBS", render: (row) => row.wbsCode ?? "Project" },
              { key: "plannedDate", header: "Planned" },
              { key: "actualDate", header: "Actual", render: (row) => row.actualDate ?? "Pending" },
              { key: "status", header: "Status" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button
                    className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
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

      <SidebarDrawer
        eyebrow={editingMilestone ? "Update milestone" : "Create milestone"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingMilestone ? "Edit milestone" : "New milestone"}
        widthClassName="sm:max-w-3xl"
      >
            <MilestoneForm
              error={formError}
              initialValues={
                editingMilestone
                  ? {
                      milestoneCode: editingMilestone.milestoneCode,
                      milestoneName: editingMilestone.milestoneName,
                      wbsId: editingMilestone.wbsId ?? "",
                      plannedDate: editingMilestone.plannedDate,
                      actualDate: editingMilestone.actualDate ?? "",
                      status: editingMilestone.status,
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              onCancel={closeModal}
              onSubmit={handleSaveMilestone}
              submitLabel={editingMilestone ? "Save Changes" : "Save Milestone"}
              wbsOptions={wbsOptions}
            />
      </SidebarDrawer>
    </AppShell>
  );
}
