"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import {
  MaterialRequestForm,
  type MaterialRequestFormValues,
} from "@/components/materials/material-request-form";
import { activityApi, materialRequestApi, projectApi } from "@/lib/api";
import type { ActivityItem, MaterialRequestItem, ProjectRecord } from "@/lib/types";

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

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(status: MaterialRequestItem["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MaterialRequestsPage() {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestItem[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activitiesByProject, setActivitiesByProject] = useState<Record<string, ActivityItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<MaterialRequestItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  async function loadMaterialRequests() {
    const response = await materialRequestApi.getMaterialRequests();
    setMaterialRequests(
      (response.data.data as Array<Omit<MaterialRequestItem, "id" | "projectId" | "activityId"> & { id: number | string; projectId: number | string; activityId: number | string }>).map(
        (item) => ({
          ...item,
          id: String(item.id),
          projectId: String(item.projectId),
          activityId: String(item.activityId),
          requestedQty: Number(item.requestedQty),
          approvedQty: Number(item.approvedQty),
          pendingQty: Number(item.pendingQty),
        }),
      ),
    );
  }

  async function loadProjects() {
    const response = await projectApi.getProjects();
    setProjects(
      (response.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
        ...project,
        id: String(project.id),
      })),
    );
  }

  async function ensureActivitiesLoaded(projectId: string) {
    if (!projectId || activitiesByProject[projectId]) {
      return;
    }

    const response = await activityApi.getActivities(projectId);
    setActivitiesByProject((current) => ({
      ...current,
      [projectId]: (response.data.data as Array<Omit<ActivityItem, "id" | "projectId" | "wbsId"> & { id: number | string; projectId: number | string; wbsId: number | string }>).map(
        (activity) => ({
          ...activity,
          id: String(activity.id),
          projectId: String(activity.projectId),
          wbsId: String(activity.wbsId),
        }),
      ),
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchPageData() {
      try {
        setIsLoading(true);
        await Promise.all([loadMaterialRequests(), loadProjects()]);
        if (!cancelled) {
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Material requests could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(values: MaterialRequestFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);

      const payload = {
        requestNo: values.requestNo,
        projectId: Number(values.projectId),
        activityId: Number(values.activityId),
        requestedBy: values.requestedBy,
        status: values.status,
        requestedQty: values.requestedQty,
        approvedQty: values.approvedQty,
      };

      if (editingRequest) {
        await materialRequestApi.updateMaterialRequest(editingRequest.id, payload);
      } else {
        await materialRequestApi.createMaterialRequest(payload);
      }

      setIsModalOpen(false);
      setEditingRequest(null);
      setSelectedProjectId("");
      await loadMaterialRequests();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Material request could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingRequest(null);
    setSelectedProjectId("");
    setIsModalOpen(true);
  }

  function openEditModal(request: MaterialRequestItem) {
    setFormError(null);
    setEditingRequest(request);
    setSelectedProjectId(request.projectId);
    setIsModalOpen(true);
    void ensureActivitiesLoaded(request.projectId).catch(() => {
      setFormError("Activities could not be loaded for the selected project.");
    });
  }

  async function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setFormError(null);

    if (!projectId) {
      return;
    }

    try {
      await ensureActivitiesLoaded(projectId);
    } catch {
      setFormError("Activities could not be loaded for the selected project.");
    }
  }

  function closeModal() {
    setFormError(null);
    setEditingRequest(null);
    setSelectedProjectId("");
    setIsModalOpen(false);
  }

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: `${project.projectCode} - ${project.projectName}`,
  }));

  const activityOptions = (activitiesByProject[selectedProjectId] ?? []).map((activity) => ({
    value: activity.id,
    label: `${activity.activityCode} - ${activity.activityName}`,
  }));

  return (
    <AppShell
      title="Material requests"
      subtitle="Approve, track, and reconcile material demand against activities directly from the database."
    >
      <SectionCard
        title="Request tracker"
        eyebrow="Execution"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={openCreateModal}
            type="button"
          >
            Add Material Request
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">
            Loading material requests...
          </div>
        ) : (
          <DataTable
            rows={materialRequests}
            columns={[
              { key: "requestNo", header: "Request No" },
              { key: "project", header: "Project" },
              { key: "activity", header: "Activity" },
              { key: "requestedBy", header: "Requested By" },
              {
                key: "status",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{formatStatus(row.status)}</span>,
              },
              { key: "requestedQty", header: "Requested", render: (row) => formatQuantity(row.requestedQty) },
              { key: "approvedQty", header: "Approved", render: (row) => formatQuantity(row.approvedQty) },
              { key: "pendingQty", header: "Pending", render: (row) => formatQuantity(row.pendingQty) },
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
                  {editingRequest ? "Edit Material Request" : "New Material Request"}
                </p>
                <h2 className="display-font text-2xl font-semibold text-brand-strong">
                  {editingRequest ? "Update request details" : "Add request details"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {editingRequest
                    ? "Update the material request and save the changes directly to the database."
                    : "Create a new material request and save it directly to the database."}
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

            <MaterialRequestForm
              activityOptions={activityOptions}
              error={formError}
              initialValues={
                editingRequest
                  ? {
                      requestNo: editingRequest.requestNo,
                      projectId: editingRequest.projectId,
                      activityId: editingRequest.activityId,
                      requestedBy: editingRequest.requestedBy,
                      status: editingRequest.status,
                      requestedQty: editingRequest.requestedQty,
                      approvedQty: editingRequest.approvedQty,
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              onCancel={closeModal}
              onProjectChange={(projectId) => {
                void handleProjectChange(projectId);
              }}
              onSubmit={handleSave}
              projectOptions={projectOptions}
              submitLabel={editingRequest ? "Update Request" : "Save Request"}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
