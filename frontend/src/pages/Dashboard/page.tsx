import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Button } from '../../components/UI/Button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus,
  ArrowRight,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { taskService } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

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

interface Stats {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

interface ApiError {
  message: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsData, tasksData] = await Promise.all([
        taskService.getStats(),
        taskService.getTasks({ limit: 5 })
      ]);
      
      setStats({
        total: statsData.total || 0,
        completed: statsData.completed || 0,
        in_progress: statsData.in_progress || 0,
        pending: statsData.pending || 0,
        high_priority: statsData.high_priority || 0,
        medium_priority: statsData.medium_priority || 0,
        low_priority: statsData.low_priority || 0
      });
      
      setRecentTasks(tasksData.tasks || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching dashboard data:', apiError);
      setError(apiError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchDashboardData]);

  const handleViewDetails = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const statsCards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      icon: TrendingUp,
      bgColor: 'from-blue-600/20 to-cyan-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      bgColor: 'from-green-600/20 to-emerald-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]',
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      bgColor: 'from-yellow-600/20 to-orange-600/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]',
    },
    {
      title: 'High Priority',
      value: stats.high_priority,
      icon: AlertCircle,
      bgColor: 'from-red-600/20 to-pink-600/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-green-600/40 to-emerald-600/40 text-green-300 border border-green-500/30';
      case 'in_progress': return 'bg-gradient-to-r from-yellow-600/40 to-orange-600/40 text-yellow-300 border border-yellow-500/30';
      default: return 'bg-gradient-to-r from-gray-600/40 to-slate-600/40 text-gray-300 border border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gradient-to-r from-red-600/40 to-pink-600/40 text-red-300 border border-red-500/30';
      case 'medium': return 'bg-gradient-to-r from-yellow-600/40 to-orange-600/40 text-yellow-300 border border-yellow-500/30';
      default: return 'bg-gradient-to-r from-blue-600/40 to-cyan-600/40 text-blue-300 border border-blue-500/30';
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
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">INITIALIZING DATABASE...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black overflow-hidden">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8">
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-red-500/30 p-8 text-center shadow-[0_0_80px_-20px_rgba(239,68,68,0.2)]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 rounded-3xl blur opacity-20"></div>
              <div className="relative">
                <div className="text-red-400 mb-4">
                  <AlertCircle className="w-16 h-16 mx-auto animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-red-300 mb-2 font-mono">SYSTEM ERROR</h3>
                <p className="text-gray-400 mb-6 font-mono">{error}</p>
                <Button 
                  variant="primary" 
                  onClick={fetchDashboardData}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                >
                  RETRY CONNECTION
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
          {/* Header with glitch effect */}
          <div className="mb-8 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter relative glitch-wrapper">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x relative z-10">
                    DASHBOARD
                  </span>
                  <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
                </h1>
                <p className="text-gray-400 mt-1 font-mono tracking-wider text-sm animate-pulse-slow">
                  <Zap className="w-4 h-4 inline mr-2 text-purple-400" />
                  REAL-TIME TASK STATISTICS
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400 font-mono">SYSTEM ONLINE</span>
                </div>
                <Link to="/tasks/create">
                  <Button 
                    variant="primary" 
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transform hover:scale-105 transition-all duration-300 font-mono"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    NEW TASK
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid - Cyberpunk Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`relative bg-black/40 backdrop-blur-2xl rounded-2xl border ${stat.borderColor} p-6 transition-all duration-500 hover:scale-105 group overflow-hidden ${stat.glowColor}`}
                >
                  {/* Animated gradient border */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.bgColor} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x`}></div>
                  
                  {/* Card shine effect */}
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400 font-mono tracking-wider mb-1">{stat.title}</p>
                        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                    {/* Animated progress bar */}
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${stat.bgColor} rounded-full transition-all duration-1000`}
                        style={{ 
                          width: `${Math.min((stat.value / (stats.total || 1)) * 100, 100)}%`,
                          opacity: stats.total > 0 ? 1 : 0
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Tasks Section - Cyberpunk Style */}
          <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 sm:p-6 shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)] transition-all duration-500 hover:shadow-[0_0_100px_-10px_rgba(255,0,255,0.15)] overflow-hidden group">
            {/* Animated gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
            
            {/* Card shine effect */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x font-mono">
                    RECENT TASKS
                  </h2>
                  <p className="text-sm text-gray-400 font-mono mt-1">
                    LATEST {recentTasks.length} TASKS FROM DATABASE
                  </p>
                </div>
                <Link to="/tasks">
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-cyan-600/50 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300 font-mono"
                  >
                    VIEW ALL
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {recentTasks.length === 0 ? (
                  <div className="text-center py-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-cyan-600/5 rounded-2xl blur-2xl"></div>
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Target className="w-10 h-10 text-purple-400" />
                      </div>
                      <p className="text-gray-400 font-mono mb-4">NO TASKS FOUND IN DATABASE</p>
                      <Link to="/tasks/create">
                        <Button 
                          variant="primary"
                          className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          DEPLOY FIRST TASK
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  recentTasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition-all duration-300 hover:bg-white/10 hover:border-purple-500/30 group/task"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {/* Task glow effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-cyan-600/0 rounded-xl opacity-0 group-hover/task:opacity-20 transition-opacity duration-500 group-hover/task:from-purple-600/20 group-hover/task:via-pink-600/20 group-hover/task:to-cyan-600/20"></div>
                      
                      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1 group-hover/task:text-purple-300 transition-colors font-mono">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2 font-mono">
                            {task.description || 'NO DESCRIPTION PROVIDED'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-mono tracking-wider ${getStatusColor(task.status)}`}>
                              {task.status?.replace('_', ' ') || 'pending'}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-mono tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority || 'medium'}
                            </span>
                            {task.due_date && (
                              <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-gray-600/40 to-slate-600/40 text-gray-300 border border-gray-500/30 font-mono">
                                DUE: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-purple-300 border border-purple-500/20 font-mono">
                              ID: #{task.id}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(task.id)}
                          className="text-purple-400 hover:text-white hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 font-mono"
                        >
                          VIEW
                          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%) rotate(45deg); }
          to { transform: translateX(100%) rotate(45deg); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .glitch-wrapper {
          position: relative;
        }
        
        /* Scrollbar styling */
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
        
        /* Task card hover effect */
        .group-hover\\:from-purple-600\\/20 {
          --tw-gradient-from: rgba(168, 85, 247, 0.2);
          --tw-gradient-to: rgba(168, 85, 247, 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
      `}</style>
    </div>
  );
};