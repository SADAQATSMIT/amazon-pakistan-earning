import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  ChevronRight, 
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../lib/AuthContext';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '../../lib/activityService';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Initialization check for admin credentials in Firestore
  useEffect(() => {
    const initAdmin = async () => {
      try {
        const adminRef = doc(db, 'systemSettings', 'admin_creds');
        await setDoc(adminRef, {
          username: 'admin',
          password: '786000',
          recoveryEmail: 'admin@admin.com'
        }, { merge: true });
      } catch (err) {
        console.warn("Init admin credentials ignored or firestore not ready yet.");
      }
    };
    initAdmin();
  }, []);

  const { setMasterAuthorized } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (inputUser === 'admin' && inputPass === '786000') {
      try {
        // Authenticate with Firebase Auth as admin@admin.com
        try {
          await signInWithEmailAndPassword(auth, 'admin@admin.com', '786000');
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            // Register the admin account in Firebase Auth on the fly
            await createUserWithEmailAndPassword(auth, 'admin@admin.com', '786000');
            // Write user document
            await setDoc(doc(db, 'users', auth.currentUser!.uid), {
              uid: auth.currentUser!.uid,
              name: 'System Admin',
              email: 'admin@admin.com',
              role: 'admin',
              balance: 0,
              tasksCompleted: 0,
              totalEarnings: 0,
              createdAt: serverTimestamp()
            });
          } else {
            throw fbErr;
          }
        }

        setMasterAuthorized(true);
        navigate('/admin/dashboard');
      } catch (err: any) {
        setError('Technical Error: Admin account setup/auth fail ho gaya: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setError('Ghalat Admin Username ya Password. Tip: admin credentials use karen.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans selection:bg-orange-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-3xl mb-6 shadow-2xl shadow-orange-900/40 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <ShieldCheck size={40} className="text-white relative z-10" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Technical Core</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
            Secure Admin Gateway
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl shadow-black/80">
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 sm:text-sm text-xs font-bold leading-relaxed"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Master Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-orange-500 transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-5 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-700"
                  placeholder="Admin Technical ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-orange-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-5 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-700"
                  placeholder="Master Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/20 mt-8 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              System Admin Terminal
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-orange-500 transition-colors"
          >
            Switch to Public Terminal
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
