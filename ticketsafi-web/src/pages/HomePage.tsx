import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import { useEvents } from '../hooks/useEvents';
import { Loader2 } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  
  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Events'); 
  const [date, setDate] = useState('');
  const [priceRange, setPriceRange] = useState('all');

  // Use Hook with ALL parameters (Server-side filtering)
  const { events, loading, error } = useEvents(searchTerm, category, date, priceRange);

  return (
    <div className="animate-fade-in min-h-screen bg-background pb-20">
      <Hero />
      
      {/* Advanced Search Bar */}
      <SearchBar 
         searchTerm={searchTerm} 
         setSearchTerm={setSearchTerm} 
         category={category} 
         setCategory={setCategory}
         date={date}
         setDate={setDate}
         priceRange={priceRange}
         setPriceRange={setPriceRange}
      />
      
      <section id="events-section" className="px-6 pt-16 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-white">
                  {searchTerm || category !== 'All Events' || date || priceRange !== 'all' ? 'Search Results' : 'Trending Now'}
              </h2>
              <p className="text-zinc-400 mt-1">
                  {events.length} {events.length === 1 ? 'event' : 'events'} found
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
             <div className="flex justify-center py-20">
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
          )}

          {/* Error State */}
          {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center">
                  {error}
              </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
              <div className="text-center py-20 bg-surface border border-white/5 rounded-3xl">
                  <p className="text-zinc-400 text-lg">No events found matching your filters.</p>
                  <button 
                    onClick={() => { 
                        setSearchTerm(''); 
                        setCategory('All Events');
                        setDate('');
                        setPriceRange('all');
                    }}
                    className="mt-4 text-primary hover:underline"
                  >
                      Clear all filters
                  </button>
              </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onPress={() => navigate(`/event/${event.id}`)} 
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;