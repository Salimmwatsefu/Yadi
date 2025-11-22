import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Upload, CheckCircle, Loader2, X, Link, Image, Globe, Briefcase } from 'lucide-react';
import api from '../../api/axios';

const CreateStorePage = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  
  // Image Refs/States
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Auto-generate Slug (Client-side helper)
  const slug = useMemo(() => {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }, [name]);

  // --- Image Handling Helpers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
        setter(file);
        previewSetter(URL.createObjectURL(file));
    }
  };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>, inputRef: React.RefObject<HTMLInputElement>) => {
    setter(null);
    previewSetter(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  
  // --- Submission Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
        setError("Store Name is required.");
        return;
    }
    
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Basic Info
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      
      // Images
      if (logoFile) formData.append('logo_image', logoFile);
      if (bannerFile) formData.append('banner_image', bannerFile);
      
      // Socials
      formData.append('instagram_link', instagramLink);
      formData.append('website_link', websiteLink);
      
      // CRITICAL: The endpoint now uses the modular stores app
      const response = await api.post('/api/stores/create/', formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
          }
      });
      
      // Success feedback and redirect
      setSuccess(true);
      setTimeout(() => navigate('/organizer'), 3000);

    } catch (err: any) {
      console.error(err.response || err);
      let errMsg = "Failed to launch store.";
      if (err.response?.data?.slug?.[0].includes('already exists')) {
          errMsg = `The URL 'ticketsafi.com/store/${slug}' is already taken. Please choose a different name.`;
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-white flex items-center gap-3">
            <Store className="w-8 h-8 text-secondary"/>
            Launch Your Digital Storefront
        </h1>
        <p className="text-zinc-400 mt-2">Set up your brand identity, logo, and unique URL.</p>
      </div>

      {success ? (
          <div className="bg-success/10 border border-success/20 p-8 rounded-3xl text-center space-y-4 animate-fade-in">
              <CheckCircle className="w-12 h-12 text-success mx-auto"/>
              <h2 className="text-2xl font-bold text-white">Store Launched Successfully!</h2>
              <p className="text-zinc-300">Redirecting you to the Organizer Dashboard...</p>
          </div>
      ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Banner */}
              {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm leading-relaxed">
                      {error}
                  </div>
              )}

              {/* SECTION: Basic Info */}
              <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary"/> Store Details
                  </h2>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Store Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                      placeholder="e.g. Nairobi Jazz Festival"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Unique Store URL (Slug)</label>
                    <div className="flex items-center bg-black/20 border border-white/10 rounded-xl p-4 text-white">
                        <span className="text-zinc-500 font-mono text-sm shrink-0">ticketsafi.com/store/</span>
                        <input 
                            type="text" 
                            className="bg-transparent border-none text-white p-0 ml-1 flex-1 font-mono outline-none"
                            value={slug}
                            readOnly
                            disabled
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea 
                      rows={3}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                      placeholder="A short tagline or description of your organization..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
              </div>

              {/* SECTION: Branding Uploads */}
              <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-secondary"/> Branding
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* LOGO UPLOAD */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Logo (Square)</label>
                        <input type="file" ref={logoInputRef} onChange={(e) => handleFileSelect(e, setLogoFile, setLogoPreview)} className="hidden" accept="image/*" />
                        
                        <div onClick={() => logoInputRef.current?.click()} className="h-40 w-40 rounded-xl border-2 border-dashed border-white/10 hover:border-primary cursor-pointer flex items-center justify-center relative overflow-hidden group/logo">
                            {logoPreview ? (
                                <>
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover transition-opacity duration-300 group-hover/logo:opacity-50" />
                                    <button type="button" onClick={(e) => {e.stopPropagation(); removeFile(setLogoFile, setLogoPreview, logoInputRef);}} className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <Upload className="w-6 h-6 text-zinc-500" />
                            )}
                        </div>
                    </div>

                    {/* BANNER UPLOAD */}
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Banner (16:9 Aspect)</label>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileSelect(e, setBannerFile, setBannerPreview)} className="hidden" accept="image/*" />
                        
                        <div onClick={() => bannerInputRef.current?.click()} className="w-full h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-primary cursor-pointer flex items-center justify-center relative overflow-hidden group/banner">
                            {bannerPreview ? (
                                <>
                                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover transition-opacity duration-300 group-hover/banner:opacity-50" />
                                    <button type="button" onClick={(e) => {e.stopPropagation(); removeFile(setBannerFile, setBannerPreview, bannerInputRef);}} className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover/banner:opacity-100 transition-opacity">
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <Upload className="w-6 h-6 text-zinc-500" />
                            )}
                        </div>
                    </div>

                  </div>
              </div>

              {/* SECTION: Socials */}
              <div className="bg-surface border border-white/10 p-8 rounded-3xl space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-success"/> Contact & Socials
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Instagram Link</label>
                    <div className="relative">
                        <Link className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                        <input type="url" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-primary outline-none" placeholder="https://instagram.com/yourbrand" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Official Website Link</label>
                    <div className="relative">
                        <Globe className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                        <input type="url" className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-primary outline-none" placeholder="https://yourbrand.com" value={websiteLink} onChange={e => setWebsiteLink(e.target.value)} />
                    </div>
                  </div>
              </div>


              {/* SUBMIT BUTTON */}
              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl text-white font-bold transition-transform flex justify-center items-center bg-secondary hover:bg-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Launch Storefront
                      </>
                  )}
                </button>
              </div>

          </form>
      )}
    </div>
  );
};

export default CreateStorePage;