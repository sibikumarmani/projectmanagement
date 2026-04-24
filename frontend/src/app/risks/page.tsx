"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { RiskForm, type RiskFormValues } from "@/components/risks/risk-form";
import { activityApi, projectApi, riskApi } from "@/lib/api";
import type { ActivityItem, ProjectRecord, RiskItem } from "@/lib/types";

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

function formatStatus(status: RiskItem["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RisksPage() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activitiesByProject, setActivitiesByProject] = useState<Record<string, ActivityItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  async function loadRisks() {
    const response = await riskApi.getRisks();
    setRisks(
      (response.data.data as Array<Omit<RiskItem, "id" | "projectId" | "activityId"> & { id: number | string; projectId: number | string; activityId: number | string }>).map(
        (risk) => ({
          ...risk,
          id: String(risk.id),
          projectId: String(risk.projectId),
          activityId: String(risk.activityId),
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
        await Promise.all([loadRisks(), loadProjects()]);
        if (!cancelled) {
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Risks could not be loaded from the database.");
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

  async function handleSave(values: RiskFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);

      const payload = {
        projectId: Number(values.projectId),
        activityId: Number(values.activityId),
        riskNo: values.riskNo,
        title: values.title,
        category: values.category,
        owner: values.owner,
        probability: values.probability,
        impact: values.impact,
        status: values.status,
        targetDate: values.targetDate,
      };

      if (editingRisk) {
        await riskApi.updateRisk(editingRisk.id, payload);
      } else {
        await riskApi.createRisk(payload);
      }

      setIsModalOpen(false);
      setEditingRisk(null);
      setSelectedProjectId("");
      await loadRisks();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Risk could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingRisk(null);
    setSelectedProjectId("");
    setIsModalOpen(true);
  }

  function openEditModal(risk: RiskItem) {
    setFormError(null);
    setEditingRisk(risk);
    setSelectedProjectId(risk.projectId);
    setIsModalOpen(true);
    void ensureActivitiesLoaded(risk.projectId).catch(() => {
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
    setEditingRisk(null);
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
      title="Risk register"
      subtitle="Score risks consistently, assign owners, and connect mitigation actions to the same project and activity hierarchy."
    >
      <SectionCard
        title="Risk log"
        eyebrow="Risk Management"
        action={
          <button
            className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
            onClick={openCreateModal}
            type="button"
          >
            Add Risk
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading risks...</div>
        ) : (
          <DataTable
            rows={risks}
            columns={[
              { key: "riskNo", header: "Risk No" },
              { key: "title", header: "Title" },
              { key: "category", header: "Category" },
              { key: "owner", header: "Owner" },
              { key: "severity", header: "Severity" },
              {
                key: "status",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{formatStatus(row.status)}</span>,
              },
              { key: "targetDate", header: "Target" },
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

      <SidebarDrawer
        description={
          editingRisk
            ? "Update the risk and save the changes directly to the database."
            : "Create a new risk and save it directly to the database."
        }
        eyebrow={editingRisk ? "Edit Risk" : "New Risk"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingRisk ? "Update risk details" : "Add risk details"}
        widthClassName="sm:max-w-4xl"
      >
            <RiskForm
              activityOptions={activityOptions}
              error={formError}
              initialValues={
                editingRisk
                  ? {
                      projectId: editingRisk.projectId,
                      activityId: editingRisk.activityId,
                      riskNo: editingRisk.riskNo,
                      title: editingRisk.title,
                      category: editingRisk.category,
                      owner: editingRisk.owner,
                      probability: editingRisk.probability,
                      impact: editingRisk.impact,
                      status: editingRisk.status,
                      targetDate: editingRisk.targetDate,
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
              submitLabel={editingRisk ? "Update Risk" : "Save Risk"}
            />
      </SidebarDrawer>
    </AppShell>
  );
}
