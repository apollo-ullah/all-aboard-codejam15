import axios, { AxiosError } from 'axios';
import { Storyboard, ScrapeResponse, GenerateSlidesResponse } from '../types';

// Use relative URLs to leverage Vite proxy
// Vite proxy in vite.config.ts forwards /api/* to http://localhost:3000
// This avoids cross-origin issues in development
const API_BASE_URL = ''; // Empty = relative URLs, uses Vite proxy

console.log('🔧 API Client Configuration:');
console.log('   Using relative URLs (Vite proxy enabled)');
console.log('   Environment:', import.meta.env.MODE);
console.log('   Proxy target: http://localhost:3000 (via vite.config.ts)');

const apiClient = axios.create({
  // No baseURL - use relative paths to leverage Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes for scraping (can take a while)
  withCredentials: false,
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    const fullURL = config.baseURL 
      ? `${config.baseURL}${config.url}` 
      : config.url || 'N/A';
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL || '(relative - using Vite proxy)',
      fullURL: fullURL,
      data: config.data,
      timeout: config.timeout,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error Details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      config: {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config 
          ? (error.config.baseURL 
              ? `${error.config.baseURL}${error.config.url}` 
              : error.config.url || 'N/A')
          : 'N/A',
        timeout: error.config?.timeout,
      },
      request: {
        readyState: (error.request as XMLHttpRequest)?.readyState,
        status: (error.request as XMLHttpRequest)?.status,
        statusText: (error.request as XMLHttpRequest)?.statusText,
        responseURL: (error.request as XMLHttpRequest)?.responseURL,
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      } : null,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

export const api = {
  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log('🔍 Testing backend connection...');
    try {
      const response = await apiClient.get('/api/test-connection');
      console.log('✅ Backend connection test successful:', response.data);
      return { success: true, message: 'Connected to backend' };
    } catch (error: any) {
      console.error('❌ Backend connection test failed:', error);
      throw new Error(`Cannot connect to backend via Vite proxy. Make sure both frontend and backend servers are running.`);
    }
  },

  async scrapeWebsite(url: string): Promise<ScrapeResponse> {
    console.log('🌐 Starting scrape request for:', url);
    try {
      const response = await apiClient.post<ScrapeResponse>('/api/scrape', { url });
      console.log('✅ Scrape successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Scrape failed:', error);
      
      // Provide detailed error message
      if (error.code === 'ERR_NETWORK') {
        throw new Error(`Network Error: Cannot connect to backend via Vite proxy. Make sure both frontend (port 5173) and backend (port 3000) servers are running.`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`Connection Refused: Backend server is not running on port 3000. Start it with: cd backend && npm run dev`);
      } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        throw new Error(`Request Timeout: The scraping request took too long. This might be normal for complex websites.`);
      } else if (error.response) {
        throw new Error(error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status} ${error.response.statusText}`);
      } else {
        throw new Error(error.message || 'Unknown error occurred');
      }
    }
  },

  async generateSlides(storyboard: Storyboard, style: 'YC' | 'Finance'): Promise<GenerateSlidesResponse> {
    console.log('📊 Starting slide generation:', { style, nodeCount: storyboard.nodes.length });
    try {
      const response = await apiClient.post<GenerateSlidesResponse>('/api/generate-slides', {
        storyboard,
        style,
      });
      console.log('✅ Slide generation successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Slide generation failed:', error);
      throw error;
    }
  },
};

