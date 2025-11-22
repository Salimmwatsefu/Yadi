import React from 'react';
import { 
  Ticket, 
  Users, 
  TrendingUp, 
  Banknote,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { useOrganizerStats } from '../../hooks/useOrganizerStats';
import { useAuth } from '../../context/AuthContext';

// Reusable Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-surface-highlight rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors text-zinc-400">
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className="flex items-center text-success text-xs font-bold bg-success/10 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3 mr-1" />
          {trend}
        </div>
      )}
    </div>
    <h3 className="text-3xl font-heading font-bold text-white mb-1">{value}</h3>
    <p className="text-sm text-zinc-400 font-medium">{title}</p>
    {subtext && <p className="text-xs text-zinc-500 mt-2">{subtext}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, loading, error } = useOrganizerStats();

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center">
        {error}
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Welcome back, {user?.username}</h1>
          <p className="text-zinc-400 mt-1">Here's what's happening with your events today.</p>
        </div>
        <button className="mt-4 md:mt-0 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center">
          <ArrowUpRight className="w-4 h-4 mr-2" />
          View Live Analytics
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`KES ${stats.total_revenue.toLocaleString()}`}
          trend="+100%" 
          icon={Banknote} 
        />
        <StatCard 
          title="Tickets Sold" 
          value={stats.tickets_sold.toLocaleString()}
          trend="Live" 
          icon={Ticket} 
          subtext={`Across ${stats.recent_events.length} events`}
        />
        <StatCard 
          title="Total Attendees" 
          value={stats.total_attendees.toLocaleString()}
          icon={Users} 
          subtext="Unique buyers"
        />
        <StatCard 
          title="Avg. Ticket Price" 
          value={`KES ${stats.avg_ticket_price.toLocaleString()}`}
          icon={TrendingUp} 
        />
      </div>

      {/* Active Events Table */}
      <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-heading font-bold text-white text-lg">Recent Events</h3>
          <button className="text-sm text-primary hover:text-primary-hover font-medium">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-highlight text-zinc-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 rounded-tl-lg">Event Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Capacity</th>
                <th className="p-4 text-right rounded-tr-lg">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {stats.recent_events.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                          No events created yet.
                      </td>
                  </tr>
              ) : (
                  stats.recent_events.map((event) => (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors cursor-pointer">
                        <td className="p-4 font-medium text-white">{event.title}</td>
                        <td className="p-4 text-zinc-400">{event.date}</td>
                        <td className="p-4">
                        <span className="px-2 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
                            {event.status}
                        </span>
                        </td>
                        <td className="p-4">
                        <div className="flex items-center">
                            <span className="mr-2 text-xs font-mono">
                                {event.sold}/{event.capacity}
                            </span>
                            <div className="h-1.5 w-24 bg-surface-highlight rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${event.capacity > 0 ? (event.sold / event.capacity) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                        </td>
                        <td className="p-4 text-right font-mono text-white">
                            KES {event.revenue.toLocaleString()}
                        </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;