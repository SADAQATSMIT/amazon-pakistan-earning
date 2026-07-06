import React, { useEffect, useState, useCallback } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, where, limit, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppUser, ActivityLog } from '../../types';
import { Search, Shield, ShieldOff, Trash2, User, History, X, Clock, Info, Landmark, TrendingUp, TrendingDown, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

const AdminUsers: React.FC = () => {
  const { userData, isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  
  // Activity Log & Transactions State
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [transactions, setTransactions] = useState<{type: 'deposit' | 'withdrawal', amount: number, status: string, createdAt: any}[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'finances'>('logs');

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ ...d.data() } as AppUser)));
    } catch (err) {
      console.warn("User fetch restricted or session not ready.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleBlock = async (user: AppUser) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isBlocked: !user.isBlocked
      });
      fetchUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleBulkAction = async (action: 'block' | 'unblock' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedIds.length} users? This cannot be undone.` 
      : `Are you sure you want to ${action} ${selectedIds.length} users?`;
      
    if (!window.confirm(confirmMessage)) return;

    setIsBulkActionLoading(true);
    const batch = writeBatch(db);

    try {
      selectedIds.forEach((id) => {
        const userRef = doc(db, 'users', id);
        if (action === 'delete') {
          batch.delete(userRef);
        } else {
          batch.update(userRef, { isBlocked: action === 'block' });
        }
      });

      await batch.commit();
      setSelectedIds([]);
      fetchUsers();
      alert(`Successfully ${action === 'delete' ? 'deleted' : action + 'ed'} ${selectedIds.length} users.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users-bulk-action');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.uid));
    }
  };

  const toggleSelectUser = (uid: string) => {
    if (selectedIds.includes(uid)) {
      setSelectedIds(selectedIds.filter(id => id !== uid));
    } else {
      setSelectedIds([...selectedIds, uid]);
    }
  };

  const fetchUserDetails = async (user: AppUser) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    setActiveTab('logs');
    try {
      // Fetch Logs
      const logsQ = query(
        collection(db, 'activityLogs'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const logsSnap = await getDocs(logsQ);
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)));

      // Fetch Finances (Deposits & Withdrawals)
      const depQ = query(collection(db, 'deposits'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
      const withQ = query(collection(db, 'withdrawals'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
      
      const [depSnap, withSnap] = await Promise.all([getDocs(depQ), getDocs(withQ)]);
      
      const financialHistory = [
        ...depSnap.docs.map(d => ({ type: 'deposit' as const, id: d.id, ...d.data() })),
        ...withSnap.docs.map(d => ({ type: 'withdrawal' as const, id: d.id, ...d.data() }))
      ].sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

      setTransactions(financialHistory as any);
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    {activeTab === 'logs' ? <History size={24} /> : <Landmark size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none mb-1">
                      {activeTab === 'logs' ? 'Activity Log' : 'Financial History'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.name}</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Logs
                  </button>
                  <button 
                    onClick={() => setActiveTab('finances')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'finances' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Wallet
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching Data...</p>
                  </div>
                ) : activeTab === 'logs' ? (
                  logs.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <Info className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm font-bold text-slate-400">No activity recorded for this user yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log, idx) => (
                        <motion.div 
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-orange-200 transition-colors"
                        >
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-600 shadow-sm shrink-0">
                            <Clock size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                                {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Recent'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 leading-snug">{log.details}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  transactions.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <Landmark className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-sm font-bold text-slate-400">No financial history found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((tx, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${tx.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {tx.type === 'deposit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-900">{tx.type}</p>
                              <p className="text-[10px] font-bold text-slate-400">{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : 'Recent'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'deposit' ? '+' : '-'} Rs. {tx.amount}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.status}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              {selectedIds.length} Selected
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 pr-3 border-r border-gray-200 mr-2"
              >
                <button
                  onClick={() => handleBulkAction('block')}
                  disabled={isBulkActionLoading}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-tight"
                  title="Bulk Block"
                >
                  <ShieldOff size={16} /> <span className="hidden lg:inline">Block</span>
                </button>
                <button
                  onClick={() => handleBulkAction('unblock')}
                  disabled={isBulkActionLoading}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-tight"
                  title="Bulk Unblock"
                >
                  <Shield size={16} /> <span className="hidden lg:inline">Unblock</span>
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={isBulkActionLoading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-tight"
                  title="Bulk Delete"
                >
                  <Trash2 size={16} /> <span className="hidden lg:inline">Delete</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 italic">
            <tr>
              <th className="px-6 py-4 w-10">
                <button 
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center text-gray-400 hover:text-orange-600 transition-colors"
                >
                  {selectedIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                    <CheckSquare size={18} className="text-orange-600" />
                  ) : selectedIds.length > 0 ? (
                    <div className="w-[18px] h-[18px] border-2 border-orange-600 bg-orange-600 rounded flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-white rounded" />
                    </div>
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.uid} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(user.uid) ? 'bg-orange-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleSelectUser(user.uid)}
                    className={`flex items-center justify-center transition-colors ${selectedIds.includes(user.uid) ? 'text-orange-600' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {selectedIds.includes(user.uid) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">{user.email}</p>
                    <p className="text-gray-500">{user.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900">Rs. {(Number(user.balance) || 0).toFixed(2)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => fetchUserDetails(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Profile & History"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={() => toggleBlock(user)}
                    className={`p-2 rounded-lg transition-colors ${user.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                    title={user.isBlocked ? 'Unblock' : 'Block'}
                  >
                    {user.isBlocked ? <Shield size={18} /> : <ShieldOff size={18} />}
                  </button>
                  <button 
                    onClick={() => deleteUser(user.uid)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
