import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Event } from '../types';

// Use the existing Event interface but we might need specific fields like 'status'
// extending the interface locally for any extra organizer-specific fields if needed
interface OrganizerEvent extends Event {
    status: string;
    sold: number;
    revenue: number;
}

export const useOrganizerEvents = () => {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/organizer/events/');
        
        const mappedEvents = response.data.map((item: any) => ({
            
            id: item.id,
            title: item.title,
            date: new Date(item.start_datetime).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric'
            }),
            location: item.location_name,
            imageUrl: item.poster_image 
                ? (item.poster_image.startsWith('http') ? item.poster_image : `${api.defaults.baseURL}${item.poster_image}`)
                : 'https://placehold.co/600x400/18181b/ffffff?text=No+Image',
            price: `KES ${item.lowest_price.toLocaleString()}`,
            category: 'Concert',
            // Additional logic for status/sold could come from backend in future updates
            // For now we infer or use defaults
            status: 'Active', 
            sold: 0, // Needs backend aggregation in ListSerializer to be accurate
            revenue: 0,
            store: item.store ? {
    id: item.store.id,
    name: item.store.name,
    slug: item.store.slug,
    logo_image: item.store.logo_image 
        ? (item.store.logo_image.startsWith('http') ? item.store.logo_image : `${api.defaults.baseURL}${item.store.logo_image}`)
        : null
} : null,
            
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching organizer events:', err);
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};