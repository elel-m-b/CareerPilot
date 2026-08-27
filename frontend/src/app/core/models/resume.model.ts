export interface Resume {
  id: number;
  userId: number;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  latestScore?: number;
  latestAnalysisId?: number;
}

export interface ResumeDetail extends Resume {
  extractedText?: string;
  updatedAt: string;
}
