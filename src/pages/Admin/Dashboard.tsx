import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { Users, ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock, Settings, AlertCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalWithdrawals: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if admin layout might be authorized/ready
    const fetchStats = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const depositsSnap = await getDocs(collection(db, 'deposits'));
        const withdrawalsSnap = await getDocs(collection(db, 'withdrawals'));
        const ticketsSnap = await getDocs(query(collection(db, 'tickets'), where('status', '==', 'open')));

        const deposits = depositsSnap.docs.map(d => d.data());
        const withdrawals = withdrawalsSnap.docs.map(d => d.data());

        setStats({
          totalUsers: usersSnap.size,
          totalDeposits: deposits.filter(d => d.status === 'approved').reduce((acc, d) => acc + (Number(d.amount) || 0), 0),
          pendingDeposits: deposits.filter(d => d.status === 'pending').length,
          pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
          totalWithdrawals: withdrawals.filter(w => w.status === 'paid').reduce((acc, w) => acc + (Number(w.amount) || 0), 0),
          openTickets: ticketsSnap.size,
        });
        setError(null);
      } catch (err: any) {
        console.error(err);
        if (err.code === 'permission-denied') {
          setError('Security layer blocked data request. Please authorize with your primary account.');
        } else {
          setError('Technical error occurred while loading system metrics.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50', sub: 'Registered accounts' },
    { name: 'Active Deposits', value: `PKR ${stats.totalDeposits}`, icon: ArrowDownCircle, color: 'text-green-600 bg-green-50', sub: 'Approved volume' },
    { name: 'Support Tickets', value: stats.openTickets, icon: Clock, color: 'text-purple-600 bg-purple-50', sub: 'Waiting response' },
    { name: 'Withdraw Requests', value: stats.pendingWithdrawals, icon: Clock, color: 'text-red-600 bg-red-50', sub: 'Pending payments' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin h-8 w-8 border-b-2 border-orange-500 rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-10 bg-red-50 border border-red-100 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-xl shadow-red-100">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Security Alert: Access Restricted</h3>
                <p className="text-xs text-red-600 font-bold uppercase tracking-widest leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-200 active:scale-95"
            >
              Re-Authorize Terminal
            </button>
          </div>
        </div>
      )}
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Metric Cards Row */}
        {cards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">{card.name}</span>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</h3>
              <span className="text-[10px] text-green-500 font-bold">+5%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.sub}</p>
          </motion.div>
        ))}

        {/* Big Bento Table Section */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-black text-slate-900 text-lg tracking-tight">System Liquidity Overview</h4>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 border border-slate-100">LAST 24 HOURS</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
             <div className="text-center space-y-2">
                <TrendingUp className="mx-auto text-slate-300" size={40} />
                <p className="text-sm font-bold text-slate-400">Transaction analytics will appear here.</p>
             </div>
          </div>
        </div>

        {/* Right Bento Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-[240px]">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block mb-2">Platform Net Profit</span>
              <h3 className="text-4xl font-black tabular-nums tracking-tighter">PKR {(stats.totalDeposits - stats.totalWithdrawals).toFixed(0)}</h3>
              <p className="text-[10px] font-bold mt-2 bg-white/20 inline-block px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">Global P&L</p>
            </div>
            <TrendingUp className="absolute -right-6 -bottom-6 opacity-10" size={160} />
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl h-[240px] relative overflow-hidden">
             <div className="relative z-10">
                <h4 className="text-lg font-black mb-1">Server Health</h4>
                <div className="flex items-center gap-2 mt-4">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse ring-4 ring-green-500/20"></span>
                  <span className="text-xs font-black tracking-widest uppercase">Operational</span>
                </div>
                <div className="mt-8 space-y-3 opacity-60">
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-orange-500" />
                   </div>
                   <p className="text-[10px] font-bold uppercase tracking-widest">Load: 12.5% / Latency: 42ms</p>
                </div>
             </div>
             <Settings className="absolute -right-8 -top-8 text-white/5" size={180} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
