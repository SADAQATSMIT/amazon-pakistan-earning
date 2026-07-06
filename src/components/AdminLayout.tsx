import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users, 
  CreditCard, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Ticket,
  ChevronDown,
  User,
  ShieldCheck,
  Activity,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router';
import { logActivity } from '../lib/activityService';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { userData, setMasterAuthorized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuStructure = {
    topLevel: [
      { name: 'Admin Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
    ],
    groups: [
      {
        id: 'finance',
        title: 'Financial Control',
        items: [
          { name: 'Deposit Requests', icon: ArrowDownCircle, path: '/admin/deposits' },
          { name: 'Withdrawal Approvals', icon: ArrowUpCircle, path: '/admin/withdrawals' },
        ]
      },
      {
        id: 'management',
        title: 'User Management',
        items: [
          { name: 'User Directory', icon: Users, path: '/admin/users' },
          { name: 'Investment Plans', icon: CreditCard, path: '/admin/plans' },
          { name: 'Task Inventory', icon: CheckSquare, path: '/admin/tasks' },
        ]
      },
      {
        id: 'system',
        title: 'Technical Support',
        items: [
          { name: 'Support Tickets', icon: Ticket, path: '/admin/support' },
          { name: 'Referral Control', icon: Activity, path: '/admin/referrals' },
          { name: 'Payment Nodes', icon: CreditCard, path: '/admin/payments' },
          { name: 'Activity Logs', icon: Clock, path: '/admin/activity' },
          { name: 'System Settings', icon: Settings, path: '/admin/settings' },
        ]
      }
    ]
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuStructure.groups.forEach(g => {
      const hasActive = g.items.some(item => location.pathname === item.path);
      initial[g.id] = hasActive || true; // Keep admin groups expanded by default
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
      await logActivity(userData.uid, userData.name, 'logout', 'Admin logged out');
    }
    setMasterAuthorized(false);
    await auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans leading-relaxed text-slate-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Pro Admin Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="font-black text-white text-base tracking-tight uppercase">Admin Panel</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-orange-500">Master Control</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-8 px-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Top Level */}
            <div>
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
                      w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-slate-800 text-white font-black border border-slate-700 shadow-xl' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                    `}
                  >
                    <item.icon size={20} className={`${isActive ? 'text-orange-500' : 'opacity-40 group-hover:opacity-100'} transition-opacity`} />
                    <span className="text-xs uppercase tracking-widest">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Groups */}
            {menuStructure.groups.map((group) => {
              const isExpanded = expandedGroups[group.id];
              return (
                <div key={group.id} className="space-y-2">
                  <button 
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 group cursor-pointer"
                  >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-300 transition-colors">
                      {group.title}
                    </h3>
                    <ChevronDown size={14} className={`text-slate-600 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
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
                                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                                ${isActive 
                                  ? 'bg-slate-800 text-white font-black border border-slate-700' 
                                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'}
                              `}
                            >
                              <item.icon size={18} className={`${isActive ? 'text-orange-500' : 'opacity-40 group-hover:opacity-100'}`} />
                              <span className="text-[11px] uppercase tracking-wider">{item.name}</span>
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

          <div className="p-6 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-black text-xs uppercase tracking-widest border border-red-500/20"
            >
              <LogOut size={18} />
              <span>Secure Session Lock</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0a0c10]">
        <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 lg:px-12 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                <span className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"></span>
                {[...menuStructure.topLevel, ...menuStructure.groups.flatMap(g => g.items)].find(m => m.path === location.pathname)?.name || 'Control Panel'}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {userData?.role === 'admin' || auth.currentUser?.email === 'skb2720305@gmail.com' ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-2xl border border-slate-700 transition-all"
              >
                <User size={16} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase text-slate-200">User View</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
                <Activity size={16} className="text-green-500" />
                <span className="text-[10px] font-black uppercase text-slate-200">System Healthy</span>
              </div>
            )}
            <div className="h-10 w-10 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white shadow-xl shadow-orange-900/40">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
