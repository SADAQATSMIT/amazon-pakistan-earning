import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  User, 
  Lock, 
  Mail, 
  ShieldAlert,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const AdminSettings: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const adminRef = doc(db, 'systemSettings', 'admin_creds');
        const snap = await getDoc(adminRef);
        if (snap.exists()) {
          const data = snap.data();
          setUsername(data.username || '');
          setPassword(data.password || '');
          setRecoveryEmail(data.recoveryEmail || '');
          setLogoUrl(data.logoUrl || '');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const adminRef = doc(db, 'systemSettings', 'admin_creds');
      await updateDoc(adminRef, {
        username,
        password,
        recoveryEmail,
        logoUrl,
        updatedAt: new Date()
      });
      setMessage({ text: 'System Configuration updated successfully!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: `Update failed: ${error.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">System Access Control</h1>
          <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">Manage your Master Terminal credentials</p>
        </div>
        <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20">
          <SettingsIcon className="text-orange-500" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Warning Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldAlert size={64} className="text-orange-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Security Warning
              </h3>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">
                If you change your password or Gmail here, ensure you remember them. 
                Losing access to the recovery Gmail will lock you out of the technical core permanently.
              </p>
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-[2rem]">
            <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">Master Terminal Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Terminal ID</p>
                <p className="text-sm font-black text-white">{username}</p>
              </div>
              <div className="h-px bg-slate-800" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Health</p>
                <p className="text-xs font-black text-green-500 uppercase tracking-widest">Operational / Secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
            {message.text && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                  message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                <CheckCircle2 size={18} />
                {message.text}
              </motion.div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-1">Application Branding (Logo)</label>
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-orange-500/50 transition-all">
                  <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:shadow-orange-500/10">
                    {logoUrl ? (
                      <img src={logoUrl} alt="App Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-3 font-bold">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Recommended: Square PNG/SVG (Max 500KB)</p>
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs uppercase tracking-widest cursor-pointer transition-colors"
                      >
                        Choose File
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs uppercase tracking-widest transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">New Terminal Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-orange-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">New System Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-orange-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Recovery Gmail Account</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-orange-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-orange-500 transition-all"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-2 px-1">This email must be registered in the system to allow session establishment.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={18} />
                  Commit System Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
