import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, runTransaction, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Withdrawal } from '../../types';
import { Check, X, Phone, User as UserIcon } from 'lucide-react';

const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('pending');

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const filteredWithdrawals = statusFilter === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === statusFilter);

  const handleAction = async (withdrawal: Withdrawal, newStatus: 'paid' | 'rejected') => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
        const userRef = doc(db, 'users', withdrawal.userId);
        
        const userSnap = await transaction.get(userRef);
        // If user document is somehow missing, we still want to update the withdrawal status
        // but we might not be able to refund if rejected.
        
        const currentBalance = userSnap.exists() ? (userSnap.data().balance || 0) : 0;

        transaction.update(withdrawalRef, { 
          status: newStatus,
          updatedAt: serverTimestamp()
        });

        if (newStatus === 'rejected' && userSnap.exists()) {
          // Refund the balance if rejected
          transaction.update(userRef, { 
            balance: currentBalance + withdrawal.amount 
          });
        }

        // Create notification for user
        const notifRef = doc(collection(db, 'notifications'));
        transaction.set(notifRef, {
          userId: withdrawal.userId,
          title: `Withdrawal ${newStatus === 'paid' ? 'Completed' : 'Rejected'}`,
          message: newStatus === 'paid' 
            ? `Your withdrawal request of Rs. ${withdrawal.amount} has been processed and paid.` 
            : `Your withdrawal request of Rs. ${withdrawal.amount} has been rejected and the amount (Rs. ${withdrawal.amount}) has been refunded to your balance.`,
          type: newStatus === 'paid' ? 'success' : 'error',
          read: false,
          createdAt: serverTimestamp()
        });

        // Log admin activity
        const logRef = doc(collection(db, 'activityLogs'));
        transaction.set(logRef, {
          userId: 'admin',
          userName: 'Admin',
          type: 'withdrawal_action',
          details: `Admin ${newStatus} withdrawal request of Rs. ${withdrawal.amount} for user ${withdrawal.userName} (${withdrawal.userId})`,
          createdAt: serverTimestamp()
        });
      });
      fetchWithdrawals();
    } catch (err: any) {
      alert('Action error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100">
          {(['all', 'pending', 'paid', 'rejected'] as const).map((status) => (
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
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Details</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading withdrawals...</td></tr>
            ) : filteredWithdrawals.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} withdrawal requests found.</td></tr>
            ) : filteredWithdrawals.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {w.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{w.userName}</p>
                      <p className="text-xs text-gray-500">ID: {w.userId.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-red-600">Rs. {w.amount}</td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{w.paymentMethod}</p>
                    <p className="text-gray-500 font-mono">{w.accountNumber}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                    ${w.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                      w.status === 'paid' ? 'bg-green-100 text-green-600' : 
                      'bg-red-100 text-red-600'}
                  `}>
                    {w.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {w.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAction(w, 'paid')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors underline text-xs font-bold"
                      >
                        Mark Paid
                      </button>
                      <button 
                        onClick={() => handleAction(w, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors underline text-xs font-bold"
                      >
                        Reject & Refund
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
