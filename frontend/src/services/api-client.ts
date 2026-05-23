import axios, { type AxiosInstance } from 'axios';
import { apiConfig } from '@/config/api.config';
import { attachAuthInterceptor } from './interceptors';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: apiConfig.baseUrl,
    timeout: apiConfig.timeout,
    headers: apiConfig.headers,
  });

  attachAuthInterceptor(client);
  return client;
};

export const apiClient = createApiClient();

export const aiApiClient = axios.create({
  baseURL: apiConfig.aiServiceUrl,
  timeout: 60_000,
  headers: apiConfig.headers,
});
