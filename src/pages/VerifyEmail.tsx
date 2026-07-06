import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.emailVerified) {
      navigate('/dashboard');
      return;
    }

    // Poll for verification status
    const interval = setInterval(async () => {
      await user.reload();
      if (auth.currentUser?.emailVerified) {
        clearInterval(interval);
        navigate('/dashboard');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleResend = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendEmailVerification(user);
      setSuccess('Verification email resent successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full blur-[120px] opacity-40 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-40 -translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8 px-4">
        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-orange-100 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] animate-ping opacity-20" />
          <Mail size={40} className="text-orange-600 relative z-10" />
        </div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Verify Your Email</h2>
        <p className="mt-4 text-base text-slate-500 font-medium leading-relaxed">
          We've sent a verification link to <span className="text-slate-900 font-bold">{user?.email}</span>. Please verify your account to continue.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-12 px-10 border border-gray-100 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 space-y-8">
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Step 1: Check Inbox</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed mt-1">Open the email from Antigravity and click the verification link.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <RefreshCw size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Step 2: Auto Refresh</h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed mt-1">Once verified, this page will automatically redirect you to the dashboard.</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-4">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">!</div>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-5 rounded-2xl text-xs font-bold border border-green-100 flex items-center gap-4">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-green-500">✓</div>
              {success}
            </div>
          )}

          <div className="space-y-4 pt-4">
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-5 px-4 border border-transparent rounded-[2rem] shadow-xl shadow-orange-100 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 group"
            >
              <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Resending...' : 'Resend Verification Email'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-5 px-4 border border-slate-100 rounded-[2rem] text-sm font-black text-slate-500 bg-white hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <LogOut size={18} />
              Sign Out & Try Another Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
