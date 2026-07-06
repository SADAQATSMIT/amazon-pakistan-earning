import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Task, Plan } from '../../types';
import { Plus, Edit2, Trash2, X, Save, Video, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const AdminTasks: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (updates: Partial<Task>) => {
    setEditingTask(prev => prev ? { ...prev, ...updates } : null);
    if (error) setError(null);
  };

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const tasksSnap = await getDocs(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')));
      const plansSnap = await getDocs(query(collection(db, 'plans'), orderBy('price', 'asc')));
      setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
    } catch (err) {
      console.warn("Permission restricted or session not ready. Retrying fetch...");
      // Don't throw fatal error on initial mount if auth is still resolving
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const isYouTubeUrl = (url: string) => {
    const p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return !!url.match(p);
  };

  const isImageUrl = (url: string) => {
    return url.length > 0 && (url.startsWith('http') || url.startsWith('https') || url.startsWith('data:image/'));
  };

  const handleSave = async () => {
    if (!editingTask?.title) return setError('Task Title is required');
    if (!editingTask?.content) return setError(editingTask?.type === 'video' ? 'YouTube URL is required' : 'Image is required');
    if (!editingTask?.planId) return setError('Please select a plan before saving.');
    
    // Duration validation
    const durationCount = Number(editingTask.duration);
    if (isNaN(durationCount) || durationCount <= 0 || !Number.isInteger(durationCount)) {
      return setError('Duration must be a positive integer.');
    }

    // Type-specific validation
    if (editingTask.type === 'video' && !isYouTubeUrl(editingTask.content)) {
      return setError('Please enter a valid YouTube Video URL.');
    }
    if (editingTask.type === 'image' && !isImageUrl(editingTask.content)) {
      return setError('Please enter a valid Image URL.');
    }
    
    setSaving(true);
    setError(null);
    try {
      const taskData = {
        ...editingTask,
        duration: durationCount,
        title: editingTask.title,
        updatedAt: serverTimestamp()
      };
      // Remove id from data for saving
      delete (taskData as any).id;

      if (editingTask.id) {
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          createdAt: serverTimestamp()
        });
      }
      setShowModal(false);
      setEditingTask(null);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tasks');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Control</h1>
        <button 
          onClick={() => { setEditingTask({ type: 'image', content: '', planId: '', duration: 15, title: '' }); setShowModal(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Content</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading tasks...</td></tr>
            ) : tasks.map((task) => {
              const plan = plans.find(p => p.id === task.planId);
              return (
                <tr key={task.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {task.type === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                      <span className="capitalize text-sm font-medium">{task.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {task.type === 'image' && task.content?.startsWith('data:image/') ? (
                      <div className="flex items-center gap-2">
                        <img src={task.content} alt="Thumbnail" className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                        <span className="text-xs text-gray-400 font-sans">Uploaded Image</span>
                      </div>
                    ) : (
                      <span className="truncate max-w-xs block font-mono text-xs text-gray-500">{task.content}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{plan?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm">{task.duration}s</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setEditingTask(task); setShowModal(true); }} className="p-1 hover:text-blue-600"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(task.id)} className="p-1 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 space-y-6">
            <h2 className="text-xl font-bold">{editingTask?.id ? 'Edit Task' : 'Add Task'}</h2>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-600 rounded-lg text-xs font-bold font-mono">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Task Title</label>
                <input 
                  type="text" 
                  value={editingTask?.title || ''} 
                  onChange={(e) => handleFieldChange({ title: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Task Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleFieldChange({ type: 'image' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      editingTask?.type === 'image'
                        ? 'border-orange-600 bg-orange-50 text-orange-600'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <ImageIcon size={18} />
                    <span className="font-bold text-sm">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange({ type: 'video' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      editingTask?.type === 'video'
                        ? 'border-orange-600 bg-orange-50 text-orange-600'
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <Video size={18} />
                    <span className="font-bold text-sm">Video</span>
                  </button>
                </div>
              </div>
              <div>
                {editingTask?.type === 'video' ? (
                  <>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">
                      YouTube Video URL
                    </label>
                    <input 
                      type="text" 
                      value={editingTask?.content || ''} 
                      onChange={(e) => handleFieldChange({ content: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                      placeholder="Enter YouTube Video URL"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">
                      Upload Image from Gallery
                    </label>
                    <div className="space-y-3">
                      {editingTask?.content && (
                        <div className="relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
                          <img src={editingTask.content} alt="Preview" className="h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => handleFieldChange({ content: '' })}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-orange-500 hover:bg-orange-50/10 transition-all text-center">
                        <ImageIcon className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-gray-600">
                          {editingTask?.content ? 'Choose another image' : 'Tap to select from gallery'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const base64 = reader.result as string;
                                const compressed = await compressImage(base64);
                                handleFieldChange({ content: compressed });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Assign to Plan</label>
                <select 
                  value={editingTask?.planId} 
                  onChange={(e) => handleFieldChange({ planId: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
                >
                  <option value="">Select Plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-tight">Duration (Seconds)</label>
                <input 
                  type="number" 
                  value={editingTask?.duration || ''} 
                  onChange={(e) => handleFieldChange({ duration: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
                  min="1"
                />
              </div>
            </div>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><Save size={18} /> Save Task</>
              )}
            </button>
            <button onClick={() => setShowModal(false)} className="w-full text-gray-500 font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
