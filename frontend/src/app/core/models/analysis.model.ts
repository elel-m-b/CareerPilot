export interface ResumeSection {
  id: number;
  sectionType: string;
  score: number;
  feedback: string;
}

export interface Recommendation {
  id: number;
  category: string;
  priority: string;
  message: string;
}

export interface ResumeAnalysis {
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
  sections: ResumeSection[];
  recommendations: Recommendation[];
}
