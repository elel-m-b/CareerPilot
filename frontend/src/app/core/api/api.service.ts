import { Injectable, inject } from "@angular/core";
import { ApiClient } from "./api-client.service";
import type {
  AuthResponse,
  DashboardStats,
  Resume,
  ResumeAnalysis,
  ResumeDetail,
  UserProfile,
} from "./api.types";

/**
 * Every endpoint CareerPilot's frontend uses, grouped by backend controller.
 * Paths are relative to the `/api` base the Spring Boot app serves.
 */
@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly client = inject(ApiClient);

  readonly auth = {
    login: (email: string, password: string) =>
      this.client.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    register: (username: string, email: string, password: string) =>
      this.client.request<AuthResponse>("/auth/register", {
        method: "POST",
        body: { username, email, password },
      }),
  };

  readonly users = {
    me: () => this.client.request<UserProfile>("/users/me"),
    update: (username: string) =>
      this.client.request<UserProfile>("/users/me", {
        method: "PUT",
        body: { username },
      }),
  };

  readonly resumes = {
    list: () => this.client.request<Resume[]>("/resumes"),
    get: (id: number) => this.client.request<ResumeDetail>(`/resumes/${id}`),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return this.client.request<Resume>("/resumes/upload", { method: "POST", formData });
    },
    remove: (id: number) => this.client.request<void>(`/resumes/${id}`, { method: "DELETE" }),
  };

  readonly analyses = {
    history: () => this.client.request<ResumeAnalysis[]>("/analyses"),
    get: (id: number) => this.client.request<ResumeAnalysis>(`/analyses/${id}`),
    forResume: (resumeId: number) =>
      this.client.request<ResumeAnalysis[]>(`/resumes/${resumeId}/analyses`),
    analyze: (resumeId: number) =>
      this.client.request<ResumeAnalysis>(`/resumes/${resumeId}/analyze`, { method: "POST" }),
    remove: (id: number) => this.client.request<void>(`/analyses/${id}`, { method: "DELETE" }),
  };

  readonly dashboard = {
    stats: () => this.client.request<DashboardStats>("/dashboard/stats"),
  };
}
