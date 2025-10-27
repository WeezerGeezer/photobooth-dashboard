import axios from 'axios';
import { Booth, HealthCheck } from '../types/booth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const boothAPI = {
  getAllBooths: async (): Promise<Booth[]> => {
    const response = await apiClient.get('/booths');
    return response.data;
  },

  getBoothById: async (boothId: string): Promise<Booth> => {
    const response = await apiClient.get(`/booths/${boothId}`);
    return response.data;
  },

  registerBooth: async (data: any): Promise<any> => {
    const response = await apiClient.post('/booths/register', data);
    return response.data;
  },

  submitHealthCheck: async (boothId: string, data: any): Promise<any> => {
    const response = await apiClient.post(`/booths/${boothId}/health`, data);
    return response.data;
  },
};

export default apiClient;
