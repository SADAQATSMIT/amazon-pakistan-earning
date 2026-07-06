import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Bell, CheckCircle2, AlertCircle, Clock, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    read: boolean;
    createdAt: any;
}

const Notifications: React.FC = () => {
    const { userData } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!userData) return;
        try {
            const q = query(
                collection(db, 'notifications'), 
                where('userId', '==', userData.uid),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [userData]);

    const markAllRead = async () => {
        if (notifications.length === 0) return;
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        try {
            const batch = writeBatch(db);
            unread.forEach(n => {
                batch.update(doc(db, 'notifications', n.id), { read: true });
            });
            await batch.commit();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const markRead = async (id: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-orange-500 rounded-full"></div>
        </div>
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activity Feed</h1>
                    <p className="text-slate-500 font-medium">Stay updated with your account activity and status alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
                    >
                        <CheckCheck size={14} />
                        Mark All Read
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-20 border border-slate-100 text-center space-y-6 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                            <Bell size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">No Notifications Yet</h3>
                            <p className="text-slate-500">When your deposits, withdrawals or commissions are processed, they will appear here.</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((notif, idx) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => !notif.read && markRead(notif.id)}
                                className={`
                                    relative p-6 rounded-[1.5rem] border transition-all cursor-pointer group
                                    ${notif.read 
                                        ? 'bg-white border-slate-100 opacity-70 grayscale-[0.5]' 
                                        : 'bg-white border-orange-200 shadow-lg shadow-orange-100/50 scale-[1.02]'}
                                `}
                            >
                                <div className="flex gap-5">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                                        ${notif.type === 'success' ? 'bg-green-100 text-green-600' : 
                                          notif.type === 'error' ? 'bg-red-100 text-red-600' : 
                                          'bg-blue-100 text-blue-600'}
                                    `}>
                                        {notif.type === 'success' ? <CheckCircle2 size={24} /> : 
                                         notif.type === 'error' ? <AlertCircle size={24} /> : 
                                         <Bell size={24} />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-black text-sm uppercase tracking-tight ${notif.read ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                <Clock size={10} />
                                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${notif.read ? 'text-slate-400 font-medium' : 'text-slate-600 font-bold'}`}>
                                            {notif.message}
                                        </p>
                                    </div>
                                    {!notif.read && (
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Notifications;
