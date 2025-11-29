import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Upload, Plus, Trash2, DollarSign, Ticket, CheckCircle, Layers, Loader2, X, Store } from 'lucide-react';
import api from '../../api/axios';

interface TierFormData {
  name: string;
  description: string;
  price: string;
  quantity_allocated: string;
}

interface StoreOption {
    id: string;
    name: string;
}

const CATEGORIES = [
    { value: 'CONCERT', label: 'Concert' },
    { value: 'FESTIVAL', label: 'Festival' },
    { value: 'NIGHTLIFE', label: 'Nightlife' },
    { value: 'THEATRE', label: 'Theatre' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'ARTS', label: 'Arts & Culture' },
    { value: 'OTHER', label: 'Other' },
];

const CreateEventPage = () => {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('CONCERT');
  
  // Store Selection State
  const [myStores, setMyStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState('');

  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [tiers, setTiers] = useState<TierFormData[]>([
      { name: 'General Admission', description: 'Standard entry', price: '', quantity_allocated: '' }
  ]);

  // Fetch Stores on Load
  useEffect(() => {
      api.get('/api/stores/organizer/list/')
         .then(res => setMyStores(res.data))
         .catch(err => console.error("Failed to load stores", err));
  }, []);

  const handleAddTier = () => {
    setTiers([...tiers, { name: '', description: '', price: '', quantity_allocated: '' }]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof TierFormData, value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
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
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !title) {
        alert("Please fill in all required fields.");
        return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location_name', location);
      formData.append('start_datetime', new Date(startDate).toISOString());
      formData.append('end_datetime', new Date(endDate).toISOString());
      formData.append('is_offline_ready', 'true');
      
      
      // Append Store (if selected)
      if (selectedStore) {
          formData.append('store', selectedStore);
      }

      if (imageFile) {
        formData.append('poster_image', imageFile);
      }

      const formattedTiers = tiers.map(t => ({
          ...t,
          price: parseFloat(t.price || '0'),
          quantity_allocated: parseInt(t.quantity_allocated || '0')
      }));
      formData.append('tiers', JSON.stringify(formattedTiers));
      
      await api.post('/api/organizer/events/create/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate('/organizer');
    } catch (err) {
      console.error(err);
      alert('Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">Create New Event</h1>
        <p className="text-zinc-400 mt-2">Launch your next experience in minutes.</p>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-surface-highlight'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-surface-highlight'}`} />
      </div>

      {step === 1 && (
        <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6 animate-fade-in">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Event Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Title</label>
              <input 
                type="text" 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                placeholder="e.g. Nairobi Jazz Festival"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                placeholder="Tell people why they should come..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Category</label>
              <div className="relative">
                <Layers className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-primary outline-none appearance-none"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value} className="bg-zinc-900 text-white">
                            {cat.label}
                        </option>
                    ))}
                </select>
                {/* Custom Arrow */}
                <div className="absolute right-4 top-4 pointer-events-none text-zinc-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                    <input 
                        type="datetime-local" 
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">End Date</label>
                    <input 
                        type="datetime-local" 
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-primary outline-none"
                  placeholder="Search venue or address"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* --- STORE LINKING SECTION --- */}
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
                        <option value="">No Store (Standalone Event)</option>
                        {myStores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-2">
                        This event will appear on the selected store's public page.
                    </p>
                </div>
            )}

            <div>
               <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Poster</label>
               <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
               {!imagePreview ? (
                   <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer group">
                       <div className="w-12 h-12 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-zinc-400">
                          <Upload className="w-6 h-6" />
                       </div>
                       <p className="text-sm text-white font-medium">Click to upload poster</p>
                   </div>
               ) : (
                   <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                       <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={removeImage} className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500">
                               <X className="w-6 h-6" />
                           </button>
                       </div>
                   </div>
               )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors shadow-neon">Next Step</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6 animate-slide-up">
          {/* ... (Ticket Tiers Step - No changes needed here from previous code) ... */}
          <h2 className="text-xl font-bold text-white flex items-center">
            <Ticket className="w-5 h-5 mr-2 text-secondary" />
            Ticket Types
          </h2>
          
          <div className="space-y-4">
            {tiers.map((tier, index) => (
                <div key={index} className="bg-black/20 p-6 rounded-2xl border border-white/5 relative group">
                    {tiers.length > 1 && (
                        <button onClick={() => handleRemoveTier(index)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Ticket Name</label>
                            <input type="text" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none font-bold" placeholder="e.g. VIP Pass" value={tier.name} onChange={e => handleTierChange(index, 'name', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Description</label>
                            <input type="text" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none" placeholder="Includes backstage access..." value={tier.description} onChange={e => handleTierChange(index, 'description', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Price (KES)</label>
                            <input type="number" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none font-mono" placeholder="0" value={tier.price} onChange={e => handleTierChange(index, 'price', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Quantity</label>
                            <input type="number" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-primary outline-none font-mono" placeholder="100" value={tier.quantity_allocated} onChange={e => handleTierChange(index, 'quantity_allocated', e.target.value)} />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={handleAddTier} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center font-medium"><Plus className="w-5 h-5 mr-2" /> Add Another Ticket Type</button>
          </div>

          <div className="flex justify-between pt-6">
             <button onClick={() => setStep(1)} className="text-zinc-400 hover:text-white font-medium">Back</button>
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-success hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Publish Event</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventPage;