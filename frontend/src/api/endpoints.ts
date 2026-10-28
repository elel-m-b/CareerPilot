import { apiRequest } from "@/api/client";
import type {
  AuthResponse,
  DashboardStats,
  Resume,
  ResumeAnalysis,
  ResumeDetail,
  UserProfile,
} from "@/api/types";

/**
 * Every endpoint CareerPilot's frontend uses, grouped by backend controller.
 * Paths are relative to the `/api` base the Spring Boot app serves.
 */
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<AuthResponse>("/auth/login", { method: "POST", body: { email, password } }),
    register: (username: string, email: string, password: string) =>
      apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: { username, email, password },
      }),
  },

  users: {
    me: () => apiRequest<UserProfile>("/users/me"),
    update: (username: string) =>
      apiRequest<UserProfile>("/users/me", { method: "PUT", body: { username } }),
  },

  resumes: {
    list: () => apiRequest<Resume[]>("/resumes"),
    get: (id: number) => apiRequest<ResumeDetail>(`/resumes/${id}`),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<Resume>("/resumes/upload", { method: "POST", formData });
    },
    remove: (id: number) => apiRequest<void>(`/resumes/${id}`, { method: "DELETE" }),
  },

  analyses: {
    history: () => apiRequest<ResumeAnalysis[]>("/analyses"),
    get: (id: number) => apiRequest<ResumeAnalysis>(`/analyses/${id}`),
    forResume: (resumeId: number) =>
      apiRequest<ResumeAnalysis[]>(`/resumes/${resumeId}/analyses`),
    analyze: (resumeId: number) =>
      apiRequest<ResumeAnalysis>(`/resumes/${resumeId}/analyze`, { method: "POST" }),
    remove: (id: number) => apiRequest<void>(`/analyses/${id}`, { method: "DELETE" }),
  },

  dashboard: {
    stats: () => apiRequest<DashboardStats>("/dashboard/stats"),
  },
};
