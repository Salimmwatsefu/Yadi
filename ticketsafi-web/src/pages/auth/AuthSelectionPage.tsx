import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Briefcase, ArrowRight } from 'lucide-react';

const AuthSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
         <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full opacity-30" />
         <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
           <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">Welcome to TicketSafi</h1>
           <p className="text-zinc-400 text-lg">How would you like to continue?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            
            {/* Option 1: Fan / Buyer */}
            <div 
                onClick={() => navigate('/login/attendee')}
                className="group relative bg-surface border border-white/10 hover:border-primary/50 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-neon"
            >
                <div className="w-14 h-14 bg-surface-highlight rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                    <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-3">I want to buy tickets</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Discover events, purchase tickets instantly via M-Pesa, and manage your digital wallet.
                </p>
                <div className="flex items-center text-sm font-bold text-white group-hover:text-primary transition-colors">
                    Join as a Fan <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </div>

            {/* Option 2: Organizer / Seller */}
            <div 
                onClick={() => navigate('/login/organizer')} 
                className="group relative bg-surface border border-white/10 hover:border-secondary/50 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            >
                <div className="w-14 h-14 bg-surface-highlight rounded-2xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                    <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-white mb-3">I am an Organizer</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Create events, manage ticket sales, view real-time analytics, and request payouts.
                </p>
                <div className="flex items-center text-sm font-bold text-white group-hover:text-secondary transition-colors">
                    Organizer Portal <ArrowRight className="w-4 h-4 ml-2" />
                </div>
            </div>

        </div>
        
        <div className="text-center mt-12">
            <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white text-sm font-medium transition-colors">
                Cancel and go back home
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthSelectionPage;