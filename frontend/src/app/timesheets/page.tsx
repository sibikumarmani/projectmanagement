"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/timesheet-form";
import { useIsClient } from "@/hooks/use-is-client";
import { activityApi, allocationApi, projectApi, timesheetApi, userApi } from "@/lib/api";
import type { ActivityItem, EmployeeAllocationRecord, ProjectRecord, TimesheetRecord, UserRecord } from "@/lib/types";
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

export default function TimesheetsPage() {
  const isClient = useIsClient();
  const { accessToken, hasHydrated } = useAppStore();
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [allocations, setAllocations] = useState<EmployeeAllocationRecord[]>([]);
  const [activitiesByProject, setActivitiesByProject] = useState<Record<string, ActivityItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<TimesheetRecord | null>(null);
  const [timesheetFilters, setTimesheetFilters] = useState<{ userId: string; projectId: string; entryMode: "ALLOCATED" | "NON_ALLOCATED" }>({
    userId: "",
    projectId: "",
    entryMode: "NON_ALLOCATED",
  });

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

  async function loadTimesheets() {
    const response = await timesheetApi.getTimesheets();
    setTimesheets(
      (response.data.data as Array<Omit<TimesheetRecord, "id" | "userId" | "projectId" | "activityId"> & { id: number | string; userId: number | string; projectId: number | string; activityId: number | string }>).map(
        (timesheet) => ({
          ...timesheet,
          id: String(timesheet.id),
          userId: String(timesheet.userId),
          projectId: String(timesheet.projectId),
          activityId: String(timesheet.activityId),
          regularHours: Number(timesheet.regularHours),
          overtimeHours: Number(timesheet.overtimeHours),
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
        const [timesheetResponse, userResponse, projectResponse, allocationResponse] = await Promise.all([
          timesheetApi.getTimesheets(),
          userApi.getUsers(),
          projectApi.getProjects(),
          allocationApi.getAllocations(),
        ]);

        if (cancelled) {
          return;
        }

        setTimesheets(
          (timesheetResponse.data.data as Array<Omit<TimesheetRecord, "id" | "userId" | "projectId" | "activityId"> & { id: number | string; userId: number | string; projectId: number | string; activityId: number | string }>).map(
            (timesheet) => ({
              ...timesheet,
              id: String(timesheet.id),
              userId: String(timesheet.userId),
              projectId: String(timesheet.projectId),
              activityId: String(timesheet.activityId),
              regularHours: Number(timesheet.regularHours),
              overtimeHours: Number(timesheet.overtimeHours),
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

        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          setError(extractApiError(error, "Timesheets could not be loaded from the database."));
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

  async function handleSave(values: TimesheetFormValues) {
    try {
      setIsSaving(true);
      setFormError(null);

      const payload = {
        userId: Number(values.userId),
        projectId: Number(values.projectId),
        activityId: Number(values.activityId),
        workDate: values.workDate,
        regularHours: values.regularHours,
        overtimeHours: values.overtimeHours,
        allocatedActivity: values.entryMode === "ALLOCATED",
        status: values.status,
        remarks: values.remarks?.trim() ? values.remarks.trim() : undefined,
      };

      if (editingTimesheet) {
        await timesheetApi.updateTimesheet(editingTimesheet.id, payload);
      } else {
        await timesheetApi.createTimesheet(payload);
      }

      setIsModalOpen(false);
      setEditingTimesheet(null);
      setTimesheetFilters({ userId: "", projectId: "", entryMode: "NON_ALLOCATED" });
      await loadTimesheets();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Timesheet could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  function openCreateModal() {
    setFormError(null);
    setEditingTimesheet(null);
    setTimesheetFilters({ userId: "", projectId: "", entryMode: "NON_ALLOCATED" });
    setIsModalOpen(true);
  }

  function openEditModal(timesheet: TimesheetRecord) {
    setFormError(null);
    setEditingTimesheet(timesheet);
    setTimesheetFilters({
      userId: timesheet.userId,
      projectId: timesheet.projectId,
      entryMode: timesheet.allocatedActivity ? "ALLOCATED" : "NON_ALLOCATED",
    });
    setIsModalOpen(true);
    void ensureActivitiesLoaded(timesheet.projectId).catch(() => {
      setFormError("Activities could not be loaded for the selected project.");
    });
  }

  function closeModal() {
    setFormError(null);
    setEditingTimesheet(null);
    setTimesheetFilters({ userId: "", projectId: "", entryMode: "NON_ALLOCATED" });
    setIsModalOpen(false);
  }

  const employeeOptions = useMemo(
    () =>
      users
        .filter((user) => user.active)
        .map((user) => ({
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

  const availableActivityOptions = useMemo(() => {
    const projectActivities = activitiesByProject[timesheetFilters.projectId] ?? [];
    if (!timesheetFilters.projectId || !timesheetFilters.userId) {
      return [];
    }

    if (timesheetFilters.entryMode === "ALLOCATED") {
      const allocatedActivityIds = new Set(
        allocations
          .filter((allocation) => allocation.userId === timesheetFilters.userId && allocation.projectId === timesheetFilters.projectId && allocation.active)
          .map((allocation) => allocation.activityId),
      );

      return projectActivities
        .filter((activity) => allocatedActivityIds.has(activity.id))
        .map((activity) => ({
          value: activity.id,
          label: `${activity.activityCode} - ${activity.activityName}`,
        }));
    }

    return projectActivities.map((activity) => ({
      value: activity.id,
      label: `${activity.activityCode} - ${activity.activityName}`,
    }));
  }, [activitiesByProject, allocations, timesheetFilters]);

  const activityHint = useMemo(() => {
    if (!timesheetFilters.userId || !timesheetFilters.projectId) {
      return "Choose an employee and project to load activities.";
    }

    if (timesheetFilters.entryMode === "ALLOCATED" && availableActivityOptions.length === 0) {
      return "No active employee allocation was found for this employee in the selected project. Use Non-Allocated Activity, or create an employee allocation first.";
    }

    if (timesheetFilters.entryMode === "NON_ALLOCATED" && availableActivityOptions.length === 0) {
      return "No activities are available for the selected project yet.";
    }

    return null;
  }, [availableActivityOptions.length, timesheetFilters]);

  const initialFormValues = useMemo(() => {
    if (!editingTimesheet) {
      return undefined;
    }

    return {
      userId: editingTimesheet.userId,
      projectId: editingTimesheet.projectId,
      entryMode: editingTimesheet.allocatedActivity ? "ALLOCATED" : "NON_ALLOCATED",
      activityId: editingTimesheet.activityId,
      workDate: editingTimesheet.workDate,
      regularHours: editingTimesheet.regularHours,
      overtimeHours: editingTimesheet.overtimeHours,
      status: editingTimesheet.status,
      remarks: editingTimesheet.remarks ?? "",
    } satisfies TimesheetFormValues;
  }, [editingTimesheet]);

  return (
    <AppShell
      title="Timesheet entry"
      subtitle="Capture hours against allocated and non-allocated activities, with clear entry mode control and project-linked activity selection."
    >
      <SectionCard
        title="Timesheet register"
        eyebrow="Labour Tracking"
        action={
          <button className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white" onClick={openCreateModal} type="button">
            Add Timesheet
          </button>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading timesheets...</div>
        ) : (
          <DataTable
            rows={timesheets}
            columns={[
              { key: "userCode", header: "Employee Code" },
              { key: "employeeName", header: "Employee" },
              { key: "projectCode", header: "Project" },
              { key: "activityCode", header: "Activity" },
              { key: "workDate", header: "Work Date" },
              { key: "regularHours", header: "Regular Hrs" },
              { key: "overtimeHours", header: "OT Hrs" },
              {
                key: "allocatedActivity",
                header: "Entry Type",
                render: (row) => (
                  <span className="rounded-full bg-[color:var(--surface-raised)] px-3 py-1 text-xs font-semibold">
                    {row.allocatedActivity ? "Allocated" : "Non-Allocated"}
                  </span>
                ),
              },
              { key: "status", header: "Status" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong" onClick={() => openEditModal(row)} type="button">
                    Edit
                  </button>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingTimesheet ? "Edit Timesheet" : "New Timesheet"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingTimesheet ? editingTimesheet.employeeName : "Enter employee timesheet hours"}
        widthClassName="sm:max-w-4xl"
      >
            <TimesheetForm
              employeeOptions={employeeOptions}
              projectOptions={projectOptions}
              activityOptions={availableActivityOptions}
              activityHint={activityHint}
              onFilterChange={({ userId, projectId, entryMode }) => {
                setTimesheetFilters({ userId, projectId, entryMode });
                if (projectId) {
                  void ensureActivitiesLoaded(projectId).catch(() => {
                    setFormError("Activities could not be loaded for the selected project.");
                  });
                }
              }}
              onSubmit={handleSave}
              onCancel={closeModal}
              error={formError}
              isSubmitting={isSaving}
              submitLabel={editingTimesheet ? "Update Timesheet" : "Create Timesheet"}
              initialValues={initialFormValues}
            />
      </SidebarDrawer>
    </AppShell>
  );
}
