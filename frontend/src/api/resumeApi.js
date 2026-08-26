import axiosInstance from './axios';

export const resumeApi = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResumes: async () => {
    const response = await axiosInstance.get('/resumes');
    return response.data;
  },

  getResumeDetail: async (id) => {
    const response = await axiosInstance.get(`/resumes/${id}`);
    return response.data;
  },

  deleteResume: async (id) => {
    await axiosInstance.delete(`/resumes/${id}`);
  },
};
