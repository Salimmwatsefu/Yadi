import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store as StoreIcon, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import type { PaginatedResponse } from '../types';


const StoresListPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    api.get<PaginatedResponse<any>>('/api/stores/').then(res => {
        setStores(res.data.results);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 pt-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-white mb-8">Discover Creators</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stores.map(store => (
                <div 
                    key={store.id}
                    onClick={() => navigate(`/stores/${store.slug}`)}
                    className="group bg-surface border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 hover:shadow-neon"
                >
                    {/* Banner */}
                    <div className="h-32 bg-surface-highlight relative">
                        {store.banner_image && <img src={store.banner_image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                    </div>
                    
                    <div className="p-6 relative">
                        {/* Logo overlapping banner */}
                        <div className="w-16 h-16 rounded-2xl bg-black border-2 border-surface absolute -top-8 left-6 overflow-hidden">
                             {store.logo_image ? (
                                <img src={store.logo_image} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600"><StoreIcon /></div>
                             )}
                        </div>
                        
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-white">{store.name}</h3>
                            <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{store.description || "No description provided."}</p>
                            
                            <div className="mt-4 flex items-center text-primary font-bold text-sm">
                                Visit Store <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StoresListPage;