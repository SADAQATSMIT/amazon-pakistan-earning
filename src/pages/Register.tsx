import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, increment, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Send verification email
      await sendEmailVerification(user);
      
      const isAdminEmail = formData.email === 'skb2720305@gmail.com';
      
      // Save new user
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        balance: 0,
        role: isAdminEmail ? 'admin' : 'user',
        isBlocked: false,
        paymentMethod: 'None',
        tasksCompleted: 0,
        totalEarnings: 0,
        referralCount: 0,
        referredBy: referralCode || null,
        createdAt: serverTimestamp(),
      });

      // Increment referrer's count if code exists
      if (referralCode) {
        try {
          await updateDoc(doc(db, 'users', referralCode), {
            referralCount: increment(1)
          });
        } catch (e) {
          console.error("Referrer not found or error incrementing:", e);
        }
      }
      
      setSuccess('Verification email sent! Please check your inbox.');
      setTimeout(() => navigate('/verify-email'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full blur-[120px] opacity-40 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-40 -translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center mb-8">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-100 mx-auto mb-6">
          <span className="text-orange-600 font-black text-3xl">A</span>
        </div>
        <h2 className="text-center text-4xl font-black tracking-tight text-slate-900 leading-none">Join the Network</h2>
        <p className="mt-3 text-center text-base text-slate-500 font-medium">Create your earner account and start tasks today.</p>
        
        {referralCode && (
          <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
            <UserPlus size={14} />
            Referred by Member ID: {referralCode.slice(0, 8)}...
          </div>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="bg-white py-12 px-10 border border-gray-100 rounded-[3rem] shadow-2xl shadow-slate-200/50">
          <form className="space-y-8" onSubmit={handleRegister}>
            {success && (
              <div className="bg-green-50 text-green-600 p-5 rounded-2xl text-xs font-bold border border-green-100 flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-green-500">✓</div>
                {success}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      id="phone"
                      type="text"
                      required
                      className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                      placeholder="+92..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">!</div>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-4 border border-transparent rounded-[1.5rem] shadow-xl shadow-orange-100 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Creating Identity...' : 'Confirm Registration & Join'}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Already possess an account?</p>
            <Link to="/login" className="text-sm font-black text-orange-600 hover:text-orange-500 bg-orange-50 px-10 py-4 rounded-2xl transition-all inline-block hover:scale-105 active:scale-95 shadow-lg shadow-orange-50">
              Sign In to Your Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
