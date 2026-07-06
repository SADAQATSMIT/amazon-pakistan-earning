import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { AppSettings } from '../types';
import { motion } from 'motion/react';
import { Wallet, Info, Upload, CheckCircle } from 'lucide-react';
import { logActivity } from '../lib/activityService';

const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'payments'));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // < 800KB for Firestore limit safety
        alert('File is too large. Please upload a smaller screenshot (< 800KB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshot) return alert('Screenshot is required');

    const minAmt = (settings as any)?.minDeposit || 100;
    if (parseFloat(amount) < minAmt) {
      alert(`Minimum deposit amount is Rs. ${minAmt}`);
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: userData?.uid,
        userName: userData?.name,
        amount: parseFloat(amount),
        transactionId,
        screenshotUrl: screenshot,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      if (userData) {
        await logActivity(userData.uid, userData.name, 'deposit_request', `Submitted a deposit request of PKR ${amount} (TX: ${transactionId})`);
      }
      setSuccess(true);
    } catch (err: any) {
      alert('Error submitting deposit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Deposit Submitted!</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Your deposit request is being reviewed by the admin. Balance will be added once approved.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deposit Money</h1>
        <p className="text-gray-500">Recharge your account to buy premium plans.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-orange-500" /> Payment Details
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-bold uppercase mb-1">JazzCash Number</p>
                <p className="text-lg font-black text-orange-900">{settings?.jazzCashNumber || '03XX XXXXXXX'}</p>
                <p className="text-[10px] text-orange-700 font-medium font-mono uppercase">Title: {settings?.jazzCashName || 'Not Set'}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold uppercase mb-1">EasyPaisa Number</p>
                <p className="text-lg font-black text-blue-900">{settings?.easyPaisaNumber || '03XX XXXXXXX'}</p>
                <p className="text-[10px] text-blue-700 font-medium font-mono uppercase">Title: {settings?.easyPaisaName || 'Not Set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
            <p className="text-sm font-bold text-orange-400 mb-2">Instructions</p>
            <ul className="text-xs space-y-3 list-decimal pl-4 text-gray-300">
              <li>Send money to the provided number.</li>
              <li>Copy the <b>Transaction ID (TID)</b> after payment.</li>
              <li>Take a clear <b>screenshot</b> of the success screen.</li>
              <li><b>Minimum Deposit:</b> Rs. {(settings as any)?.minDeposit || 100}</li>
              <li>Fill the form and upload the screenshot.</li>
              <li>Wait for 10-30 mins for approval.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Deposit Amount</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 transition-all font-bold text-lg"
                  placeholder="Rs. 0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID (TID)</label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                  placeholder="ID: 123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload Screenshot</label>
              <div 
                className={`
                  relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all
                  ${screenshot ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50'}
                `}
              >
                {screenshot ? (
                  <div className="flex flex-col items-center">
                    <img src={screenshot} alt="Preview" className="h-32 rounded-lg mb-2 shadow-md" />
                    <button type="button" onClick={() => setScreenshot(null)} className="text-red-600 text-xs font-bold underline">Change Image</button>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-500 text-center">Click or drag to upload payment proof</p>
                    <p className="text-[10px] text-gray-400 mt-1">Maximum size: 800KB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required={!screenshot}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   Submitting...
                </>
              ) : 'Confirm Deposit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
