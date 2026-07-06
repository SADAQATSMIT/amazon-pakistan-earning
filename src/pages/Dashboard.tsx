import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { CompletedTask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, CheckCircle, Package, Users, History, ArrowRight, Copy, Check, Search, Filter, X, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState<CompletedTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<CompletedTask | null>(null);
  const [allCompletedTasks, setAllCompletedTasks] = useState<CompletedTask[]>([]);
  const [loadingAllTasks, setLoadingAllTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    if (!userData?.uid) return;

    // Only listen if verified or admin to avoid permission-denied errors
    const isVerified = auth.currentUser?.emailVerified || auth.currentUser?.email === 'skb2720305@gmail.com';
    if (!isVerified) {
      setLoadingTasks(false);
      return;
    }

    const q = query(
      collection(db, 'taskCompletions'),
      where('userId', '==', userData.uid),
      orderBy('completedAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompletedTask[];
      setRecentTasks(tasks);
      setLoadingTasks(false);
    }, (error) => {
      console.warn("Task history listener permission denied", error);
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  useEffect(() => {
    if (!showHistoryModal || !userData?.uid) return;
    setLoadingAllTasks(true);

    const q = query(
      collection(db, 'taskCompletions'),
      where('userId', '==', userData.uid),
      orderBy('completedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CompletedTask[];
      setAllCompletedTasks(tasks);
      setLoadingAllTasks(false);
    }, (error) => {
      console.error("Error fetching completed tasks", error);
      setLoadingAllTasks(false);
    });

    return () => unsubscribe();
  }, [showHistoryModal, userData?.uid]);

  const formatFullDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return 'Yesterday';
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return '1 hour ago';
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return '1 minute ago';
    return 'Just now';
  };

  const filteredTasks = allCompletedTasks.filter((task) => {
    const matchesSearch = task.taskTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || task.taskType === typeFilter;
    return matchesSearch && matchesType;
  });

  const copyReferralLink = () => {
    if (!userData?.uid) return;
    const link = `${window.location.origin}/register?ref=${userData.uid}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { name: 'Current Balance', value: `PKR ${(Number(userData?.balance) || 0).toFixed(0)}`, icon: Wallet, color: 'text-orange-600 bg-orange-50', sub: 'Available for withdraw' },
    { name: 'Active Plan', value: userData?.planName || 'Free Plan', icon: Package, color: 'text-blue-600 bg-blue-50', sub: 'Expires in 30 days' },
    { name: 'Tasks Completed', value: (userData?.tasksCompleted ?? 0).toString(), icon: CheckCircle, color: 'text-green-600 bg-green-50', sub: 'Total earnings history' },
    { name: 'Total Earning', value: `PKR ${(Number(userData?.totalEarnings) || 0).toFixed(0)}`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50', sub: 'Bonus & commission' },
  ];

  return (
    <div className="space-y-6">
      {/* Bento Header Metric */}
      <div className="grid grid-cols-12 grid-rows-1 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl text-white">
          <div className="relative z-10 w-full lg:w-2/3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-2 block">Premium Earning Platform</span>
            <h1 className="text-3xl font-black mb-2 leading-tight">Increase your income with <span className="text-orange-500">Amazon Tasks</span></h1>
            <p className="text-sm text-slate-400 mb-6 font-medium">Buy a premium plan and unlock up to 50 daily tasks with massive commissions.</p>
            <button 
              onClick={() => navigate('/plans')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-orange-900/40"
            >
              Unlock Premium Plan
            </button>
          </div>
          {/* Decorative Bento Graphics */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-600/20 rounded-full blur-[80px]" />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 transform rotate-12 hidden lg:block">
            <Package size={200} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-orange-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 block mb-1">Your Balance</span>
            <h2 className="text-4xl font-black tabular-nums tracking-tighter">PKR {(Number(userData?.balance) || 0).toFixed(0)}</h2>
            <p className="text-[10px] font-bold mt-2 bg-white/20 inline-block px-2 py-0.5 rounded-full">+12% this week</p>
          </div>
          <div className="relative z-10 flex gap-2 mt-8">
            <button 
              onClick={() => navigate('/deposit')}
              className="flex-1 bg-white text-orange-600 py-2.5 rounded-xl font-black text-xs hover:bg-orange-50 transition-colors"
            >
              Deposit
            </button>
            <button 
              onClick={() => navigate('/withdraw')}
              className="flex-1 bg-orange-700/50 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors border border-white/10"
            >
              Withdraw
            </button>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 opacity-10" size={140} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500`}>
              <stat.icon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.name}</p>
            <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Completed Tasks History Section */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Completed Tasks History</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time status tracking & credited earnings history</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="flex-1 sm:flex-none text-xs font-black text-orange-600 hover:underline px-4 py-2.5 bg-orange-50 hover:bg-orange-100/50 rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                View Full History <History size={14} />
              </button>
              <button 
                onClick={() => navigate('/tasks')}
                className="flex-1 sm:flex-none text-xs font-black text-white bg-orange-600 hover:bg-orange-700 px-4 py-2.5 rounded-xl text-center transition-all shadow-md shadow-orange-500/10"
              >
                Earn Now
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {loadingTasks ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="flex items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="text-center">
                  <CheckCircle className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm font-bold text-slate-400">You haven't completed any tasks recently.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedTaskDetails(task)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50/10 border border-transparent hover:border-orange-100 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600">
                        <CheckCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-orange-600 transition-colors">{task.taskTitle}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{task.taskType}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-slate-400">
                            {formatFullDate(task.completedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-black text-green-600">+PKR {(Number(task.earnings) || 0).toFixed(2)}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 mt-1">
                          <Check size={8} strokeWidth={4} /> Credited
                        </span>
                      </div>
                      <div className="text-slate-300 group-hover:text-orange-500 transition-colors">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Promo Bento Section */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500 rounded-full" />
              Promo Code
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter Code (e.g. PAK2024)" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 uppercase"
                />
              </div>
              <button className="w-full bg-slate-900 text-white rounded-2xl py-4 text-xs font-black hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                Redeem Bonus Reward
              </button>
            </div>
          </div>

          <div 
            onClick={() => navigate('/referral-details')}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
          >
             <div className="relative z-10">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-black mb-1">Invite Friends</h4>
                <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                  <ArrowRight size={16} />
                </div>
              </div>
              <p className="text-xs text-blue-100 opacity-80 mb-4 font-medium leading-relaxed">Earn up to 10% lifetime commission on network deposits.</p>
              <div className="flex flex-col gap-3">
                <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/10 flex items-center justify-between gap-4 group/link">
                  <span className="text-[10px] font-mono opacity-60 truncate">
                    {window.location.origin}/register?ref={userData?.uid?.slice(0, 8)}...
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyReferralLink();
                    }}
                    className={`shrink-0 p-2 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 px-3 py-2 rounded-xl text-[10px] font-black text-white/60">
                    {userData?.referralCount || 0} Joins
                  </div>
                  <div className="text-[10px] font-bold text-blue-100 opacity-60">10% Commission</div>
                </div>
              </div>
             </div>
             <Users size={120} className="absolute -right-8 -bottom-8 opacity-20 group-hover:rotate-12 transition-transform duration-700" />
          </div>
        </div>
      </div>

      {/* Complete History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[85vh] flex flex-col relative overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Completed Tasks History</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {allCompletedTasks.length} total completions recorded
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="p-6 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by task title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                
                <div className="flex items-center gap-2 md:justify-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Filter size={12} /> Filter:
                  </span>
                  {(['all', 'image', 'video'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        typeFilter === type
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* List Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                {loadingAllTasks ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving audit history...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="text-slate-300 mb-2" size={40} />
                    <p className="text-sm font-bold text-slate-500">No matching completed tasks found.</p>
                    <p className="text-xs text-slate-400 mt-1">Try refining your search query or type filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskDetails(task)}
                        className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shadow-sm">
                            <CheckCircle size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors leading-tight">
                              {task.taskTitle}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {task.taskType}
                              </span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400" />
                                {formatFullDate(task.completedAt)}
                              </span>
                              <span className="text-[10px] text-slate-300 hidden sm:inline">•</span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">
                                {getTimeAgo(task.completedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 md:hidden">Earnings</span>
                            <span className="text-sm font-black text-green-600">
                              +PKR {(Number(task.earnings) || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                              <Check size={10} strokeWidth={4} /> Credited
                            </span>
                            <div className="text-slate-300 group-hover:text-orange-500 transition-colors hidden md:block">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Amazon Task Auditing Node
                </span>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-colors"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Dialog */}
      <AnimatePresence>
        {selectedTaskDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTaskDetails(null)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />
            
            {/* Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md relative overflow-hidden z-10 p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Completion Receipt</h4>
                <button
                  onClick={() => setSelectedTaskDetails(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-md mb-3">
                  <CheckCircle size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credits Earned</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  PKR {(Number(selectedTaskDetails.earnings) || 0).toFixed(2)}
                </h3>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 mt-2">
                  <Check size={10} strokeWidth={4} /> Success & Credited
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Task Title</span>
                  <span className="font-black text-slate-950 text-right max-w-[200px] truncate">{selectedTaskDetails.taskTitle}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Format / Type</span>
                  <span className="font-black text-slate-950 uppercase text-xs tracking-wider">{selectedTaskDetails.taskType}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Completion Time</span>
                  <span className="font-black text-slate-950 text-xs text-right">
                    {formatFullDate(selectedTaskDetails.completedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Time Passed</span>
                  <span className="font-bold text-slate-600 text-xs">
                    {getTimeAgo(selectedTaskDetails.completedAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">System Status</span>
                  <span className="font-black text-green-600 text-xs uppercase tracking-widest">SETTLED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Completion ID</span>
                  <span className="font-mono text-[11px] text-slate-500 font-bold">
                    #{selectedTaskDetails.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 text-xs font-black hover:bg-slate-800 transition-colors shadow-lg shadow-slate-100"
              >
                Okay, Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
