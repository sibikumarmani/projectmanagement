"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CostTrendChart } from "@/components/dashboard/dashboard-charts";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { activityApi, dashboardApi, materialRequestApi, milestoneApi, projectApi, riskApi, timesheetApi, wbsApi } from "@/lib/api";
import type { ActivityItem, MaterialRequestItem, MilestoneItem, ProjectRecord, ReportSnapshot, RiskItem, TimesheetRecord, WbsRecord } from "@/lib/types";

type ReportId =
  | "project-summary"
  | "wbs-cost"
  | "activity-budget-vs-actual"
  | "material-request-vs-receipt"
  | "timesheet-utilization"
  | "overhead-allocation"
  | "milestone-tracking"
  | "risk-register"
  | "progress-summary";

type ReportCatalogItem = {
  id: ReportId;
  name: string;
  description: string;
  records: number | null;
  status: "ready" | "partial" | "pending";
};

type DashboardSummaryResponse = {
  costSnapshots: ReportSnapshot[];
};

type ExportCell = string | number | boolean | null | undefined;

type ExportColumn<T> = {
  header: string;
  value: (row: T) => ExportCell;
};

type ExportTable<T = unknown> = {
  title: string;
  columns: ExportColumn<T>[];
  rows: T[];
};

function formatReportStatus(status: ReportCatalogItem["status"]) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Pending";
}

