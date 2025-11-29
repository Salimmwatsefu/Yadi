import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Ticket, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserMenu = () => {
  const { user, logout } = useAuth();

  
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!user) return null;

  const isOrganizer = user.role === 'ORGANIZER';
  const isScanner = user.role === 'SCANNER'

  return (
    <div className="relative" ref={menuRef}>
      {/* --- Avatar Trigger --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 pr-3 rounded-full bg-surface border border-white/10 hover:border-primary/50 transition-all duration-200 group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-neon">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-zinc-300 group-hover:text-white max-w-[100px] truncate hidden md:block">
          {user.username}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* --- Dropdown Menu --- */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-white/10 rounded-xl shadow-xl py-2 z-50 animate-slide-up origin-top-right">
          
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/5 mb-1">
            <p className="text-sm font-bold text-white truncate">{user.username}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="px-2 space-y-1">
           {/* Only show Wallet if NOT Scanner */}
            {!isScanner && (
                <button 
                  onClick={() => { navigate('/my-tickets'); setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Ticket className="w-4 h-4 text-primary" />
                  <span>My Wallet</span>
                </button>
            )}

            {/* Only show Portal if Organizer (or Admin) */}
            {(isOrganizer || user.is_staff) && (
                <button 
                  onClick={() => { navigate('/organizer'); setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-secondary" />
                  <span>Organizer Portal</span>
                </button>
            )}

            <div className="h-px bg-white/5 my-1" />

            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;