import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, User, Mail, Calendar, DollarSign, CheckCircle, Users, ChevronDown, ChevronUp, Clock, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { useEventDetails } from '../../hooks/useEventDetails';

interface Attendee {
  id: string;
  attendee_name: string;
  attendee_email: string;
  tier_name: string;
  tier_price: number;
  status: string;
  purchase_date: string;
  qr_code_hash: string;
  checked_in_at?: string; 
}

interface GroupedAttendee {
  id: string; 
  attendee_name: string;
  attendee_email: string;
  tier_name: string;
  total_paid: number;
  tickets: Attendee[]; 
  total_count: number;
  checked_in_count: number;
}

const OrganizerEventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { event, loading: eventLoading } = useEventDetails(id);

  const handleExportCSV = () => {
      if (!id || !api.defaults.baseURL) {
          console.error("Cannot export: Event ID or Base URL is missing.");
          return;
      }
      
      // We MUST use the absolute URL (e.g., http://localhost:8000 or https://tickets.yadi.app)
      const backendHost = api.defaults.baseURL.endsWith('/') 
                            ? api.defaults.baseURL.slice(0, -1) 
                            : api.defaults.baseURL;
      
      // Construct the full, absolute URL, ensuring the /api/ prefix is included
      const exportUrl = `${backendHost}/api/organizer/events/${id}/export/`;

      // Use window.location.href to force the browser to navigate and download the file, 
      // bypassing the React Router.
      window.location.href = exportUrl;
  };
  
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());


  // --- NEW PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState({
        count: 0, // Total number of tickets
        next: null,
        previous: null,
        totalPages: 1, 
    });


    useEffect(() => {
        if (id) fetchAttendees(currentPage);
    }, [id, currentPage]);



  // --- FETCH FUNCTION (UPDATED) ---
    const fetchAttendees = async (page: number) => {
        setLoadingAttendees(true);
        try {
            // Send the page number in the request
            const response = await api.get(`/api/organizer/events/${id}/attendees/?page=${page}`);
            
            // 1. Get results
            setAttendees(response.data.results);
            
            // 2. Calculate Total Pages (using math.ceil)
            const totalCount = response.data.count;
            const pageSize = 10; // Must match Django's PAGE_SIZE
            
            setPaginationMeta({
                count: totalCount,
                next: response.data.next,
                previous: response.data.previous,
                totalPages: Math.ceil(totalCount / pageSize),
            });

        } catch (err) {
            console.error("Failed to load guest list", err);
        } finally {
            setLoadingAttendees(false);
        }
    };

  const groupedAttendees = useMemo(() => {
      const groups: Record<string, GroupedAttendee> = {};

      attendees.forEach(ticket => {
          const key = `${ticket.attendee_email}-${ticket.tier_name}`;
          
          if (!groups[key]) {
              groups[key] = { 
                  id: key,
                  attendee_name: ticket.attendee_name,
                  attendee_email: ticket.attendee_email,
                  tier_name: ticket.tier_name,
                  total_paid: 0,
                  tickets: [],
                  total_count: 0,
                  checked_in_count: 0
              };
          }
          
          groups[key].tickets.push(ticket);
          groups[key].total_paid += Number(ticket.tier_price);
          groups[key].total_count += 1;
          if (ticket.status === 'CHECKED_IN') {
              groups[key].checked_in_count += 1;
          }
      });

      return Object.values(groups);
  }, [attendees]);

  const filteredGroups = groupedAttendees.filter(group => 
    group.attendee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.attendee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    // Allow searching by the last few chars of ID for verification
    group.tickets.some(t => t.id.toLowerCase().endsWith(searchTerm.toLowerCase()))
  );

  const toggleRow = (groupId: string) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(groupId)) {
          newSet.delete(groupId);
      } else {
          newSet.add(groupId);
      }
      setExpandedRows(newSet);
  };

  const totalRevenue = attendees.reduce((sum, guest) => sum + Number(guest.tier_price || 0), 0);
  const totalSold = attendees.length;
  const totalCheckedIn = attendees.filter(a => a.status === 'CHECKED_IN').length;

  if (eventLoading || loadingAttendees) return (
    <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!event) return null;

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <button 
            onClick={() => navigate('/organizer/events')}
            className="flex items-center text-zinc-400 hover:text-white mb-4 transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                    <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">{event.title}</h1>
                    <p className="text-zinc-400 text-sm flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1" /> 
                        {event.date} • {event.location}
                    </p>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate(`/organizer/events/${id}/edit`)}
                    className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                    Edit Event
                </button>
                <button onClick={handleExportCSV} className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </button>
            </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface border border-white/10 p-6 rounded-2xl">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-mono font-bold text-white mt-1">KES {totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="bg-surface border border-white/10 p-6 rounded-2xl">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Tickets Sold</p>
              <h3 className="text-2xl font-mono font-bold text-white mt-1">{totalSold}</h3>
          </div>
          <div className="bg-surface border border-white/10 p-6 rounded-2xl">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Check-ins</p>
              <h3 className="text-2xl font-mono font-bold text-white mt-1">
                  {totalCheckedIn} <span className="text-sm text-zinc-500 font-normal">/ {totalSold}</span>
              </h3>
              <div className="w-full bg-white/5 h-1 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success" 
                    style={{ width: `${totalSold > 0 ? (totalCheckedIn / totalSold) * 100 : 0}%` }} 
                  />
              </div>
          </div>
      </div>

      {/* Guest List Table */}
      <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-heading font-bold text-white text-lg">Guest List</h3>
              <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input 
                      type="text" 
                      placeholder="Search name, email..." 
                      className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 text-white text-sm focus:border-primary outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-highlight text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                      <tr>
                          <th className="p-4 pl-6">Attendee</th>
                          <th className="p-4">Ticket Type</th>
                          <th className="p-4">Check-in Status</th>
                          <th className="p-4 text-right pr-6">Total Paid</th>
                          <th className="p-4 w-10"></th>
                      </tr>
                  </thead>
                  <tbody className="text-sm text-zinc-300">
                      {filteredGroups.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="p-8 text-center text-zinc-500">
                                  No attendees found matching your search.
                              </td>
                          </tr>
                      ) : (
                          filteredGroups.map((group) => {
                              const isExpanded = expandedRows.has(group.id);
                              const allCheckedIn = group.checked_in_count === group.total_count;
                              
                              return (
                                <React.Fragment key={group.id}>
                                  {/* Main Summary Row */}
                                  <tr 
                                    className={`hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 ${isExpanded ? 'bg-white/5' : ''}`}
                                    onClick={() => toggleRow(group.id)}
                                  >
                                      <td className="p-4 pl-6">
                                          <div className="flex items-center">
                                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs text-white font-bold mr-3">
                                                  {group.attendee_name?.[0]?.toUpperCase() || 'U'}
                                              </div>
                                              <div>
                                                  <p className="text-white font-medium">{group.attendee_name || 'Unknown User'}</p>
                                                  <p className="text-xs text-zinc-500">{group.attendee_email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <div className="flex items-center gap-2">
                                              <span className="inline-block px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
                                                  {group.tier_name}
                                              </span>
                                              {group.total_count > 1 && (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold border border-primary/20">
                                                      x{group.total_count} Tickets
                                                  </span>
                                              )}
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <div className="flex items-center space-x-2">
                                              <div className="flex-1 h-2 w-24 bg-surface-highlight rounded-full overflow-hidden border border-white/5">
                                                  <div 
                                                    className={`h-full rounded-full ${allCheckedIn ? 'bg-success' : 'bg-blue-500'}`} 
                                                    style={{ width: `${(group.checked_in_count / group.total_count) * 100}%` }}
                                                  />
                                              </div>
                                              <span className={`text-xs font-bold ${allCheckedIn ? 'text-success' : 'text-zinc-400'}`}>
                                                  {group.checked_in_count}/{group.total_count} In
                                              </span>
                                          </div>
                                      </td>
                                      <td className="p-4 text-right pr-6 font-mono text-white">
                                          KES {group.total_paid.toLocaleString()}
                                      </td>
                                      <td className="p-4 text-center">
                                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                      </td>
                                  </tr>

                                  {/* Expanded Detail Rows */}
                                  {isExpanded && (
                                      <tr className="bg-black/20">
                                          <td colSpan={5} className="p-0">
                                              <div className="py-2 px-6 border-b border-white/5 shadow-inner">
                                                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2 pl-2 flex items-center gap-2">
                                                      <Shield className="w-3 h-3" /> Secure Ticket List
                                                  </p>
                                                  {group.tickets.map((ticket, idx) => (
                                                      <div key={ticket.id} className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 mb-1 transition-colors">
                                                          <div className="flex items-center gap-3">
                                                              <div className="font-mono text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded border border-white/5" title="Ticket ID (Masked for Security)">
                                                                  {/* SECURITY FIX: Only show last 6 characters */}
                                                                  •••• {ticket.id.slice(-6).toUpperCase()}
                                                              </div>
                                                              <div className="text-sm text-zinc-300">
                                                                  Ticket {idx + 1}
                                                              </div>
                                                          </div>
                                                          
                                                          <div className="flex items-center gap-4">
                                                              {ticket.status === 'CHECKED_IN' ? (
                                                                  <span className="flex items-center text-xs font-bold text-success">
                                                                      <CheckCircle className="w-3 h-3 mr-1" />
                                                                      Checked In {ticket.checked_in_at ? `at ${new Date(ticket.checked_in_at).toLocaleTimeString()}` : ''}
                                                                  </span>
                                                              ) : (
                                                                  <span className="flex items-center text-xs text-zinc-500">
                                                                      <Clock className="w-3 h-3 mr-1" />
                                                                      Not Scanned
                                                                  </span>
                                                              )}
                                                              
                                                              {/* SECURITY FIX: Hide the QR Hash entirely */}
                                                              <div className="text-xs font-mono text-zinc-700 select-none">
                                                                  Token Hidden
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </td>
                                      </tr>
                                  )}
                                </React.Fragment>
                              );
                          })
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination Controls at the bottom of the table */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center">
             <p className="text-xs text-zinc-500">
                Page {currentPage} of {paginationMeta.totalPages} | 
                Total tickets: {paginationMeta.count}
             </p>
             <div className="flex gap-2">
                 <button 
                     onClick={() => setCurrentPage(prev => prev - 1)}
                     disabled={!paginationMeta.previous}
                     className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                 >
                     <ChevronLeft className="w-4 h-4 text-white" />
                 </button>
                 <button 
                     onClick={() => setCurrentPage(prev => prev + 1)}
                     disabled={!paginationMeta.next}
                     className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                 >
                     <ChevronRight className="w-4 h-4 text-white" />
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerEventDetailsPage;