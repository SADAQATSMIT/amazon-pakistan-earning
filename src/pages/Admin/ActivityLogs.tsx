import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Activity, Clock, User, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    type: string;
    description: string;
    createdAt: any;
    amount?: number;
}

const AdminActivity: React.FC = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'activityLogs'), orderBy('createdAt', 'desc'), limit(100));
            const snap = await getDocs(q);
            setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'plan_purchase': return 'text-purple-500 bg-purple-500/10';
            case 'deposit_request': return 'text-blue-500 bg-blue-500/10';
            case 'withdrawal_request': return 'text-orange-500 bg-orange-500/10';
            case 'referral_commission': return 'text-green-500 bg-green-500/10';
            case 'task_complete': return 'text-cyan-500 bg-cyan-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">System Activity Logs</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Real-time Transaction & Event Monitoring</p>
                </div>
                <button onClick={fetchLogs} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <Clock size={18} />
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Event Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Detail Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No activity entries found</td></tr>
                            ) : logs.map((log, idx) => (
                                <motion.tr 
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="hover:bg-slate-800/20 transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-slate-700 rounded-full group-hover:bg-orange-500 transition-colors"></div>
                                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                                                {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Recent'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                                                <User size={14} className="text-slate-500" />
                                            </div>
                                            <div className="leading-none">
                                                <p className="text-xs font-black text-white uppercase tracking-tight">{log.userName}</p>
                                                <p className="text-[9px] text-slate-500 font-mono mt-1">{log.userId.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current opacity-70 ${getTypeColor(log.type)}`}>
                                            {log.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 max-w-xs">
                                        <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors truncate" title={log.description}>
                                            {log.description}
                                        </p>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-orange-600/10 border border-orange-600/20 p-8 rounded-[2rem] flex items-start gap-6">
                <div className="p-3 bg-orange-600 text-white rounded-xl shadow-lg shrink-0">
                    <Info size={20} />
                </div>
                <div className="space-y-2">
                    <h4 className="font-black text-orange-500 text-xs uppercase tracking-widest">Compliance Awareness</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Activity logs are immutable and represent the historical sequence of all critical events within the platform. These logs are essential for audit trails, debugging, and identifying multi-level referral commissions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminActivity;
