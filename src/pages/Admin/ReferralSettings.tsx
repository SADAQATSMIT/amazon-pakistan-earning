import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const AdminReferrals: React.FC = () => {
    const [settings, setSettings] = useState({
        level1: 10,
        level2: 5,
        level3: 2
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'referrals');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setSettings(snap.data() as any);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await setDoc(doc(db, 'settings', 'referrals'), {
                ...settings,
                updatedAt: new Date()
            });
            setMessage({ text: 'Referral commissions updated successfully!', type: 'success' });
        } catch (err: any) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Referral Control</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Affiliate Network Multi-Level Commission Management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { level: 1, val: settings.level1, color: 'text-blue-500' },
                    { level: 2, val: settings.level2, color: 'text-purple-500' },
                    { level: 3, val: settings.level3, color: 'text-green-500' }
                ].map((l) => (
                    <div key={l.level} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl -mr-16 -mt-16 bg-current ${l.color}`}></div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commission Tier</span>
                                <Users size={16} className={l.color} />
                            </div>
                            <h3 className="text-4xl font-black text-white">Level {l.level}</h3>
                            <p className={`text-2xl font-black ${l.color}`}>{l.val}%</p>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10 blur-[100px] -mr-32 -mt-32 bg-orange-600"></div>
                
                <div className="relative z-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { id: 'level1', label: 'Primary Level (L1)', desc: 'Direct referral bonus' },
                            { id: 'level2', label: 'Secondary Level (L2)', desc: 'Second degree bonus' },
                            { id: 'level3', label: 'Tertiary Level (L3)', desc: 'Third degree bonus' }
                        ].map((field) => (
                            <div key={field.id} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 truncate">
                                        {field.label}
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            value={settings[field.id as keyof typeof settings]}
                                            onChange={(e) => setSettings({ ...settings, [field.id]: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-center"
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-600 font-bold">%</div>
                                    </div>
                                    <p className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">{field.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {message.text && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl flex items-center gap-3 border ${
                                message.type === 'success' 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                        >
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
                        </motion.div>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-orange-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Override Commission Protocols</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-[2rem] flex items-start gap-6">
                <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shrink-0">
                    <AlertCircle size={20} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-black text-blue-400 text-xs uppercase tracking-widest">Protocol Intelligence</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Referral commissions are calculated automatically when a referred agent upgrades their investment plan. The commission is instantly credited to the upline's balance based on the percentage tiers defined above.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminReferrals;
