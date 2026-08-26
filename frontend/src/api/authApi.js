import axiosInstance from './axios';

export const authApi = {
  register: async (username, email, password) => {
    const response = await axiosInstance.post('/auth/register', { username, email, password });
    return response.data;
  },

  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateProfile: async (username) => {
    const response = await axiosInstance.put('/users/me', { username });
    return response.data;
  },
};
