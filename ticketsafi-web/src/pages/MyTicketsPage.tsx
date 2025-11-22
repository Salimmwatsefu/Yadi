import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket as TicketIcon, ChevronRight } from 'lucide-react';
import { useMyTickets } from '../hooks/useMyTickets';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { tickets, loading, error } = useMyTickets();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-surface/50 border-b border-white/5 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-heading font-bold text-white">My Wallet</h1>
          <p className="text-zinc-400 mt-2">Manage your upcoming events and tickets</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Empty State */}
        {tickets.length === 0 && (
            <div className="text-center py-20 bg-surface border border-white/5 rounded-3xl">
                <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                    <TicketIcon className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No tickets yet</h3>
                <p className="text-zinc-400 mb-6">Looks like you haven't booked any plans yet.</p>
                <button 
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    Explore Events
                </button>
            </div>
        )}

        {/* Ticket List */}
        <div className="grid gap-6">
            {tickets.map((ticket) => (
                <div 
                    key={ticket.id}
                    onClick={() => navigate(`/ticket/${ticket.id}`)}
                    className="group relative bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-all cursor-pointer flex flex-col md:flex-row"
                >
                    {/* Left: Image */}
                    <div className="md:w-48 h-48 md:h-auto relative shrink-0">
                        <img 
                            src={ticket.event_image} 
                            alt={ticket.event_title} 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent md:bg-gradient-to-r" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                 ticket.status === 'ACTIVE' 
                                 ? 'bg-success/20 text-success border-success/20' 
                                 : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                             }`}>
                                 {ticket.status === 'ACTIVE' ? 'Valid' : ticket.status}
                             </span>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="p-6 flex-1 flex flex-col justify-center relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-heading font-bold text-white mb-2 group-hover:text-primary transition-colors">
                                    {ticket.event_title}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-zinc-400 mb-4">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1.5" />
                                        {new Date(ticket.event_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1.5" />
                                        {ticket.event_location}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider">Ticket Type</span>
                                <span className="text-white font-medium">{ticket.tier_name}</span>
                            </div>
                            
                            <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                                View QR Code <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;