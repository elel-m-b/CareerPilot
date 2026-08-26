import axiosInstance from './axios';

export const analysisApi = {
  analyzeResume: async (resumeId) => {
    const response = await axiosInstance.post(`/resumes/${resumeId}/analyze`);
    return response.data;
  },

  getResumeAnalyses: async (resumeId) => {
    const response = await axiosInstance.get(`/resumes/${resumeId}/analyses`);
    return response.data;
  },

  getAnalysisHistory: async () => {
    const response = await axiosInstance.get('/analyses');
    return response.data;
  },

  getAnalysisById: async (analysisId) => {
    const response = await axiosInstance.get(`/analyses/${analysisId}`);
    return response.data;
  },

  deleteAnalysis: async (analysisId) => {
    await axiosInstance.delete(`/analyses/${analysisId}`);
  },

  getDashboardStats: async () => {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  },
};
