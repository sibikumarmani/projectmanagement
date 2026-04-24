"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { activityApi, milestoneApi, projectApi, wbsApi } from "@/lib/api";
import type { ActivityItem, MilestoneItem, ProjectRecord, WbsRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type TimelineRow = {
  id: string;
  type: "wbs" | "activity";
  sourceId?: string;
  code: string;
  name: string;
  status: string;
  owner?: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  level: number;
};

type ZoomMode = "day" | "month" | "year";

type DragState = {
  activityId: string;
  mode: "move" | "resize-start" | "resize-end";
  pointerStartX: number;
  initialStartDate: string;
  initialEndDate: string;
};

const dayMs = 24 * 60 * 60 * 1000;
function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function formatYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatMonthShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function formatFullDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function startOfYear(date: Date) {
  const next = startOfDay(date);
  next.setMonth(0, 1);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
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
  return "bg-slate-500";
}

function mapApiProjects(responseData: unknown) {
  return (responseData as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
    ...project,
    id: String(project.id),
  }));
}

function mapApiWbs(responseData: unknown) {
  return (responseData as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
    ...wbs,
    id: String(wbs.id),
    projectId: String(wbs.projectId),
  }));
}

function mapApiActivities(responseData: unknown, wbsCodeById: Map<string, string>) {
  return (
    responseData as Array<
      Omit<ActivityItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
        id: number | string;
        projectId: number | string;
        wbsId: number | string;
      }
    >
  ).map((activity) => {
    const wbsId = String(activity.wbsId);
    return {
      ...activity,
      id: String(activity.id),
      projectId: String(activity.projectId),
      wbsId,
      wbsCode: wbsCodeById.get(wbsId) ?? null,
    };
  });
}

function mapApiMilestones(responseData: unknown, wbsCodeById: Map<string, string>) {
  return (
    responseData as Array<
      Omit<MilestoneItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
        id: number | string;
        projectId: number | string;
        wbsId: number | string | null;
      }
    >
  ).map((milestone) => {
    const wbsId = milestone.wbsId == null ? null : String(milestone.wbsId);
    return {
      ...milestone,
      id: String(milestone.id),
      projectId: String(milestone.projectId),
      wbsId,
      wbsCode: wbsId ? (wbsCodeById.get(wbsId) ?? null) : null,
    };
  });
}

