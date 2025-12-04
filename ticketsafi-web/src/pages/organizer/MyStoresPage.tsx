import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, ExternalLink, Loader2, Edit } from 'lucide-react';
import api from '../../api/axios';
import type { PaginatedResponse } from '../../types'

const MyStoresPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PaginatedResponse<any>>('/api/stores/organizer/list/')
       .then(res => {
           // FIX: Access the results array
           setStores(res.data.results);
       })
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-primary"/></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-white">My Storefronts</h1>
        <button 
            onClick={() => navigate('/organizer/store/create')}
            className="px-6 py-3 bg-secondary hover:bg-violet-700 text-white font-bold rounded-xl transition-colors flex items-center"
        >
            <Plus className="w-5 h-5 mr-2" /> Launch New Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-white/5 rounded-3xl">
            <Store className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">You haven't created any storefronts yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
            {stores.map(store => (
                <div key={store.id} className="bg-surface border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-black/50 overflow-hidden">
                                {store.logo_image ? (
                                    <img src={store.logo_image} className="w-full h-full object-cover" />
                                ) : <Store className="p-2 w-full h-full text-zinc-500"/>}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{store.name}</h3>
                                <p className="text-xs text-zinc-500 font-mono">/{store.slug}</p>
                            </div>
                        </div>
                        <button 
    onClick={() => navigate(`/organizer/store/${store.id}/edit`)}
    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
>
    <Edit className="w-4 h-4" />
</button>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <a 
                            href={`/stores/${store.slug}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium flex justify-center items-center transition-colors"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" /> View Live
                        </a>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MyStoresPage;