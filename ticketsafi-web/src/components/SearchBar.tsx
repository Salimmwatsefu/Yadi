import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, DollarSign, ChevronDown, Layers, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  date: string;
  setDate: (date: string) => void;
  priceRange: string;
  setPriceRange: (range: string) => void;
}

const CATEGORIES = ['All Events', 'Concert', 'Festival', 'Nightlife', 'Theatre', 'Sports', 'Arts'];
const PRICE_RANGES = [
    { label: 'Any Price', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Under KES 1,000', value: '0-1000' },
    { label: 'KES 1,000 - 2,500', value: '1000-2500' },
    { label: 'KES 2,500 - 5,000', value: '2500-5000' },
    { label: 'VIP (5,000+)', value: '5000-max' },
];

const SearchBar: React.FC<SearchBarProps> = ({ 
    searchTerm, setSearchTerm, 
    category, setCategory, 
    date, setDate, 
    priceRange, setPriceRange 
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'price' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPriceLabel = () => {
      const found = PRICE_RANGES.find(p => p.value === priceRange);
      return found ? found.label : 'Any Price';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-5 md:mt-40 relative z-40 px-4" ref={containerRef}>
      
      {/* --- THE ULTRA MODERN ISLAND --- */}
      {/* Mobile: rounded-3xl (Card look), Desktop: rounded-full (Pill look) */}
      <div className="relative group rounded-3xl md:rounded-full transition-all duration-300">
        
        {/* 1. The Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-3xl md:rounded-full opacity-20 blur-lg group-hover:opacity-100 transition duration-1000 group-hover:duration-200 "></div>
        
        {/* 2. The Glass Container */}
        <div className="relative bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-full p-3 md:p-2 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-0 md:gap-4">
            
            {/* --- SECTION 1: SEARCH INPUT --- */}
            <div className="flex-1 w-full md:w-auto relative px-2 py-3 md:px-4 md:py-2 group/input border-b border-white/5 md:border-none">
                <div className="flex items-center">
                    <Search className="w-5 h-5 text-zinc-400 group-focus-within/input:text-primary transition-colors shrink-0" />
                    <input 
                        type="text" 
                        placeholder="Search events, artists..." 
                        className="w-full bg-transparent border-none text-white placeholder:text-zinc-500 focus:ring-0 text-base font-medium px-3 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-zinc-600 hover:text-white shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1"></div>

            {/* --- SECTION 2: CATEGORY --- */}
            <div className="relative w-full md:w-auto border-b border-white/5 md:border-none">
                <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                    className={`w-full md:w-auto flex items-center justify-between md:justify-start px-2 py-3 md:px-4 md:py-2 rounded-xl md:rounded-full hover:bg-white/5 transition-colors ${activeDropdown === 'category' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
                >
                    <div className="flex items-center gap-3">
                        <Layers className={`w-4 h-4 ${category !== 'All Events' ? 'text-secondary' : ''}`} />
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Event Type</p>
                            <p className={`text-sm font-medium truncate max-w-[200px] md:max-w-[120px] ${category !== 'All Events' ? 'text-white' : 'text-zinc-400'}`}>
                                {category}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ml-2 opacity-50 transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
                </button>

                {activeDropdown === 'category' && (
                    <div className="absolute top-full left-0 mt-2 md:mt-4 w-full md:w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden p-2 animate-slide-up z-50">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setActiveDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    category === cat ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1"></div>

            {/* --- SECTION 3: DATE --- */}
            <div className="w-full md:w-auto px-2 py-3 md:px-4 md:py-2 group cursor-pointer relative hover:bg-white/5 rounded-xl md:rounded-full transition-colors border-b border-white/5 md:border-none">
                <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${date ? 'text-primary' : 'text-zinc-500'}`} />
                    <div className="text-left relative w-full">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 text-zinc-400">Date</p>
                        <input 
                            type="date" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <p className={`text-sm font-medium ${date ? 'text-white' : 'text-zinc-400'}`}>
                            {date ? new Date(date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Any Date'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden md:block w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1"></div>

            {/* --- SECTION 4: PRICE --- */}
            <div className="relative w-full md:w-auto border-b border-white/5 md:border-none">
                <button 
                    onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                    className={`w-full md:w-auto flex items-center justify-between md:justify-start px-2 py-3 md:px-4 md:py-2 rounded-xl md:rounded-full hover:bg-white/5 transition-colors ${activeDropdown === 'price' ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
                >
                    <div className="flex items-center gap-3">
                        <DollarSign className={`w-4 h-4 ${priceRange !== 'all' ? 'text-success' : ''}`} />
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Price</p>
                            <p className={`text-sm font-medium truncate ${priceRange !== 'all' ? 'text-white' : 'text-zinc-400'}`}>
                                {getPriceLabel().split(' ')[0]}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 ml-2 opacity-50 transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
                </button>

                {activeDropdown === 'price' && (
                    <div className="absolute top-full right-0 md:left-auto mt-2 md:mt-4 w-full md:w-64 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden p-2 animate-slide-up z-50">
                        {PRICE_RANGES.map(range => (
                            <button
                                key={range.value}
                                onClick={() => { setPriceRange(range.value); setActiveDropdown(null); }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    priceRange === range.value ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* --- SECTION 5: ACTION BUTTON --- */}
            <div className="pt-2 md:pt-0 md:p-1 w-full md:w-auto">
                <button className="w-full md:w-14 py-3 md:py-0 h-auto md:h-14 rounded-xl md:rounded-full bg-neon-gradient shadow-neon flex items-center justify-center text-white hover:scale-[1.02] md:hover:scale-105 transition-transform border border-white/20 gap-2">
                    <Search className="w-5 h-5" />
                    <span className="md:hidden font-bold text-sm">Search Events</span>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SearchBar;