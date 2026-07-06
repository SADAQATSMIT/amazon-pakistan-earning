import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plan } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

const AdminPlans: React.FC = () => {
  const { isAdmin } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'plans'), orderBy('price', 'asc')));
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
    } catch (err) {
      console.warn("Plans fetch restricted or session not ready.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPlans();
    }
  }, [isAdmin]);

  const handleSave = async () => {
    if (!editingPlan?.name) return setError('Plan name is required');
    if (editingPlan.price === undefined || editingPlan.price === null) return setError('Price is required');
    
    setSaving(true);
    setError(null);
    try {
      const planData = {
        name: editingPlan.name,
        price: Number(editingPlan.price),
        dailyTasks: Number(editingPlan.dailyTasks || 0),
        earningPerTask: Number(editingPlan.earningPerTask || 0),
        updatedAt: serverTimestamp()
      };

      if (editingPlan.id) {
        await updateDoc(doc(db, 'plans', editingPlan.id), planData);
      } else {
        await addDoc(collection(db, 'plans'), {
          ...planData,
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'plans');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'plans', id));
      fetchPlans();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `plans/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Plans</h1>
        <button 
          onClick={() => { setEditingPlan({ name: '', price: 0, dailyTasks: 0, earningPerTask: 0 }); setShowModal(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading plans...</p>
        ) : plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>Price: <b>Rs. {plan.price}</b></p>
              <p>Daily Tasks: <b>{plan.dailyTasks}</b></p>
              <p>Earning/Task: <b>Rs. {plan.earningPerTask}</b></p>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setEditingPlan(plan); setShowModal(true); }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(plan.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingPlan?.id ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-600 rounded-lg text-xs font-bold font-mono">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan?.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={editingPlan?.price || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Tasks</label>
                  <input
                    type="number"
                    value={editingPlan?.dailyTasks || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, dailyTasks: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Earning Per Task</label>
                <input
                  type="number"
                  value={editingPlan?.earningPerTask || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, earningPerTask: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><Save size={18} /> {editingPlan?.id ? 'Update Plan' : 'Create Plan'}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
