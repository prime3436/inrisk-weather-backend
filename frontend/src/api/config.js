import axios from 'axios';

// Defaults to localhost for local development, but uses the environment variable
// for production builds on Vercel/Netlify/GitHub Pages.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});
