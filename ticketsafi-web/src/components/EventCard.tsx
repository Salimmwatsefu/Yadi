import React from 'react';
import { MapPin, Calendar, Ticket } from 'lucide-react';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  return (
    <div 
      onClick={onPress}
      className="group relative bg-surface rounded-2xl overflow-hidden border border-white/5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-neon"
    >
      {/* Image Section with Gradient Overlay */}
      <div className="relative h-64 w-full overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* The "Cinematic" Fade at the bottom */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent opacity-90" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-bold tracking-wider text-white uppercase bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
            {event.category}
          </span>
        </div>

        {/* Selling Fast Badge */}
        {event.isSellingFast && (
          <div className="absolute top-4 right-4 animate-pulse">
            <span className="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
              Selling Fast 🔥
            </span>
          </div>
        )}
      </div>

      {/* Content Section (Floats over the image slightly) */}
      <div className="relative p-5 -mt-12 z-10">
        {/* Date & Time */}
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-zinc-300">{event.date}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-heading font-bold text-white leading-tight mb-2 group-hover:text-primary transition-colors mt-10">
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-zinc-400 mb-6">
          <MapPin className="w-4 h-4 mr-1.5" />
          <span className="text-sm truncate">{event.location}</span>
        </div>

        {/* Footer: Price & Buy Button */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex flex-col">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Starting at</span>
                <span className="text-lg font-bold text-white font-heading">{event.price}</span>
            </div>

            <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm transition-all group-hover:bg-neon-gradient group-hover:border-transparent group-hover:shadow-lg">
                Get Tickets
            </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;