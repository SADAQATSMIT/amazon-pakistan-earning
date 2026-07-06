import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { SupportTicket } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Send, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

const Support: React.FC = () => {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData?.uid) return;

    // Only listen if verified or admin to avoid permission-denied errors
    const isVerified = auth.currentUser?.emailVerified || auth.currentUser?.email === 'skb2720305@gmail.com';
    if (!isVerified) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userData.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.warn("Support tickets listener permission denied", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !subject || !message) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: userData.uid,
        userName: userData.name,
        subject,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setSubject('');
      setMessage('');
      setShowNewTicket(false);
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Center</h1>
          <p className="text-slate-500 font-medium mt-1">Need help? Create a ticket and we'll reply shortly.</p>
        </div>
        <button
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-orange-100 flex items-center gap-2 active:scale-95"
        >
          <Ticket size={18} />
          {showNewTicket ? 'View Tickets' : 'New Ticket'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showNewTicket ? (
          <motion.div
            key="new-ticket"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                  placeholder="e.g., Deposit Issue, Plan Inquiry..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                  placeholder="Describe your issue in detail..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {submitting ? 'Sending Request...' : 'Submit Support Ticket'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="ticket-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No Support Tickets</h3>
                  <p className="text-slate-400 font-medium">You haven't created any support requests yet.</p>
                </div>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/20 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`
                          px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                          ${ticket.status === 'open' ? 'bg-blue-50 text-blue-600' : 
                            ticket.status === 'in-progress' ? 'bg-orange-50 text-orange-600' : 
                            'bg-green-50 text-green-600'}
                        `}>
                          {ticket.status.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {ticket.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{ticket.subject}</h3>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {ticket.message}
                  </p>

                  {ticket.reply && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-orange-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Admin Response</span>
                        <span className="text-[10px] font-bold text-orange-400 ml-auto">
                          {ticket.repliedAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed">
                        {ticket.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Support;
