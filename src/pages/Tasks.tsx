import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, doc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Task, Plan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timer, setTimer] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [doneToday, setDoneToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskData, setTaskData] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasksAndStatus = async () => {
      if (!userData?.activePlanId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch tasks for the current plan
        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('planId', '==', userData.activePlanId)));
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));

        // Count completed today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const completionsSnap = await getDocs(query(
          collection(db, 'taskCompletions'),
          where('userId', '==', userData.uid),
          where('completedAt', '>=', startOfDay)
        ));
        setDoneToday(completionsSnap.size);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasksAndStatus();
  }, [userData]);

  useEffect(() => {
    let interval: any;
    if (activeTask && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (activeTask && timer === 0 && !showConfirmation) {
      setShowConfirmation(true);
    }
    return () => clearInterval(interval);
  }, [activeTask, timer, showConfirmation]);

  const startTask = (task: Task) => {
    setTaskData(task);
    // Check if user reached daily limit
    // Fetch plan details to check limit
    const getPlan = async () => {
      const p = await getDoc(doc(db, 'plans', userData!.activePlanId!));
      const planData = p.data() as Plan;
      if (doneToday >= planData.dailyTasks) {
        return alert('Daily task limit reached for your plan.');
      }
      setActiveTask(task);
      setTimer(task.duration || 10);
      setShowConfirmation(false);
    }
    getPlan();
  };

  const handleClaim = () => {
    completeTask();
  };

  const completeTask = async () => {
    if (!activeTask || !userData || completing) return;
    setCompleting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userData.uid);
        const planRef = doc(db, 'plans', userData.activePlanId!);
        
        const userSnap = await transaction.get(userRef);
        const planSnap = await transaction.get(planRef);
        
        if (!userSnap.exists() || !planSnap.exists()) throw new Error('Data missing');
        
        const earnings = planSnap.data().earningPerTask;
        const currentBalance = userSnap.data().balance;

        // Record completion
        const completionRef = doc(collection(db, 'taskCompletions'));
        transaction.set(completionRef, {
          userId: userData.uid,
          taskId: activeTask.id,
          taskTitle: activeTask.title || 'Task',
          taskType: activeTask.type,
          earnings: earnings,
          completedAt: serverTimestamp(),
        });

        // Add balance
        transaction.update(userRef, {
          balance: currentBalance + earnings,
          tasksCompleted: (userSnap.data().tasksCompleted || 0) + 1,
          totalEarnings: (userSnap.data().totalEarnings || 0) + earnings
        });

        // Log task completion activity
        const logRef = doc(collection(db, 'activityLogs'));
        transaction.set(logRef, {
          userId: userData.uid,
          userName: userData.name,
          type: 'task_completion',
          description: `Completed task: ${activeTask.type} and earned PKR ${earnings}`,
          amount: earnings,
          createdAt: serverTimestamp()
        });
      });
      setDoneToday(prev => prev + 1);
      setActiveTask(null);
      setShowConfirmation(false);
      alert('Task completed! Earnings added to your balance.');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCompleting(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterType === 'all') return true;
    return task.type === filterType;
  });

  const activeTaskDuration = activeTask?.duration && activeTask.duration > 0 ? activeTask.duration : 10;
  const progressPercent = Math.round(((activeTaskDuration - timer) / activeTaskDuration) * 100);
  const progressPercentClamped = Math.max(0, Math.min(100, isNaN(progressPercent) ? 0 : progressPercent));

  const getEmbedUrl = (content: string | undefined | null) => {
    if (!content) return '';
    return content.replace('watch?v=', 'embed/');
  };

  if (!userData?.activePlanId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Plan</h2>
        <p className="text-gray-500 mb-8 max-w-sm">You need an active investment plan to access tasks and start earning.</p>
        <button onClick={() => navigate('/plans')} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100">
          Browse Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earning Tasks</h1>
          <p className="text-gray-500">Complete tasks to earn money.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['all', 'image', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  filterType === type 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm border border-blue-100 shadow-sm">
            <Clock size={16} />
            Today: {doneToday}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/20">
              {showConfirmation ? (
                <div className="p-12 text-center space-y-8">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle size={48} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Task Finished!</h2>
                    <p className="text-slate-500 font-medium">Click the button below to claim your rewards.</p>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={completing}
                    className="w-full max-w-xs bg-green-600 border-b-4 border-green-800 hover:bg-green-700 text-white py-5 rounded-2xl font-black transition-all disabled:opacity-50 inline-flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0"
                  >
                    {completing ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play size={20} />
                    )}
                    Claim Earnings
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight mb-1">Task in Progress</h3>
                      <div className="flex items-center gap-2 opacity-60">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                        <p className="text-xs font-bold uppercase tracking-widest">Verifying attention...</p>
                      </div>
                    </div>
                    <div className="bg-slate-800 px-8 py-4 rounded-3xl text-4xl font-black tabular-nums border border-white/5 shadow-inner">
                      {timer}s
                    </div>
                  </div>

                  <div className="p-4 md:p-8 flex items-center justify-center bg-slate-50 min-h-[400px]">
                    {activeTask.type === 'image' ? (
                      <img src={activeTask.content || ''} alt="Task" className="max-h-[600px] object-contain rounded-3xl shadow-2xl border-8 border-white" />
                    ) : (
                      <div className="w-full aspect-video">
                        <iframe 
                          src={getEmbedUrl(activeTask.content)} 
                          className="w-full h-full rounded-3xl shadow-2xl border-8 border-white"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task Progress</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                          {progressPercentClamped}% Complete
                        </span>
                      </div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-orange-500"
                          initial={{ width: '0%' }}
                          animate={{ width: `${progressPercentClamped}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
             [1,2,3].map(i => <div key={i} className="h-64 bg-white border border-slate-100 animate-pulse rounded-[2.5rem]"></div>)
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900">No Tasks Found</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 px-8">There are no {filterType !== 'all' ? filterType : ''} tasks available for your plan today.</p>
          </div>
        ) : filteredTasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-orange-500/20 transition-all hover:shadow-2xl hover:shadow-orange-500/5 group relative overflow-hidden"
          >
            <div className="absolute top-6 right-6 z-10">
               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 task.type === 'video' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
               }`}>
                 {task.type}
               </div>
            </div>

            <div className="w-full h-40 bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all border border-slate-100">
              {task.type === 'image' ? (
                <img src={task.content} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500" alt="" />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-slate-900/20 text-orange-600 group-hover:scale-110 transition-transform">
                    <Play fill="currentColor" size={28} className="translate-x-0.5" />
                   </div>
                </div>
              )}
            </div>
            <h3 className="font-black text-slate-900 mb-2 truncate text-lg">{task.title || 'Earning Task'}</h3>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                <Clock size={14} className="text-orange-500" /> {task.duration}s
              </div>
              <button 
                onClick={() => startTask(task)}
                className="bg-slate-900 border-b-4 border-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-xl active:translate-y-1 active:border-b-0"
                disabled={completing}
              >
                Launch
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
