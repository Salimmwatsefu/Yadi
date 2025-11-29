import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Ticket, ArrowUpRight, Sparkles } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';

const Hero = () => {
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-rotate
  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeIndex, events.length]);

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setActiveIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  };

  const containerVariants: any = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 } },
    exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0, transition: { duration: 0.3 } })
  };

  const blockVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  };

  // Helper to correctly split date string
  const getDateTime = (dateString: string) => {
      if (!dateString) return { date: '', time: '' };
      
      if (dateString.includes('•')) {
          const parts = dateString.split('•');
          return { date: parts[0].trim(), time: parts[1].trim() };
      }
      
      const lastComma = dateString.lastIndexOf(',');
      if (lastComma !== -1) {
          return {
              date: dateString.substring(0, lastComma).trim(),
              time: dateString.substring(lastComma + 1).trim()
          };
      }
      
      return { date: dateString, time: '' };
  };

  if (loading) {
      return (
          <div className="h-[85vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  const activeEvent = events[activeIndex];
  const { date: displayDate, time: displayTime } = activeEvent ? getDateTime(activeEvent.date) : { date: '', time: '' };

  return (
    <header className="relative flex flex-col justify-center items-center px-2 md:px-8 overflow-hidden bg-background h-[100dvh] md:h-[90vh] pt-5 pb-4 md:pb-0">
      
      {/* --- DESKTOP SIDE NAVIGATION (Hidden on Mobile) --- */}
      <button 
        onClick={prevSlide} 
        className="absolute left-4 z-30 p-3 rounded-full bg-black/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all backdrop-blur-sm group hidden md:block"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button 
        onClick={nextSlide} 
        className="absolute right-4 z-30 p-3 rounded-full bg-black/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all backdrop-blur-sm group hidden md:block"
      >
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* --- CONTENT LAYER (Z-10) --- */}
      <div className="w-full max-w-[1400px] h-full flex flex-col relative z-10">
          
          {/* --- MAIN BENTO GRID --- */}
          <div className="flex-1 w-full min-h-0 flex items-center">
            <div className="w-full h-full relative overflow-hidden">
                
                <div className="absolute inset-0">
                    <AnimatePresence initial={false} mode="wait" custom={direction}>
                        {activeEvent && (
                            <motion.div 
                                key={activeIndex}
                                custom={direction}
                                variants={containerVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                // MOBILE FIX: Use 'fr' units instead of percentages to guarantee filling height
                                className="w-full h-full grid grid-cols-1 md:grid-cols-3 grid-rows-[2fr_1fr_auto] md:grid-rows-2 gap-3"
                            >
                                {/* 1. IMAGE BLOCK (Top on Mobile, Left on Desktop) */}
                                <motion.div 
                                    variants={blockVariants}
                                    className="md:col-span-2 md:row-span-2 relative rounded-[2rem] overflow-hidden group cursor-pointer bg-zinc-900"
                                    onClick={() => navigate(`/event/${activeEvent.id}`)}
                                >
                                    <img 
                                        src={activeEvent.imageUrl} 
                                        alt={activeEvent.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                                    
                                    {/* Featured Badge */}
                                    <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
                                        <div className="relative px-3 py-1 md:px-4 md:py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
                                            <Sparkles className="w-3 h-3 text-white" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Featured</span>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full z-10 max-w-3xl">
                                        <div className="flex items-center gap-2 mb-2 md:mb-4">
                                            <span className="bg-white text-black px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                {activeEvent.category}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl lg:text-6xl font-heading font-bold text-white leading-tight mb-2 md:mb-4 line-clamp-2">
                                            {activeEvent.title}
                                        </h2>
                                        <p className="text-zinc-400 text-sm md:text-base line-clamp-2 max-w-xl leading-relaxed hidden md:block">
                                            {activeEvent.description || "Join us for an unforgettable experience featuring top artists and immersive vibes."}
                                        </p>
                                    </div>
                                    
                                    {/* Desktop Hover Arrow */}
                                    <div className="absolute top-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full hidden md:flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 border border-white/10">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>

                                    {/* --- MOBILE NAVIGATION CONTROLS (Inside Image) --- */}
                                    <div className="absolute top-2 right-6 z-30 flex gap-2 md:hidden">
                                        <button onClick={prevSlide} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white active:scale-95 transition-transform">
                                            <ChevronLeft className="w-3 h-3" />
                                        </button>
                                        <button onClick={nextSlide} className="p-3 rounded-full bg-white text-black border border-white active:scale-95 transition-transform">
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </motion.div>

        {/* 1. WRAPPER: Changed to Grid for perfect 50/50 split */}
<div className="grid grid-cols-2 sm:grid-cols-1 gap-3 md:gap-6 w-full">

    {/* 2. DETAILS BLOCK */}
    <motion.div 
        variants={blockVariants}
        // Removed 'md:block' dependencies. Grid handles the width now.
        className="relative rounded-[2rem] p-4 md:p-8 flex flex-col justify-between group overflow-hidden shadow-2xl border border-white/10 h-[170px] md:h-[230px] w-full min-w-0"
    >
        {/* ... GLOWY BACKGROUNDS ... */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/60 to-zinc-900/90" />
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-spin-slow opacity-30 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" 
             style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}>
        </div>

        <div className="relative z-10 flex md:block items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1 md:mb-3 text-white/70">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Date</span>
                </div>
                <h3 className="text-lg md:text-2xl font-heading font-bold text-white mb-1 drop-shadow-md truncate">
                    {displayDate}
                </h3>
                <p className="text-zinc-300 text-xs md:text-base font-medium">
                    {displayTime}
                </p>
            </div>
        </div>

        <div className="relative z-10 pt-3 md:pt-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-2 text-white/70 mb-1">
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-secondary" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Location</span>
            </div>
            <p className="text-zinc-200 text-sm md:text-base truncate font-medium">
                {activeEvent.location.split(',')[0]}
            </p>
        </div>
    </motion.div>

    {/* 3. ACTION BLOCK */}
    <motion.div 
        variants={blockVariants}
        className="bg-white text-black rounded-[2rem] p-4 md:p-8 flex flex-col justify-between items-center md:items-stretch relative overflow-hidden group cursor-pointer hover:bg-zinc-200 transition-colors h-[170px] md:h-[230px] w-full min-w-0"
        onClick={() => navigate(`/event/${activeEvent.id}`)}
    >
        <div className="relative z-10 flex flex-col items-center md:items-start">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Starting From</p>
            <h3 className="text-xl md:text-4xl font-mono font-bold tracking-tighter text-black mt-7 sm:mt-0">
                {activeEvent.price}
            </h3>
        </div>

        <div className="relative z-10 w-full py-2 md:py-4 px-2 md:px-0 rounded-xl border-2 border-black flex items-center justify-center gap-2 font-bold text-xs md:text-base mt-0 md:mt-2 group-hover:bg-black group-hover:text-white transition-all">
            <span className="hidden md:inline">Get Tickets</span>
            <span className="md:hidden">Buy</span>
            <Ticket className="w-4 h-4 md:w-5 md:h-5" />
        </div>
    </motion.div>

</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

          </div>
      </div>
    </header>
  );
};

export default Hero;