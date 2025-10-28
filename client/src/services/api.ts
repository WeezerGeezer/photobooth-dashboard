import axios from 'axios';
import { Booth, HealthCheck } from '../types/booth';
import { mockBooths, generateMockBooths } from './mockData';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA !== 'false';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const boothAPI = {
  getAllBooths: async (): Promise<Booth[]> => {
    try {
      // Try to fetch from real API first
      const response = await apiClient.get('/booths');
      return response.data;
    } catch (error) {
      // Fallback to mock data
      if (USE_MOCK_DATA) {
        console.log('Using mock data - API unavailable');
        return mockBooths;
      }
      throw error;
    }
  },

  getBoothById: async (boothId: string): Promise<Booth> => {
    try {
      // Try to fetch from real API first
      const response = await apiClient.get(`/booths/${boothId}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data
      if (USE_MOCK_DATA) {
        const booth = mockBooths.find(b => b.id === boothId);
        if (booth) return booth;
      }
      throw error;
    }
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
