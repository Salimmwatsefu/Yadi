import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { ArrowLeft, Share2, Download, Calendar, MapPin, User, Store, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import * as htmlToImage from 'html-to-image'; // You might need to install this: npm install html-to-image

interface TicketData {
  id: string;
  qr_code_hash: string;
  event_title: string;
  event_start_date: string;
  event_end_date: string;
  event_location: string;
  event_image: string;
  organizer_name: string;
  attendee_name: string;
  attendee_email: string;
  tier_name: string;
  tier_price: number;
  status: string;
}

const TicketPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await api.get(`/api/tickets/${id}/`);
        setTicket({
            ...response.data,
            event_image: response.data.event_image.startsWith('http') 
                ? response.data.event_image 
                : `http://localhost:8000${response.data.event_image}`
        });
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  // --- NEW: Native Image Sharing ---
  const handleShare = async () => {
    if (!ticket || !ticketRef.current) return;

    try {
        // 1. Generate Image from DOM
        const dataUrl = await htmlToImage.toPng(ticketRef.current);
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `Ticket-${ticket.event_title}.png`, { type: 'image/png' });

        // 2. Check if Native Sharing is supported (Mobile)
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Ticket: ${ticket.event_title}`,
                text: `Hey! Here is my ticket for ${ticket.event_title}.`,
            });
        } else {
            // 3. Fallback for Desktop: Just Download it
            const link = document.createElement('a');
            link.download = `Ticket-${ticket.event_title}.png`;
            link.href = dataUrl;
            link.click();
            alert("Ticket image saved! You can now manually send it on WhatsApp.");
        }
    } catch (error) {
        console.error("Error sharing:", error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background text-white">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!ticket) return null;

  const startDate = new Date(ticket.event_start_date);
  const endDate = new Date(ticket.event_end_date);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center pt-6 pb-20 px-4 overflow-y-auto">
      
      <div className="w-full max-w-md flex justify-between items-center mb-8">
         <button onClick={() => navigate('/')} className="p-2 bg-surface border border-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
             <ArrowLeft className="w-5 h-5" />
         </button>
         <h2 className="font-heading font-bold text-lg tracking-wide">DIGITAL PASS</h2>
         <button onClick={handleShare} className="p-2 bg-surface border border-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
             <Share2 className="w-5 h-5" />
         </button>
      </div>

      {/* --- THE TICKET STUB (Ref attached for screenshot) --- */}
      <div ref={ticketRef} className="w-full max-w-md bg-surface rounded-3xl overflow-hidden shadow-neon border border-white/10 relative animate-slide-up">
          
          <div className="relative h-56">
              <img 
                  src={ticket.event_image} 
                  alt={ticket.event_title} 
                  className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
              
              <div className="absolute bottom-4 left-6 right-6">
                  <span className="inline-block px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/20">
                      {ticket.organizer_name} Presents
                  </span>
                  <h1 className="text-2xl font-heading font-bold leading-tight text-white mb-1 drop-shadow-md">
                      {ticket.event_title}
                  </h1>
              </div>
          </div>

          <div className="px-6 pt-4 pb-6 space-y-5 bg-surface">
              <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center shrink-0 text-primary">
                      <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Date & Time</p>
                      <p className="font-medium text-white text-sm mt-0.5">
                          {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-400">
                          {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                  </div>
              </div>

              <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center shrink-0 text-secondary">
                      <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Location</p>
                      <p className="font-medium text-white text-sm mt-0.5">{ticket.event_location}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Attendee</p>
                      <div className="flex items-center mt-1">
                          <User className="w-3 h-3 mr-1.5 text-zinc-400" />
                          <p className="text-sm font-medium text-white truncate">{ticket.attendee_name}</p>
                      </div>
                  </div>
                  <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Ticket Type</p>
                      <div className="flex items-center mt-1">
                          <p className="text-sm font-bold text-primary">{ticket.tier_name}</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="relative flex items-center justify-between px-0 bg-surface">
             <div className="w-6 h-6 rounded-full bg-background -ml-3"></div>
             <div className="flex-1 border-t-2 border-dashed border-zinc-700 mx-2"></div>
             <div className="w-6 h-6 rounded-full bg-background -mr-3"></div>
          </div>

          <div className="bg-white p-8 flex flex-col items-center justify-center pb-10">
              <div className="bg-white p-2 rounded-xl">
                  <QRCode 
                      value={ticket.qr_code_hash} 
                      size={180}
                      level="H"
                  />
              </div>
              <p className="text-zinc-500 text-xs font-mono mt-4 uppercase tracking-widest">
                  ID: {ticket.id.split('-')[0]}
              </p>
              <div className="mt-3 flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Valid Entry</span>
              </div>
          </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 w-full max-w-md grid grid-cols-1 gap-4">
        <button 
            onClick={handleShare} // Triggers native share (Image on Mobile)
            className="flex items-center justify-center py-4 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20b85c] transition-colors shadow-[0_0_20px_rgba(37,211,102,0.4)]"
        >
            <MessageCircle className="w-5 h-5 mr-2" />
            Share Ticket Image (WhatsApp)
        </button>
      </div>

    </div>
  );
};

export default TicketPage;