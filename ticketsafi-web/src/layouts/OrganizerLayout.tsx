import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut, 
  PlusCircle,
  Store,
  Ticket,
  Users,
  Loader2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface OrganizerLayoutProps {
  children: React.ReactNode;
}

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-3 mb-2 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]' 
        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-primary' : 'text-zinc-500 group-hover:text-white'}`} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, loading } = useAuth();
  
  // --- STRICT ROLE CHECK ---
  useEffect(() => {
      if (!loading) {
          if (!user) {
              navigate('/login/organizer');
          } else if (user.role === 'SCANNER') {
              // Kick scanners out immediately
              navigate('/scanner', { replace: true });
          } else if (user.role === 'ATTENDEE') {
              // Kick attendees out
              navigate('/');
          }
      }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== 'ORGANIZER') {
      return (
          <div className="h-screen w-screen bg-background flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
      );
  }
  // -------------------------

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-surface border-r border-white/5 fixed h-full z-20 hidden md:flex flex-col">
        {/* Logo */}
        <div className="p-6 mb-6">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-neon-gradient rounded-lg flex items-center justify-center shadow-neon">
              <Ticket className="text-white w-4 h-4" />
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
          <div className="mt-5 px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Organizer Portal
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 px-3">Main</p>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            path="/organizer"
            active={location.pathname === '/organizer'} 
            onClick={() => navigate('/organizer')}
          />
          <SidebarItem 
            icon={Calendar} 
            label="My Events" 
            path="/organizer/events" 
            active={location.pathname.includes('/events')}
            onClick={() => navigate('/organizer/events')}
          />
          <SidebarItem 
            icon={Wallet} 
            label="Payouts" 
            path="/organizer/payouts" 
            active={location.pathname.includes('/payouts')}
            onClick={() => navigate('/organizer/payouts')}
          />

          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Tools</p>
          
          <SidebarItem 
            icon={Store} 
            label="My Stores" 
            path="/organizer/stores" 
            active={location.pathname.includes('/organizer/stores') || location.pathname.includes('/store/create')}
            onClick={() => navigate('/organizer/stores')} 
          />
          
          <SidebarItem 
            icon={Users} 
            label="Gate Team" 
            path="/organizer/team" 
            active={location.pathname.includes('/organizer/team')}
            onClick={() => navigate('/organizer/team')} 
          />

          <SidebarItem 
            icon={PlusCircle} 
            label="Create Event" 
            path="/organizer/create" 
            active={location.pathname === '/organizer/create'}
            onClick={() => navigate('/organizer/create')} 
          />
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            path="/organizer/settings" 
            active={location.pathname === '/organizer/settings'}
            onClick={() => navigate('/organizer/settings')}
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => logout().then(() => navigate('/'))}
            className="flex items-center text-red-500 hover:bg-red-50/10 w-full p-3 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 min-h-screen bg-background relative">
        <header className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <h2 className="text-sm font-medium text-zinc-400">
            Organizer Portal
          </h2>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm">
             {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
             {children}
        </div>
      </main>
    </div>
  );
};

export default OrganizerLayout;