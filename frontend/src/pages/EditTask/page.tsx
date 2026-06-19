import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { taskService } from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Zap, FileText, Calendar, Tag, Clock, ArrowLeft, Save } from 'lucide-react';

interface ApiError {
  message: string;
}

export const EditTaskPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const task = await taskService.getTask(id as string);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching task:', apiError);
      setError(apiError.message || 'Failed to load task');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const taskData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
      };
      
      if (formData.due_date) {
        const dueDate = new Date(formData.due_date);
        dueDate.setHours(23, 59, 59, 999);
        taskData.due_date = dueDate.toISOString();
      }
      
      await taskService.updateTask(id as string, taskData);
      setSuccess('Task updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/tasks');
      }, 1500);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error updating task:', apiError);
      setError(apiError.message || 'Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 blur-2xl animate-pulse"></div>
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">LOADING TASK...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff11,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff11,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)]"></div>
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      
      <Sidebar />
      <div className="lg:pl-72 relative z-10">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Header with glitch effect */}
            <div className="mb-8 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tighter relative glitch-wrapper">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
                      EDIT TASK
                    </span>
                    <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
                  </h1>
                  <p className="text-gray-400 mt-1 font-mono tracking-wider text-sm">
                    <Zap className="w-4 h-4 inline mr-2 text-purple-400" />
                    UPDATE YOUR TASK DETAILS
                  </p>
                </div>
                <button
                  onClick={() => navigate('/tasks')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all duration-300 text-gray-400 hover:text-white font-mono text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  BACK TO TASKS
                </button>
              </div>
            </div>

            {/* Form Card */}
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)] transition-all duration-500 hover:shadow-[0_0_100px_-10px_rgba(255,0,255,0.15)] overflow-hidden group">
              {/* Animated gradient border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
              
              {/* Card shine effect */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>

              <div className="relative z-10">
                {error && (
                  <div className="mb-6 p-4 bg-red-950/50 border border-red-500/30 rounded-xl flex items-start gap-3 animate-shake backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-red-300 font-mono font-bold tracking-wider">ERROR</p>
                      <p className="text-red-300/80 text-sm font-mono">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-950/50 border border-green-500/30 rounded-xl flex items-start gap-3 backdrop-blur-sm animate-slide-up">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-green-300 font-mono font-bold tracking-wider">SUCCESS</p>
                      <p className="text-green-300/80 text-sm font-mono">{success}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-mono tracking-wider text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      TASK TITLE <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative group/input">
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                        placeholder="Enter task title..."
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-mono tracking-wider text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      DESCRIPTION
                    </label>
                    <div className="relative group/input">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono resize-none"
                        placeholder="Enter task description (optional)..."
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Status and Priority Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-mono tracking-wider text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        STATUS
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                      >
                        <option value="pending">PENDING</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="completed">COMPLETED</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-mono tracking-wider text-gray-300 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-pink-400" />
                        PRIORITY
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                      >
                        <option value="low">LOW</option>
                        <option value="medium">MEDIUM</option>
                        <option value="high">HIGH</option>
                      </select>
                    </div>
                  </div>

                  {/* Due Date Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-mono tracking-wider text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-400" />
                      DUE DATE
                    </label>
                    <div className="relative group/input">
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-cyan-500/5 opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-gray-500 font-mono tracking-wider mt-1">
                      [ OPTIONAL ] SELECT A DUE DATE FOR THIS TASK
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-3 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider relative overflow-hidden group/btn"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></span>
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/5 to-purple-600/0 animate-pulse-slow"></span>
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>UPDATING...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>UPDATE TASK</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/tasks')}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-3 rounded-xl transition-all duration-300 font-mono tracking-wider"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .glitch-wrapper {
          position: relative;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #06b6d4);
          border-radius: 2px;
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
        
        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(0,0,0,0.5) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
};