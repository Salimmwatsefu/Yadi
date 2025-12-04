import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Loader2, Copy, Check } from 'lucide-react';
import api from '../../api/axios';
import type { PaginatedResponse } from '../../types'

interface ScannerUser {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
}

const TeamPage = () => {
    const [scanners, setScanners] = useState<ScannerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Feedback
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        fetchScanners();
    }, []);

    const fetchScanners = async () => {
        try {
            const res = await api.get<PaginatedResponse<ScannerUser>>('/api/organizer/team/scanners/');
            // FIX: Access the results array
            setScanners(res.data.results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScanner = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await api.post('/api/organizer/team/scanners/create/', {
                username,
                email,
                password
            });
            setScanners([...scanners, res.data]);
            setUsername('');
            setEmail('');
            setPassword('');
            alert("Scanner account created! Share the credentials with your team.");
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to create scanner.");
        } finally {
            setIsCreating(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-white">Gate Team</h1>
                <p className="text-zinc-400 mt-2">Create accounts for your bouncers and gate agents.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                
                {/* Create Form */}
                <div className="md:col-span-1">
                    <div className="bg-surface border border-white/10 p-6 rounded-2xl sticky top-24">
                        <h3 className="font-bold text-white mb-4 flex items-center">
                            <Plus className="w-5 h-5 mr-2 text-primary" /> Add New Scanner
                        </h3>
                        <form onSubmit={handleCreateScanner} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Username</label>
                                <input 
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none mt-1"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="e.g. Gate1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Email (Optional)</label>
                                <input 
                                    type="email"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none mt-1"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="bouncer@gmail.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Set Password</label>
                                <input 
                                    type="text" // Visible so organizer can copy it
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-primary outline-none mt-1 font-mono"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Secret123"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isCreating}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex justify-center"
                            >
                                {isCreating ? <Loader2 className="animate-spin w-5 h-5"/> : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 text-zinc-500 mx-auto"/></div>
                    ) : scanners.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5">
                            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                            <p className="text-zinc-500">No scanner accounts yet.</p>
                        </div>
                    ) : (
                        scanners.map(scanner => (
                            <div key={scanner.id} className="bg-surface border border-white/10 p-4 rounded-xl flex items-center justify-between group">
                                <div>
                                    <h4 className="font-bold text-white">{scanner.username}</h4>
                                    <p className="text-xs text-zinc-500">Role: Scanner</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => copyToClipboard(scanner.username, scanner.id)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                        title="Copy Username"
                                    >
                                        {copied === scanner.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default TeamPage;