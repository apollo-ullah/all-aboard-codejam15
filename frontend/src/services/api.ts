import axios from 'axios';
import { Storyboard, ScrapeResponse, GenerateSlidesResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  async scrapeWebsite(url: string): Promise<ScrapeResponse> {
    const response = await apiClient.post<ScrapeResponse>('/api/scrape', { url });
    return response.data;
  },

  async generateSlides(storyboard: Storyboard, style: 'YC' | 'Finance'): Promise<GenerateSlidesResponse> {
    const response = await apiClient.post<GenerateSlidesResponse>('/api/generate-slides', {
      storyboard,
      style,
    });
    return response.data;
  },
};

