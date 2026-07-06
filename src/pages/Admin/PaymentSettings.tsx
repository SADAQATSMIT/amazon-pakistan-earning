import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CreditCard, Save, CheckCircle2, AlertCircle, Smartphone, User, Hash } from 'lucide-react';
import { motion } from 'motion/react';

const AdminPayments: React.FC = () => {
    const [settings, setSettings] = useState({
        jazzCashNumber: '',
        jazzCashName: '',
        easyPaisaNumber: '',
        easyPaisaName: '',
        minWithdraw: 300,
        minDeposit: 100
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'payments');
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
            await setDoc(doc(db, 'settings', 'payments'), {
                ...settings,
                updatedAt: new Date()
            });
            setMessage({ text: 'Payment gateway configuration updated!', type: 'success' });
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
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Payment Nodes</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Configure Incoming Deposit Gateways & System Limits</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* JazzCash Configuration */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl -mr-16 -mt-16 bg-red-600 transition-all group-hover:opacity-10"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-sm uppercase tracking-widest">JazzCash Gateway</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mobile Wallet Protocol</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={settings.jazzCashNumber}
                                        onChange={(e) => setSettings({ ...settings, jazzCashNumber: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-mono"
                                        placeholder="03XXXXXXXXX"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Account Title (Name)</label>
                                    <input
                                        type="text"
                                        value={settings.jazzCashName}
                                        onChange={(e) => setSettings({ ...settings, jazzCashName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all uppercase"
                                        placeholder="E.G. MUHAMMAD ALI"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EasyPaisa Configuration */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl -mr-16 -mt-16 bg-green-500 transition-all group-hover:opacity-10"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-sm uppercase tracking-widest">EasyPaisa Gateway</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Payment Protocol</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={settings.easyPaisaNumber}
                                        onChange={(e) => setSettings({ ...settings, easyPaisaNumber: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all font-mono"
                                        placeholder="03XXXXXXXXX"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Account Title (Name)</label>
                                    <input
                                        type="text"
                                        value={settings.easyPaisaName}
                                        onChange={(e) => setSettings({ ...settings, easyPaisaName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all uppercase"
                                        placeholder="E.G. MUHAMMAD ALI"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">System Liquidity Control</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                    Define the minimum thresholds for user financial operations.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Minimum Withdrawal (PKR)</label>
                                    <div className="relative group max-w-xs">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-600 font-bold transition-colors group-focus-within:text-orange-500">Rs.</div>
                                        <input
                                            type="number"
                                            value={settings.minWithdraw}
                                            onChange={(e) => setSettings({ ...settings, minWithdraw: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-6 py-4 text-white font-black text-sm focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Minimum Deposit (PKR)</label>
                                    <div className="relative group max-w-xs">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-600 font-bold transition-colors group-focus-within:text-blue-500">Rs.</div>
                                        <input
                                            type="number"
                                            value={settings.minDeposit}
                                            onChange={(e) => setSettings({ ...settings, minDeposit: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-6 py-4 text-white font-black text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Tip</h4>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                    Setting a minimum deposit prevents micro-transactions that can clutter your logs and increase administrative overhead. Ensure the minimum corresponds with JazzCash/EasyPaisa transfer limits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {message.text && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl flex items-center gap-4 border ${
                            message.type === 'success' 
                            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{message.text}</span>
                    </motion.div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto px-12 py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-orange-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 active:scale-95"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Deploy Payment Protocols</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminPayments;
