import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Smartphone, CheckCircle, Loader2, Mail, User } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierId: string;
  tierName: string;
  price: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, tierId, tierName, price }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  
  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async () => {
    // Validation
    if (!phoneNumber.startsWith('254') || phoneNumber.length !== 12) {
      setError('Please enter a valid M-Pesa number (e.g., 2547... or 2541...)');
      return;
    }

    // Guest Validation
    if (!user) {
        if (!guestEmail.includes('@')) {
            setError('Please enter a valid email address for ticket delivery.');
            return;
        }
        if (!guestName) {
            setError('Please enter your full name.');
            return;
        }
    }

    try {
      setStep('processing');
      setError('');
      
      // Prepare Payload
      const payload: any = {
        tier_id: tierId,
        phone_number: phoneNumber
      };

      // Append guest details if needed
      if (!user) {
          payload.email = guestEmail;
          payload.name = guestName;
      }
      
      const response = await api.post('/api/pay/initiate/', payload);

      if (response.data.ticket_id) {
          setTicketId(response.data.ticket_id);
      }

      setTimeout(() => {
        setStep('success');
      }, 2000);

    } catch (err: any) {
      setStep('input');
      const msg = err.response?.data?.error || 'Payment failed. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
          <h3 className="font-heading font-bold text-white text-lg">Complete Purchase</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center p-4 bg-surface-highlight rounded-xl border border-white/5">
             <div>
               <p className="text-xs text-zinc-400 uppercase font-bold">Ticket Type</p>
               <p className="text-white font-medium">{tierName}</p>
             </div>
             <div className="text-right">
               <p className="text-xs text-zinc-400 uppercase font-bold">Amount</p>
               <p className="text-primary font-bold text-lg">KES {price}</p>
             </div>
          </div>

          {step === 'input' && (
            <div className="space-y-4">
              
              {/* GUEST FIELDS (Only show if not logged in) */}
              {!user && (
                  <>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs mb-4">
                        Checking out as Guest. We'll send the ticket to this email.
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="John Doe" 
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 outline-none"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                            <input 
                                type="email" 
                                placeholder="name@example.com" 
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-primary/50 outline-none"
                                value={guestEmail}
                                onChange={(e) => setGuestEmail(e.target.value)}
                            />
                        </div>
                    </div>
                  </>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-2">M-Pesa Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="2547... or 2541..." 
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-success/50 outline-none"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
              
              <button 
                onClick={handlePayment}
                className="w-full py-4 rounded-xl bg-success text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform flex justify-center items-center"
              >
                Pay Now
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8 space-y-4">
               <div className="relative w-16 h-16 mx-auto">
                 <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-success border-t-transparent rounded-full animate-spin"></div>
               </div>
               <div>
                 <h4 className="text-white font-bold text-lg">Check your phone</h4>
                 <p className="text-zinc-400 text-sm mt-1">Enter your M-Pesa PIN to complete the transaction.</p>
               </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-fade-in">
               <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle className="w-8 h-8" />
               </div>
               <div>
                 <h4 className="text-white font-bold text-xl">Payment Successful!</h4>
                 <p className="text-zinc-400 text-sm mt-2">Your ticket is ready.</p>
               </div>
               <button 
                 onClick={() => {
                     onClose();
                     if (ticketId) {
                         navigate(`/ticket/${ticketId}`);
                     }
                 }}
                 className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors mt-4"
               >
                 View Ticket
               </button>
            </div>
          )}

        </div>
        
        <div className="bg-black/20 p-3 text-center border-t border-white/5">
          <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Secured by M-Pesa Daraja & TicketSafi
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;