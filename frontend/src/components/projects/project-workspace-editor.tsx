"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type InputHTMLAttributes, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { AppShell } from "@/components/layout/app-shell";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { projectApi } from "@/lib/api";
import type { ActivityItem, MilestoneItem, ProjectRecord, ProjectWorkspace, WbsRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { ActivityForm, type ActivityFormValues } from "@/components/activities/activity-form";
import { MilestoneForm, type MilestoneFormValues } from "@/components/milestones/milestone-form";
import { WbsForm, type WbsFormValues } from "@/components/wbs/wbs-form";

type TabKey = "wbs" | "activities" | "milestones" | "gantt";

type ProjectDraft = {
  projectCode: string;
  projectName: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
};

type DraftWbs = {
  id: string | null;
  clientKey: string;
  wbsCode: string;
  wbsName: string;
  levelNo: number;
  progressPercent: number;
  budgetAmount: number;
  actualAmount: number;
};

type DraftActivity = {
  id: string | null;
  clientKey: string;
  activityCode: string;
  activityName: string;
  wbsClientKey: string;
  plannedStart: string;
  plannedEnd: string;
  durationDays: number;
  progressPercent: number;
  status: string;
  responsibleUser: string;
};

type DraftMilestone = {
  id: string | null;
  clientKey: string;
  milestoneCode: string;
  milestoneName: string;
  wbsClientKey: string;
  plannedDate: string;
  actualDate: string;
  status: string;
};

type PopupState<T> = {
  isOpen: boolean;
  draft: T;
  editingKey: string | null;
  error: string | null;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "wbs", label: "WBS" },
  { key: "activities", label: "Activities" },
  { key: "milestones", label: "Milestones" },
  { key: "gantt", label: "Gantt Chart" },
];

const emptyProjectDraft = (): ProjectDraft => ({
  projectCode: "",
  projectName: "",
  clientName: "",
  projectManager: "",
  startDate: "",
  endDate: "",
  budgetAmount: 0,
});

function createKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyWbs(): DraftWbs {
  return {
    id: null,
    clientKey: createKey("wbs"),
    wbsCode: "",
    wbsName: "",
    levelNo: 1,
    progressPercent: 0,
    budgetAmount: 0,
    actualAmount: 0,
  };
}

function createEmptyActivity(wbsClientKey = ""): DraftActivity {
  return {
    id: null,
    clientKey: createKey("act"),
    activityCode: "",
    activityName: "",
    wbsClientKey,
    plannedStart: "",
    plannedEnd: "",
    durationDays: 1,
    progressPercent: 0,
    status: "Not Started",
    responsibleUser: "",
  };
}

function createEmptyMilestone(wbsClientKey = ""): DraftMilestone {
  return {
    id: null,
    clientKey: createKey("mil"),
    milestoneCode: "",
    milestoneName: "",
    wbsClientKey,
    plannedDate: "",
    actualDate: "",
    status: "PLANNED",
  };
}

function createPopupState<T>(draft: T): PopupState<T> {
  return {
    isOpen: false,
    draft,
    editingKey: null,
    error: null,
  };
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
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.defaultMessage === "string") {
    return data.errors[0].defaultMessage;
  }
  return fallbackMessage;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function formatMonthShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function formatYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatFullDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(1);
  return next;
}

function startOfYear(date: Date) {
  const next = startOfDay(date);
  next.setMonth(0, 1);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete")) {
    return "bg-emerald-500";
  }
  if (normalized.includes("delay") || normalized.includes("risk")) {
    return "bg-rose-500";
  }
  if (normalized.includes("progress")) {
    return "bg-amber-500";
  }
  return "bg-[color:var(--surface-muted)]0";
}

function toProjectRecord(project: Omit<ProjectRecord, "id"> & { id: number | string }): ProjectRecord {
  return {
    ...project,
    id: String(project.id),
  };
}

function mapWorkspace(responseData: {
  project: Omit<ProjectRecord, "id"> & { id: number | string };
  wbs: Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>;
  activities: Array<Omit<ActivityItem, "id" | "projectId" | "wbsId"> & { id: number | string; projectId: number | string; wbsId: number | string }>;
  milestones: Array<Omit<MilestoneItem, "id" | "projectId" | "wbsId"> & { id: number | string; projectId: number | string; wbsId: number | string | null }>;
}): ProjectWorkspace {
  return {
    project: toProjectRecord(responseData.project),
    wbs: responseData.wbs.map((row) => ({ ...row, id: String(row.id), projectId: String(row.projectId) })),
    activities: responseData.activities.map((row) => ({
      ...row,
      id: String(row.id),
      projectId: String(row.projectId),
      wbsId: String(row.wbsId),
    })),
    milestones: responseData.milestones.map((row) => ({
      ...row,
      id: String(row.id),
      projectId: String(row.projectId),
      wbsId: row.wbsId == null ? null : String(row.wbsId),
    })),
  };
}

function projectToDraft(project: ProjectRecord): ProjectDraft {
  return {
    projectCode: project.projectCode,
    projectName: project.projectName,
    clientName: project.clientName,
    projectManager: project.projectManager,
    startDate: project.startDate,
    endDate: project.endDate,
    budgetAmount: project.budgetAmount,
  };
}

function workspaceToDraft(workspace: ProjectWorkspace) {
  const wbsDraft = workspace.wbs.map((row) => ({
    id: row.id,
    clientKey: createKey(`wbs-${row.id}`),
    wbsCode: row.wbsCode,
    wbsName: row.wbsName,
    levelNo: row.levelNo,
    progressPercent: row.progressPercent,
    budgetAmount: row.budgetAmount,
    actualAmount: row.actualAmount,
  }));

  const wbsClientKeyById = new Map(wbsDraft.map((row) => [row.id, row.clientKey]));

  return {
    project: projectToDraft(workspace.project),
    wbs: wbsDraft,
    activities: workspace.activities.map((row) => ({
      id: row.id,
      clientKey: createKey(`act-${row.id}`),
      activityCode: row.activityCode,
      activityName: row.activityName,
      wbsClientKey: wbsClientKeyById.get(row.wbsId) ?? "",
      plannedStart: row.plannedStart,
      plannedEnd: row.plannedEnd,
      durationDays: row.durationDays,
      progressPercent: row.progressPercent,
      status: row.status,
      responsibleUser: row.responsibleUser,
    })),
    milestones: workspace.milestones.map((row) => ({
      id: row.id,
      clientKey: createKey(`mil-${row.id}`),
      milestoneCode: row.milestoneCode,
      milestoneName: row.milestoneName,
      wbsClientKey: row.wbsId ? (wbsClientKeyById.get(row.wbsId) ?? "") : "",
      plannedDate: row.plannedDate,
      actualDate: row.actualDate ?? "",
      status: row.status,
    })),
  };
}

function computeDurationDays(start: string, end: string, fallback: number) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate || endDate < startDate) {
    return fallback;
  }

  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}

type WbsTreeRow = DraftWbs & {
  continuationLevels: number[];
  hasNextSibling: boolean;
};

type EmbeddedTimelineRow = {
  id: string;
  type: "wbs" | "activity";
  code: string;
  name: string;
  status: string;
  owner?: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  level: number;
};

