import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Menu, LogIn, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from '../components/UserMenu';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-white flex flex-col">
      
      {/* --- STANDARD STICKY NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* 1. Logo Section & Brand Text */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => navigate('/')}
            >
              <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-neon-gradient rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10 z-10">
                    <Ticket className="text-white w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300" />
                  </div>
              </div>
              <span className="text-xl font-heading font-bold tracking-tight hidden sm:block group-hover:text-white transition-colors">
                TicketSafi
              </span>
            </div>

            {/* NEW: Experience Live Text in Nav */}
            <div className="hidden md:block h-6 w-px bg-white/10"></div>
            <h1 className="hidden md:flex items-center text-lg font-heading font-bold text-white leading-tight">
                Experience&nbsp;
                {/* FIX: Added inline-block and adjusted gradient classes for visibility */}
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary animate-gradient-x ">
                  Live.
                </span>
            </h1>
          </div>
          
          {/* 2. User Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>

            {/* --- DYNAMIC AUTH SECTION --- */}
            {!loading && (
              <>
                {user ? (
                  // State 1: Logged In -> Show Menu
                  <div className="pl-4 border-l border-white/10">
                    <UserMenu />
                  </div>
                ) : (
                  // State 2: Guest -> Show Login Button
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
             <p>Systems Operational • Nairobi</p>
          </div>
          <p className="hidden md:block">&copy; 2025 TicketSafi Kenya.</p>
          <div className="flex space-x-8">
            <span className="hover:text-primary cursor-pointer transition-colors hover:underline decoration-primary/50 underline-offset-4">Privacy</span>
            <span className="hover:text-primary cursor-pointer transition-colors hover:underline decoration-primary/50 underline-offset-4">Terms</span>
            <span className="hover:text-primary cursor-pointer transition-colors hover:underline decoration-primary/50 underline-offset-4">Organizers</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default MainLayout;