export default function GanttPage() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wbsRows, setWbsRows] = useState<WbsRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("month");
  const [viewState, setViewState] = useState<{ projectId: string | null; date: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const hasValidSelectedProject = Boolean(selectedProjectId) && !selectedProjectId.startsWith("p");

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await projectApi.getProjects();
        if (cancelled) {
          return;
        }

        const loadedProjects = mapApiProjects(response.data.data);
        setProjects(loadedProjects);

        if (!loadedProjects.some((project) => project.id === selectedProjectId) && loadedProjects.length > 0) {
          setSelectedProjectId(loadedProjects[0].id);
        }
      } catch {
        if (!cancelled) {
          setError("Projects could not be loaded for the Gantt chart.");
          setIsLoading(false);
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

    async function loadGanttData() {
      try {
        setIsLoading(true);
        const [wbsResponse, activityResponse, milestoneResponse] = await Promise.all([
          wbsApi.getWbs(selectedProjectId),
          activityApi.getActivities(selectedProjectId),
          milestoneApi.getMilestones(selectedProjectId),
        ]);

        if (cancelled) {
          return;
        }

        const mappedWbs = mapApiWbs(wbsResponse.data.data);
        const wbsCodeById = new Map(mappedWbs.map((wbs) => [wbs.id, wbs.wbsCode]));
        setWbsRows(mappedWbs);
        setActivities(mapApiActivities(activityResponse.data.data, wbsCodeById));
        setMilestones(mapApiMilestones(milestoneResponse.data.data, wbsCodeById));
        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            setError("Your session expired while loading Gantt data.");
          } else {
            setError("Gantt data could not be loaded from the database.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadGanttData();

    return () => {
      cancelled = true;
    };
  }, [hasValidSelectedProject, selectedProjectId]);

  const timelineRows = useMemo<TimelineRow[]>(() => {
    const activitiesByWbs = new Map<string, ActivityItem[]>();
    activities.forEach((activity) => {
      const group = activitiesByWbs.get(activity.wbsId) ?? [];
      group.push(activity);
      activitiesByWbs.set(activity.wbsId, group);
    });

    return wbsRows.flatMap((wbs) => {
      const wbsActivities = activitiesByWbs.get(wbs.id) ?? [];
      const datedActivities = wbsActivities.filter((activity) => parseDate(activity.plannedStart) && parseDate(activity.plannedEnd));
      const starts = datedActivities.map((activity) => parseDate(activity.plannedStart)).filter((date): date is Date => Boolean(date));
      const ends = datedActivities.map((activity) => parseDate(activity.plannedEnd)).filter((date): date is Date => Boolean(date));
      const startDate = starts.length ? new Date(Math.min(...starts.map((date) => date.getTime()))) : parseDate(selectedProject?.startDate ?? "") ?? new Date();
      const endDate = ends.length ? new Date(Math.max(...ends.map((date) => date.getTime()))) : parseDate(selectedProject?.endDate ?? "") ?? startDate;

      const wbsRow: TimelineRow = {
        id: `wbs-${wbs.id}`,
        type: "wbs",
        sourceId: wbs.id,
        code: wbs.wbsCode,
        name: wbs.wbsName,
        status: "WBS",
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        progressPercent: wbs.progressPercent,
        level: wbs.levelNo,
      };

      const activityRows = wbsActivities.map((activity) => ({
        id: `activity-${activity.id}`,
        type: "activity" as const,
        sourceId: activity.id,
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
  }, [activities, selectedProject?.endDate, selectedProject?.startDate, wbsRows]);

  const defaultViewDate = useMemo(
    () =>
      parseDate(selectedProject?.startDate ?? "") ??
      timelineRows.map((row) => parseDate(row.startDate)).find((date): date is Date => Boolean(date)) ??
      new Date(),
    [selectedProject?.startDate, timelineRows],
  );

  const currentViewDate = viewState?.projectId === selectedProjectId ? viewState.date : defaultViewDate;

  const timelineConfig = useMemo(() => {
    if (zoomMode === "day") {
      return { columnWidth: 64, minWidth: 1536 };
    }
    if (zoomMode === "year") {
      return { columnWidth: 110, minWidth: 1320 };
    }
    return { columnWidth: 40, minWidth: 1240 };
  }, [zoomMode]);

  const visibleRange = useMemo(() => {
    if (zoomMode === "day") {
      const start = startOfDay(currentViewDate);
      const end = addDays(start, 1);
      return {
        start,
        end,
        title: formatFullDay(start),
      };
    }

    if (zoomMode === "year") {
      const start = startOfYear(currentViewDate);
      const end = addYears(start, 1);
      return {
        start,
        end,
        title: formatYear(start),
      };
    }

    const start = startOfMonth(currentViewDate);
    const end = addMonths(start, 1);
    return {
      start,
      end,
      title: formatMonth(start),
    };
  }, [currentViewDate, zoomMode]);

  const timelineColumns = useMemo(() => {
    if (zoomMode === "day") {
      return Array.from({ length: 24 }, (_, hour) => {
        const start = new Date(visibleRange.start);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(visibleRange.start);
        end.setHours(hour + 1, 0, 0, 0);
        return {
          key: `hour-${hour}`,
          start,
          end,
          majorLabel: formatFullDay(visibleRange.start),
          minorTop: `${String(hour).padStart(2, "0")}:00`,
          minorBottom: hour < 12 ? "AM" : "PM",
          shaded: hour < 6 || hour >= 18,
        };
      });
    }

    if (zoomMode === "year") {
      return Array.from({ length: 12 }, (_, monthOffset) => {
        const start = addMonths(visibleRange.start, monthOffset);
        const end = addMonths(visibleRange.start, monthOffset + 1);
        return {
          key: `month-${monthOffset}`,
          start,
          end,
          majorLabel: formatYear(visibleRange.start),
          minorTop: formatMonthShort(start),
          minorBottom: formatYear(start),
          shaded: monthOffset % 2 === 1,
        };
      });
    }

    const totalDays = daysBetween(visibleRange.start, addDays(visibleRange.end, -1));
    return Array.from({ length: totalDays }, (_, dayOffset) => {
      const start = addDays(visibleRange.start, dayOffset);
      const end = addDays(start, 1);
      return {
        key: `day-${dayOffset}`,
        start,
        end,
        majorLabel: formatMonth(visibleRange.start),
        minorTop: formatWeekday(start),
        minorBottom: String(start.getDate()),
        shaded: start.getDay() === 0 || start.getDay() === 6,
      };
    });
  }, [visibleRange.end, visibleRange.start, zoomMode]);

  const timelineWidth = useMemo(
    () => Math.max(timelineConfig.minWidth, timelineColumns.length * timelineConfig.columnWidth),
    [timelineColumns.length, timelineConfig.columnWidth, timelineConfig.minWidth],
  );

  const majorBands = useMemo(() => {
    if (timelineColumns.length === 0) {
      return [];
    }

    const bands: Array<{ key: string; label: string; left: number; width: number }> = [];
    let currentLabel = timelineColumns[0].majorLabel;
    let startIndex = 0;

    for (let index = 1; index <= timelineColumns.length; index += 1) {
      const nextLabel = timelineColumns[index]?.majorLabel;
      if (index < timelineColumns.length && nextLabel === currentLabel) {
        continue;
      }

      bands.push({
        key: `${currentLabel}-${startIndex}`,
        label: currentLabel,
        left: startIndex * timelineConfig.columnWidth,
        width: (index - startIndex) * timelineConfig.columnWidth,
      });

      currentLabel = nextLabel ?? "";
      startIndex = index;
    }

    return bands;
  }, [timelineColumns, timelineConfig.columnWidth]);

  function getPositionPx(date: Date) {
    const totalDuration = visibleRange.end.getTime() - visibleRange.start.getTime();
    if (totalDuration <= 0) {
      return 0;
    }

    const clampedTime = clamp(date.getTime(), visibleRange.start.getTime(), visibleRange.end.getTime());
    return ((clampedTime - visibleRange.start.getTime()) / totalDuration) * timelineWidth;
  }

  function handlePrevious() {
    setViewState((current) => {
      const baseDate = current?.projectId === selectedProjectId ? current.date : defaultViewDate;
      if (zoomMode === "day") {
        return { projectId: selectedProjectId, date: addDays(baseDate, -1) };
      }
      if (zoomMode === "year") {
        return { projectId: selectedProjectId, date: addYears(baseDate, -1) };
      }
      return { projectId: selectedProjectId, date: addMonths(baseDate, -1) };
    });
  }

  function handleNext() {
    setViewState((current) => {
      const baseDate = current?.projectId === selectedProjectId ? current.date : defaultViewDate;
      if (zoomMode === "day") {
        return { projectId: selectedProjectId, date: addDays(baseDate, 1) };
      }
      if (zoomMode === "year") {
        return { projectId: selectedProjectId, date: addYears(baseDate, 1) };
      }
      return { projectId: selectedProjectId, date: addMonths(baseDate, 1) };
    });
  }

  function getBarStyle(row: TimelineRow) {
    const start = parseDate(row.startDate) ?? visibleRange.start;
    const end = parseDate(row.endDate) ?? start;
    const left = getPositionPx(start);
    const endExclusive = addDays(end, 1);
    const width = Math.max(18, getPositionPx(endExclusive) - left);
    return { left: `${left}px`, width: `${width}px` };
  }

  const persistActivityDates = useCallback(async (activityId: string, nextStartDate: string, nextEndDate: string) => {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity || !selectedProjectId || selectedProjectId.startsWith("p")) {
      return;
    }

    const nextDurationDays = daysBetween(parseDate(nextStartDate) ?? new Date(), parseDate(nextEndDate) ?? new Date());
    const previousActivities = activities;
    const updatedActivities = activities.map((item) =>
      item.id === activityId
        ? {
            ...item,
            plannedStart: nextStartDate,
            plannedEnd: nextEndDate,
            durationDays: nextDurationDays,
          }
        : item,
    );

    setActivities(updatedActivities);
    setIsSaving(true);
    setError(null);

    try {
      await activityApi.updateActivity(selectedProjectId, activityId, {
        activityCode: activity.activityCode,
        activityName: activity.activityName,
        wbsId: Number(activity.wbsId),
        plannedStart: nextStartDate,
        plannedEnd: nextEndDate,
        durationDays: nextDurationDays,
        progressPercent: activity.progressPercent,
        status: activity.status,
        responsibleUser: activity.responsibleUser,
      });
    } catch (saveError: unknown) {
      setActivities(previousActivities);
      if (axios.isAxiosError(saveError) && typeof saveError.response?.data?.message === "string") {
        setError(saveError.response.data.message);
      } else {
        setError("The activity schedule could not be updated from the Gantt chart.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [activities, selectedProjectId]);

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDrag = dragState;

    function handlePointerMove(event: MouseEvent) {
      const deltaDays = Math.round((event.clientX - activeDrag.pointerStartX) / 48);
      const initialStart = parseDate(activeDrag.initialStartDate);
      const initialEnd = parseDate(activeDrag.initialEndDate);
      if (!initialStart || !initialEnd) {
        return;
      }

      let nextStart = initialStart;
      let nextEnd = initialEnd;

      if (activeDrag.mode === "move") {
        nextStart = addDays(initialStart, deltaDays);
        nextEnd = addDays(initialEnd, deltaDays);
      } else if (activeDrag.mode === "resize-start") {
        nextStart = addDays(initialStart, deltaDays);
        if (nextStart > initialEnd) {
          nextStart = initialEnd;
        }
      } else {
        nextEnd = addDays(initialEnd, deltaDays);
        if (nextEnd < initialStart) {
          nextEnd = initialStart;
        }
      }

      setActivities((current) =>
        current.map((activity) =>
          activity.id === activeDrag.activityId
            ? {
                ...activity,
                plannedStart: toIsoDate(nextStart),
                plannedEnd: toIsoDate(nextEnd),
                durationDays: daysBetween(nextStart, nextEnd),
              }
            : activity,
        ),
      );
    }

    function handlePointerUp() {
      const editedActivity = activities.find((activity) => activity.id === activeDrag.activityId);
      const didChange =
        editedActivity &&
        (editedActivity.plannedStart !== activeDrag.initialStartDate || editedActivity.plannedEnd !== activeDrag.initialEndDate);

      const finalStartDate = editedActivity?.plannedStart ?? activeDrag.initialStartDate;
      const finalEndDate = editedActivity?.plannedEnd ?? activeDrag.initialEndDate;

      setDragState(null);

      if (didChange) {
        void persistActivityDates(activeDrag.activityId, finalStartDate, finalEndDate);
      }
    }

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [activities, dragState, persistActivityDates]);

  function startBarEdit(event: React.MouseEvent<HTMLElement>, row: TimelineRow, mode: DragState["mode"]) {
    if (row.type !== "activity" || !row.sourceId || isSaving) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragState({
      activityId: row.sourceId,
      mode,
      pointerStartX: event.clientX,
      initialStartDate: row.startDate,
      initialEndDate: row.endDate,
    });
  }

  return (
    <AppShell
      title="Gantt chart"
      subtitle="Visualize the selected project's WBS, activities, milestones, dates, and progress in one timeline, then drag activity bars to reschedule directly."
    >
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4">
        <SectionCard title="Project timeline" eyebrow="Planning">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-strong">Choose project</span>
              <select
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none ring-0"
                disabled={projects.length === 0}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                value={selectedProjectId}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} - {project.projectName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-white/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">WBS</p>
                <p className="mt-1 text-xl font-semibold text-brand-strong">{wbsRows.length}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Activities</p>
                <p className="mt-1 text-xl font-semibold text-brand-strong">{activities.length}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Milestones</p>
                <p className="mt-1 text-xl font-semibold text-brand-strong">{milestones.length}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={selectedProject ? `${selectedProject.projectCode} timeline` : "Timeline"} eyebrow="Gantt">
          {isLoading ? (
            <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading Gantt chart...</div>
          ) : timelineRows.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-line bg-white/35 px-5 py-10 text-sm text-slate-600">
              Create WBS and activities for this project to populate the Gantt chart.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-line bg-white/40">
              <div className="border-b border-line bg-white/70 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Drag activity bars to move them. Drag the left or right edge to resize dates.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Day shows hours, month shows days, year shows months. Use previous and next to move the visible window.
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="inline-flex flex-wrap rounded-full border border-line bg-white/80 p-1">
                    {(["day", "month", "year"] as ZoomMode[]).map((mode) => (
                      <button
                        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                          zoomMode === mode ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                        key={mode}
                        onClick={() => setZoomMode(mode)}
                        type="button"
                      >
                        {mode[0].toUpperCase() + mode.slice(1)} view
                      </button>
                    ))}
                  </div>

                  <div className="inline-flex flex-wrap items-center rounded-full border border-line bg-white/80 p-1">
                    <button
                      className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      onClick={handlePrevious}
                      type="button"
                    >
                      Prev
                    </button>
                    <div className="flex items-center px-3 text-sm font-semibold text-brand-strong">{visibleRange.title}</div>
                    <button
                      className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                      onClick={handleNext}
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={`grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] border-b border-line bg-white/70 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[320px_minmax(620px,1fr)] ${
                  dragState ? "select-none" : ""
                }`}
              >
                <div className="px-4 py-3">Task</div>
                <div className="overflow-x-auto px-4 py-3">
                  <div className="relative rounded-2xl border border-line/70 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]" style={{ width: `${timelineWidth}px` }}>
                    <div className="relative h-9 border-b border-line/70 bg-slate-50/80">
                      {majorBands.map((band) => (
                        <div
                          className="absolute inset-y-0 flex items-center border-r border-line/70 px-3 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase"
                          key={band.key}
                          style={{ left: `${band.left}px`, width: `${band.width}px` }}
                        >
                          {band.label}
                        </div>
                      ))}
                    </div>

                    <div className="relative h-12">
                      {timelineColumns.map((column, index) => {
                        const left = index * timelineConfig.columnWidth;
                        return (
                          <div
                            className={`absolute inset-y-0 border-r border-line/60 ${column.shaded ? "bg-amber-50/80" : "bg-white/80"}`}
                            key={column.key}
                            style={{ left: `${left}px`, width: `${timelineConfig.columnWidth}px` }}
                          >
                            <div className="flex h-full flex-col items-center justify-center">
                              <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                                {column.minorTop}
                              </span>
                              <span className="mt-1 text-xs font-semibold text-brand-strong">
                                {column.minorBottom}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-h-[620px] overflow-auto">
                {timelineRows.map((row) => (
                  <div
                    className={`grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] border-b border-line last:border-b-0 sm:grid-cols-[320px_minmax(620px,1fr)] ${row.type === "wbs" ? "bg-slate-50/80" : "bg-white/35"}`}
                    key={row.id}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3" style={{ paddingLeft: `${Math.min(row.level, 4) * 10}px` }}>
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${row.type === "wbs" ? "bg-brand" : statusTone(row.status)}`} />
                        <div>
                          <p className="font-semibold text-brand-strong">
                            {row.code} <span className="font-normal text-slate-500">{row.name}</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.status}
                            {row.owner ? ` - ${row.owner}` : ""} - {row.progressPercent}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto px-4 py-4">
                      <div className="relative min-h-[62px] rounded-2xl border border-line/60 bg-white/40" style={{ width: `${timelineWidth}px` }}>
                        {timelineColumns.map((column, index) => {
                          return (
                            <span
                              aria-hidden="true"
                              className={`absolute inset-y-0 border-r border-line/50 ${column.shaded ? "bg-amber-50/60" : "bg-white/10"}`}
                              key={`${row.id}-${column.key}`}
                              style={{ left: `${index * timelineConfig.columnWidth}px`, width: `${timelineConfig.columnWidth}px` }}
                            />
                          );
                        })}
                        <div
                          className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-full ${
                            row.type === "wbs"
                              ? "bg-brand-strong/75"
                              : dragState?.activityId === row.sourceId
                                ? "cursor-grabbing bg-brand"
                                : "cursor-grab bg-brand/55"
                          }`}
                          onMouseDown={row.type === "activity" ? (event) => startBarEdit(event, row, "move") : undefined}
                          style={getBarStyle(row)}
                          title={
                            row.type === "activity"
                              ? `${row.code}: drag to move, drag edges to resize`
                              : `${row.code}: ${row.startDate} to ${row.endDate}`
                          }
                        >
                          <div className="h-full rounded-full bg-emerald-500/75" style={{ width: `${clamp(row.progressPercent, 0, 100)}%` }} />
                          {row.type === "activity" ? (
                            <>
                              <span
                                className="absolute left-0 top-1/2 h-6 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-brand-strong shadow-sm"
                                onMouseDown={(event) => startBarEdit(event, row, "resize-start")}
                              />
                              <span
                                className="absolute right-0 top-1/2 h-6 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-brand-strong shadow-sm"
                                onMouseDown={(event) => startBarEdit(event, row, "resize-end")}
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {milestones.length > 0 ? (
                  <div className="grid min-w-[980px] grid-cols-[280px_minmax(620px,1fr)] bg-amber-50/50 sm:grid-cols-[320px_minmax(620px,1fr)]">
                    <div className="px-4 py-4">
                      <p className="font-semibold text-brand-strong">Milestones</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Planned and actual dates{isSaving ? " - saving schedule changes..." : ""}
                      </p>
                    </div>
                    <div className="overflow-x-auto px-4 py-4">
                      <div className="relative min-h-[82px] rounded-2xl border border-line/60 bg-white/40" style={{ width: `${timelineWidth}px` }}>
                        {timelineColumns.map((column, index) => {
                          return (
                            <span
                              aria-hidden="true"
                              className={`absolute inset-y-0 border-r border-line/50 ${column.shaded ? "bg-amber-50/60" : "bg-white/10"}`}
                              key={`milestone-${column.key}`}
                              style={{ left: `${index * timelineConfig.columnWidth}px`, width: `${timelineConfig.columnWidth}px` }}
                            />
                          );
                        })}
                        {milestones.map((milestone) => {
                          const plannedDate = parseDate(milestone.plannedDate);
                          if (!plannedDate) {
                            return null;
                          }

                          return (
                            <div
                              className="absolute top-4 -translate-x-1/2 text-center"
                              key={milestone.id}
                              style={{ left: `${getPositionPx(plannedDate)}px` }}
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
          )}
        </SectionCard>
      </section>
    </AppShell>
  );
}
