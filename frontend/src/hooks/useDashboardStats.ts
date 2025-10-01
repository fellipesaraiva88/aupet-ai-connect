import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: async () => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.get(`${API_URL}/api/admin/dashboard/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const token = localStorage.getItem('supabase.auth.token');
      const { data } = await axios.get(`${API_URL}/api/admin/dashboard/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
