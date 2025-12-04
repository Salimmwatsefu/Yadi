import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ArrowLeft, Share2, Info, CheckCircle2, Ticket as TicketIcon, ExternalLink, Store } from 'lucide-react';
import { useEventDetails } from '../hooks/useEventDetails';
import CheckoutModal from '../components/CheckoutModal';

const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { event, loading, error } = useEventDetails(id);
  
  // State for Selection & Modal
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  // FIX 1: Quantity is now state and defaults to 1
  const [quantity, setQuantity] = useState(1); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Helper to get selected tier details
  const selectedTierData = event?.tiers?.find(t => t.id === selectedTier);

  const handleSelectTier = (tierId: string) => {
      setSelectedTier(tierId);
      // FIX 2: Restore reset to 1 when tier is selected
      setQuantity(1); 
  }
  
  const singlePriceValue = selectedTierData 
      ? parseFloat(selectedTierData.price.replace('KES ', '').replace(/,/g, ''))
      : 0;

  // Total price now correctly uses the quantity state
  const totalPrice = `KES ${(singlePriceValue * quantity).toLocaleString()}`;


  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !event) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <p className="text-red-500 mb-4">{error || 'Event not found'}</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline">Back to Home</button>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background text-white pb-32 overflow-x-hidden">
      
      {/* --- Checkout Modal --- */}
      {selectedTierData && (
        <CheckoutModal 
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          tierId={selectedTierData.id}
          tierName={selectedTierData.name}
          price={selectedTierData.price} // Single ticket price
          quantity={quantity} // Passed as selected quantity
        />
      )}
      
      {/* --- Background Ambient Glow --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full opacity-40" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full opacity-40" />
      </div>

      {/* --- Navigation Bar --- */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center text-zinc-400 hover:text-white transition-colors"
              >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="hidden md:inline font-medium">Back to Events</span>
              </button>
              <div className="font-heading font-bold text-lg opacity-0 md:opacity-100 transition-opacity">
                 {event.title}
              </div>
              <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <Share2 className="w-5 h-5" />
              </button>
          </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="max-w-7xl mx-auto px-6 pt-8 md:pt-12">
          <div className="grid lg:grid-cols-12 gap-10">
              
              {/* LEFT COLUMN: Visuals & Description (Span 7) */}
              <div className="lg:col-span-7 space-y-8">
                  {/* Poster Image */}
                  <div className="relative aspect-[4/3] md:aspect-[16/9] w-full rounded-3xl overflow-hidden border border-white/10 shadow-neon group">
                      <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-60" />
                  </div>

                    {/* --- STORE / ORGANIZER CARD --- */}
{event.store ? (
    <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-1 rounded-3xl shadow-xl mb-6 group cursor-pointer relative overflow-hidden" onClick={() => navigate(`/stores/${event.store?.slug}`)}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-surface-highlight/50 backdrop-blur-sm rounded-[20px] p-4 flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                {event.store.logo_image ? (
                    <img src={event.store.logo_image} className="w-full h-full object-cover" alt={event.store.name} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><Store className="w-6 h-6" /></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Presented By</p>
                <h4 className="text-white font-bold truncate flex items-center gap-2">
                    {event.store.name}
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                </h4>
            </div>
        </div>
    </div>
) : null}

                  {/* About Section */}
                  <div className="bg-surface/50 backdrop-blur-sm border border-white/5 p-8 rounded-3xl">
                      <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center">
                          <Info className="w-6 h-6 mr-3 text-primary" />
                          About This Event
                      </h3>
                      <div className="prose prose-invert max-w-none">
                          <p className="text-zinc-300 leading-relaxed whitespace-pre-line text-lg">
                              {event.description || "No description available."}
                          </p>
                      </div>
                  </div>

                
              </div>

              {/* RIGHT COLUMN: Details & Tickets (Span 5) */}
              <div className="lg:col-span-5 relative">
                  {/* Sticky Wrapper */}
                  <div className="sticky top-24 space-y-6">
                      
                      {/* Event Header Info */}
                      <div className="space-y-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold tracking-wider uppercase text-zinc-300">
                              {event.category}
                          </span>
                          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
                              {event.title}
                          </h1>
                          
                          <div className="flex flex-col space-y-3 pt-2">
                              <div className="flex items-center text-zinc-300">
                                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                                  <span className="text-lg">{event.date}</span>
                              </div>
                              <div className="flex items-center text-zinc-300">
                                  <MapPin className="w-5 h-5 mr-3 text-secondary" />
                                  <span className="text-lg">{event.location}</span>
                              </div>
                          </div>
                      </div>

                      <hr className="border-white/10" />

                      {/* Ticket Selector */}
                      <div className="bg-surface border border-white/10 p-6 rounded-3xl shadow-xl">
                           <div className="flex items-center justify-between mb-6">
                               <h3 className="text-xl font-bold text-white flex items-center">
                                   <TicketIcon className="w-5 h-5 mr-2 text-primary" />
                                   Select Tickets
                               </h3>
                               <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
                                   Step 1 of 2
                               </span>
                           </div>

                           <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                              {event.tiers?.map((tier) => {
                                  const isSelected = selectedTier === tier.id;
                                  return (
                                    <div 
                                        key={tier.id}
                                        onClick={() => handleSelectTier(tier.id)}
                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                            isSelected 
                                            ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
                                            : 'bg-surface-highlight border-transparent hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`font-bold text-lg ${isSelected ? 'text-primary' : 'text-white'}`}>
                                                {tier.name}
                                            </h4>
                                            {isSelected && <CheckCircle2 className="w-6 h-6 text-primary" />}
                                        </div>
                                        <p className="text-sm text-zinc-500 mb-3">{tier.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-mono font-bold text-white">
                                                KES {tier.price}
                                            </span>
                                            {tier.available_qty < 50 && tier.available_qty > 0 && (
                                                <span className="text-xs font-bold text-orange-500 animate-pulse">
                                                    Only {tier.available_qty} left!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                  );
                              })}
                           </div>

                           {/* --- QUANTITY SELECTOR (UNLOCKED AND CAPPED) --- */}
                           {selectedTierData && (
                                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                    {/* FIX 1: Update Label */}
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10" // FIX 3: Enforce max 10
                                        // FIX 4: Use value={0 ? '' : quantity} to allow clearing, and let 1 be the final clipped value
                                        value={quantity === 0 ? '' : quantity} 
                                        disabled={false} // Unlocked
                                        onChange={(e) => {
                                            const rawValue = e.target.value;
                                            if (rawValue === '') {
                                                setQuantity(0); // Allow temporary empty state
                                            } else {
                                                const val = parseInt(rawValue);
                                                if (!isNaN(val)) {
                                                    // FIX 5: Ensure the value is clipped between 1 and 3
                                                    setQuantity(Math.min(10, Math.max(1, val))); 
                                                }
                                            }
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white text-lg focus:border-primary outline-none"
                                    />
                                </div>
                           )}
                           
                           {/* Desktop Buy Button */}
                           <div className="mt-6 pt-6 border-t border-white/10 hidden md:block">
                               <div className="flex justify-between items-center mb-4">
                                   <span className="text-zinc-400">Total Amount ({quantity} {quantity > 1 ? 'Tickets' : 'Ticket'})</span>
                                   <span className="text-2xl font-bold text-white">
                                       {totalPrice}
                                   </span>
                               </div>
                               <button 
                                 disabled={!selectedTier || quantity === 0}
                                 onClick={() => setIsCheckoutOpen(true)}
                                 className={`w-full py-4 rounded-xl font-bold text-white transition-all ${selectedTier ? 'bg-neon-gradient shadow-neon hover:scale-[1.02]' : 'bg-zinc-800 cursor-not-allowed opacity-50'}`}
                               >
                                 {selectedTier ? `Proceed to Checkout for ${quantity}` : 'Select a Ticket'}
                               </button>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- Mobile Action Bar (Floating) --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-white/10 z-40 md:hidden safe-area-bottom">
          <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                  <p className="text-xs text-zinc-400 uppercase font-bold">Total</p>
                  <p className="text-xl font-bold text-white">
                      {totalPrice}
                  </p>
              </div>
              <button 
                disabled={!selectedTier || quantity === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className={`flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all ${selectedTier ? 'bg-neon-gradient shadow-neon' : 'bg-zinc-800 cursor-not-allowed text-zinc-500'}`}
              >
                {selectedTier ? `Checkout for ${quantity}` : 'Select Ticket'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;