import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut, 
  PlusCircle,
  Store,
  Loader2,
  Ticket
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios'; // Need for store check

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

// --- Store Status Check Wrapper (Critical for redirect logic) ---
const StoreCheckWrapper: React.FC<{ children: React.ReactNode, isStoreCreationPage: boolean }> = ({ children, isStoreCreationPage }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [storeStatus, setStoreStatus] = useState<'loading' | 'exists' | 'none'>('loading');

    useEffect(() => {
        if (!user || user.role !== 'ORGANIZER') {
            setStoreStatus('none');
            return;
        }

        let isMounted = true;
        const checkStore = async () => {
            try {
                await api.get('/api/stores/manage/'); 
                if (isMounted) setStoreStatus('exists');
            } catch (err: any) {
                if (err.response?.status === 404) {
                    if (isMounted) setStoreStatus('none');
                } else {
                    console.error("Store check failed:", err);
                    if (isMounted) setStoreStatus('none');
                }
            }
        };

        // Delay the check slightly to give the user context loads time
        const timer = setTimeout(() => {
            checkStore();
        }, 100); 

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [user]);

    // **FIXED REDIRECT LOGIC**
    useEffect(() => {
        // 1. If Store DNE AND user is NOT on Create page, redirect to Create.
        if (storeStatus === 'none' && !isStoreCreationPage) {
            navigate('/organizer/store/create', { replace: true });
        }
        
        // 2. If Store exists AND user IS on Create page, redirect to Dashboard.
        if (storeStatus === 'exists' && isStoreCreationPage) {
            navigate('/organizer', { replace: true });
        }
    }, [storeStatus, isStoreCreationPage, navigate]);

    // RENDER LOGIC
    if (user?.role === 'ORGANIZER' && storeStatus === 'loading') {
        return (
             <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-secondary"/>
                <p className="text-zinc-400 ml-3">Loading Portal...</p>
             </div>
        );
    }
    
    // RENDER CHILDREN ONLY when state is settled and redirection is handled
    return <>{children}</>;
};

// --- Main Layout ---
const OrganizerLayout: React.FC<OrganizerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const isStoreCreationPage = location.pathname.includes('/store/create');

  const handleSidebarClick = (path: string) => {
    // Navigate directly, letting the StoreCheckWrapper handle any necessary redirection logic
    navigate(path);
  };


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
            <span className="text-xl font-heading font-bold tracking-tight text-white">TicketSafi</span>
          </div>
          <div className="mt-2 px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
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
            onClick={() => handleSidebarClick('/organizer')}
          />
          <SidebarItem 
            icon={Calendar} 
            label="My Events" 
            path="/organizer/events" 
            active={location.pathname.includes('/events') && !isStoreCreationPage}
            onClick={() => handleSidebarClick('/organizer/events')}
          />
          <SidebarItem 
            icon={Wallet} 
            label="Payouts" 
            path="/organizer/payouts" 
            active={location.pathname.includes('/payouts')}
            onClick={() => navigate('/organizer/payouts')}
          />

          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3 px-3 mt-8">Tools</p>
          
          {/* New Store Button */}
          <SidebarItem 
            icon={Store} 
            label="Store Profile" 
            path="/organizer/store/manage" 
            active={location.pathname.includes('/store/manage') || isStoreCreationPage}
            onClick={() => handleSidebarClick('/organizer/store/manage')} 
          />
          
          <SidebarItem 
            icon={PlusCircle} 
            label="Create Event" 
            path="/organizer/create" 
            active={location.pathname === '/organizer/create'}
            onClick={() => handleSidebarClick('/organizer/create')} 
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
            {location.pathname.includes('/events') ? 'Event Management' : 'Dashboard'}
          </h2>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-sm">
             {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </header>

        {/* View Rendering wrapped in Store Check */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
          <StoreCheckWrapper isStoreCreationPage={isStoreCreationPage}>
             {children}
          </StoreCheckWrapper>
        </div>
      </main>
    </div>
  );
};

export default OrganizerLayout;