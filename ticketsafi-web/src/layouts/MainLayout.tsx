import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Menu, ChevronRight, X, Calendar, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from '../components/UserMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // State for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
      navigate(path);
      setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-white flex flex-col font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* 1. Logo */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => handleNav('/')}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-neon-gradient rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10 z-10">
                    <Ticket className="text-white w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300" />
                  </div>
              </div>
              <div className="flex flex-col">
        <span className="font-heading font-bold text-xl tracking-wide text-white leading-none">
          Yadi Tickets
        </span>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] leading-none mt-1 group-hover:text-primary-hover transition-colors">
          by Yadi
        </span>
      </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:block h-6 w-px bg-white/10"></div>
            <div className="hidden md:flex items-center space-x-6">
                <button 
                    onClick={() => navigate('/')} 
                    className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname === '/' ? 'text-primary' : 'text-zinc-400 hover:text-primary-hover'}`}
                >
                    Events
                </button>
                <button 
                    onClick={() => navigate('/stores')} 
                    className={`text-sm font-medium transition-colors cursor-pointer ${location.pathname.includes('/stores') ? 'text-primary' : 'text-zinc-400 hover:text-primary-hover'}`}
                >
                    Creators
                </button>
            </div>
          </div>
          
          {/* 2. Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors relative z-50"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Auth (Desktop & Mobile Header) */}
            {!loading && (
              <>
                {user ? (
                  <div className="pl-0 md:pl-4 border-l-0 md:border-l border-white/10">
                    <UserMenu />
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/login')}
                    className="group relative flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative text-sm font-bold text-white flex items-center">
                      Sign In <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* --- MOBILE MENU DROPDOWN --- */}
        {isMobileMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-white/10 shadow-2xl animate-slide-up">
                <div className="p-4 space-y-2">
                    <button 
                        onClick={() => handleNav('/')}
                        className={`w-full flex items-center p-4 rounded-xl transition-colors ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Calendar className="w-5 h-5 mr-3" />
                        <span className="font-bold">Discover Events</span>
                    </button>
                    <button 
                        onClick={() => handleNav('/stores')}
                        className={`w-full flex items-center p-4 rounded-xl transition-colors ${location.pathname.includes('/stores') ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        <span className="font-bold">Browse Creators</span>
                    </button>
                </div>
            </div>
        )}
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-surface py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-60 text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <p>Yadi Tickets • Nairobi, Kenya</p>
          </div>
          <p className="hidden md:block">&copy; 2025 Yadi Kenya.</p>
          <div className="flex space-x-8">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Organizers</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default MainLayout;