type EmbeddedZoomMode = "day" | "month" | "year";

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-sm outline-none ${props.className ?? ""}`} />;
}

function hasNextSiblingAtLevel(rows: DraftWbs[], startIndex: number, targetLevel: number) {
  for (let index = startIndex + 1; index < rows.length; index += 1) {
    const nextLevel = rows[index]?.levelNo ?? 0;
    if (nextLevel < targetLevel) {
      return false;
    }
    if (nextLevel === targetLevel) {
      return true;
    }
  }

  return false;
}

type ProjectWorkspaceEditorProps = {
  projectId: string | null;
};

export function ProjectWorkspaceEditor({ projectId }: ProjectWorkspaceEditorProps) {
  const router = useRouter();
  const { setSelectedProjectId } = useAppStore();
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [wbsDraft, setWbsDraft] = useState<DraftWbs[]>([]);
  const [activitiesDraft, setActivitiesDraft] = useState<DraftActivity[]>([]);
  const [milestonesDraft, setMilestonesDraft] = useState<DraftMilestone[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("wbs");
  const [embeddedZoomMode, setEmbeddedZoomMode] = useState<EmbeddedZoomMode>("month");
  const [embeddedViewDate, setEmbeddedViewDate] = useState<Date | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [wbsPopup, setWbsPopup] = useState<PopupState<DraftWbs>>(createPopupState(createEmptyWbs()));
  const [activityPopup, setActivityPopup] = useState<PopupState<DraftActivity>>(createPopupState(createEmptyActivity()));
  const [milestonePopup, setMilestonePopup] = useState<PopupState<DraftMilestone>>(createPopupState(createEmptyMilestone()));

  const activityWbsOptions = useMemo(
    () => wbsDraft.map((row) => ({ id: row.clientKey, label: `${row.wbsCode || "New WBS"} - ${row.wbsName || "Untitled"}` })),
    [wbsDraft],
  );

  const milestoneWbsOptions = activityWbsOptions;

  const embeddedTimelineRows = useMemo<EmbeddedTimelineRow[]>(() => {
    const activitiesByWbs = new Map<string, DraftActivity[]>();
    activitiesDraft.forEach((activity) => {
      const group = activitiesByWbs.get(activity.wbsClientKey) ?? [];
      group.push(activity);
      activitiesByWbs.set(activity.wbsClientKey, group);
    });

    return wbsDraft.flatMap((wbs) => {
      const wbsActivities = activitiesByWbs.get(wbs.clientKey) ?? [];
      const datedActivities = wbsActivities.filter((activity) => parseDate(activity.plannedStart) && parseDate(activity.plannedEnd));
      const starts = datedActivities.map((activity) => parseDate(activity.plannedStart)).filter((date): date is Date => Boolean(date));
      const ends = datedActivities.map((activity) => parseDate(activity.plannedEnd)).filter((date): date is Date => Boolean(date));
      const fallbackStart = parseDate(projectDraft.startDate) ?? new Date();
      const fallbackEnd = parseDate(projectDraft.endDate) ?? fallbackStart;
      const startDate = starts.length ? new Date(Math.min(...starts.map((date) => date.getTime()))) : fallbackStart;
      const endDate = ends.length ? new Date(Math.max(...ends.map((date) => date.getTime()))) : fallbackEnd;

      const wbsRow: EmbeddedTimelineRow = {
        id: `wbs-${wbs.clientKey}`,
        type: "wbs",
        code: wbs.wbsCode,
        name: wbs.wbsName,
        status: "WBS",
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        progressPercent: wbs.progressPercent,
        level: wbs.levelNo,
      };

      const activityRows = wbsActivities
        .filter((activity) => activity.plannedStart && activity.plannedEnd)
        .map((activity) => ({
          id: `activity-${activity.clientKey}`,
          type: "activity" as const,
          code: activity.activityCode,
          name: activity.activityName,
          status: activity.status,
          owner: activity.responsibleUser,
          startDate: activity.plannedStart,
          endDate: activity.plannedEnd,
          progressPercent: activity.progressPercent,
          level: wbs.levelNo + 1,
        }));

      return [wbsRow, ...activityRows];
    });
  }, [activitiesDraft, projectDraft.endDate, projectDraft.startDate, wbsDraft]);

  const embeddedDefaultViewDate = useMemo(
    () =>
      parseDate(projectDraft.startDate) ??
      embeddedTimelineRows.map((row) => parseDate(row.startDate)).find((date): date is Date => Boolean(date)) ??
      new Date(),
    [embeddedTimelineRows, projectDraft.startDate],
  );

  const activeEmbeddedViewDate = embeddedViewDate ?? embeddedDefaultViewDate;

  const embeddedTimelineFrame = useMemo(() => {
    if (embeddedZoomMode === "day") {
      const start = startOfDay(activeEmbeddedViewDate);
      const end = addDays(start, 1);
      const columnWidth = 64;
      const columns = Array.from({ length: 24 }, (_, hour) => {
        const columnStart = new Date(start);
        columnStart.setHours(hour, 0, 0, 0);
        const columnEnd = new Date(start);
        columnEnd.setHours(hour + 1, 0, 0, 0);
        return {
          key: `hour-${hour}`,
          start: columnStart,
          end: columnEnd,
          majorLabel: formatFullDay(start),
          minorTop: `${String(hour).padStart(2, "0")}:00`,
          minorBottom: hour < 12 ? "AM" : "PM",
          shaded: hour < 6 || hour >= 18,
        };
      });

      return {
        start,
        end,
        title: formatFullDay(start),
        columns,
        columnWidth,
        width: Math.max(1536, columns.length * columnWidth),
      };
    }

    if (embeddedZoomMode === "year") {
      const start = startOfYear(activeEmbeddedViewDate);
      const end = addYears(start, 1);
      const columnWidth = 110;
      const columns = Array.from({ length: 12 }, (_, monthOffset) => {
        const columnStart = addMonths(start, monthOffset);
        const columnEnd = addMonths(start, monthOffset + 1);
        return {
          key: `month-${monthOffset}`,
          start: columnStart,
          end: columnEnd,
          majorLabel: formatYear(start),
          minorTop: formatMonthShort(columnStart),
          minorBottom: formatYear(columnStart),
          shaded: monthOffset % 2 === 1,
        };
      });

      return {
        start,
        end,
        title: formatYear(start),
        columns,
        columnWidth,
        width: Math.max(1320, columns.length * columnWidth),
      };
    }

    const start = startOfMonth(activeEmbeddedViewDate);
    const end = addMonths(start, 1);
    const columnWidth = 40;
    const totalDays = daysBetween(start, addDays(end, -1));
    const columns = Array.from({ length: totalDays }, (_, dayOffset) => {
      const columnStart = addDays(start, dayOffset);
      const columnEnd = addDays(columnStart, 1);
      return {
        key: `day-${dayOffset}`,
        start: columnStart,
        end: columnEnd,
        majorLabel: formatMonth(start),
        minorTop: formatWeekday(columnStart),
        minorBottom: String(columnStart.getDate()),
        shaded: columnStart.getDay() === 0 || columnStart.getDay() === 6,
      };
    });

    return {
      start,
      end,
      title: formatMonth(start),
      columns,
      columnWidth,
      width: Math.max(1240, columns.length * columnWidth),
    };
  }, [activeEmbeddedViewDate, embeddedZoomMode]);

  const embeddedMajorBands = useMemo(() => {
    if (!embeddedTimelineFrame || embeddedTimelineFrame.columns.length === 0) {
      return [];
    }

    const bands: Array<{ key: string; label: string; left: number; width: number }> = [];
    let currentLabel = embeddedTimelineFrame.columns[0].majorLabel;
    let startIndex = 0;

    for (let index = 1; index <= embeddedTimelineFrame.columns.length; index += 1) {
      const nextLabel = embeddedTimelineFrame.columns[index]?.majorLabel;
      if (index < embeddedTimelineFrame.columns.length && nextLabel === currentLabel) {
        continue;
      }

      bands.push({
        key: `${currentLabel}-${startIndex}`,
        label: currentLabel,
        left: startIndex * embeddedTimelineFrame.columnWidth,
        width: (index - startIndex) * embeddedTimelineFrame.columnWidth,
      });

      currentLabel = nextLabel ?? "";
      startIndex = index;
    }

    return bands;
  }, [embeddedTimelineFrame]);

  function getEmbeddedPositionPx(date: Date) {
    if (!embeddedTimelineFrame) {
      return 0;
    }

    const totalDuration = embeddedTimelineFrame.end.getTime() - embeddedTimelineFrame.start.getTime();
    if (totalDuration <= 0) {
      return 0;
    }

    const clampedTime = Math.min(Math.max(date.getTime(), embeddedTimelineFrame.start.getTime()), embeddedTimelineFrame.end.getTime());
    return ((clampedTime - embeddedTimelineFrame.start.getTime()) / totalDuration) * embeddedTimelineFrame.width;
  }

  function handleEmbeddedPrevious() {
    setEmbeddedViewDate((current) => {
      const baseDate = current ?? embeddedDefaultViewDate;
      if (embeddedZoomMode === "day") {
        return addDays(baseDate, -1);
      }
      if (embeddedZoomMode === "year") {
        return addYears(baseDate, -1);
      }
      return addMonths(baseDate, -1);
    });
  }

  function handleEmbeddedNext() {
    setEmbeddedViewDate((current) => {
      const baseDate = current ?? embeddedDefaultViewDate;
      if (embeddedZoomMode === "day") {
        return addDays(baseDate, 1);
      }
      if (embeddedZoomMode === "year") {
        return addYears(baseDate, 1);
      }
      return addMonths(baseDate, 1);
    });
  }

  const wbsTreeRows = useMemo<WbsTreeRow[]>(
    () =>
      wbsDraft.map((row, index, rows) => ({
        ...row,
        continuationLevels: Array.from({ length: Math.max(0, row.levelNo - 1) }, (_, levelIndex) => levelIndex + 1).filter((level) =>
          hasNextSiblingAtLevel(rows, index, level),
        ),
        hasNextSibling: hasNextSiblingAtLevel(rows, index, row.levelNo),
      })),
    [wbsDraft],
  );

  const projectDisplayName = projectDraft.projectName.trim() || "Untitled Project";
  const projectDisplayCode = projectDraft.projectCode.trim() || "New Project";

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (!projectId) {
        setProjectDraft(emptyProjectDraft());
        setWbsDraft([]);
        setActivitiesDraft([]);
        setMilestonesDraft([]);
        setActiveTab("wbs");
        setLoadError(null);
        setSaveError(null);
        setSaveSuccess(null);
        return;
      }

      try {
        setIsWorkspaceLoading(true);
        setLoadError(null);
        setSaveError(null);
        setSaveSuccess(null);
        const response = await projectApi.getProjectWorkspace(projectId);
        if (cancelled) {
          return;
        }

        const workspace = mapWorkspace(response.data.data as Parameters<typeof mapWorkspace>[0]);
        const draft = workspaceToDraft(workspace);
        setProjectDraft(draft.project);
        setWbsDraft(draft.wbs);
        setActivitiesDraft(draft.activities);
        setMilestonesDraft(draft.milestones);
        setSelectedProjectId(projectId);
      } catch (workspaceError: unknown) {
        if (!cancelled) {
          setLoadError(extractApiError(workspaceError, "Project workspace could not be loaded."));
        }
      } finally {
        if (!cancelled) {
          setIsWorkspaceLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [projectId, setSelectedProjectId]);

  function validateDraft() {
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
      return "Project start and end dates are required.";
    }
    if (new Date(projectDraft.endDate) < new Date(projectDraft.startDate)) {
      return "Project end date must be on or after the start date.";
    }

    for (const row of wbsDraft) {
      if (!row.wbsCode.trim() || !row.wbsName.trim()) {
        return "Every WBS row needs code and name.";
      }
    }

    for (const row of activitiesDraft) {
      if (!row.activityCode.trim() || !row.activityName.trim()) {
        return "Every activity row needs code and name.";
      }
      if (!row.wbsClientKey) {
        return "Every activity must be linked to a WBS row.";
      }
      if (!row.plannedStart || !row.plannedEnd) {
        return "Every activity needs planned start and end dates.";
      }
      if (new Date(row.plannedEnd) < new Date(row.plannedStart)) {
        return `Activity ${row.activityCode || row.activityName || "row"} has an invalid date range.`;
      }
    }

    for (const row of milestonesDraft) {
      if (!row.milestoneCode.trim() || !row.milestoneName.trim() || !row.plannedDate) {
        return "Every milestone row needs code, name, and planned date.";
      }
    }

    return null;
  }

  function openWbsPopup(row?: DraftWbs) {
    setWbsPopup({
      isOpen: true,
      draft: row ? { ...row } : createEmptyWbs(),
      editingKey: row?.clientKey ?? null,
      error: null,
    });
  }

  function openActivityPopup(row?: DraftActivity) {
    if (wbsDraft.length === 0) {
      setSaveError("Add at least one WBS record before adding activities.");
      return;
    }

    setActivityPopup({
      isOpen: true,
      draft: row ? { ...row } : createEmptyActivity(wbsDraft[0]?.clientKey ?? ""),
      editingKey: row?.clientKey ?? null,
      error: null,
    });
  }

  function openMilestonePopup(row?: DraftMilestone) {
    setMilestonePopup({
      isOpen: true,
      draft: row ? { ...row } : createEmptyMilestone(""),
      editingKey: row?.clientKey ?? null,
      error: null,
    });
  }

  function closeWbsPopup() {
    setWbsPopup(createPopupState(createEmptyWbs()));
  }

  function closeActivityPopup() {
    setActivityPopup(createPopupState(createEmptyActivity(wbsDraft[0]?.clientKey ?? "")));
  }

  function closeMilestonePopup() {
    setMilestonePopup(createPopupState(createEmptyMilestone("")));
  }

  function saveWbsDraft(values: WbsFormValues) {
    const nextDraft: DraftWbs = {
      ...wbsPopup.draft,
      wbsCode: values.wbsCode,
      wbsName: values.wbsName,
      levelNo: values.levelNo,
      progressPercent: values.progressPercent,
      budgetAmount: values.budgetAmount,
      actualAmount: values.actualAmount,
    };

    setWbsDraft((current) => {
      if (!wbsPopup.editingKey) {
        return [...current, nextDraft];
      }

      return current.map((row) => (row.clientKey === wbsPopup.editingKey ? nextDraft : row));
    });
    closeWbsPopup();
  }

  function saveActivityDraft(values: ActivityFormValues) {
    const nextDraft: DraftActivity = {
      ...activityPopup.draft,
      activityCode: values.activityCode,
      activityName: values.activityName,
      wbsClientKey: values.wbsId,
      plannedStart: values.plannedStart,
      plannedEnd: values.plannedEnd,
      durationDays: computeDurationDays(values.plannedStart, values.plannedEnd, values.durationDays),
      progressPercent: values.progressPercent,
      status: values.status,
      responsibleUser: values.responsibleUser,
    };

    setActivitiesDraft((current) => {
      if (!activityPopup.editingKey) {
        return [...current, nextDraft];
      }

      return current.map((item) => (item.clientKey === activityPopup.editingKey ? nextDraft : item));
    });
    closeActivityPopup();
  }

  function saveMilestoneDraft(values: MilestoneFormValues) {
    const row: DraftMilestone = {
      ...milestonePopup.draft,
      milestoneCode: values.milestoneCode,
      milestoneName: values.milestoneName,
      wbsClientKey: values.wbsId,
      plannedDate: values.plannedDate,
      actualDate: values.actualDate ?? "",
      status: values.status,
    };

    setMilestonesDraft((current) => {
      if (!milestonePopup.editingKey) {
        return [...current, row];
      }

      return current.map((item) => (item.clientKey === milestonePopup.editingKey ? { ...row } : item));
    });
    closeMilestonePopup();
  }

  async function handleSaveAll() {
    const validationError = validateDraft();
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess(null);
      return;
    }

    const wbsIdByClientKey = new Map(wbsDraft.filter((row) => row.id).map((row) => [row.clientKey, Number(row.id)]));

    const payload = {
      project: {
        ...projectDraft,
        budgetAmount: Number(projectDraft.budgetAmount),
      },
      wbs: wbsDraft.map((row) => ({
        id: row.id ? Number(row.id) : null,
        clientKey: row.clientKey,
        wbsCode: row.wbsCode,
        wbsName: row.wbsName,
        levelNo: Number(row.levelNo),
        progressPercent: Number(row.progressPercent),
        budgetAmount: Number(row.budgetAmount),
        actualAmount: Number(row.actualAmount),
      })),
      activities: activitiesDraft.map((row) => ({
        id: row.id ? Number(row.id) : null,
        clientKey: row.clientKey,
        wbsId: wbsIdByClientKey.get(row.wbsClientKey) ?? null,
        wbsClientKey: row.wbsClientKey || null,
        activityCode: row.activityCode,
        activityName: row.activityName,
        plannedStart: row.plannedStart,
        plannedEnd: row.plannedEnd,
        durationDays: Number(computeDurationDays(row.plannedStart, row.plannedEnd, row.durationDays)),
        progressPercent: Number(row.progressPercent),
        status: row.status,
        responsibleUser: row.responsibleUser,
      })),
      milestones: milestonesDraft.map((row) => ({
        id: row.id ? Number(row.id) : null,
        clientKey: row.clientKey,
        wbsId: row.wbsClientKey ? (wbsIdByClientKey.get(row.wbsClientKey) ?? null) : null,
        wbsClientKey: row.wbsClientKey || null,
        milestoneCode: row.milestoneCode,
        milestoneName: row.milestoneName,
        plannedDate: row.plannedDate,
        actualDate: row.actualDate || null,
        status: row.status,
      })),
    };

    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const response = projectId
        ? await projectApi.updateProjectWorkspace(projectId, payload)
        : await projectApi.createProjectWorkspace(payload);

      const workspace = mapWorkspace(response.data.data as Parameters<typeof mapWorkspace>[0]);
      const draft = workspaceToDraft(workspace);
      setProjectDraft(draft.project);
      setWbsDraft(draft.wbs);
      setActivitiesDraft(draft.activities);
      setMilestonesDraft(draft.milestones);
      setSelectedProjectId(workspace.project.id);
      if (!projectId) {
        router.replace(`/projects/${workspace.project.id}`);
      }
      setSaveSuccess("Project workspace saved successfully.");
    } catch (saveWorkspaceError: unknown) {
      setSaveError(extractApiError(saveWorkspaceError, "Project workspace could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title={projectId ? "Project detail workspace" : "New project workspace"}
      subtitle="Edit the project header, manage WBS, activities, milestones in popup forms, and save everything together with one main action."
    >
      <SectionCard
        title={projectId ? "Project detail workspace" : "New project workspace"}
        eyebrow="Full Edit"
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]" href="/projects">
              Back to Projects
            </Link>
            <button
              className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isWorkspaceLoading || isSaving}
              onClick={() => void handleSaveAll()}
              type="button"
            >
              {isSaving ? "Saving All..." : "Save All"}
            </button>
          </div>
        }
      >
        {loadError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p> : null}
        {saveError ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{saveError}</p> : null}
        {saveSuccess ? <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{saveSuccess}</p> : null}

        {isWorkspaceLoading ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading workspace...</div>
        ) : (
          <>
            <div className="mb-6 rounded-[24px] border border-line bg-brand-strong/8 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Project Name</p>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-brand-strong">{projectDisplayName}</h2>
                  <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
                    Code: {projectDisplayCode}
                    {projectDraft.clientName.trim() ? ` • Client: ${projectDraft.clientName.trim()}` : ""}
                  </p>
                </div>
                <p className="text-sm text-[color:var(--foreground-muted)]">{projectId ? "Editing existing project" : "Creating new project"}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Code</span>
                <TextInput value={projectDraft.projectCode} onChange={(event) => setProjectDraft((current) => ({ ...current, projectCode: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Name</span>
                <TextInput value={projectDraft.projectName} onChange={(event) => setProjectDraft((current) => ({ ...current, projectName: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Client</span>
                <TextInput value={projectDraft.clientName} onChange={(event) => setProjectDraft((current) => ({ ...current, clientName: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Project Manager</span>
                <TextInput value={projectDraft.projectManager} onChange={(event) => setProjectDraft((current) => ({ ...current, projectManager: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Start Date</span>
                <TextInput type="date" value={projectDraft.startDate} onChange={(event) => setProjectDraft((current) => ({ ...current, startDate: event.target.value }))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">End Date</span>
                <TextInput type="date" value={projectDraft.endDate} onChange={(event) => setProjectDraft((current) => ({ ...current, endDate: event.target.value }))} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Budget Amount</span>
                <TextInput
                  min={0}
                  step="0.01"
                  type="number"
                  value={projectDraft.budgetAmount}
                  onChange={(event) => setProjectDraft((current) => ({ ...current, budgetAmount: Number(event.target.value) }))}
                />
              </label>
            </div>

            <div className="mt-8 border-t border-line pt-6">
              <div className="mb-6 flex flex-wrap gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.key ? "bg-brand-strong text-white" : "border border-line bg-[color:var(--surface-raised)] text-[color:var(--foreground)]"
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "wbs" ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-4 py-2 text-sm font-semibold text-brand-strong" onClick={() => openWbsPopup()} type="button">
                      Add WBS
                    </button>
                  </div>
                  {wbsDraft.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-line bg-[color:var(--surface-soft)] px-4 py-10 text-sm text-[color:var(--foreground-muted)]">
                      No WBS records yet. Use Add WBS to create the project structure.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[22px] border border-line">
                      <div className="grid min-w-[920px] grid-cols-[minmax(320px,2.2fr)_80px_100px_140px_140px_90px] bg-[color:var(--surface-soft)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">
                        <div className="px-4 py-3 font-semibold">WBS Hierarchy</div>
                        <div className="px-4 py-3 font-semibold">Level</div>
                        <div className="px-4 py-3 font-semibold">Progress</div>
                        <div className="px-4 py-3 font-semibold">Budget</div>
                        <div className="px-4 py-3 font-semibold">Actual</div>
                        <div className="px-4 py-3 font-semibold">Action</div>
                      </div>
                      <div className="divide-y divide-line bg-[color:var(--surface-soft)]">
                        {wbsTreeRows.map((row) => (
                          <div key={row.clientKey} className="grid min-w-[920px] grid-cols-[minmax(320px,2.2fr)_80px_100px_140px_140px_90px] items-center text-sm text-[color:var(--foreground)] hover:bg-[color:var(--surface-soft)]">
                            <div className="px-4 py-3">
                              <div className="flex min-h-12 items-center">
                                {Array.from({ length: Math.max(0, row.levelNo - 1) }, (_, levelIndex) => {
                                  const level = levelIndex + 1;
                                  return (
                                    <div key={`${row.clientKey}-level-${level}`} className="relative h-12 w-6 shrink-0">
                                      {row.continuationLevels.includes(level) ? <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-300" /> : null}
                                    </div>
                                  );
                                })}
                                <div className="relative mr-3 h-12 w-8 shrink-0">
                                  <span className={`absolute left-1/2 top-0 w-px -translate-x-1/2 bg-slate-300 ${row.levelNo > 1 ? "h-1/2" : "h-0"}`} />
                                  <span className={`absolute left-1/2 top-1/2 h-px -translate-y-1/2 bg-slate-300 ${row.levelNo > 1 ? "w-6" : "w-3"}`} />
                                  {row.hasNextSibling ? <span className="absolute left-1/2 top-1/2 h-1/2 w-px -translate-x-1/2 bg-slate-300" /> : null}
                                  <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-brand-strong bg-[color:var(--surface-raised)]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{row.wbsCode}</p>
                                  <p className="mt-1 truncate font-semibold text-brand-strong">{row.wbsName}</p>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-3">{row.levelNo}</div>
                            <div className="px-4 py-3">{row.progressPercent}%</div>
                            <div className="px-4 py-3">{formatCurrency(row.budgetAmount)}</div>
                            <div className="px-4 py-3">{formatCurrency(row.actualAmount)}</div>
                            <div className="px-4 py-3">
                              <button
                                className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                                onClick={() => openWbsPopup(row)}
                                type="button"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === "activities" ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-4 py-2 text-sm font-semibold text-brand-strong" onClick={() => openActivityPopup()} type="button">
                      Add Activity
                    </button>
                  </div>
                  {activitiesDraft.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-line bg-[color:var(--surface-soft)] px-4 py-10 text-sm text-[color:var(--foreground-muted)]">
                      No activities yet. Add activity records in a popup and save them together with the project.
                    </div>
                  ) : (
                    <DataTable
                      columns={[
                        { key: "activityCode", header: "Code" },
                        { key: "activityName", header: "Activity" },
                        {
                          key: "wbsCode",
                          header: "WBS",
                          render: (row) => wbsDraft.find((wbs) => wbs.clientKey === row.wbsClientKey)?.wbsCode ?? "Unknown",
                        },
                        { key: "plannedStart", header: "Start" },
                        { key: "plannedEnd", header: "Finish" },
                        { key: "durationDays", header: "Duration" },
                        { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
                        { key: "responsibleUser", header: "Responsible" },
                        {
                          key: "status",
                          header: "Status",
                          render: (row) => <span className="rounded-full bg-[color:var(--surface-raised)] px-3 py-1 text-xs font-semibold">{row.status}</span>,
                        },
                        {
                          key: "actions",
                          header: "Actions",
                          render: (row) => (
                            <button
                              className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                              onClick={() => openActivityPopup(row)}
                              type="button"
                            >
                              Edit
                            </button>
                          ),
                        },
                      ]}
                      rows={activitiesDraft.map((row) => ({ ...row, id: row.id ?? row.clientKey }))}
                    />
                  )}
                </div>
              ) : null}

              {activeTab === "milestones" ? (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button className="rounded-full border border-line bg-[color:var(--surface-raised)] px-4 py-2 text-sm font-semibold text-brand-strong" onClick={() => openMilestonePopup()} type="button">
                      Add Milestone
                    </button>
                  </div>
                  {milestonesDraft.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-line bg-[color:var(--surface-soft)] px-4 py-10 text-sm text-[color:var(--foreground-muted)]">
                      No milestones yet. Add milestone records from the popup form.
                    </div>
                  ) : (
                    <DataTable
                      columns={[
                        { key: "milestoneCode", header: "Code" },
                        { key: "milestoneName", header: "Milestone" },
                        {
                          key: "wbsCode",
                          header: "WBS",
                          render: (row) => wbsDraft.find((wbs) => wbs.clientKey === row.wbsClientKey)?.wbsCode ?? "Project",
                        },
                        { key: "plannedDate", header: "Planned" },
                        { key: "actualDate", header: "Actual", render: (row) => row.actualDate || "Pending" },
                        { key: "status", header: "Status", render: (row) => formatStatus(row.status) },
                        {
                          key: "actions",
                          header: "Actions",
                          render: (row) => (
                            <button
                              className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                              onClick={() => openMilestonePopup(row)}
                              type="button"
                            >
                              Edit
                            </button>
                          ),
                        },
                      ]}
                      rows={milestonesDraft.map((row) => ({ ...row, id: row.id ?? row.clientKey }))}
                    />
                  )}
                </div>
              ) : null}

              {activeTab === "gantt" ? (
                <div className="space-y-6">
                  {!embeddedTimelineFrame || embeddedTimelineRows.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-line bg-[color:var(--surface-soft)] px-4 py-10 text-sm text-[color:var(--foreground-muted)]">
                      Add WBS, activities, and milestones with planned dates to populate the Gantt chart.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="rounded-[24px] border border-line bg-[color:var(--surface-soft)] p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Project Timeline</p>
                          <h3 className="mt-2 text-xl font-semibold text-brand-strong">
                            {projectDraft.projectCode || "Project"} timeline
                          </h3>
                          <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">
                            {embeddedTimelineFrame.title}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
                          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">WBS</p>
                            <p className="mt-1 text-xl font-semibold text-brand-strong">{wbsDraft.length}</p>
                          </div>
                          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Activities</p>
                            <p className="mt-1 text-xl font-semibold text-brand-strong">{activitiesDraft.length}</p>
                          </div>
                          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Milestones</p>
                            <p className="mt-1 text-xl font-semibold text-brand-strong">{milestonesDraft.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-[24px] border border-line bg-[color:var(--surface-soft)]">
                        <div className="border-b border-line bg-[color:var(--surface-soft)] px-4 py-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">
                              Project Gantt view aligned with WBS, activities, and milestones saved in this workspace.
                            </p>
                            <p className="mt-1 text-xs text-[color:var(--foreground-subtle)]">
                              Day shows hours, month shows days, and year shows months. Use previous and next to move the visible window.
                            </p>
                          </div>

                          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="inline-flex flex-wrap rounded-full border border-line bg-[color:var(--surface-raised)] p-1">
                              {(["day", "month", "year"] as EmbeddedZoomMode[]).map((mode) => (
                                <button
                                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                    embeddedZoomMode === mode ? "bg-brand text-white" : "text-[color:var(--foreground-muted)] hover:bg-slate-100"
                                  }`}
                                  key={mode}
                                  onClick={() => setEmbeddedZoomMode(mode)}
                                  type="button"
                                >
                                  {mode[0].toUpperCase() + mode.slice(1)} view
                                </button>
                              ))}
                            </div>

                            <div className="inline-flex flex-wrap items-center rounded-full border border-line bg-[color:var(--surface-raised)] p-1">
                              <button
                                className="rounded-full px-3 py-1.5 text-sm font-semibold text-[color:var(--foreground-muted)] transition hover:bg-slate-100"
                                onClick={handleEmbeddedPrevious}
                                type="button"
                              >
                                Prev
                              </button>
                              <div className="flex items-center px-3 text-sm font-semibold text-brand-strong">{embeddedTimelineFrame.title}</div>
                              <button
                                className="rounded-full px-3 py-1.5 text-sm font-semibold text-[color:var(--foreground-muted)] transition hover:bg-slate-100"
                                onClick={handleEmbeddedNext}
                                type="button"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] border-b border-line bg-[color:var(--surface-soft)] text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)] sm:grid-cols-[320px_minmax(620px,1fr)]">
                          <div className="px-4 py-3">Task</div>
                          <div className="overflow-x-auto px-4 py-3">
                            <div className="relative rounded-2xl border border-line/70 bg-[color:var(--surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" style={{ width: `${embeddedTimelineFrame.width}px` }}>
                              <div className="surface-muted relative h-9 border-b border-line/70">
                                {embeddedMajorBands.map((band) => (
                                  <div
                                    className="absolute inset-y-0 flex items-center border-r border-line/70 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground-subtle)]"
                                    key={band.key}
                                    style={{ left: `${band.left}px`, width: `${band.width}px` }}
                                  >
                                    {band.label}
                                  </div>
                                ))}
                              </div>

                              <div className="relative h-12">
                                {embeddedTimelineFrame.columns.map((column, index) => (
                                  <div
                                    className={`absolute inset-y-0 border-r border-line/60 ${column.shaded ? "bg-amber-50/80" : "bg-[color:var(--surface-raised)]"}`}
                                    key={column.key}
                                    style={{ left: `${index * embeddedTimelineFrame.columnWidth}px`, width: `${embeddedTimelineFrame.columnWidth}px` }}
                                  >
                                    <div className="flex h-full flex-col items-center justify-center">
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground-subtle)]">{column.minorTop}</span>
                                      <span className="mt-1 text-xs font-semibold text-brand-strong">{column.minorBottom}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-[620px] overflow-auto">
                          {embeddedTimelineRows.map((row) => {
                            const start = parseDate(row.startDate);
                            const end = parseDate(row.endDate);
                            if (!start || !end) {
                              return null;
                            }

                            const left = getEmbeddedPositionPx(start);
                            const width = Math.max(18, getEmbeddedPositionPx(end) - left + 28);

                            return (
                              <div
                                className={`grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] border-b border-line last:border-b-0 sm:grid-cols-[320px_minmax(620px,1fr)] ${row.type === "wbs" ? "surface-muted" : "bg-[color:var(--surface-soft)]"}`}
                                key={row.id}
                              >
                                <div className="px-4 py-3">
                                  <div className="flex items-start gap-3" style={{ paddingLeft: `${Math.min(row.level, 4) * 10}px` }}>
                                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${row.type === "wbs" ? "bg-brand" : statusTone(row.status)}`} />
                                    <div>
                                      <p className="font-semibold text-brand-strong">
                                        {row.code} <span className="font-normal text-[color:var(--foreground-subtle)]">{row.name}</span>
                                      </p>
                                      <p className="mt-1 text-xs text-[color:var(--foreground-subtle)]">
                                        {row.status}
                                        {row.owner ? ` - ${row.owner}` : ""} - {row.progressPercent}%
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="overflow-x-auto px-4 py-4">
                                  <div className="relative min-h-[62px] rounded-2xl border border-line/60 bg-[color:var(--surface-soft)]" style={{ width: `${embeddedTimelineFrame.width}px` }}>
                                    {embeddedTimelineFrame.columns.map((column, index) => (
                                      <span
                                        aria-hidden="true"
                                        className={`absolute inset-y-0 border-r border-line/50 ${column.shaded ? "bg-amber-50/60" : "bg-transparent"}`}
                                        key={`${row.id}-${column.key}`}
                                        style={{ left: `${index * embeddedTimelineFrame.columnWidth}px`, width: `${embeddedTimelineFrame.columnWidth}px` }}
                                      />
                                    ))}
                                    <div
                                      className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-full ${row.type === "wbs" ? "bg-brand-strong/75" : "bg-brand/55"}`}
                                      style={{ left: `${left}px`, width: `${width}px` }}
                                    >
                                      <div className="h-full rounded-full bg-emerald-500/75" style={{ width: `${Math.min(Math.max(row.progressPercent, 0), 100)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {milestonesDraft.length > 0 ? (
                            <div className="grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] bg-amber-50/50 sm:grid-cols-[320px_minmax(620px,1fr)]">
                              <div className="px-4 py-4">
                                <p className="font-semibold text-brand-strong">Milestones</p>
                                <p className="mt-1 text-xs text-[color:var(--foreground-subtle)]">Planned milestone dates from this project workspace</p>
                              </div>
                              <div className="overflow-x-auto px-4 py-4">
                                <div className="relative min-h-[82px] rounded-2xl border border-line/60 bg-[color:var(--surface-soft)]" style={{ width: `${embeddedTimelineFrame.width}px` }}>
                                  {embeddedTimelineFrame.columns.map((column, index) => (
                                    <span
                                      aria-hidden="true"
                                      className={`absolute inset-y-0 border-r border-line/50 ${column.shaded ? "bg-amber-50/60" : "bg-transparent"}`}
                                      key={`milestone-${column.key}`}
                                      style={{ left: `${index * embeddedTimelineFrame.columnWidth}px`, width: `${embeddedTimelineFrame.columnWidth}px` }}
                                    />
                                  ))}
                                  {milestonesDraft.map((milestone) => {
                                    const plannedDate = parseDate(milestone.plannedDate);
                                    if (!plannedDate) {
                                      return null;
                                    }

                                    return (
                                      <div
                                        className="absolute top-4 -translate-x-1/2 text-center"
                                        key={milestone.clientKey}
                                        style={{ left: `${getEmbeddedPositionPx(plannedDate)}px` }}
                                        title={`${milestone.milestoneCode}: ${milestone.plannedDate}`}
                                      >
                                        <div className="mx-auto h-4 w-4 rotate-45 rounded-[4px] bg-highlight shadow-sm" />
                                        <p className="mt-2 max-w-[110px] truncate text-[11px] font-semibold text-brand-strong">{milestone.milestoneCode}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </SectionCard>

      <SidebarDrawer
        description="Add or edit a WBS record in the side panel, then save all project changes using the main Save button."
        eyebrow={wbsPopup.editingKey ? "Edit WBS" : "New WBS"}
        onClose={closeWbsPopup}
        open={wbsPopup.isOpen}
        title={wbsPopup.editingKey ? "Update WBS details" : "Add WBS details"}
        widthClassName="sm:max-w-3xl"
      >
        <WbsForm
          error={wbsPopup.error}
          initialValues={{
            wbsCode: wbsPopup.draft.wbsCode,
            wbsName: wbsPopup.draft.wbsName,
            levelNo: wbsPopup.draft.levelNo,
            progressPercent: wbsPopup.draft.progressPercent,
            budgetAmount: wbsPopup.draft.budgetAmount,
            actualAmount: wbsPopup.draft.actualAmount,
          }}
          isSubmitting={false}
          onCancel={closeWbsPopup}
          onSubmit={saveWbsDraft}
          submitLabel={wbsPopup.editingKey ? "Update WBS" : "Save WBS"}
        />
      </SidebarDrawer>

      <SidebarDrawer
        eyebrow={activityPopup.editingKey ? "Update activity" : "Create activity"}
        onClose={closeActivityPopup}
        open={activityPopup.isOpen}
        title={activityPopup.editingKey ? "Edit activity" : "New activity"}
        widthClassName="sm:max-w-3xl"
      >
        <ActivityForm
          error={activityPopup.error}
          initialValues={{
            activityCode: activityPopup.draft.activityCode,
            activityName: activityPopup.draft.activityName,
            wbsId: activityPopup.draft.wbsClientKey,
            plannedStart: activityPopup.draft.plannedStart,
            plannedEnd: activityPopup.draft.plannedEnd,
            durationDays: activityPopup.draft.durationDays,
            progressPercent: activityPopup.draft.progressPercent,
            status: activityPopup.draft.status,
            responsibleUser: activityPopup.draft.responsibleUser,
          }}
          isSubmitting={false}
          onCancel={closeActivityPopup}
          onSubmit={saveActivityDraft}
          submitLabel={activityPopup.editingKey ? "Save Changes" : "Save Activity"}
          wbsOptions={activityWbsOptions}
        />
      </SidebarDrawer>

      <SidebarDrawer
        eyebrow={milestonePopup.editingKey ? "Update milestone" : "Create milestone"}
        onClose={closeMilestonePopup}
        open={milestonePopup.isOpen}
        title={milestonePopup.editingKey ? "Edit milestone" : "New milestone"}
        widthClassName="sm:max-w-3xl"
      >
        <MilestoneForm
          error={milestonePopup.error}
          initialValues={{
            milestoneCode: milestonePopup.draft.milestoneCode,
            milestoneName: milestonePopup.draft.milestoneName,
            wbsId: milestonePopup.draft.wbsClientKey,
            plannedDate: milestonePopup.draft.plannedDate,
            actualDate: milestonePopup.draft.actualDate,
            status: milestonePopup.draft.status,
          }}
          isSubmitting={false}
          onCancel={closeMilestonePopup}
          onSubmit={saveMilestoneDraft}
          submitLabel={milestonePopup.editingKey ? "Save Changes" : "Save Milestone"}
          wbsOptions={milestoneWbsOptions}
        />
      </SidebarDrawer>
    </AppShell>
  );
}
