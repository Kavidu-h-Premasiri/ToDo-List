import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Button } from '../../components/UI/Button';
import { taskService } from '../../services/api';
import { ArrowLeft, Edit, AlertCircle, Zap, FileText, Tag, Clock, User, Calendar as CalendarIcon, Hash } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: number;
  assigned_to?: number;
  team_id?: number;
  assignee_name?: string;
}

interface ApiError {
  message: string;
}

export const TaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTask = useCallback(async () => {
    if (!id) {
      setError('Task ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching task:', apiError);
      setError(apiError.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Use mounted flag to prevent state updates after unmount
  useEffect(() => {
    let isMounted = true;
    
    const loadTask = async () => {
      if (isMounted) {
        await fetchTask();
      }
    };
    
    loadTask();
    
    return () => {
      isMounted = false;
    };
  }, [fetchTask]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-green-600/40 to-emerald-600/40 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-gradient-to-r from-yellow-600/40 to-orange-600/40 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gradient-to-r from-gray-600/40 to-slate-600/40 text-gray-300 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-red-600/40 to-pink-600/40 text-red-300 border-red-500/30';
      case 'medium': return 'bg-gradient-to-r from-yellow-600/40 to-orange-600/40 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gradient-to-r from-blue-600/40 to-cyan-600/40 text-blue-300 border-blue-500/30';
    }
  };

  const handleGoBack = (): void => {
    navigate('/tasks');
  };

  const handleEdit = (): void => {
    if (task) {
      navigate(`/tasks/${task.id}/edit`);
    }
  };

  if (loading) {
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

  if (error || !task) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,#ff00ff11,transparent_60%),radial-gradient(circle_at_70%_80%,#00ffff11,transparent_60%),radial-gradient(circle_at_50%_50%,#000000,#0a0a0a)]"></div>
        <Sidebar />
        <div className="lg:pl-72 relative z-10">
          <Navbar />
          <div className="p-8">
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-red-500/30 p-12 text-center shadow-[0_0_80px_-20px_rgba(239,68,68,0.1)] overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 rounded-3xl blur opacity-20"></div>
              <div className="relative">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
                <p className="text-red-300 font-mono tracking-wider text-lg">{error || 'TASK NOT FOUND'}</p>
                <Button 
                  variant="primary" 
                  onClick={handleGoBack} 
                  className="mt-6 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  BACK TO TASKS
                </Button>
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
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-6 text-gray-400 hover:text-purple-400 transition-all duration-300 font-mono border border-white/10 hover:border-purple-500/30 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO TASKS
          </Button>

          <div className="max-w-4xl mx-auto">
            {/* Task Details Card */}
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)] transition-all duration-500 hover:shadow-[0_0_100px_-10px_rgba(255,0,255,0.15)] overflow-hidden group">
              {/* Animated gradient border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
              
              {/* Card shine effect */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>

              <div className="relative">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-500 font-mono tracking-wider">TASK #{task.id}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-tight">
                      {task.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border font-mono tracking-wider ${getStatusColor(task.status)}`}>
                        <Clock className="w-3 h-3" />
                        {task.status?.replace('_', ' ') || 'pending'}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border font-mono tracking-wider ${getPriorityColor(task.priority)}`}>
                        <Tag className="w-3 h-3" />
                        {task.priority || 'medium'}
                      </span>
                      {task.assigned_to && (
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3" />
                          ASSIGNED TO: {task.assignee_name || 'User'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleEdit}
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transform hover:scale-105 transition-all duration-300 font-mono"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    EDIT TASK
                  </Button>
                </div>

                {/* Description */}
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <h3 className="text-sm font-mono tracking-wider text-gray-400 flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    DESCRIPTION
                  </h3>
                  <p className="text-gray-300 font-mono leading-relaxed">
                    {task.description || 'NO DESCRIPTION PROVIDED'}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all duration-300">
                    <CalendarIcon className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-400 font-mono tracking-wider">CREATED</p>
                      <p className="text-sm font-bold text-white font-mono">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300">
                    <CalendarIcon className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400 font-mono tracking-wider">UPDATED</p>
                      <p className="text-sm font-bold text-white font-mono">
                        {new Date(task.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-all duration-300 sm:col-span-2">
                      <CalendarIcon className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-mono tracking-wider">DUE DATE</p>
                        <p className="text-sm font-bold text-white font-mono">
                          {new Date(task.due_date).toLocaleDateString()}
                          {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                            <span className="ml-2 text-red-400 text-xs font-mono animate-pulse">(OVERDUE)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      STATUS: {task.status?.toUpperCase() || 'PENDING'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-pink-400" />
                      PRIORITY: {task.priority?.toUpperCase() || 'MEDIUM'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    ID: #{task.id}
                  </span>
                </div>
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
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
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
      `}</style>
    </div>
  );
};