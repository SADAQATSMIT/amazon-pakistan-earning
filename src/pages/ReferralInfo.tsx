import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  Gift, 
  ArrowLeft, 
  Target, 
  ShieldCheck, 
  Zap,
  ChevronRight,
  Share2,
  Trophy,
  Rocket
} from 'lucide-react';

const ReferralInfo: React.FC = () => {
  const navigate = useNavigate();

  const commissionTiers = [
    { level: 1, rate: 10, title: 'Direct Referral', desc: 'Earned from users you directly invited', icon: Users, color: 'text-blue-500 bg-blue-50' },
    { level: 2, rate: 5, title: 'Network Level 2', desc: 'Earned from users invited by your Level 1 referrals', icon: Zap, color: 'text-purple-500 bg-purple-50' },
    { level: 3, rate: 2, title: 'Network Level 3', desc: 'Earned from users invited by your Level 2 referrals', icon: TrendingUp, color: 'text-green-500 bg-green-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Affiliate Program</h1>
          <p className="text-slate-500 font-medium">Build your network and earn massive passive income.</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="px-6 py-3 bg-orange-600 text-white rounded-xl flex items-center gap-3 shadow-lg shadow-orange-900/20">
              <Trophy size={20} />
              <span className="font-black text-xs uppercase tracking-widest">Master Partner</span>
           </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
              <Rocket size={14} /> Passive Earning Protocol
            </div>
            <h2 className="text-5xl font-black leading-[1.1] tracking-tight">Turn your social network <span className="text-orange-500">into Digital Assets.</span></h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              Earn lifetime commissions on every deposit made by your network up to 3 levels deep. No upper limit on earnings.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                    <CheckCircle size={18} className="text-orange-500" />
                  </div>
                  <span className="text-xs font-bold">Unlimited Referrals</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                    <CheckCircle size={18} className="text-orange-500" />
                  </div>
                  <span className="text-xs font-bold">Instant Payouts</span>
               </div>
            </div>
          </div>
          <div className="hidden md:flex justify-center relative">
             <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full" />
             <div className="relative transform rotate-6 hover:rotate-0 transition-transform duration-700">
                <Gift size={240} className="text-orange-500 opacity-20" />
                <Users size={200} className="absolute inset-0 text-white translate-x-8 translate-y-8" />
             </div>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
      </div>

      {/* Tiers Section */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">The Earning Spectrum</h3>
            <h2 className="text-3xl font-black text-slate-900">Multi-Level Commission Structure</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {commissionTiers.map((tier, idx) => (
            <motion.div
              key={tier.level}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-0 transition-all group-hover:scale-110" />
              <div className="relative z-10 space-y-6">
                <div className={`w-14 h-14 ${tier.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                  <tier.icon size={28} />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Tier</span>
                   <h4 className="text-xl font-black text-slate-900 mt-1">Level {tier.level} Bonus</h4>
                </div>
                <div className="flex items-baseline gap-2">
                   <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{tier.rate}%</h2>
                   <span className="text-sm font-bold text-slate-500">Reward</span>
                </div>
                <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-wide border-t border-slate-50 pt-6">
                  {tier.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500 border border-white/10 shadow-lg">
                  <Share2 size={24} />
               </div>
               <h4 className="text-lg font-black tracking-tight">1. Invite Members</h4>
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                 Share your unique referral link with your friends, family, and social circles. 
                 Anyone who registers with your link becomes part of your network.
               </p>
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-500 border border-white/10 shadow-lg">
                  <Zap size={24} />
               </div>
               <h4 className="text-lg font-black tracking-tight">2. Network Activity</h4>
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                 As members of your network purchase investment plans to unlock higher earnings, 
                 the system automatically calculates your commission in real-time.
               </p>
            </div>
            <div className="space-y-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-green-500 border border-white/10 shadow-lg">
                  <TrendingUp size={24} />
               </div>
               <h4 className="text-lg font-black tracking-tight">3. Lifetime Rewards</h4>
               <p className="text-xs text-slate-400 font-medium leading-relaxed">
                 Commissions are credited instantly to your main balance. You can withdraw 
                 these earnings directly to your JazzCash or EasyPaisa account.
               </p>
            </div>
         </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 rounded-br-[4rem] -z-0 opacity-50" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50 rounded-tl-[4rem] -z-0 opacity-50" />
        
        <div className="relative z-10 space-y-4 max-w-xl mx-auto">
          <div className="w-20 h-20 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-600 shadow-xl shadow-orange-100 mx-auto mb-6">
            <Gift size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Ready to expand your empire?</h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">
            Every great success starts with a strong team. Start sharing your referral link now and watch your balance grow exponentially.
          </p>
          <div className="pt-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-12 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-slate-300 active:scale-95 flex items-center gap-3 mx-auto"
            >
              Start Inviting Now
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <ShieldCheck size={size} className={className} />
);

export default ReferralInfo;
