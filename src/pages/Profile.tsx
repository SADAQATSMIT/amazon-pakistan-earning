import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { auth, db } from '../lib/firebase';
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from 'firebase/auth';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CompletedTask, Withdrawal } from '../types';
import { motion } from 'motion/react';
import { User, Lock, Mail, Phone, ShieldCheck, AlertCircle, CheckCircle2, History, TrendingUp, Calendar, ArrowDownCircle, Wallet } from 'lucide-react';
import { logActivity } from '../lib/activityService';

const Profile: React.FC = () => {
  const { userData } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
    }
  }, [userData]);
  
  const [taskHistory, setTaskHistory] = useState<CompletedTask[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  
  const [isTaskHistoryExpanded, setIsTaskHistoryExpanded] = useState(false);
  const [isWithdrawalHistoryExpanded, setIsWithdrawalHistoryExpanded] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, 'completedTasks'),
          where('userId', '==', userData.uid),
          orderBy('completedAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CompletedTask[];
        setTaskHistory(tasks);
      } catch (err) {
        console.error('Error fetching task history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    const fetchWithdrawals = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, 'withdrawals'),
          where('userId', '==', userData.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const withdrawals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Withdrawal[];
        setWithdrawalHistory(withdrawals);
      } catch (err) {
        console.error('Error fetching withdrawal history:', err);
      } finally {
        setWithdrawalsLoading(false);
      }
    };

    fetchHistory();
    fetchWithdrawals();
  }, [userData?.uid]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('User not found');

      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      if (userData) {
        await logActivity(userData.uid, userData.name, 'password_change', 'User updated their account password');
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(err.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!userData?.uid) return;
      await updateDoc(doc(db, 'users', userData.uid), {
        name,
        phone,
        updatedAt: serverTimestamp()
      });
      await logActivity(userData.uid, name, 'profile_update', 'User updated their profile information');
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your profile information and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[4rem] -z-0 transition-all group-hover:scale-110" />
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center border-4 border-white shadow-xl mb-6 relative group-hover:rotate-3 transition-transform">
                <span className="text-4xl font-black text-slate-400">
                  {userData?.name?.charAt(0).toUpperCase()}
                </span>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900">{userData?.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 w-fit mx-auto px-3 py-1 rounded-full mt-2 border border-orange-100">
                {userData?.role} Member
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4 text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Mail size={18} className="text-slate-400" />
                <span className="truncate">{userData?.email}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Phone size={18} className="text-slate-400" />
                <span>{userData?.phone || 'Not linked'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h4 className="font-black text-lg mb-2">Security Score</h4>
              <p className="text-xs text-white/60 font-medium mb-6">Your account security is high. Keep your password private.</p>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-orange-500 h-full rounded-full shadow-[0_0_12px_rgba(249,115,22,0.5)]"
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-orange-400">85% Secured</p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner translate-y-[-2px]">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Personal Information</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Update your basic account details</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all text-slate-800"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                      <Phone size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all text-slate-800"
                      placeholder="03XX XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={updateLoading}
                className="w-full bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-white py-5 rounded-2xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0"
              >
                {updateLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={20} />
                )}
                {updateLoading ? 'Saving Changes...' : 'Save Profile Information'}
              </button>
            </form>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner translate-y-[-2px]">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Update Security Password</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Secure your account with a strong key</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                      <ShieldCheck size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all text-slate-800"
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all text-slate-800"
                        placeholder="At least 6 chars"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300">
                        <Lock size={18} />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold transition-all text-slate-800"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 flex items-center gap-4 text-xs font-black uppercase tracking-wide"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 text-green-600 p-5 rounded-2xl border border-green-100 flex items-center gap-4 text-xs font-black uppercase tracking-wide"
                >
                  <CheckCircle2 size={20} className="shrink-0" />
                  {success}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-white py-5 rounded-2xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck size={20} />
                )}
                {loading ? 'Verifying & Saving...' : 'Update Security Password'}
              </button>
            </form>

            <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200/50">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notice:</h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Changing your password will require you to use the new credentials on your next login. 
                Ensure you have access to your registered email in case you forget your new password.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task History Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Task Completion History</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Your recent activity and earnings log</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Completed</p>
              <p className="text-lg font-black text-slate-900 leading-none">{userData?.tasksCompleted || 0}</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lifetime Earnings</p>
              <p className="text-lg font-black text-green-600 leading-none">PKR {(Number(userData?.totalEarnings) || 0).toFixed(0)}</p>
            </div>
            <button 
              onClick={() => setIsTaskHistoryExpanded(!isTaskHistoryExpanded)}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <motion.div animate={{ rotate: isTaskHistoryExpanded ? 180 : 0 }}>
                <ArrowDownCircle size={20} className="text-slate-400" />
              </motion.div>
            </button>
          </div>
        </div>

        <motion.div 
          initial={false}
          animate={{ height: isTaskHistoryExpanded ? 'auto' : 0, opacity: isTaskHistoryExpanded ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 md:p-8">
            {historyLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : taskHistory.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <TrendingUp size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
              <h4 className="text-lg font-black text-slate-900 mb-1">No Activity Yet</h4>
              <p className="text-sm font-medium text-slate-400">Complete tasks to see your earning history here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-6 pb-2">Task Details</th>
                    <th className="px-6 pb-2">Type</th>
                    <th className="px-6 pb-2">Completed At</th>
                    <th className="px-6 pb-2 text-right">Earning</th>
                  </tr>
                </thead>
                <tbody>
                  {taskHistory.map((task, idx) => (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-blue-50/50 rounded-l-2xl border-y border-l border-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                            <CheckCircle2 size={16} />
                          </div>
                          <span className="text-sm font-black text-slate-900">{task.taskTitle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-blue-50/50 border-y border-slate-100 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                          {task.taskType}
                        </span>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-blue-50/50 border-y border-slate-100 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Calendar size={12} className="text-slate-300" />
                          {task.completedAt?.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-blue-50/50 rounded-r-2xl border-y border-r border-slate-100 text-right transition-colors font-black text-green-600">
                        +PKR {(Number(task.earnings) || 0).toFixed(2)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </motion.div>
      </div>

      {/* Withdrawal History Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
              <ArrowDownCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none mb-1">Withdrawal History</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Status of your cashout requests</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Balance</p>
              <p className="text-lg font-black text-slate-900 leading-none">PKR {(Number(userData?.balance) || 0).toFixed(0)}</p>
            </div>
            <button 
              onClick={() => setIsWithdrawalHistoryExpanded(!isWithdrawalHistoryExpanded)}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <motion.div animate={{ rotate: isWithdrawalHistoryExpanded ? 180 : 0 }}>
                <ArrowDownCircle size={20} className="text-slate-400" />
              </motion.div>
            </button>
          </div>
        </div>

        <motion.div 
          initial={false}
          animate={{ height: isWithdrawalHistoryExpanded ? 'auto' : 0, opacity: isWithdrawalHistoryExpanded ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 md:p-8">
            {withdrawalsLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : withdrawalHistory.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <Wallet size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
              <h4 className="text-lg font-black text-slate-900 mb-1">No Withdrawals</h4>
              <p className="text-sm font-medium text-slate-400">Your withdrawal history will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-6 pb-2">Amount</th>
                    <th className="px-6 pb-2">Method</th>
                    <th className="px-6 pb-2">Status</th>
                    <th className="px-6 pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalHistory.map((withdrawal, idx) => (
                    <motion.tr
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-orange-50/50 rounded-l-2xl border-y border-l border-slate-100 transition-colors">
                        <span className="text-sm font-black text-slate-900">PKR {withdrawal.amount}</span>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-orange-50/50 border-y border-slate-100 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-orange-600 transition-colors">
                            {withdrawal.paymentMethod}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{withdrawal.accountNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-orange-50/50 border-y border-slate-100 transition-colors">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          withdrawal.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' :
                          withdrawal.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 bg-slate-50 group-hover:bg-orange-50/50 rounded-r-2xl border-y border-r border-slate-100 text-right transition-colors">
                        <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                          <Calendar size={12} className="text-slate-300" />
                          {withdrawal.createdAt?.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
