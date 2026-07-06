import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock } from 'lucide-react';
import { logActivity } from '../lib/activityService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user role to verify they are not admin
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const role = userSnap.exists() ? userSnap.data().role : 'user';

      if (role === 'admin' || user.email === 'admin@admin.com') {
        await auth.signOut();
        setError('Admin users is panel se login nahi kar sakte. Kripya System Admin Terminal use karein.');
        setLoading(false);
        return;
      }

      await logActivity(user.uid, user.email || 'Unknown', 'login', `User logged in: ${user.email}`);
      
      if (!user.emailVerified && user.email !== 'skb2720305@gmail.com') {
        navigate('/verify-email');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-100 mx-auto mb-6">
          <span className="text-orange-600 font-black text-3xl">A</span>
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 leading-none">Welcome Back</h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">Access your Amazon earning account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-10 px-8 border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          <form className="space-y-6" onSubmit={handleLogin}>
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
                  className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none block w-full pl-11 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0">!</div>
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-orange-100 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In To Account'}
              </button>
            </div>
          </form>

          <div className="mt-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                <span className="px-4 bg-white text-slate-400">New around here?</span>
              </div>
            </div>

            <div className="text-center">
              <Link to="/register" className="text-sm font-black text-orange-600 hover:text-orange-500 bg-orange-50 px-6 py-3 rounded-xl transition-colors inline-block w-full">
                Register for free members account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center relative z-10">
        <Link to="/admin/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-600 transition-colors">
          System Admin Terminal
        </Link>
      </div>
    </div>
  );
};

export default Login;
