import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Event } from '../types';

// Define the raw backend shape for details (includes tiers)
interface BackendEventDetail {
    id: string;
    title: string;
    start_datetime: string;
    location_name: string;
    poster_image: string | null;
    description: string;
    organizer_name: string;
    category: string; 
    tiers: {
        id: string;
        name: string;
        description: string;
        price: number;
        available_qty: number;
    }[];

    store: {
        id: string;
        name: string;
        slug: string;
        logo_image: string | null;
    } | null;
}

export const useEventDetails = (eventId: string | undefined) => {
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId) return;

        const fetchEvent = async () => {
            try {
                setLoading(true);
                const response = await api.get<BackendEventDetail>(`/api/events/${eventId}/`);
                const data = response.data;

                // Transform Backend Data -> Frontend Shape
                const mappedEvent: Event = {
                    id: data.id,
                    title: data.title,
                    date: new Date(data.start_datetime).toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    }),
                    location: data.location_name,
                    imageUrl: data.poster_image 
                        ? (data.poster_image.startsWith('http') ? data.poster_image : `${api.defaults.baseURL}${data.store.logo_image}`)
                        : 'https://placehold.co/600x400/18181b/ffffff?text=No+Image',
                    price: '0', // Not used in details header usually
                    category: data.category as any,
                    description: data.description,
                    organizer_name: data.organizer_name,
                    tiers: data.tiers.map((t) => ({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        price: t.price.toLocaleString(),
                        available_qty: t.available_qty
                    })),

                    store: data.store ? {
    id: data.store.id,
    name: data.store.name,
    slug: data.store.slug,
    logo_image: data.store.logo_image
        ? (data.store.logo_image.startsWith('http') ? data.store.logo_image : `${api.defaults.baseURL}${data.store.logo_image}`)
        : null
} : null,

                };

                setEvent(mappedEvent);
            } catch (err) {
                console.error('Failed to fetch event details:', err);
                setError('Could not load event details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    return { event, loading, error };
};