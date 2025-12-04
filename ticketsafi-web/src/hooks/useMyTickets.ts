import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { PaginatedResponse } from '../types';

export interface TicketSummary {
  id: string;
  qr_code_hash: string;
  event_title: string;
  event_start_date: string;
  event_location: string;
  event_image: string;
  tier_name: string;
  status: 'ACTIVE' | 'CHECKED_IN' | 'USED' | 'CANCELLED';
}

export const useMyTickets = () => {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await api.get<PaginatedResponse<TicketSummary>>('/api/tickets/');
        
        const mappedTickets = response.data.results.map(t => ({
            ...t,
            // Ensure image URL is absolute
            event_image: t.event_image.startsWith('http') 
                ? t.event_image 
                : `${api.defaults.baseURL}${t.event_image}`
        }));

        setTickets(mappedTickets);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Could not load your tickets.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return { tickets, loading, error };
};