"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { EmployeeAllocationForm, type EmployeeAllocationFormValues } from "@/components/allocations/employee-allocation-form";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { useIsClient } from "@/hooks/use-is-client";
import { activityApi, allocationApi, projectApi, userApi } from "@/lib/api";
import type { ActivityItem, EmployeeAllocationRecord, ProjectRecord, UserRecord } from "@/lib/types";
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
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.defaultMessage === "string") {
    return data.errors[0].defaultMessage;
  }
  return fallbackMessage;
}

export default function EmployeeAllocationsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [allocations, setAllocations] = useState<EmployeeAllocationRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activitiesByProject, setActivitiesByProject] = useState<Record<string, ActivityItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<EmployeeAllocationRecord | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

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

  async function loadAllocations() {
    const response = await allocationApi.getAllocations();
    setAllocations(
      (response.data.data as Array<Omit<EmployeeAllocationRecord, "id" | "userId" | "projectId" | "activityId"> & { id: number | string; userId: number | string; projectId: number | string; activityId: number | string }>).map(
        (allocation) => ({
          ...allocation,
          id: String(allocation.id),
          userId: String(allocation.userId),
          projectId: String(allocation.projectId),
          activityId: String(allocation.activityId),
        }),
      ),
    );
  }

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    async function loadPageData() {
      try {
        setIsLoading(true);
        const [allocationResponse, userResponse, projectResponse] = await Promise.all([
          allocationApi.getAllocations(),
          userApi.getUsers(),
          projectApi.getProjects(),
        ]);

        if (cancelled) {
          return;
        }

        setAllocations(
          (allocationResponse.data.data as Array<Omit<EmployeeAllocationRecord, "id" | "userId" | "projectId" | "activityId"> & { id: number | string; userId: number | string; projectId: number | string; activityId: number | string }>).map(
            (allocation) => ({
              ...allocation,
              id: String(allocation.id),
              userId: String(allocation.userId),
              projectId: String(allocation.projectId),
              activityId: String(allocation.activityId),
            }),
          ),
        );

        setUsers(
          (userResponse.data.data as Array<Omit<UserRecord, "id"> & { id: number | string }>).map((user) => ({
            ...user,
            id: String(user.id),
          })),
        );

        setProjects(
          (projectResponse.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
            ...project,
            id: String(project.id),
          })),
        );

        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(extractApiError(error, "Employee allocations could not be loaded from the database."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      cancelled = true;
    };
  }, [accessToken, hasHydrated, isClient]);

  async function handleSave(values: EmployeeAllocationFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);

      const payload = {
        userId: Number(values.userId),
        projectId: Number(values.projectId),
        activityId: Number(values.activityId),
        allocationDate: values.allocationDate,
        allocationPercentage: values.allocationPercentage,
        active: values.active,
        remarks: values.remarks?.trim() ? values.remarks.trim() : undefined,
      };

      if (editingAllocation) {
        await allocationApi.updateAllocation(editingAllocation.id, payload);
      } else {
        await allocationApi.createAllocation(payload);
      }

      setIsModalOpen(false);
      setEditingAllocation(null);
      setSelectedProjectId("");
      await loadAllocations();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Employee allocation could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingAllocation(null);
    setSelectedProjectId("");
    setIsModalOpen(true);
  }

  function openEditModal(allocation: EmployeeAllocationRecord) {
    setFormError(null);
    setEditingAllocation(allocation);
    setSelectedProjectId(allocation.projectId);
    setIsModalOpen(true);
    void ensureActivitiesLoaded(allocation.projectId).catch(() => {
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
    setEditingAllocation(null);
    setSelectedProjectId("");
    setIsModalOpen(false);
  }

  const employeeOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.userCode} - ${user.fullName}`,
      })),
    [users],
  );

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: `${project.projectCode} - ${project.projectName}`,
      })),
    [projects],
  );

  const activityOptions = useMemo(
    () =>
      (activitiesByProject[selectedProjectId] ?? []).map((activity) => ({
        value: activity.id,
        label: `${activity.activityCode} - ${activity.activityName}`,
      })),
    [activitiesByProject, selectedProjectId],
  );

  return (
    <AppShell
      title="Employee allocation"
      subtitle="Allocate employees to activities, track current assignment percentages, and manage the activity-facing labour plan from one screen."
    >
      <SectionCard
        title="Allocation register"
        eyebrow="Work Planning"
        action={
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={openCreateModal} type="button">
            Add Allocation
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading employee allocations...</div>
        ) : (
          <DataTable
            rows={allocations}
            columns={[
              { key: "userCode", header: "Employee Code" },
              { key: "employeeName", header: "Employee" },
              { key: "projectCode", header: "Project" },
              { key: "activityCode", header: "Activity" },
              { key: "allocationDate", header: "Allocation Date" },
              {
                key: "allocationPercentage",
                header: "Allocation %",
                render: (row) => `${row.allocationPercentage}%`,
              },
              {
                key: "active",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{row.active ? "Active" : "Inactive"}</span>,
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-brand-strong" onClick={() => openEditModal(row)} type="button">
                    Edit
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingAllocation ? "Edit Allocation" : "New Allocation"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingAllocation ? editingAllocation.employeeName : "Allocate an employee to an activity"}
        widthClassName="sm:max-w-4xl"
      >
            <EmployeeAllocationForm
              employeeOptions={employeeOptions}
              projectOptions={projectOptions}
              activityOptions={activityOptions}
              onProjectChange={(projectId) => void handleProjectChange(projectId)}
              onSubmit={handleSave}
              onCancel={closeModal}
              error={formError}
              isSubmitting={isSaving}
              submitLabel={editingAllocation ? "Update Allocation" : "Create Allocation"}
              initialValues={
                editingAllocation
                  ? {
                      userId: editingAllocation.userId,
                      projectId: editingAllocation.projectId,
                      activityId: editingAllocation.activityId,
                      allocationDate: editingAllocation.allocationDate,
                      allocationPercentage: editingAllocation.allocationPercentage,
                      active: editingAllocation.active,
                      remarks: editingAllocation.remarks ?? "",
                    }
                  : undefined
              }
            />
      </SidebarDrawer>
    </AppShell>
  );
}
