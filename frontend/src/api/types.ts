/**
 * DTOs returned by the CareerPilot Spring Boot API.
 *
 * Kept in one place so the transport layer is the only code that knows the
 * backend's JSON shape. Field names match the Java records exactly.
 */

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  status?: number;
  timestamp?: string;
  path?: string;
  errors?: Record<string, string>;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
};

export type Resume = {
  id: number;
  userId: number;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  latestScore: number | null;
  latestAnalysisId: number | null;
};

export type ResumeDetail = {
  id: number;
  userId: number;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  uploadedAt: string;
  updatedAt: string;
};

export type AnalysisSection = {
  id: number;
  sectionType: string;
  score: number;
  feedback: string;
};

export type AnalysisRecommendation = {
  id: number;
  category: string;
  priority: string;
  message: string;
};

export type ResumeAnalysis = {
  id: number;
  resumeId: number;
  originalFilename: string;
  overallScore: number;
  atsScore: number;
  contentScore: number;
  structureScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectsScore: number;
  analyzedAt: string;
  sections: AnalysisSection[];
  recommendations: AnalysisRecommendation[];
};

export type DashboardStats = {
  totalResumes: number;
  totalAnalyses: number;
  averageScore: number;
  bestScore: number;
};
