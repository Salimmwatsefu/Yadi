import { useState, useEffect } from 'react';
import api from '../api/axios';

export interface EventPerformance {
  id: string;
  title: string;
  date: string;
  status: string;
  sold: number;
  capacity: number;
  revenue: number;
}

export interface DashboardStats {
  total_revenue: number;
  tickets_sold: number;
  total_attendees: number;
  avg_ticket_price: number;
  recent_events: EventPerformance[];
}

export const useOrganizerStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardStats>('/api/organizer/dashboard/');
        
        // Format the dates for UI
        const formattedData = {
            ...response.data,
            recent_events: response.data.recent_events.map(ev => ({
                ...ev,
                date: new Date(ev.date).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                })
            }))
        };

        setStats(formattedData);
      } catch (err) {
        console.error('Error fetching organizer stats:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};