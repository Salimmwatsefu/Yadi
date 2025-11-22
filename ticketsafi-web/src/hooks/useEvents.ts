import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Event } from '../types';

interface BackendEvent {
    id: string;
    title: string;
    start_datetime: string;
    location_name: string;
    poster_image: string | null;
    lowest_price: number;
    organizer_name: string;
    description: string;
    category: string; 
    
}

export const useEvents = (
    searchQuery: string = '', 
    selectedCategory: string = 'All',
    date: string = '',
    priceRange: string = 'all'
) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                
                const params = new URLSearchParams();
                if (searchQuery) params.append('q', searchQuery);
                if (selectedCategory && selectedCategory !== 'All Events' && selectedCategory !== 'All') {
                    params.append('category', selectedCategory);
                }
                if (date) params.append('date', date);
                if (priceRange !== 'all') {
                    if (priceRange === 'free') {
                        params.append('max_price', '0');
                    } else if (priceRange.includes('-')) {
                        const [min, max] = priceRange.split('-');
                        params.append('min_price', min);
                        if (max !== 'max') params.append('max_price', max);
                    }
                }

                const response = await api.get<BackendEvent[]>(`/api/events/?${params.toString()}`);
                
                const mappedEvents: Event[] = response.data.map((item) => {
                    const d = new Date(item.start_datetime);
                    
                    // Manual formatting to ensure "Nov 27, 2025" format regardless of locale
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const monthName = months[d.getMonth()];
                    const day = d.getDate();
                    const year = d.getFullYear();
                    
                    // "Nov 27, 2025"
                    const datePart = `${monthName} ${day}, ${year}`;
                    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

                    return {
                        id: item.id,
                        title: item.title,
                        // Explicitly using bullet separator
                        date: `${datePart} • ${timePart}`,
                        location: item.location_name,
                        imageUrl: item.poster_image 
                            ? (item.poster_image.startsWith('http') ? item.poster_image : `${api.defaults.baseURL}${item.poster_image}`)
                            : 'https://placehold.co/600x400/18181b/ffffff?text=No+Image',
                        price: `KES ${item.lowest_price.toLocaleString()}`,
                        category: item.category as any,
                        isSellingFast: false, 
                        
                    };
                });

                setEvents(mappedEvents);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('Could not load events.');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedCategory, date, priceRange]);

    return { events, loading, error };
};