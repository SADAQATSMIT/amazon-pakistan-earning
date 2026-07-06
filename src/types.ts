export type UserRole = 'user' | 'admin';
export type PaymentMethod = 'JazzCash' | 'EasyPaisa' | 'None';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  balance: number;
  activePlanId?: string;
  planName?: string;
  tasksCompleted: number;
  totalEarnings: number;
  referralCode?: string;
  referredBy?: string;
  referralCount: number;
  paymentMethod: PaymentMethod;
  accountNumber?: string;
  isBlocked: boolean;
  role: UserRole;
  createdAt: any;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  dailyTasks: number;
  earningPerTask: number;
}

export interface Task {
  id: string;
  type: 'image' | 'video';
  content: string;
  planId: string;
  duration: number;
  title: string;
  createdAt: any;
}

export interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  screenshotUrl: string;
  transactionId: string;
  status: RequestStatus;
  createdAt: any;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  status: RequestStatus;
  createdAt: any;
}

export interface AppSettings {
  appName: string;
  logoUrl?: string;
  minWithdraw: number;
  jazzCashNumber: string;
  easyPaisaNumber: string;
  tasksEnabled: boolean;
  depositsEnabled: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  bonus: number;
  isActive: boolean;
}

export interface CompletedTask {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  taskType: string;
  earnings: number;
  completedAt: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'closed' | 'in-progress';
  createdAt: any;
  reply?: string;
  repliedAt?: any;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  action: 'login' | 'logout' | 'password_change' | 'plan_purchase' | 'deposit_request' | 'withdrawal_request' | 'task_completion' | 'profile_update';
  details: string;
  ip?: string;
  createdAt: any;
}
