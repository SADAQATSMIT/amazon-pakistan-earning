import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  CreditCard, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Tag,
  Ticket,
  ChevronDown,
  User,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { auth, db } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router';
import { logActivity } from '../lib/activityService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!userData) return;
    
    // Only listen if verified or admin to avoid permission-denied errors
    const isVerified = auth.currentUser?.emailVerified || auth.currentUser?.email === 'skb2720305@gmail.com';
    if (!isVerified) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userData.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadNotifs(snap.size);
    }, (error) => {
      console.warn("Notifications listener permission denied (expected for unverified users)", error);
    });
    return () => unsubscribe();
  }, [userData]);

  const menuStructure = {
    topLevel: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
    groups: [
      {
        id: 'earning',
        title: 'Earnings',
        items: [
          { name: 'Plans', icon: CreditCard, path: '/plans' },
          { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
        ]
      },
      {
        id: 'finance',
        title: 'Finance',
        items: [
          { name: 'Deposit', icon: ArrowDownCircle, path: '/deposit' },
          { name: 'Withdraw', icon: ArrowUpCircle, path: '/withdraw' },
        ]
      },
      {
        id: 'help',
        title: 'Support',
        items: [
          { name: 'Tickets', icon: Ticket, path: '/support' },
          { name: 'Profile', icon: User, path: '/profile' },
        ]
      }
    ]
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuStructure.groups.forEach(g => {
      const hasActive = g.items.some(item => location.pathname === item.path);
      initial[g.id] = hasActive || false;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleLogout = async () => {
    if (userData) {
      await logActivity(userData.uid, userData.name, 'logout', 'User logged out');
    }
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans leading-relaxed">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Bento Style Gradient */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-orange-600 to-orange-700 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-orange-600 font-extrabold text-xl">A</span>
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-sm tracking-tight">Amazon Pakistan</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">
                  Premium Earning
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Top Level Items */}
            <div className="space-y-1 mb-6">
              {menuStructure.topLevel.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-white/15 text-white font-bold shadow-lg ring-1 ring-white/20' 
                        : 'text-orange-100 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <item.icon size={18} className={`${isActive ? 'text-white' : 'opacity-60 group-hover:opacity-100'} transition-opacity`} />
                    <span className="text-xs">{item.name}</span>
                    {isActive && <motion.div layoutId="activeIndex" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                  </button>
                );
              })}
            </div>

            {/* Grouped Items */}
            {menuStructure.groups.map((group) => {
              const isExpanded = expandedGroups[group.id];
              return (
                <div key={group.id} className="space-y-1">
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-4 py-2 group cursor-pointer rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
                      {group.title}
                    </h3>
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} className="text-white/30 group-hover:text-white/60" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-1"
                      >
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setSidebarOpen(false);
                              }}
                              className={`
                                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                                ${isActive 
                                  ? 'bg-white/15 text-white font-bold shadow-lg ring-1 ring-white/20' 
                                  : 'text-orange-100 hover:bg-white/10 hover:text-white'}
                              `}
                            >
                              <item.icon size={18} className={`${isActive ? 'text-white' : 'opacity-60 group-hover:opacity-100'} transition-opacity`} />
                              <span className="text-xs">{item.name}</span>
                              {isActive && <motion.div layoutId="activeIndex" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="bg-orange-500/20 border border-white/10 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold mb-1">Account Balance</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                <span className="text-sm font-black tracking-tight">PKR {(Number(userData?.balance) || 0).toFixed(0)}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-orange-200 hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-orange-600">
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-extrabold text-gray-800 tracking-tight leading-none">
                {[...menuStructure.topLevel, ...menuStructure.groups.flatMap(g => g.items)].find(m => m.path === location.pathname)?.name || 'Dashboard'}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Amazon Pakistan Earning</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {(userData?.role === 'admin' || auth.currentUser?.email === 'skb2720305@gmail.com') && (
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 border border-slate-700"
              >
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                Admin Panel
              </button>
            )}
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-gray-400 hover:text-orange-600 transition-colors"
            >
              <Bell size={22} />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-white ring-1 ring-red-100">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-800">{userData?.name}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{userData?.role}</p>
              </div>
              <div className={`
                h-10 w-10 rounded-full flex items-center justify-center font-black border-2 border-white ring-1 shadow-sm
                bg-slate-100 ring-gray-100 text-slate-600
              `}>
                {userData?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
