import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Upload, Plus, Trash2, DollarSign, Ticket, CheckCircle, Loader2, X, Save, ArrowLeft, Store, Lock } from 'lucide-react';
import api from '../../api/axios';

interface TierFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  quantity_allocated: string;
  quantity_sold?: number; // Added this field
}

interface StoreOption {
    id: string;
    name: string;
}

const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [myStores, setMyStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [tiers, setTiers] = useState<TierFormData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await api.get(`/api/organizer/events/${id}/edit/`);
        const data = eventRes.data;

        setTitle(data.title);
        setDescription(data.description);
        setLocation(data.location_name);
        
        if (data.start_datetime) setStartDate(data.start_datetime.slice(0, 16));
        if (data.end_datetime) setEndDate(data.end_datetime.slice(0, 16));

        if (data.store) setSelectedStore(data.store);

        if (data.poster_image) {
             const imgUrl = data.poster_image.startsWith('http') 
                ? data.poster_image 
                : `http://localhost:8000${data.poster_image}`;
             setImagePreview(imgUrl);
        }

        // Populate Tiers
        if (data.tiers) {
            setTiers(data.tiers.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                price: t.price.toString(),
                quantity_allocated: t.quantity_allocated.toString(),
                quantity_sold: t.quantity_sold || 0 // Capture sales data
            })));
        }

        const storesRes = await api.get('/api/stores/organizer/list/');
        setMyStores(storesRes.data);

      } catch (err) {
        console.error("Failed to load event data", err);
        alert("Could not load event details.");
        navigate('/organizer/events');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleAddTier = () => {
    setTiers([...tiers, { name: '', description: '', price: '', quantity_allocated: '' }]);
  };

  const handleRemoveTier = (index: number) => {
    const tier = tiers[index];
    // Prevent deletion on frontend if tickets are sold
    if (tier.quantity_sold && tier.quantity_sold > 0) {
        alert(`Cannot delete "${tier.name}" because ${tier.quantity_sold} tickets have already been sold.`);
        return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof TierFormData, value: string) => {
    const newTiers = [...tiers];
    (newTiers[index] as any)[field] = value;
    setTiers(newTiers);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
      setImageFile(null);
      if (imagePreview && !imagePreview.includes('http')) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location_name', location);
      formData.append('start_datetime', new Date(startDate).toISOString());
      formData.append('end_datetime', new Date(endDate).toISOString());
      
      formData.append('store', selectedStore);

      if (imageFile) {
        formData.append('poster_image', imageFile);
      }

      const formattedTiers = tiers.map(t => ({
          ...(t.id ? { id: t.id } : {}), 
          name: t.name,
          description: t.description,
          price: parseFloat(t.price || '0'),
          quantity_allocated: parseInt(t.quantity_allocated || '0')
      }));
      formData.append('tiers', JSON.stringify(formattedTiers));
      
      await api.patch(`/api/organizer/events/${id}/edit/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate(`/organizer/events/${id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/organizer/events/${id}`)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">Edit Event</h1>
            <p className="text-zinc-400 mt-1">Update details for {title}</p>
        </div>
      </div>

      <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6">
          {/* ... Basic Details ... */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Title</label>
              <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
              <textarea rows={4} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                    <input type="datetime-local" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">End Date</label>
                    <input type="datetime-local" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Location</label>
              <input type="text" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            {myStores.length > 0 && (
                <div className="p-4 border border-white/5 rounded-xl bg-white/5">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center">
                        <Store className="w-4 h-4 mr-2" /> Link to Storefront (Optional)
                    </label>
                    <select 
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none appearance-none"
                    >
                        <option value="">No Store (Unlinked)</option>
                        {myStores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
               <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Poster</label>
               <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
               {!imagePreview ? (
                   <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 cursor-pointer">
                       <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                       <p className="text-sm text-zinc-400">Click to change poster</p>
                   </div>
               ) : (
                   <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                       <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={removeImage} className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white border border-red-500">
                               <X className="w-6 h-6" />
                           </button>
                       </div>
                   </div>
               )}
            </div>
          </div>

          {/* --- TICKET TIERS SECTION --- */}
          <div className="pt-6 border-t border-white/10 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-secondary" />
                Ticket Types
              </h2>
              
              <div className="space-y-4">
                {tiers.map((tier, index) => {
                    const isLocked = tier.quantity_sold !== undefined && tier.quantity_sold > 0;
                    
                    return (
                        <div 
                            key={index} 
                            className={`p-6 rounded-2xl border border-white/5 relative group transition-all ${isLocked ? 'bg-white/5 border-white/5 opacity-80' : 'bg-black/20'}`}
                        >
                            {/* Delete Button / Locked Icon */}
                            <div className="absolute top-4 right-4">
                                {isLocked ? (
                                    <div className="group/tooltip relative">
                                        <Lock className="w-5 h-5 text-zinc-500 cursor-not-allowed" />
                                        <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-zinc-400 hidden group-hover/tooltip:block z-10">
                                            Cannot delete: {tier.quantity_sold} tickets sold.
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleRemoveTier(index)}
                                        className="text-zinc-600 hover:text-red-500 transition-colors"
                                        title="Remove this ticket"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Ticket Name</label>
                                    <input 
                                        type="text" 
                                        disabled={isLocked}
                                        className={`w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none font-bold ${isLocked ? 'cursor-not-allowed text-zinc-400' : ''}`}
                                        placeholder="e.g. VIP Pass"
                                        value={tier.name}
                                        onChange={e => handleTierChange(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Description</label>
                                    <input 
                                        type="text" 
                                        disabled={isLocked}
                                        className={`w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none ${isLocked ? 'cursor-not-allowed text-zinc-400' : ''}`}
                                        placeholder="Includes backstage access..."
                                        value={tier.description}
                                        onChange={e => handleTierChange(index, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Price (KES)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-0 top-2 w-4 h-4 text-zinc-500" />
                                        <input 
                                            type="number" 
                                            disabled={isLocked}
                                            className={`w-full bg-transparent border-b border-white/10 py-2 pl-6 text-white focus:border-primary outline-none font-mono ${isLocked ? 'cursor-not-allowed text-zinc-400' : ''}`}
                                            placeholder="0"
                                            value={tier.price}
                                            onChange={e => handleTierChange(index, 'price', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Quantity</label>
                                    <input 
                                        type="number" 
                                        // Allow changing quantity even if locked (usually to increase stock)
                                        className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none font-mono"
                                        placeholder="100"
                                        value={tier.quantity_allocated}
                                        onChange={e => handleTierChange(index, 'quantity_allocated', e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            {isLocked && (
                                <div className="mt-2 text-[10px] text-primary flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> 
                                    {tier.quantity_sold} sold - Editing restricted
                                </div>
                            )}
                        </div>
                    );
                })}

                <button 
                    onClick={handleAddTier}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center font-medium"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Another Ticket Type
                </button>
              </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-success hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-neon flex items-center"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
            </button>
          </div>
      </div>
    </div>
  );
};

export default EditEventPage;