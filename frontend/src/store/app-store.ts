"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  selectedProjectId: string;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  user: {
    id: number;
    userCode?: string;
    fullName: string;
    email: string;
    roleName: string;
    avatarImage?: string | null;
  } | null;
  setSelectedProjectId: (projectId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuth: (payload: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      userCode?: string;
      fullName: string;
      email: string;
      roleName: string;
      avatarImage?: string | null;
    };
  }) => void;
  updateUser: (payload: Partial<NonNullable<AppState["user"]>>) => void;
  clearAuth: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedProjectId: "p1",
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      user: null,
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAuth: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      updateUser: (payload) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...payload,
              }
            : state.user,
        })),
      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "pms-auth-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
