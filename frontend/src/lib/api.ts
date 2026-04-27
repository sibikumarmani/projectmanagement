import axios from "axios";
import { useAppStore } from "@/store/app-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const inMemoryToken = useAppStore.getState().accessToken;

    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
      return config;
    }

    const persisted = window.localStorage.getItem("pms-auth-store");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted) as {
          state?: { accessToken?: string | null };
        };
        const persistedToken = parsed.state?.accessToken;
        if (persistedToken) {
          config.headers.Authorization = `Bearer ${persistedToken}`;
        }
      } catch {
        window.localStorage.removeItem("pms-auth-store");
      }
    }
  }

  return config;
});

export const authApi = {
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  register: (payload: { fullName: string; email: string; password: string }) => api.post("/auth/register", payload),
  verifyEmail: (payload: { email: string; code: string }) => api.post("/auth/verify-email", payload),
  resendVerificationCode: (payload: { email: string }) => api.post("/auth/resend-verification-code", payload),
  verificationStatus: (payload: { email: string }) => api.post("/auth/verification-status", payload),
  forgotPassword: (payload: { email: string }) => api.post("/auth/forgot-password", payload),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => api.post("/auth/reset-password", payload),
  refresh: (payload: { refreshToken: string }) => api.post("/auth/refresh", payload),
};

export const agentApi = {
  chat: (payload: {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  }) => api.post("/agent/chat", payload),
};

export const userApi = {
  getUsers: () => api.get("/users"),
  createUser: (payload: {
    fullName: string;
    email: string;
    password: string;
    roleName: string;
    active: boolean;
    emailVerified: boolean;
  }) => api.post("/users", payload),
  updateUser: (
    id: string,
    payload: {
      fullName: string;
      email: string;
      password?: string;
      roleName: string;
      active: boolean;
      emailVerified: boolean;
    },
  ) => api.put(`/users/${id}`, payload),
  getLatestResetCode: (id: string) => api.get(`/users/${id}/latest-reset-code`),
};

export const allocationApi = {
  getAllocations: () => api.get("/employee-allocations"),
  createAllocation: (payload: {
    userId: number;
    projectId: number;
    activityId: number;
    allocationDate: string;
    allocationPercentage: number;
    active: boolean;
    remarks?: string;
  }) => api.post("/employee-allocations", payload),
  updateAllocation: (
    id: string,
    payload: {
      userId: number;
      projectId: number;
      activityId: number;
      allocationDate: string;
      allocationPercentage: number;
      active: boolean;
      remarks?: string;
    },
  ) => api.put(`/employee-allocations/${id}`, payload),
};

export const timesheetApi = {
  getTimesheets: () => api.get("/timesheets"),
  createTimesheet: (payload: {
    userId: number;
    projectId: number;
    activityId: number;
    workDate: string;
    regularHours: number;
    overtimeHours: number;
    allocatedActivity: boolean;
    status: string;
    remarks?: string;
  }) => api.post("/timesheets", payload),
  updateTimesheet: (
    id: string,
    payload: {
      userId: number;
      projectId: number;
      activityId: number;
      workDate: string;
      regularHours: number;
      overtimeHours: number;
      allocatedActivity: boolean;
      status: string;
      remarks?: string;
    },
  ) => api.put(`/timesheets/${id}`, payload),
};

export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),
};

export const projectApi = {
  getProjects: () => api.get("/projects"),
  getProjectWorkspace: (id: string) => api.get(`/projects/${id}/workspace`),
  createProject: (payload: {
    projectCode: string;
    projectName: string;
    clientName: string;
    projectManager: string;
    startDate: string;
    endDate: string;
    budgetAmount: number;
  }) => api.post("/projects", payload),
  updateProject: (
    id: string,
    payload: {
      projectCode: string;
      projectName: string;
      clientName: string;
      projectManager: string;
      startDate: string;
      endDate: string;
      budgetAmount: number;
    },
  ) => api.put(`/projects/${id}`, payload),
  createProjectWorkspace: (payload: {
    project: {
      projectCode: string;
      projectName: string;
      clientName: string;
      projectManager: string;
      startDate: string;
      endDate: string;
      budgetAmount: number;
    };
    wbs: Array<{
      id: number | null;
      clientKey: string;
      wbsCode: string;
      wbsName: string;
      levelNo: number;
      progressPercent: number;
      budgetAmount: number;
      actualAmount: number;
    }>;
    activities: Array<{
      id: number | null;
      clientKey: string;
      wbsId: number | null;
      wbsClientKey: string | null;
      activityCode: string;
      activityName: string;
      plannedStart: string;
      plannedEnd: string;
      durationDays: number;
      progressPercent: number;
      status: string;
      responsibleUser: string;
    }>;
    milestones: Array<{
      id: number | null;
      clientKey: string;
      wbsId: number | null;
      wbsClientKey: string | null;
      milestoneCode: string;
      milestoneName: string;
      plannedDate: string;
      actualDate: string | null;
      status: string;
    }>;
  }) => api.post("/projects/workspace", payload),
  updateProjectWorkspace: (
    id: string,
    payload: {
      project: {
        projectCode: string;
        projectName: string;
        clientName: string;
        projectManager: string;
        startDate: string;
        endDate: string;
        budgetAmount: number;
      };
      wbs: Array<{
        id: number | null;
        clientKey: string;
        wbsCode: string;
        wbsName: string;
        levelNo: number;
        progressPercent: number;
        budgetAmount: number;
        actualAmount: number;
      }>;
      activities: Array<{
        id: number | null;
        clientKey: string;
        wbsId: number | null;
        wbsClientKey: string | null;
        activityCode: string;
        activityName: string;
        plannedStart: string;
        plannedEnd: string;
        durationDays: number;
        progressPercent: number;
        status: string;
        responsibleUser: string;
      }>;
      milestones: Array<{
        id: number | null;
        clientKey: string;
        wbsId: number | null;
        wbsClientKey: string | null;
        milestoneCode: string;
        milestoneName: string;
        plannedDate: string;
        actualDate: string | null;
        status: string;
      }>;
    },
  ) => api.put(`/projects/${id}/workspace`, payload),
  deactivateProject: (id: string) => api.put(`/projects/${id}/deactivate`),
};

export const milestoneApi = {
  getMilestones: (projectId: string) => api.get(`/projects/${projectId}/milestones`),
  createMilestone: (
    projectId: string,
    payload: {
      milestoneCode: string;
      milestoneName: string;
      wbsId: number | null;
      plannedDate: string;
      actualDate: string | null;
      status: string;
    },
  ) => api.post(`/projects/${projectId}/milestones`, payload),
  updateMilestone: (
    projectId: string,
    id: string,
    payload: {
      milestoneCode: string;
      milestoneName: string;
      wbsId: number | null;
      plannedDate: string;
      actualDate: string | null;
      status: string;
    },
  ) => api.put(`/projects/${projectId}/milestones/${id}`, payload),
};

export const wbsApi = {
  getWbs: (projectId: string) => api.get(`/projects/${projectId}/wbs`),
  createWbs: (
    projectId: string,
    payload: {
      wbsCode: string;
      wbsName: string;
      levelNo: number;
      progressPercent: number;
      budgetAmount: number;
      actualAmount: number;
    },
  ) => api.post(`/projects/${projectId}/wbs`, payload),
  updateWbs: (
    projectId: string,
    id: string,
    payload: {
      wbsCode: string;
      wbsName: string;
      levelNo: number;
      progressPercent: number;
      budgetAmount: number;
      actualAmount: number;
    },
  ) => api.put(`/projects/${projectId}/wbs/${id}`, payload),
};

export const activityApi = {
  getActivities: (projectId: string) => api.get(`/projects/${projectId}/activities`),
  createActivity: (
    projectId: string,
    payload: {
      activityCode: string;
      activityName: string;
      wbsId: number;
      plannedStart: string;
      plannedEnd: string;
      durationDays: number;
      progressPercent: number;
      status: string;
      responsibleUser: string;
    },
  ) => api.post(`/projects/${projectId}/activities`, payload),
  updateActivity: (
    projectId: string,
    id: string,
    payload: {
      activityCode: string;
      activityName: string;
      wbsId: number;
      plannedStart: string;
      plannedEnd: string;
      durationDays: number;
      progressPercent: number;
      status: string;
      responsibleUser: string;
    },
  ) => api.put(`/projects/${projectId}/activities/${id}`, payload),
};

export const materialRequestApi = {
  getMaterialRequests: () => api.get("/material-requests"),
  createMaterialRequest: (payload: {
    requestNo: string;
    projectId: number;
    activityId: number;
    requestedBy: string;
    status: string;
    requestedQty: number;
    approvedQty: number;
  }) => api.post("/material-requests", payload),
  updateMaterialRequest: (
    id: string,
    payload: {
      requestNo: string;
      projectId: number;
      activityId: number;
      requestedBy: string;
      status: string;
      requestedQty: number;
      approvedQty: number;
    },
  ) => api.put(`/material-requests/${id}`, payload),
};

export const riskApi = {
  getRisks: () => api.get("/risks"),
  createRisk: (payload: {
    projectId: number;
    activityId: number;
    riskNo: string;
    title: string;
    category: string;
    owner: string;
    probability: number;
    impact: number;
    status: string;
    targetDate: string;
  }) => api.post("/risks", payload),
  updateRisk: (
    id: string,
    payload: {
      projectId: number;
      activityId: number;
      riskNo: string;
      title: string;
      category: string;
      owner: string;
      probability: number;
      impact: number;
      status: string;
      targetDate: string;
    },
  ) => api.put(`/risks/${id}`, payload),
};

export const billingApi = {
  getBillings: (projectId: string) => api.get(`/projects/${projectId}/billings`),
  createBilling: (
    projectId: string,
    payload: {
      milestoneId: number;
      billingNo: string;
      billingDate: string;
      billedAmount: number;
      certifiedAmount: number;
      status: string;
      remarks: string | null;
    },
  ) => api.post(`/projects/${projectId}/billings`, payload),
  updateBilling: (
    projectId: string,
    id: string,
    payload: {
      milestoneId: number;
      billingNo: string;
      billingDate: string;
      billedAmount: number;
      certifiedAmount: number;
      status: string;
      remarks: string | null;
    },
  ) => api.put(`/projects/${projectId}/billings/${id}`, payload),
};
