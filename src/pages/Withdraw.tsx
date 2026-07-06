import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { ArrowUpCircle, AlertCircle } from 'lucide-react';
import { logActivity } from '../lib/activityService';

const Withdraw: React.FC = () => {
  const { userData } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa'>('JazzCash');
  const [accountNumber, setAccountNumber] = useState(userData?.accountNumber || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paySettings, setPaySettings] = useState<any>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'payments'));
      if (docSnap.exists()) {
        setPaySettings(docSnap.data());
      }
    };
    fetchSettings();
  }, []);

  const minLimit = paySettings?.minWithdraw || 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    
    if (!userData) return;
    if (withdrawAmount < minLimit) return setMessage(`Minimum withdraw is Rs. ${minLimit}`);
    if (withdrawAmount > userData.balance) return setMessage('Insufficient balance');
    if (!accountNumber) return setMessage('Account number required');

    setLoading(true);
    setMessage('');
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error('User not found');
        const currentBalance = userSnap.data().balance;
        
        if (currentBalance < withdrawAmount) throw new Error('Insufficient balance');

        // Deduct balance immediately (Escrow)
        transaction.update(userRef, { balance: currentBalance - withdrawAmount });
        
        // Create withdrawal record
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        transaction.set(withdrawalRef, {
          userId: userData.uid,
          userName: userData.name,
          amount: withdrawAmount,
          paymentMethod,
          accountNumber,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      });
      await logActivity(userData.uid, userData.name, 'withdrawal_request', `Requested a withdrawal of PKR ${withdrawAmount} to ${paymentMethod} (${accountNumber})`);
      setMessage('Withdrawal request submitted successfully!');
      setAmount('');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw Earnings</h1>
        <p className="text-gray-500">Fast and secure withdrawals to your local accounts.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-900">
          <ArrowUpCircle size={24} />
          <div>
            <p className="text-sm font-bold">Your Balance</p>
            <p className="text-2xl font-black">Rs. {(Number(userData?.balance) || 0).toFixed(2)}</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm flex items-center gap-2 ${message.includes('Error') || message.includes('Minimum') || message.includes('Insufficient') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertCircle size={18} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Withdraw Amount (Min: 300)</label>
              <input
                type="number"
                required
                min={300}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500"
              >
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Account Number / Phone</label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500"
              placeholder="03XX XXXXXXX"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-100"
          >
            {loading ? 'Processing...' : 'Submit Withdrawal'}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2">Withdrawal Rules</h3>
        <ul className="text-sm text-gray-500 space-y-2 list-disc pl-5">
          <li>Minimum withdrawal amount is Rs. 300.</li>
          <li>Payments are processed within 24-48 hours.</li>
          <li>Ensure your account details are correct. Incorrect numbers may lead to payment failure.</li>
          <li>One withdrawal request can be pending at a time.</li>
        </ul>
      </div>
    </div>
  );
};

export default Withdraw;
