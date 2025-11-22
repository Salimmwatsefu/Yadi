import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Upload, Plus, Trash2, DollarSign, Ticket, CheckCircle, Loader2, X, Save, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';

interface TierFormData {
  id?: string; // Existing tiers have IDs
  name: string;
  description: string;
  price: string;
  quantity_allocated: string;
}

const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [tiers, setTiers] = useState<TierFormData[]>([]);

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Use the edit endpoint (GET) to retrieve data securely
        const response = await api.get(`/api/organizer/events/${id}/edit/`);
        const data = response.data;

        setTitle(data.title);
        setDescription(data.description);
        setLocation(data.location_name);
        
        // Format dates for input[type="datetime-local"] (YYYY-MM-DDTHH:mm)
        if (data.start_datetime) setStartDate(data.start_datetime.slice(0, 16));
        if (data.end_datetime) setEndDate(data.end_datetime.slice(0, 16));

        if (data.poster_image) {
             // Determine full URL
             const imgUrl = data.poster_image.startsWith('http') 
                ? data.poster_image 
                : `http://localhost:8000${data.poster_image}`;
             setImagePreview(imgUrl);
        }

        // Load Tiers
        if (data.tiers) {
            setTiers(data.tiers.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                price: t.price.toString(),
                quantity_allocated: t.quantity_allocated.toString()
            })));
        }

      } catch (err) {
        console.error("Failed to load event", err);
        alert("Could not load event details.");
        navigate('/organizer/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  // ... (Reuse logic from CreateEventPage for adding/removing tiers/images) ...
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
      // Don't revoke if it's the original URL from server, but simplistic check is fine
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

      if (imageFile) {
        formData.append('poster_image', imageFile);
      }

      // Note: Editing nested tiers via PUT is tricky with DRF standard serializers.
      // For MVP stability, we often just send the updated JSON list.
      // Backend must be smart enough to update existing IDs and create new ones.
      // Standard DRF might delete/recreate or fail on nested updates without specific logic.
      // For now, let's send it and assume the backend `to_internal_value` parses it.
      
      const formattedTiers = tiers.map(t => ({
          // Include ID if it exists so backend knows to update, not create
          ...(t.id ? { id: t.id } : {}), 
          name: t.name,
          description: t.description,
          price: parseFloat(t.price || '0'),
          quantity_allocated: parseInt(t.quantity_allocated || '0')
      }));
      formData.append('tiers', JSON.stringify(formattedTiers));
      
      // Use PATCH to update only changed fields (safest) or PUT for full replacement
      await api.patch(`/api/organizer/events/${id}/edit/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate(`/organizer/events/${id}`); // Go back to dashboard
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
          {/* Same Form Fields as Create Page */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Event Title</label>
              <input 
                type="text" 
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
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
              <input 
                  type="text" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
              />
            </div>

            {/* Image Upload */}
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

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-success hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-neon flex items-center"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
              )}
            </button>
          </div>
      </div>
    </div>
  );
};

export default EditEventPage;