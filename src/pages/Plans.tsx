import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Plan } from '../types';
import { CheckSquare, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { logActivity } from '../lib/activityService';

const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'plans')));
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleBuy = async (plan: Plan) => {
    if (!userData) return;
    if (userData.balance < plan.price) {
      if (window.confirm('Insufficient balance. Would you like to go to the deposit page?')) {
        navigate('/deposit');
      }
      return;
    }
    if (userData.activePlanId === plan.id) return alert('You already have this plan.');

    if (!window.confirm(`Buy ${plan.name} for Rs. ${plan.price}?`)) return;

    setPurchasing(plan.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userData.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error('User not found');
        const userDataActual = userSnap.data();
        const currentBalance = userDataActual.balance;
        
        if (currentBalance < plan.price) throw new Error('Insufficient balance');

        // Deduct balance and update plan
        transaction.update(userRef, { 
          balance: currentBalance - plan.price,
          activePlanId: plan.id,
          planName: plan.name 
        });

        // Referral Commission Logic (3 Levels)
        const referralSettingsRef = doc(db, 'settings', 'referrals');
        const referralSettingsSnap = await transaction.get(referralSettingsRef);
        const refSettings = referralSettingsSnap.exists() 
          ? referralSettingsSnap.data() 
          : { level1: 10, level2: 5, level3: 2 };

        let currentReferrerId = userDataActual.referredBy;
        const levels = [
          { key: 'level1', label: 'L1' },
          { key: 'level2', label: 'L2' },
          { key: 'level3', label: 'L3' }
        ];

        for (const level of levels) {
          if (!currentReferrerId) break;

          const referrerRef = doc(db, 'users', currentReferrerId);
          const referrerSnap = await transaction.get(referrerRef);

          if (referrerSnap.exists()) {
            const commissionPercent = refSettings[level.key] || 0;
            const commissionAmount = (plan.price * commissionPercent) / 100;

            if (commissionAmount > 0) {
              transaction.update(referrerRef, {
                balance: (referrerSnap.data().balance || 0) + commissionAmount,
                referralEarnings: (referrerSnap.data().referralEarnings || 0) + commissionAmount
              });

              // Create activity log for referrer
              const logRef = doc(collection(db, 'activityLogs'));
              transaction.set(logRef, {
                userId: currentReferrerId,
                userName: referrerSnap.data().name,
                type: 'referral_commission',
                description: `Received ${level.label} commission of Rs. ${commissionAmount} from ${userData.name}'s plan purchase (${plan.name})`,
                amount: commissionAmount,
                createdAt: new Date()
              });
            }
            currentReferrerId = referrerSnap.data().referredBy;
          } else {
            break;
          }
        }
      });
      await logActivity(userData.uid, userData.name, 'plan_purchase', `Purchased plan: ${plan.name} for PKR ${plan.price}`);
      alert('Plan purchased successfully!');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin h-8 w-8 border-b-2 border-orange-500 rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 block bg-orange-50 w-fit mx-auto px-4 py-1.5 rounded-full border border-orange-100">Maximize Earnings</span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Investment Plans</h1>
        <p className="text-slate-500 font-medium text-lg">Choose a plan that fits your earning goals. Higher plans give more daily tasks and bigger rewards.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {plans.map((plan, idx) => {
          const isCurrent = userData?.activePlanId === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`
                relative bg-white rounded-[2.5rem] p-10 transition-all duration-500 overflow-hidden
                ${isCurrent 
                  ? 'border-4 border-orange-500 shadow-2xl shadow-orange-200' 
                  : 'border border-gray-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-50 group'}
              `}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                  <Sparkles size={12} /> Active Plan
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-400">PKR</span>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                </div>
              </div>

              <div className="space-y-5 mb-10">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-orange-500">
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Daily Capacity</p>
                    <p className="text-sm font-black text-slate-800">{plan.dailyTasks} Tasks / Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-green-500">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Earning Rate</p>
                    <p className="text-sm font-black text-slate-800">PKR {plan.earningPerTask} Per Task</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between mb-10">
                <span className="text-xs font-bold text-orange-700">Daily Potential</span>
                <span className="text-xl font-black text-orange-950">PKR {plan.dailyTasks * plan.earningPerTask}</span>
              </div>

              <button
                onClick={() => handleBuy(plan)}
                disabled={purchasing === plan.id || isCurrent}
                className={`
                  w-full py-5 rounded-2xl font-black text-sm transition-all shadow-xl tracking-tight
                  ${isCurrent 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                  }
                `}
              >
                {purchasing === plan.id ? 'VERIFYING...' : isCurrent ? 'CURRENTLY ACTIVE' : 'PURCHASE PLAN'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
