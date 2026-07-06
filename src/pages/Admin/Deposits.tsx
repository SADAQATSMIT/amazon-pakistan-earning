import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, getDoc, runTransaction, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Deposit, AppUser } from '../../types';
import { Check, X, Eye, ExternalLink, User, Smartphone, Calendar, Hash, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AdminDeposits: React.FC = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setDeposits(snap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const filteredDeposits = statusFilter === 'all' 
    ? deposits 
    : deposits.filter(d => d.status === statusFilter);

  const handleViewDetails = async (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setLoadingUser(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', deposit.userId));
      if (userSnap.exists()) {
        setSelectedUser({ ...userSnap.data() } as AppUser);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleAction = async (deposit: Deposit, newStatus: 'approved' | 'rejected') => {
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'deposits', deposit.id);
        const userRef = doc(db, 'users', deposit.userId);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        
        const currentBalance = userSnap.data().balance || 0;

        transaction.update(depositRef, { 
          status: newStatus,
          updatedAt: serverTimestamp()
        });

        if (newStatus === 'approved') {
          transaction.update(userRef, { 
            balance: currentBalance + deposit.amount 
          });
        }

        // Create notification for user
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          userId: deposit.userId,
          title: `Deposit ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
          message: newStatus === 'approved' 
            ? `Your deposit of Rs. ${deposit.amount} has been approved and added to your balance.` 
            : `Your deposit of Rs. ${deposit.amount} has been rejected. Please contact support for more details.`,
          type: newStatus === 'approved' ? 'success' : 'error',
          read: false,
          createdAt: serverTimestamp()
        });

        // Log admin activity
        const logRef = doc(collection(db, 'activityLogs'));
        transaction.set(logRef, {
          userId: 'admin',
          userName: 'Admin',
          type: 'deposit_action',
          details: `Admin ${newStatus} deposit request of Rs. ${deposit.amount} for user ${deposit.userName || deposit.userId}`,
          createdAt: serverTimestamp()
        });
      });
      fetchDeposits();
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Deposit Requests</h1>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? 'bg-orange-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">TXID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Screenshot</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading deposits...</td></tr>
            ) : filteredDeposits.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} deposit requests found.</td></tr>
            ) : filteredDeposits.map((deposit) => (
              <tr key={deposit.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{deposit.userName || deposit.userId}</td>
                <td className="px-6 py-4 text-sm font-bold text-green-600 font-mono">Rs. {deposit.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{deposit.transactionId}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleViewDetails(deposit)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                  >
                    <Eye size={14} /> Preview
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                    ${deposit.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                      deposit.status === 'approved' ? 'bg-green-100 text-green-600' : 
                      'bg-red-100 text-red-600'}
                  `}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => handleViewDetails(deposit)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info size={18} />
                  </button>
                  {deposit.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAction(deposit, 'approved')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleAction(deposit, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedDeposit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeposit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col md:flex-row"
            >
              {/* Image Preview Side */}
              <div className="md:w-1/2 bg-slate-50 flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm underline decoration-blue-500 decoration-4 underline-offset-4">Payment Evidence</h3>
                  <a href={selectedDeposit.screenshotUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                    <ExternalLink size={18} />
                  </a>
                </div>
                <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
                  <img src={selectedDeposit.screenshotUrl} alt="Deposit Proof" className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-4 border-white" />
                </div>
              </div>

              {/* Details Side */}
              <div className="md:w-1/2 p-10 flex flex-col h-full bg-white relative">
                <button 
                  onClick={() => setSelectedDeposit(null)}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={24} />
                </button>

                <div className="space-y-8 flex-1 overflow-y-auto pr-2">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Deposit Review</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Transaction Verification Protocol</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Smartphone size={10} /> Amount Requested
                      </p>
                      <p className="text-2xl font-black text-green-600 font-mono">Rs. {selectedDeposit.amount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Hash size={10} /> Transaction ID
                      </p>
                      <p className="text-sm font-black text-slate-700 font-mono break-all">{selectedDeposit.transactionId}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                      <User size={12} className="text-blue-500" /> User Profile Data
                    </h4>
                    {loadingUser ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ) : selectedUser ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Full Name</span>
                          <span className="font-black text-slate-900">{selectedUser.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Phone / Login</span>
                          <span className="font-black text-slate-900">{selectedUser.phone}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Current Balance</span>
                          <span className="font-black text-orange-600">Rs. {selectedUser.balance}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Email</span>
                          <span className="font-black text-slate-600 text-xs">{selectedUser.email || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500 font-bold">User profile could not be loaded.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> Submission Date
                    </p>
                    <p className="text-xs font-bold text-slate-600">
                      {selectedDeposit.createdAt?.toDate ? selectedDeposit.createdAt.toDate().toLocaleString() : 'Recent'}
                    </p>
                  </div>
                </div>

                {selectedDeposit.status === 'pending' && (
                  <div className="mt-8 flex gap-4 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => handleAction(selectedDeposit, 'approved')}
                      className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(selectedDeposit, 'rejected')}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Reject
                    </button>
                  </div>
                )}
                
                {selectedDeposit.status !== 'pending' && (
                  <div className={`mt-8 py-4 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest
                    ${selectedDeposit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {selectedDeposit.status === 'approved' ? <Check size={16} /> : <X size={16} />}
                    Session {selectedDeposit.status}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDeposits;