function getStatusClasses(status: ReportCatalogItem["status"]) {
  if (status === "ready") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRiskStatus(status: RiskItem["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMaterialStatus(status: MaterialRequestItem["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatExportValue(value: ExportCell) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function escapeHtml(value: ExportCell) {
  return formatExportValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildReportTablesHtml(tables: Array<ExportTable<unknown>>, options: { title: string; description: string; generatedAt: string }) {
  const renderedTables = tables
    .map((table) => {
      const bodyRows =
        table.rows.length > 0
          ? table.rows
              .map(
                (row) => `
                  <tr>
                    ${table.columns.map((column) => `<td>${escapeHtml(column.value(row))}</td>`).join("")}
                  </tr>
                `,
              )
              .join("")
          : `<tr><td colspan="${table.columns.length}">No records available</td></tr>`;

      return `
        <section>
          <h2>${escapeHtml(table.title)}</h2>
          <table>
            <thead>
              <tr>${table.columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("")}</tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(options.title)}</title>
        <style>
          body { color: #13263a; font-family: Arial, sans-serif; margin: 28px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          h2 { font-size: 16px; margin: 24px 0 10px; }
          p { color: #526171; margin: 0 0 6px; }
          table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
          th, td { border: 1px solid #d8dee7; font-size: 12px; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #edf2f7; color: #173a59; font-weight: 700; }
          tr:nth-child(even) td { background: #fafafa; }
          @media print {
            body { margin: 14mm; }
            section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(options.title)}</h1>
        <p>${escapeHtml(options.description)}</p>
        <p>Generated: ${escapeHtml(options.generatedAt)}</p>
        ${renderedTables}
      </body>
    </html>
  `;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toExportTable<T>(table: ExportTable<T>): ExportTable<unknown> {
  return table as unknown as ExportTable<unknown>;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportId>("project-summary");
  const [costSnapshots, setCostSnapshots] = useState<ReportSnapshot[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [wbsRecords, setWbsRecords] = useState<WbsRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [reportCatalog, setReportCatalog] = useState<ReportCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReportsData() {
      try {
        setIsLoading(true);

        const [dashboardResponse, projectsResponse, risksResponse, materialRequestsResponse, timesheetResponse] = await Promise.all([
          dashboardApi.getSummary(),
          projectApi.getProjects(),
          riskApi.getRisks(),
          materialRequestApi.getMaterialRequests(),
          timesheetApi.getTimesheets(),
        ]);

        const loadedProjects = (projectsResponse.data.data as Array<Omit<ProjectRecord, "id"> & { id: number | string }>).map((project) => ({
          ...project,
          id: String(project.id),
        }));

        const loadedRisks = (risksResponse.data.data as Array<Omit<RiskItem, "id" | "projectId" | "activityId"> & { id: number | string; projectId: number | string; activityId: number | string }>).map(
          (risk) => ({
            ...risk,
            id: String(risk.id),
            projectId: String(risk.projectId),
            activityId: String(risk.activityId),
          }),
        );

        const loadedMaterialRequests = (
          materialRequestsResponse.data.data as Array<
            Omit<MaterialRequestItem, "id" | "projectId" | "activityId"> & {
              id: number | string;
              projectId: number | string;
              activityId: number | string;
            }
          >
        ).map((item) => ({
          ...item,
          id: String(item.id),
          projectId: String(item.projectId),
          activityId: String(item.activityId),
        }));

        const loadedTimesheets = (
          timesheetResponse.data.data as Array<
            Omit<TimesheetRecord, "id" | "userId" | "projectId" | "activityId"> & {
              id: number | string;
              userId: number | string;
              projectId: number | string;
              activityId: number | string;
            }
          >
        ).map((timesheet) => ({
          ...timesheet,
          id: String(timesheet.id),
          userId: String(timesheet.userId),
          projectId: String(timesheet.projectId),
          activityId: String(timesheet.activityId),
          regularHours: Number(timesheet.regularHours),
          overtimeHours: Number(timesheet.overtimeHours),
        }));

        const [wbsResponses, activityResponses, milestoneResponses] = await Promise.all([
          Promise.all(loadedProjects.map((project) => wbsApi.getWbs(project.id))),
          Promise.all(loadedProjects.map((project) => activityApi.getActivities(project.id))),
          Promise.all(loadedProjects.map((project) => milestoneApi.getMilestones(project.id))),
        ]);

        const loadedWbsRecords = wbsResponses.flatMap((response) =>
          (response.data.data as Array<Omit<WbsRecord, "id" | "projectId"> & { id: number | string; projectId: number | string }>).map((wbs) => ({
            ...wbs,
            id: String(wbs.id),
            projectId: String(wbs.projectId),
          })),
        );

        const loadedActivities = activityResponses.flatMap((response) =>
          (response.data.data as Array<Omit<ActivityItem, "id" | "projectId" | "wbsId"> & { id: number | string; projectId: number | string; wbsId: number | string }>).map(
            (activity) => ({
              ...activity,
              id: String(activity.id),
              projectId: String(activity.projectId),
              wbsId: String(activity.wbsId),
            }),
          ),
        );

        const loadedMilestones = milestoneResponses.flatMap((response) =>
          (response.data.data as Array<Omit<MilestoneItem, "id" | "projectId" | "wbsId"> & { id: number | string; projectId: number | string; wbsId: number | string | null }>).map(
            (milestone) => ({
              ...milestone,
              id: String(milestone.id),
              projectId: String(milestone.projectId),
              wbsId: milestone.wbsId === null ? null : String(milestone.wbsId),
            }),
          ),
        );

        const averageProgress = loadedProjects.length
          ? Math.round(loadedProjects.reduce((sum, project) => sum + project.progressPercent, 0) / loadedProjects.length)
          : 0;
        const dashboardData = dashboardResponse.data.data as DashboardSummaryResponse;

        if (cancelled) {
          return;
        }

        setCostSnapshots(dashboardData.costSnapshots ?? []);
        setProjects(loadedProjects);
        setWbsRecords(loadedWbsRecords);
        setActivities(loadedActivities);
        setMaterialRequests(loadedMaterialRequests);
        setMilestones(loadedMilestones);
        setRisks(loadedRisks);
        setTimesheets(loadedTimesheets);
        setReportCatalog([
          {
            id: "project-summary",
            name: "Project summary report",
            description: "Portfolio-level project register, budget, and status overview.",
            records: loadedProjects.length,
            status: loadedProjects.length > 0 ? "ready" : "pending",
          },
          {
            id: "wbs-cost",
            name: "WBS cost report",
            description: "WBS hierarchy with budget and actual rollups from project-linked records.",
            records: loadedWbsRecords.length,
            status: loadedWbsRecords.length > 0 ? "ready" : "pending",
          },
          {
            id: "activity-budget-vs-actual",
            name: "Activity budget vs actual report",
            description: "Activity-facing cost trend built from current budget, allocation, and actual data.",
            records: loadedActivities.length,
            status: loadedActivities.length > 0 && dashboardData.costSnapshots.length > 0 ? "ready" : "partial",
          },
          {
            id: "material-request-vs-receipt",
            name: "Material request vs receipt report",
            description: "Material demand and approval visibility using live request records.",
            records: loadedMaterialRequests.length,
            status: loadedMaterialRequests.length > 0 ? "partial" : "pending",
          },
          {
            id: "timesheet-utilization",
            name: "Timesheet utilization report",
            description: "Employee hours captured from live timesheet entries for allocated and non-allocated activities.",
            records: loadedTimesheets.length,
            status: loadedTimesheets.length > 0 ? "ready" : "pending",
          },
          {
            id: "overhead-allocation",
            name: "Overhead allocation report",
            description: "Overhead allocation report slot is enabled and waiting for overhead posting data.",
            records: null,
            status: "pending",
          },
          {
            id: "milestone-tracking",
            name: "Milestone tracking report",
            description: "Milestone schedule tracking sourced from live project milestone records.",
            records: loadedMilestones.length,
            status: loadedMilestones.length > 0 ? "ready" : "pending",
          },
          {
            id: "risk-register",
            name: "Risk register report",
            description: "Risk scoring, ownership, and target-date tracking from the live register.",
            records: loadedRisks.length,
            status: loadedRisks.length > 0 ? "ready" : "pending",
          },
          {
            id: "progress-summary",
            name: "Progress summary report",
            description: `Average project progress currently tracked at ${averageProgress}% across active records.`,
            records: loadedProjects.length,
            status: loadedProjects.length > 0 ? "ready" : "pending",
          },
        ]);
        setError(null);
      } catch (error: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            setError("Your session expired while loading report data from the database.");
            return;
          }

          setError("Reports could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReportsData();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalRegularHours = useMemo(
    () => timesheets.reduce((sum, timesheet) => sum + timesheet.regularHours, 0),
    [timesheets],
  );

  const totalOvertimeHours = useMemo(
    () => timesheets.reduce((sum, timesheet) => sum + timesheet.overtimeHours, 0),
    [timesheets],
  );

  const selectedReportMeta = reportCatalog.find((report) => report.id === selectedReport);

  const selectedReportTables = useMemo<Array<ExportTable<unknown>>>(() => {
    const projectNameById = new Map(projects.map((project) => [project.id, `${project.projectCode} - ${project.projectName}`]));

    switch (selectedReport) {
      case "project-summary":
        return [
          toExportTable<ProjectRecord>({
            title: "Project Summary",
            rows: projects,
            columns: [
              { header: "Code", value: (row) => row.projectCode },
              { header: "Project", value: (row) => row.projectName },
              { header: "Client", value: (row) => row.clientName },
              { header: "Manager", value: (row) => row.projectManager },
              { header: "Status", value: (row) => row.status },
              { header: "Progress", value: (row) => `${row.progressPercent}%` },
              { header: "Budget", value: (row) => row.budgetAmount },
              { header: "Actual", value: (row) => row.actualAmount },
            ],
          }),
        ];
      case "wbs-cost":
        return [
          toExportTable<WbsRecord>({
            title: "WBS Cost",
            rows: wbsRecords,
            columns: [
              { header: "Project", value: (row) => projectNameById.get(row.projectId) ?? row.projectId },
              { header: "WBS Code", value: (row) => row.wbsCode },
              { header: "WBS Name", value: (row) => row.wbsName },
              { header: "Level", value: (row) => row.levelNo },
              { header: "Progress", value: (row) => `${row.progressPercent}%` },
              { header: "Budget", value: (row) => row.budgetAmount },
              { header: "Actual", value: (row) => row.actualAmount },
            ],
          }),
        ];
      case "activity-budget-vs-actual":
        return [
          toExportTable<ReportSnapshot>({
            title: "Cost Trend",
            rows: costSnapshots,
            columns: [
              { header: "Month", value: (row) => row.month },
              { header: "Budget", value: (row) => row.budget },
              { header: "Allocated", value: (row) => row.allocated },
              { header: "Actual", value: (row) => row.actual },
            ],
          }),
          toExportTable<ActivityItem>({
            title: "Activity Budget vs Actual",
            rows: activities,
            columns: [
              { header: "Activity", value: (row) => row.activityCode },
              { header: "Name", value: (row) => row.activityName },
              { header: "WBS", value: (row) => row.wbsCode },
              { header: "Status", value: (row) => row.status },
              { header: "Owner", value: (row) => row.responsibleUser },
              { header: "Progress", value: (row) => `${row.progressPercent}%` },
              { header: "Planned Start", value: (row) => row.plannedStart },
              { header: "Planned End", value: (row) => row.plannedEnd },
            ],
          }),
        ];
      case "material-request-vs-receipt":
        return [
          toExportTable<MaterialRequestItem>({
            title: "Material Request vs Receipt",
            rows: materialRequests,
            columns: [
              { header: "Request No", value: (row) => row.requestNo },
              { header: "Project", value: (row) => row.project },
              { header: "Activity", value: (row) => row.activity },
              { header: "Requested By", value: (row) => row.requestedBy },
              { header: "Status", value: (row) => formatMaterialStatus(row.status) },
              { header: "Requested", value: (row) => row.requestedQty },
              { header: "Approved", value: (row) => row.approvedQty },
              { header: "Pending", value: (row) => row.pendingQty },
            ],
          }),
        ];
      case "timesheet-utilization":
        return [
          toExportTable<{ id: string; entries: number; regularHours: string; overtimeHours: string }>({
            title: "Timesheet Utilization Summary",
            rows: [
              {
                id: "summary",
                entries: timesheets.length,
                regularHours: totalRegularHours.toFixed(2),
                overtimeHours: totalOvertimeHours.toFixed(2),
              },
            ],
            columns: [
              { header: "Entries", value: (row) => row.entries },
              { header: "Regular Hours", value: (row) => row.regularHours },
              { header: "Overtime Hours", value: (row) => row.overtimeHours },
            ],
          }),
          toExportTable<TimesheetRecord>({
            title: "Timesheet Entries",
            rows: timesheets,
            columns: [
              { header: "Employee Code", value: (row) => row.userCode },
              { header: "Employee", value: (row) => row.employeeName },
              { header: "Project", value: (row) => row.projectCode },
              { header: "Activity", value: (row) => row.activityCode },
              { header: "Work Date", value: (row) => row.workDate },
              { header: "Regular Hrs", value: (row) => row.regularHours.toFixed(2) },
              { header: "OT Hrs", value: (row) => row.overtimeHours.toFixed(2) },
              { header: "Entry Type", value: (row) => (row.allocatedActivity ? "Allocated" : "Non-Allocated") },
              { header: "Status", value: (row) => row.status },
            ],
          }),
        ];
      case "overhead-allocation":
        return [
          toExportTable<Record<string, never>>({
            title: "Overhead Allocation",
            rows: [],
            columns: [
              { header: "Period", value: () => "" },
              { header: "Project", value: () => "" },
              { header: "WBS", value: () => "" },
              { header: "Activity", value: () => "" },
              { header: "Basis", value: () => "" },
              { header: "Allocated Amount", value: () => "" },
              { header: "Posted", value: () => "" },
            ],
          }),
        ];
      case "milestone-tracking":
        return [
          toExportTable<MilestoneItem>({
            title: "Milestone Tracking",
            rows: milestones,
            columns: [
              { header: "Milestone", value: (row) => row.milestoneCode },
              { header: "Name", value: (row) => row.milestoneName },
              { header: "Planned", value: (row) => row.plannedDate },
              { header: "Actual", value: (row) => row.actualDate },
              { header: "Status", value: (row) => row.status },
              { header: "WBS", value: (row) => row.wbsCode },
            ],
          }),
        ];
      case "risk-register":
        return [
          toExportTable<RiskItem>({
            title: "Risk Register",
            rows: risks,
            columns: [
              { header: "Risk No", value: (row) => row.riskNo },
              { header: "Title", value: (row) => row.title },
              { header: "Category", value: (row) => row.category },
              { header: "Owner", value: (row) => row.owner },
              { header: "Probability", value: (row) => row.probability },
              { header: "Impact", value: (row) => row.impact },
              { header: "Severity", value: (row) => row.severity },
              { header: "Status", value: (row) => formatRiskStatus(row.status) },
              { header: "Target", value: (row) => row.targetDate },
            ],
          }),
        ];
      case "progress-summary":
        return [
          toExportTable<ProjectRecord>({
            title: "Progress Summary",
            rows: projects,
            columns: [
              { header: "Code", value: (row) => row.projectCode },
              { header: "Project", value: (row) => row.projectName },
              { header: "Status", value: (row) => row.status },
              { header: "Start", value: (row) => row.startDate },
              { header: "End", value: (row) => row.endDate },
              { header: "Progress", value: (row) => `${row.progressPercent}%` },
            ],
          }),
        ];
      default:
        return [];
    }
  }, [activities, costSnapshots, materialRequests, milestones, projects, risks, selectedReport, timesheets, totalOvertimeHours, totalRegularHours, wbsRecords]);

  function handleDownloadExcel() {
    const title = selectedReportMeta?.name ?? "Report";
    const description = selectedReportMeta?.description ?? "";
    const generatedAt = new Date().toLocaleString();
    const html = buildReportTablesHtml(selectedReportTables, { title, description, generatedAt });
    downloadFile(html, `${normalizeFilename(title)}.xls`, "application/vnd.ms-excel;charset=utf-8");
  }

  function handlePrintPdf() {
    const title = selectedReportMeta?.name ?? "Report";
    const description = selectedReportMeta?.description ?? "";
    const generatedAt = new Date().toLocaleString();
    const html = buildReportTablesHtml(selectedReportTables, { title, description, generatedAt });
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");

    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
  }

  function renderReportPanel() {
    if (isLoading) {
      return <div className="rounded-[22px] border border-line bg-white/35 px-4 py-8 text-sm text-slate-600">Loading report data...</div>;
    }

    switch (selectedReport) {
      case "project-summary":
        return (
          <DataTable
            rows={projects}
            columns={[
              { key: "projectCode", header: "Code" },
              { key: "projectName", header: "Project" },
              { key: "clientName", header: "Client" },
              { key: "projectManager", header: "Manager" },
              { key: "status", header: "Status" },
              { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
              { key: "budgetAmount", header: "Budget", render: (row) => formatCurrency(row.budgetAmount) },
              { key: "actualAmount", header: "Actual", render: (row) => formatCurrency(row.actualAmount) },
            ]}
          />
        );
      case "wbs-cost":
        return (
          <DataTable
            rows={wbsRecords}
            columns={[
              { key: "projectId", header: "Project" },
              { key: "wbsCode", header: "WBS Code" },
              { key: "wbsName", header: "WBS Name" },
              { key: "levelNo", header: "Level" },
              { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
              { key: "budgetAmount", header: "Budget", render: (row) => formatCurrency(row.budgetAmount) },
              { key: "actualAmount", header: "Actual", render: (row) => formatCurrency(row.actualAmount) },
            ]}
          />
        );
      case "activity-budget-vs-actual":
        return (
          <div className="space-y-4">
            <CostTrendChart data={costSnapshots} />
            <DataTable
              rows={activities}
              columns={[
                { key: "activityCode", header: "Activity" },
                { key: "activityName", header: "Name" },
                { key: "status", header: "Status" },
                { key: "responsibleUser", header: "Owner" },
                { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
              ]}
            />
          </div>
        );
      case "material-request-vs-receipt":
        return (
          <DataTable
            rows={materialRequests}
            columns={[
              { key: "requestNo", header: "Request No" },
              { key: "project", header: "Project" },
              { key: "activity", header: "Activity" },
              { key: "requestedBy", header: "Requested By" },
              { key: "status", header: "Status", render: (row) => formatMaterialStatus(row.status) },
              { key: "requestedQty", header: "Requested" },
              { key: "approvedQty", header: "Approved" },
              { key: "pendingQty", header: "Pending" },
            ]}
          />
        );
      case "milestone-tracking":
        return (
          <DataTable
            rows={milestones}
            columns={[
              { key: "milestoneCode", header: "Milestone" },
              { key: "milestoneName", header: "Name" },
              { key: "plannedDate", header: "Planned" },
              { key: "actualDate", header: "Actual" },
              { key: "status", header: "Status" },
              { key: "wbsCode", header: "WBS" },
            ]}
          />
        );
      case "risk-register":
        return (
          <DataTable
            rows={risks}
            columns={[
              { key: "riskNo", header: "Risk No" },
              { key: "title", header: "Title" },
              { key: "category", header: "Category" },
              { key: "owner", header: "Owner" },
              { key: "severity", header: "Severity" },
              { key: "status", header: "Status", render: (row) => formatRiskStatus(row.status) },
              { key: "targetDate", header: "Target" },
            ]}
          />
        );
      case "progress-summary":
        return (
          <DataTable
            rows={projects}
            columns={[
              { key: "projectCode", header: "Code" },
              { key: "projectName", header: "Project" },
              { key: "status", header: "Status" },
              { key: "startDate", header: "Start" },
              { key: "endDate", header: "End" },
              { key: "progressPercent", header: "Progress", render: (row) => `${row.progressPercent}%` },
            ]}
          />
        );
      case "timesheet-utilization":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-line bg-white/45 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Entries</p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">{timesheets.length}</p>
              </div>
              <div className="rounded-[22px] border border-line bg-white/45 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Regular Hours</p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">{totalRegularHours.toFixed(2)}</p>
              </div>
              <div className="rounded-[22px] border border-line bg-white/45 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Overtime Hours</p>
                <p className="mt-2 text-2xl font-semibold text-brand-strong">{totalOvertimeHours.toFixed(2)}</p>
              </div>
            </div>

            <DataTable
              rows={timesheets}
              columns={[
                { key: "userCode", header: "Employee Code" },
                { key: "employeeName", header: "Employee" },
                { key: "projectCode", header: "Project" },
                { key: "activityCode", header: "Activity" },
                { key: "workDate", header: "Work Date" },
                { key: "regularHours", header: "Regular Hrs", render: (row) => row.regularHours.toFixed(2) },
                { key: "overtimeHours", header: "OT Hrs", render: (row) => row.overtimeHours.toFixed(2) },
                {
                  key: "allocatedActivity",
                  header: "Entry Type",
                  render: (row) => (row.allocatedActivity ? "Allocated" : "Non-Allocated"),
                },
                { key: "status", header: "Status" },
              ]}
            />
          </div>
        );
      case "overhead-allocation":
        return (
          <div className="rounded-[22px] border border-dashed border-line bg-white/35 px-5 py-10 text-sm text-slate-600">
            This report menu is enabled, but its source module is not connected to the database yet.
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <AppShell
      title="Reports and analytics"
      subtitle="Open reports from a live menu and inspect the current database-backed report data on demand."
    >
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4">
        <SectionCard title="Report selector" eyebrow="Reports">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-strong">Choose report</span>
                <select
                  className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-slate-700 outline-none ring-0"
                  onChange={(event) => setSelectedReport(event.target.value as ReportId)}
                  value={selectedReport}
                >
                  {reportCatalog.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedReportMeta ? (
              <div className="flex items-center gap-3 lg:pt-8">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedReportMeta.status)}`}>
                  {formatReportStatus(selectedReportMeta.status)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {selectedReportMeta.records === null ? "Awaiting source module" : `${selectedReportMeta.records} records available`}
                </span>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title={selectedReportMeta?.name ?? "Report data"} eyebrow="Preview">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="text-sm text-slate-600">{selectedReportMeta?.description ?? "Select a report from the menu."}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-brand-strong shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || !selectedReportMeta}
                onClick={handleDownloadExcel}
                type="button"
              >
                Download Excel
              </button>
              <button
                className="rounded-full bg-brand-strong px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || !selectedReportMeta}
                onClick={handlePrintPdf}
                type="button"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
          {renderReportPanel()}
        </SectionCard>
      </section>
    </AppShell>
  );
}
