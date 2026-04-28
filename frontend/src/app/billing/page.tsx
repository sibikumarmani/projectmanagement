"use client";

import axios from "axios";
import { jsPDF } from "jspdf";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { SidebarDrawer } from "@/components/common/sidebar-drawer";
import { AppShell } from "@/components/layout/app-shell";
import { BillingForm, type BillingFormValues } from "@/components/billing/billing-form";
import { billingApi, milestoneApi, projectApi } from "@/lib/api";
import type { BillingItem, MilestoneItem, ProjectRecord } from "@/lib/types";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(status: BillingItem["status"]) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function BillingPage() {
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const hasValidSelectedProject = Boolean(selectedProjectId) && !selectedProjectId.startsWith("p");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [billings, setBillings] = useState<BillingItem[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<BillingItem | null>(null);
  const [receiptBilling, setReceiptBilling] = useState<BillingItem | null>(null);

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

    async function loadBillingData() {
      try {
        setIsBillingLoading(true);
        const [billingResponse, milestoneResponse] = await Promise.all([
          billingApi.getBillings(selectedProjectId),
          milestoneApi.getMilestones(selectedProjectId),
        ]);

        if (cancelled) {
          return;
        }

        setBillings(
          (
            billingResponse.data.data as Array<
              Omit<BillingItem, "id" | "projectId" | "milestoneId"> & {
                id: number | string;
                projectId: number | string;
                milestoneId: number | string;
              }
            >
          ).map((billing) => ({
            ...billing,
            id: String(billing.id),
            projectId: String(billing.projectId),
            milestoneId: String(billing.milestoneId),
            billedAmount: Number(billing.billedAmount),
            certifiedAmount: Number(billing.certifiedAmount),
          })),
        );

        setMilestones(
          (
            milestoneResponse.data.data as Array<
              Omit<MilestoneItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
                id: number | string;
                projectId: number | string;
                wbsId: number | string | null;
              }
            >
          ).map((milestone) => ({
            ...milestone,
            id: String(milestone.id),
            projectId: String(milestone.projectId),
            wbsId: milestone.wbsId == null ? null : String(milestone.wbsId),
            wbsCode: null,
          })),
        );
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Billing data could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) {
          setIsBillingLoading(false);
        }
      }
    }

    void loadBillingData();

    return () => {
      cancelled = true;
    };
  }, [hasValidSelectedProject, selectedProjectId]);

  async function refreshBillings() {
    if (!hasValidSelectedProject) {
      setBillings([]);
      setMilestones([]);
      return;
    }

    const [billingResponse, milestoneResponse] = await Promise.all([
      billingApi.getBillings(selectedProjectId),
      milestoneApi.getMilestones(selectedProjectId),
    ]);

    setBillings(
      (
        billingResponse.data.data as Array<
          Omit<BillingItem, "id" | "projectId" | "milestoneId"> & {
            id: number | string;
            projectId: number | string;
            milestoneId: number | string;
          }
        >
      ).map((billing) => ({
        ...billing,
        id: String(billing.id),
        projectId: String(billing.projectId),
        milestoneId: String(billing.milestoneId),
        billedAmount: Number(billing.billedAmount),
        certifiedAmount: Number(billing.certifiedAmount),
      })),
    );

    setMilestones(
      (
        milestoneResponse.data.data as Array<
          Omit<MilestoneItem, "id" | "projectId" | "wbsId" | "wbsCode"> & {
            id: number | string;
            projectId: number | string;
            wbsId: number | string | null;
          }
        >
      ).map((milestone) => ({
        ...milestone,
        id: String(milestone.id),
        projectId: String(milestone.projectId),
        wbsId: milestone.wbsId == null ? null : String(milestone.wbsId),
        wbsCode: null,
      })),
    );
  }

  function openAddModal() {
    setFormError(null);
    setEditingBilling(null);
    setIsModalOpen(true);
  }

  function openEditModal(billing: BillingItem) {
    setFormError(null);
    setEditingBilling(billing);
    setIsModalOpen(true);
  }

  function closeModal() {
    setFormError(null);
    setEditingBilling(null);
    setIsModalOpen(false);
  }

  function openReceiptModal(billing: BillingItem) {
    setReceiptBilling(billing);
  }

  function closeReceiptModal() {
    setReceiptBilling(null);
  }

  async function handleSaveBilling(values: BillingFormValues) {
    if (!hasValidSelectedProject) {
      setFormError("Select a valid project first.");
      return;
    }

    const payload = {
      milestoneId: Number(values.milestoneId),
      billingNo: values.billingNo,
      billingDate: values.billingDate,
      billedAmount: values.billedAmount,
      certifiedAmount: values.certifiedAmount,
      status: values.status,
      remarks: values.remarks && values.remarks.trim().length > 0 ? values.remarks.trim() : null,
    };

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingBilling) {
        await billingApi.updateBilling(selectedProjectId, editingBilling.id, payload);
      } else {
        await billingApi.createBilling(selectedProjectId, payload);
      }

      closeModal();
      await refreshBillings();
    } catch (error: unknown) {
      setFormError(extractApiError(error, "Billing could not be saved."));
    } finally {
      setIsSaving(false);
    }
  }

  const currentProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const totalBilledAmount = billings.reduce((sum, billing) => sum + billing.billedAmount, 0);
  const totalCertifiedAmount = billings.reduce((sum, billing) => sum + billing.certifiedAmount, 0);

  const milestoneOptions = useMemo(
    () =>
      milestones.map((milestone) => ({
        id: milestone.id,
        label: `${milestone.milestoneCode} - ${milestone.milestoneName}`,
      })),
    [milestones],
  );

  function handlePrint() {
    window.print();
  }

  function buildReceiptHtml(billing: BillingItem) {
    const outstandingAmount = billing.billedAmount - billing.certifiedAmount;
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${billing.billingNo} Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 32px;
              color: #102033;
            }
            .sheet {
              border: 1px solid #d7dde5;
              border-radius: 16px;
              padding: 28px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 14px;
            }
            .muted {
              color: #5a6978;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 4px;
            }
            .value {
              font-size: 15px;
              font-weight: 600;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 10px;
            }
            .subtitle {
              margin: 0 0 24px;
              color: #5a6978;
            }
            .totals {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #d7dde5;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <p class="muted">Project Management and Cost Control System</p>
            <h1 class="title">Billing Receipt</h1>
            <p class="subtitle">Milestone-level commercial receipt for the selected project.</p>

            <div class="row">
              <div>
                <div class="muted">Project</div>
                <div class="value">${currentProject ? `${currentProject.projectCode} - ${currentProject.projectName}` : "Selected project"}</div>
              </div>
              <div>
                <div class="muted">Billing No</div>
                <div class="value">${billing.billingNo}</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="muted">Milestone</div>
                <div class="value">${billing.milestoneCode} - ${billing.milestoneName}</div>
              </div>
              <div>
                <div class="muted">Billing Date</div>
                <div class="value">${billing.billingDate}</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="muted">Status</div>
                <div class="value">${formatStatus(billing.status)}</div>
              </div>
              <div>
                <div class="muted">Billed Amount</div>
                <div class="value">${formatCurrency(billing.billedAmount)}</div>
              </div>
            </div>

            <div class="row">
              <div>
                <div class="muted">Certified Amount</div>
                <div class="value">${formatCurrency(billing.certifiedAmount)}</div>
              </div>
              <div>
                <div class="muted">Outstanding</div>
                <div class="value">${formatCurrency(outstandingAmount)}</div>
              </div>
            </div>

            <div class="totals">
              <div class="muted">Remarks</div>
              <div class="value">${billing.remarks ?? "No remarks"}</div>
            </div>
          </div>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `;
  }

  function handlePrintReceipt(billing: BillingItem) {
    const receiptWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!receiptWindow) {
      return;
    }

    receiptWindow.document.open();
    receiptWindow.document.write(buildReceiptHtml(billing));
    receiptWindow.document.close();
  }

  function handleExportReceiptPdf(billing: BillingItem) {
    const projectLabel = currentProject ? `${currentProject.projectCode} - ${currentProject.projectName}` : "Selected project";
    const outstandingAmount = billing.billedAmount - billing.certifiedAmount;
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    pdf.setFillColor(22, 58, 87);
    pdf.rect(0, 0, 595, 84, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text("Billing Receipt", 40, 52);

    pdf.setTextColor(16, 32, 51);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("Project Management and Cost Control System", 40, 110);

    const rows: Array<[string, string]> = [
      ["Project", projectLabel],
      ["Billing No", billing.billingNo],
      ["Milestone", `${billing.milestoneCode} - ${billing.milestoneName}`],
      ["Billing Date", billing.billingDate],
      ["Status", formatStatus(billing.status)],
      ["Billed Amount", formatCurrency(billing.billedAmount)],
      ["Certified Amount", formatCurrency(billing.certifiedAmount)],
      ["Outstanding", formatCurrency(outstandingAmount)],
      ["Remarks", billing.remarks ?? "No remarks"],
    ];

    let y = 150;
    rows.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(90, 105, 120);
      pdf.text(label.toUpperCase(), 40, y);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.setTextColor(16, 32, 51);
      const lines = pdf.splitTextToSize(value, 360);
      pdf.text(lines, 180, y);
      y += Math.max(32, lines.length * 18 + 12);
    });

    pdf.setDrawColor(215, 221, 229);
    pdf.line(40, y + 8, 555, y + 8);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(90, 105, 120);
    pdf.text("System-generated milestone billing receipt", 40, y + 30);

    pdf.save(`${billing.billingNo}.pdf`);
  }

  return (
    <AppShell
      title="Milestone billing"
      subtitle="Create billing at milestone level, view billing only for the selected project, and print the current billing list when needed."
    >
      <SectionCard
        title="Billing register"
        eyebrow="Commercial Control"
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
              className="rounded-full border border-line bg-[color:var(--surface-soft)] px-5 py-3 text-sm font-semibold text-brand-strong"
              disabled={!hasValidSelectedProject}
              onClick={handlePrint}
              type="button"
            >
              Print List
            </button>
            <button
              className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
              disabled={!hasValidSelectedProject}
              onClick={openAddModal}
              type="button"
            >
              Add Billing
            </button>
          </div>
        }
      >
        {error ? <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mb-4 grid gap-4 md:grid-cols-3 print:grid-cols-3">
          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Selected Project</p>
            <p className="mt-2 text-sm font-semibold text-brand-strong">
              {currentProject ? `${currentProject.projectCode} - ${currentProject.projectName}` : "No project selected"}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Total Billed</p>
            <p className="mt-2 text-sm font-semibold text-brand-strong">{formatCurrency(totalBilledAmount)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Total Certified</p>
            <p className="mt-2 text-sm font-semibold text-brand-strong">{formatCurrency(totalCertifiedAmount)}</p>
          </div>
        </div>

        {isProjectsLoading || (hasValidSelectedProject && isBillingLoading) ? (
          <div className="rounded-[22px] border border-line bg-[color:var(--surface-soft)] px-4 py-8 text-sm text-[color:var(--foreground-muted)]">Loading billing data...</div>
        ) : (
          <DataTable
            rows={hasValidSelectedProject ? billings : []}
            columns={[
              { key: "billingNo", header: "Billing No" },
              { key: "milestoneCode", header: "Milestone Code" },
              { key: "milestoneName", header: "Milestone" },
              { key: "billingDate", header: "Billing Date" },
              { key: "billedAmount", header: "Billed", render: (row) => formatCurrency(row.billedAmount) },
              { key: "certifiedAmount", header: "Certified", render: (row) => formatCurrency(row.certifiedAmount) },
              { key: "status", header: "Status", render: (row) => formatStatus(row.status) },
              { key: "remarks", header: "Remarks", render: (row) => row.remarks ?? "-" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2 print:hidden">
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => openReceiptModal(row)}
                      type="button"
                    >
                      Receipt
                    </button>
                    <button
                      className="rounded-full border border-line bg-[color:var(--surface-raised)] px-3 py-2 text-xs font-semibold text-brand-strong"
                      onClick={() => openEditModal(row)}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SidebarDrawer
        eyebrow={editingBilling ? "Update billing" : "Create billing"}
        onClose={closeModal}
        open={isModalOpen}
        title={editingBilling ? "Edit billing" : "New billing"}
        widthClassName="sm:max-w-3xl"
      >
            <BillingForm
              error={formError}
              initialValues={
                editingBilling
                  ? {
                      milestoneId: editingBilling.milestoneId,
                      billingNo: editingBilling.billingNo,
                      billingDate: editingBilling.billingDate,
                      billedAmount: editingBilling.billedAmount,
                      certifiedAmount: editingBilling.certifiedAmount,
                      status: editingBilling.status,
                      remarks: editingBilling.remarks ?? "",
                    }
                  : undefined
              }
              isSubmitting={isSaving}
              milestoneOptions={milestoneOptions}
              onCancel={closeModal}
              onSubmit={handleSaveBilling}
              submitLabel={editingBilling ? "Save Changes" : "Save Billing"}
            />
      </SidebarDrawer>

      <SidebarDrawer
        description="Receipt view for this billing entry. You can print it or export it to PDF."
        eyebrow="Billing receipt"
        onClose={closeReceiptModal}
        open={Boolean(receiptBilling)}
        title={receiptBilling?.billingNo ?? "Billing receipt"}
        widthClassName="sm:max-w-3xl"
      >
        {receiptBilling ? (
          <div className="rounded-[24px] border border-line bg-[color:var(--surface-soft)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-subtle)]">Project Management and Cost Control System</p>
              <h3 className="mt-2 display-font text-3xl font-semibold text-brand-strong">Billing Receipt</h3>
              <p className="mt-2 text-sm text-[color:var(--foreground-muted)]">Milestone-level billing receipt generated from the selected project.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Project</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">
                    {currentProject ? `${currentProject.projectCode} - ${currentProject.projectName}` : "Selected project"}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Billing Date</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">{receiptBilling.billingDate}</p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Milestone</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">
                    {receiptBilling.milestoneCode} - {receiptBilling.milestoneName}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Status</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">{formatStatus(receiptBilling.status)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Billed Amount</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">{formatCurrency(receiptBilling.billedAmount)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Certified Amount</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">{formatCurrency(receiptBilling.certifiedAmount)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-[color:var(--surface-soft)] px-4 py-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Remarks</p>
                  <p className="mt-2 text-sm font-semibold text-brand-strong">{receiptBilling.remarks ?? "No remarks"}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground-subtle)]">Outstanding</p>
                  <p className="mt-2 text-lg font-semibold text-brand-strong">
                    {formatCurrency(receiptBilling.billedAmount - receiptBilling.certifiedAmount)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    className="rounded-full border border-line bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold text-brand-strong"
                    onClick={() => handlePrintReceipt(receiptBilling)}
                    type="button"
                  >
                    Print Receipt
                  </button>
                  <button
                    className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => handleExportReceiptPdf(receiptBilling)}
                    type="button"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
          </div>
        ) : null}
      </SidebarDrawer>
    </AppShell>
  );
}
