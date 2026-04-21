export type ProjectStatus = "Planning" | "Active" | "At Risk" | "Closed";
export type RiskStatus = "OPEN" | "UNDER_REVIEW" | "MITIGATION_IN_PROGRESS" | "CLOSED" | "ESCALATED";

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  tone: "success" | "warning" | "danger";
};

export type ProjectSummary = {
  id: string;
  code: string;
  name: string;
  client: string;
  manager: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  actual: number;
  startDate: string;
  endDate: string;
  location: string;
};

export type ProjectRecord = {
  id: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  status: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
  actualAmount: number;
  progressPercent: number;
};

export type WbsNode = {
  id: string;
  code: string;
  name: string;
  level: number;
  owner: string;
  progress: number;
  budget: number;
  actual: number;
};

export type WbsRecord = {
  id: string;
  projectId: string;
  wbsCode: string;
  wbsName: string;
  levelNo: number;
  progressPercent: number;
  budgetAmount: number;
  actualAmount: number;
};

export type ActivityItem = {
  id: string;
  projectId: string;
  wbsId: string;
  activityCode: string;
  activityName: string;
  wbsCode: string | null;
  plannedStart: string;
  plannedEnd: string;
  durationDays: number;
  progressPercent: number;
  status: "Not Started" | "In Progress" | "Delayed" | "Completed";
  responsibleUser: string;
};

export type RiskItem = {
  id: string;
  projectId: string;
  activityId: string;
  riskNo: string;
  title: string;
  category: string;
  owner: string;
  probability: number;
  impact: number;
  severity: number;
  status: RiskStatus;
  targetDate: string;
};

export type MilestoneItem = {
  id: string;
  milestoneCode: string;
  milestoneName: string;
  projectId: string;
  wbsId: string | null;
  plannedDate: string;
  actualDate: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "AT_RISK";
  wbsCode: string | null;
};

export type MaterialRequestItem = {
  id: string;
  requestNo: string;
  projectId: string;
  project: string;
  activityId: string;
  activity: string;
  requestedBy: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PARTIALLY_RECEIVED" | "FULLY_RECEIVED";
  requestedQty: number;
  approvedQty: number;
  pendingQty: number;
};

export type ReportSnapshot = {
  month: string;
  budget: number;
  actual: number;
  allocated: number;
};

export type BillingItem = {
  id: string;
  projectId: string;
  milestoneId: string;
  milestoneCode: string;
  milestoneName: string;
  billingNo: string;
  billingDate: string;
  billedAmount: number;
  certifiedAmount: number;
  status: "DRAFT" | "SUBMITTED" | "CERTIFIED" | "REJECTED" | "PAID";
  remarks: string | null;
};
