"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityForm, type ActivityFormValues } from "@/components/activities/activity-form";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { activityApi, projectApi, wbsApi } from "@/lib/api";
import type { ActivityItem, ProjectRecord, WbsRecord } from "@/lib/types";
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

export default function ActivitiesPage() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const hasValidSelectedProject = Boolean(selectedProjectId) && !selectedProjectId.startsWith("p");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wbsRows, setWbsRows] = useState<WbsRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

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

    async function loadActivityData() {
      try {
        setIsActivitiesLoading(true);
        const [activityResponse, wbsResponse] = await Promise.all([activityApi.getActivities(selectedProjectId), wbsApi.getWbs(selectedProjectId)]);

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
        setActivities(
          (
            activityResponse.data.data as Array<
              Omit<ActivityItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
                id: number | string;
                projectId: number | string;
                wbsId: number | string;
              }
            >
          ).map((activity) => {
            const normalizedWbsId = String(activity.wbsId);
            return {
              ...activity,
              id: String(activity.id),
              projectId: String(activity.projectId),
              wbsId: normalizedWbsId,
              wbsCode: wbsCodeById.get(normalizedWbsId) ?? "Unknown",
            };
          }),
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Activity data could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsActivitiesLoading(false);
        }
      }
    }

    void loadActivityData();

    return () => {
      cancelled = true;
    };
  }, [hasValidSelectedProject, selectedProjectId]);

  async function refreshActivities() {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setActivities([]);
      setWbsRows([]);
      return;
    }

    const [activityResponse, wbsResponse] = await Promise.all([activityApi.getActivities(selectedProjectId), wbsApi.getWbs(selectedProjectId)]);
    const mappedWbs = (wbsResponse.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
      ...wbs,
      id: String(wbs.id),
      projectId: String(wbs.projectId),
    }));
    const wbsCodeById = new Map(mappedWbs.map((wbs) => [wbs.id, wbs.wbsCode]));

    setWbsRows(mappedWbs);
    setActivities(
      (
        activityResponse.data.data as Array<
          Omit<ActivityItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
            id: number | string;
            projectId: number | string;
            wbsId: number | string;
          }
        >
      ).map((activity) => {
        const normalizedWbsId = String(activity.wbsId);
        return {
          ...activity,
          id: String(activity.id),
          projectId: String(activity.projectId),
          wbsId: normalizedWbsId,
          wbsCode: wbsCodeById.get(normalizedWbsId) ?? "Unknown",
        };
      }),
    );
  }

  function openAddModal() {
    setFormError(null);
    setEditingActivity(null);
    setIsModalOpen(true);
  }

  function openEditModal(activity: ActivityItem) {
    setFormError(null);
    setEditingActivity(activity);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingActivity(null);
    setIsModalOpen(false);
  }

  async function handleSaveActivity(values: ActivityFormValues) {
    if (!selectedProjectId || selectedProjectId.startsWith("p")) {
      setFormError("Select a valid project first.");
      return;
    }

    const payload = {
      activityCode: values.activityCode,
      activityName: values.activityName,
      wbsId: Number(values.wbsId),
      plannedStart: values.plannedStart,
      plannedEnd: values.plannedEnd,
      durationDays: values.durationDays,
      progressPercent: values.progressPercent,
      status: values.status,
      responsibleUser: values.responsibleUser,
    };

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingActivity) {
        await activityApi.updateActivity(selectedProjectId, editingActivity.id, payload);
      } else {
        await activityApi.createActivity(selectedProjectId, payload);
      }

      closeModal();
      await refreshActivities();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Activity could not be saved."));
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
      title="Activity planning"
      subtitle="Load activities from the database, switch by project, and maintain the activity register with popup-based add and edit actions."
    >
      <SectionCard
        title="Activity register"
        eyebrow="Planning"
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
              Add Activity
            </button>
          </div>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isProjectsLoading || (hasValidSelectedProject && isActivitiesLoading) ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading activity data...</div>
        ) : (
          <DataTable
            rows={hasValidSelectedProject ? activities : []}
            columns={[
              { key: "activityCode", header: "Code" },
              { key: "activityName", header: "Activity" },
              { key: "wbsCode", header: "WBS", render: (row) => row.wbsCode ?? "Unknown" },
              { key: "plannedStart", header: "Start" },
              { key: "plannedEnd", header: "Finish" },
              { key: "durationDays", header: "Duration" },
              { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
              { key: "responsibleUser", header: "Responsible" },
              {
                key: "status",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{row.status}</span>,
              },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/60 bg-[#f8f5ef] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-strong/70">
                  {editingActivity ? "Update activity" : "Create activity"}
                </p>
                <h2 className="mt-2 font-display text-2xl text-slate-900">{editingActivity ? "Edit activity" : "New activity"}</h2>
              </div>
              <button className="text-sm font-semibold text-slate-600" onClick={closeModal} type="button">
                Close
              </button>
            </div>

            <ActivityForm
              error={formError}
              initialValues={
                editingActivity
                  ? {
                      activityCode: editingActivity.activityCode,
                      activityName: editingActivity.activityName,
                      wbsId: editingActivity.wbsId,
                      plannedStart: editingActivity.plannedStart,
                      plannedEnd: editingActivity.plannedEnd,
                      durationDays: editingActivity.durationDays,
                      progressPercent: editingActivity.progressPercent,
                      status: editingActivity.status,
                      responsibleUser: editingActivity.responsibleUser,
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              onCancel={closeModal}
              onSubmit={handleSaveActivity}
              submitLabel={editingActivity ? "Save Changes" : "Save Activity"}
              wbsOptions={wbsOptions}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
