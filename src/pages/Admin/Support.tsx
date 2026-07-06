import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SupportTicket } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Filter,
  User,
  Calendar,
  X
} from 'lucide-react';

import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'closed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tickets');
    });

    return () => unsubscribe();
  }, []);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply) return;

    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        reply,
        repliedAt: serverTimestamp(),
        status: 'closed', // Default to closing after reply, but user can change it
      });
      // Update local state to reflect change immediately if needed or just let onSnapshot handle it
      setReply('');
      // Keep it selected if they want to see the status change, or close it.
      // The user wants "options to reply and update status".
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `tickets/${selectedTicket.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (ticketId: string, status: 'open' | 'in-progress' | 'closed') => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), { status });
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}/status`);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = ticket.userName.toLowerCase().includes(search.toLowerCase()) || 
                         ticket.subject.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Management</h1>
          <p className="text-slate-500 font-medium mt-1">Resolve user inquiries and maintain customer satisfaction.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search user or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-sm w-full md:w-64 shadow-sm"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-sm shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">
              No tickets found matching your criteria.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <motion.div
                layout
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`
                  p-5 rounded-[1.5rem] border transition-all cursor-pointer group relative
                  ${selectedTicket?.id === ticket.id 
                    ? 'bg-orange-600 border-orange-500 text-white shadow-xl shadow-orange-100 scale-[1.02]' 
                    : 'bg-white border-slate-100 hover:border-orange-200 shadow-sm'}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`
                    px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                    ${selectedTicket?.id === ticket.id 
                      ? 'bg-white/20 text-white' 
                      : ticket.status === 'open' ? 'bg-blue-50 text-blue-600' : 
                        ticket.status === 'in-progress' ? 'bg-orange-50 text-orange-600' : 
                        'bg-green-50 text-green-600'}
                  `}>
                    {ticket.status.replace('-', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold ${selectedTicket?.id === ticket.id ? 'text-white/70' : 'text-slate-400'}`}>
                    {ticket.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <h3 className={`font-black text-sm mb-1 ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-slate-900'}`}>
                  {ticket.subject}
                </h3>
                <div className={`flex items-center gap-2 text-[11px] font-bold ${selectedTicket?.id === ticket.id ? 'text-white/80' : 'text-slate-500'}`}>
                  <User size={12} />
                  {ticket.userName}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Reply Interface */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <User size={14} className="text-orange-600" />
                        {selectedTicket.userName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar size={14} className="text-orange-600" />
                        {selectedTicket.createdAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                      User Message
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {selectedTicket.reply && (
                    <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 relative ml-8">
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-600">
                        Our Response
                      </div>
                      <p className="text-slate-900 font-bold leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.reply}
                      </p>
                      <div className="mt-4 text-[10px] font-bold text-orange-400 italic">
                        Sent on {selectedTicket.repliedAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Response Form */}
                <div className="p-8 border-t border-slate-50 bg-slate-50/30 rounded-b-[2.5rem]">
                  <form onSubmit={handleReply} className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Write Your Reply</label>
                       <div className="flex gap-2 ml-auto">
                         <button 
                            type="button" 
                            onClick={() => updateStatus(selectedTicket.id, 'in-progress')}
                            className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                         >
                           Set In-Progress
                         </button>
                         <button 
                            type="button"
                            onClick={() => updateStatus(selectedTicket.id, 'closed')}
                            className="text-[10px] font-black px-3 py-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
                         >
                           Close Ticket
                         </button>
                       </div>
                    </div>
                    <div className="relative">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your message here..."
                        rows={4}
                        className="w-full px-6 py-4 border border-slate-100 rounded-[2rem] bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-bold shadow-sm"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !reply}
                        className="absolute bottom-4 right-4 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="h-full bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                  <MessageSquare size={40} className="opacity-20" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Select a Ticket</h3>
                  <p className="font-medium max-w-xs mx-auto">Choose a support request from the list to view details and send a reply.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
