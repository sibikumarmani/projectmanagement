"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { activityApi, milestoneApi, projectApi, wbsApi } from "@/lib/api";
import type { ActivityItem, MilestoneItem, ProjectRecord, WbsRecord } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type TimelineRow = {
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

const dayMs = 24 * 60 * 60 * 1000;

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const timelineBounds = useMemo(() => {
    const dates = [
      selectedProject?.startDate,
      selectedProject?.endDate,
      ...timelineRows.flatMap((row) => [row.startDate, row.endDate]),
      ...milestones.flatMap((milestone) => [milestone.plannedDate, milestone.actualDate ?? milestone.plannedDate]),
    ]
      .map((value) => (value ? parseDate(value) : null))
      .filter((date): date is Date => Boolean(date));

    const today = new Date();
    const minDate = dates.length ? new Date(Math.min(...dates.map((date) => date.getTime()))) : today;
    const maxDate = dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : today;
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return {
      start: minDate,
      end: maxDate,
      totalDays: daysBetween(minDate, maxDate),
    };
  }, [milestones, selectedProject?.endDate, selectedProject?.startDate, timelineRows]);

  const monthMarkers = useMemo(() => {
    const markers: Date[] = [];
    const cursor = new Date(timelineBounds.start);
    cursor.setDate(1);
    if (cursor < timelineBounds.start) {
      cursor.setMonth(cursor.getMonth() + 1);
    }

    while (cursor <= timelineBounds.end) {
      markers.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return markers;
  }, [timelineBounds.end, timelineBounds.start]);

  function getPositionPercent(date: Date) {
    return clamp(((date.getTime() - timelineBounds.start.getTime()) / (timelineBounds.totalDays * dayMs)) * 100, 0, 100);
  }

  function getBarStyle(row: TimelineRow) {
    const start = parseDate(row.startDate) ?? timelineBounds.start;
    const end = parseDate(row.endDate) ?? start;
    const left = getPositionPercent(start);
    const right = getPositionPercent(end);
    const width = Math.max(1.5, right - left);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <AppShell
      title="Gantt chart"
      subtitle="Visualize the selected project's WBS, activities, milestones, dates, and progress in one timeline."
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

            <div className="grid grid-cols-3 gap-2 text-center">
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
              <div className="grid min-w-[980px] grid-cols-[320px_minmax(620px,1fr)] border-b border-line bg-white/70 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <div className="px-4 py-3">Task</div>
                <div className="relative px-4 py-3">
                  <div className="flex justify-between">
                    <span>{formatShortDate(timelineBounds.start)}</span>
                    <span>{formatShortDate(timelineBounds.end)}</span>
                  </div>
                  {monthMarkers.map((month) => (
                    <span
                      className="absolute top-3 -translate-x-1/2 rounded-full bg-white/80 px-2 text-[10px] text-slate-500"
                      key={month.toISOString()}
                      style={{ left: `${getPositionPercent(month)}%` }}
                    >
                      {formatMonth(month)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="max-h-[620px] min-w-[980px] overflow-auto">
                {timelineRows.map((row) => (
                  <div
                    className={`grid grid-cols-[320px_minmax(620px,1fr)] border-b border-line last:border-b-0 ${row.type === "wbs" ? "bg-slate-50/80" : "bg-white/35"}`}
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

                    <div className="relative min-h-[62px] px-4 py-4">
                      {monthMarkers.map((month) => (
                        <span
                          aria-hidden="true"
                          className="absolute top-0 h-full border-l border-dashed border-slate-200"
                          key={`${row.id}-${month.toISOString()}`}
                          style={{ left: `${getPositionPercent(month)}%` }}
                        />
                      ))}
                      <div
                        className={`absolute top-1/2 h-4 -translate-y-1/2 rounded-full ${row.type === "wbs" ? "bg-brand-strong/75" : "bg-brand/55"}`}
                        style={getBarStyle(row)}
                        title={`${row.code}: ${row.startDate} to ${row.endDate}`}
                      >
                        <div className="h-full rounded-full bg-emerald-500/75" style={{ width: `${clamp(row.progressPercent, 0, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}

                {milestones.length > 0 ? (
                  <div className="grid grid-cols-[320px_minmax(620px,1fr)] bg-amber-50/50">
                    <div className="px-4 py-4">
                      <p className="font-semibold text-brand-strong">Milestones</p>
                      <p className="mt-1 text-xs text-slate-500">Planned and actual dates</p>
                    </div>
                    <div className="relative min-h-[82px] px-4 py-4">
                      {milestones.map((milestone) => {
                        const plannedDate = parseDate(milestone.plannedDate);
                        if (!plannedDate) {
                          return null;
                        }

                        return (
                          <div
                            className="absolute top-4 -translate-x-1/2 text-center"
                            key={milestone.id}
                            style={{ left: `${getPositionPercent(plannedDate)}%` }}
                            title={`${milestone.milestoneCode}: ${milestone.plannedDate}`}
                          >
                            <div className="mx-auto h-4 w-4 rotate-45 rounded-[4px] bg-highlight shadow-sm" />
                            <p className="mt-2 max-w-[110px] truncate text-[11px] font-semibold text-brand-strong">{milestone.milestoneCode}</p>
                          </div>
                        );
                      })}
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
