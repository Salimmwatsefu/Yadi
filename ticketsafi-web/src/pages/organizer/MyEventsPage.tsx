import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, MapPin, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { useOrganizerEvents } from '../../hooks/useOrganizerEvents';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { events, loading, error } = useOrganizerEvents();

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">My Events</h1>
          <p className="text-zinc-400 mt-1">Manage your listings, edit details, and track performance.</p>
        </div>
        <button 
            onClick={() => navigate('/organizer/create')}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-neon flex items-center"
        >
            <Plus className="w-5 h-5 mr-2" />
            Create Event
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
              <input 
                  type="text" 
                  placeholder="Search events..." 
                  className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-12 text-white placeholder:text-zinc-600 focus:border-primary outline-none"
              />
          </div>
          <div className="flex gap-4">
              <button className="px-4 py-3 bg-surface border border-white/10 rounded-xl text-zinc-300 hover:text-white flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
              </button>
          </div>
      </div>

      {/* Events List */}
      {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
          </div>
      ) : events.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-white/5 rounded-3xl">
              <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
              <p className="text-zinc-400 mb-6">You haven't created any events yet.</p>
              <button 
                  onClick={() => navigate('/organizer/create')}
                  className="text-primary hover:underline font-medium"
              >
                  Create your first event
              </button>
          </div>
      ) : (
          <div className="grid gap-4">
              {events.map((event) => (
                  <div key={event.id} className="group bg-surface border border-white/5 p-4 rounded-2xl hover:border-white/20 transition-all flex flex-col md:flex-row gap-6 items-center">
                      {/* Image */}
                      <div className="w-full md:w-32 h-32 md:h-24 rounded-xl overflow-hidden bg-surface-highlight shrink-0">
                          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center md:text-left">
                          <h3 className="font-heading font-bold text-white text-lg mb-1">{event.title}</h3>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-zinc-400">
                              <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1.5 text-primary" />
                                  {event.date}
                              </div>
                              <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1.5 text-secondary" />
                                  {event.location}
                              </div>
                          </div>
                      </div>

                      {/* Stats (Mocked for List View for now) */}
                      <div className="flex gap-6 text-center px-6 md:border-l md:border-r border-white/5">
                          <div>
                              <p className="text-xs text-zinc-500 uppercase font-bold">Status</p>
                              <span className="inline-block px-2 py-0.5 mt-1 rounded bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                  Active
                              </span>
                          </div>
                          <div>
                              <p className="text-xs text-zinc-500 uppercase font-bold">Price</p>
                              <p className="text-white font-mono font-bold mt-0.5">{event.price}</p>
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center">
                          <button 
                            
                            onClick={() => navigate(`/organizer/events/${event.id}`)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                              View
                          </button>
                          <button className="ml-2 p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5">
                              <MoreHorizontal className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default MyEventsPage;