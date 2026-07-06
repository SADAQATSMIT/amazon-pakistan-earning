import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Pages (to be created)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Plans from './pages/Plans';
import Tasks from './pages/Tasks';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminDeposits from './pages/Admin/Deposits';
import AdminWithdrawals from './pages/Admin/Withdrawals';
import AdminPlans from './pages/Admin/Plans';
import AdminTasks from './pages/Admin/Tasks';
import AdminSettings from './pages/Admin/Settings';
import AdminSupport from './pages/Admin/Support';
import AdminReferrals from './pages/Admin/ReferralSettings';
import AdminPayments from './pages/Admin/PaymentSettings';
import AdminActivity from './pages/Admin/ActivityLogs';
import AdminLogin from './pages/Admin/Login';
import Support from './pages/Support';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import VerifyEmail from './pages/VerifyEmail';
import ReferralInfo from './pages/ReferralInfo';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, userData, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!user && !isAdmin && !location.pathname.startsWith('/admin/login')) return <Navigate to="/login" />;
  
  if (user && !user.emailVerified && !isAdmin && location.pathname !== '/verify-email') {
    return <Navigate to="/verify-email" />;
  }

  if (userData?.isBlocked) return <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-600 p-8">
    <h1 className="text-4xl font-bold mb-4">Account Blocked</h1>
    <p>Your account has been blocked for violating our terms of service.</p>
  </div>;
  
  if (adminOnly && !isAdmin) return <Navigate to="/admin/login" />;

  const ContentLayout = adminOnly ? AdminLayout : Layout;

  return <ContentLayout>{children}</ContentLayout>;
};

const DashboardWrapper = () => {
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardWrapper /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/referral-details" element={<ProtectedRoute><ReferralInfo /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/deposits" element={<ProtectedRoute adminOnly><AdminDeposits /></ProtectedRoute>} />
          <Route path="/admin/withdrawals" element={<ProtectedRoute adminOnly><AdminWithdrawals /></ProtectedRoute>} />
          <Route path="/admin/plans" element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute adminOnly><AdminTasks /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupport /></ProtectedRoute>} />
          <Route path="/admin/referrals" element={<ProtectedRoute adminOnly><AdminReferrals /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/activity" element={<ProtectedRoute adminOnly><AdminActivity /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
