// src/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const getFullUrl = (path: string) => {
  // Remove /api from the base URL to get the root
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}/${path}`;
};