import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Button } from '../../components/UI/Button';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import { taskService } from '../../services/api';
import { Link } from 'react-router-dom';

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

interface TaskStats {
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

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Define fetchTasks with useCallback and proper dependencies
  const fetchTasks = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const response = await taskService.getTasks();
      console.log('Tasks response:', response);
      
      const allTasks = response.tasks || [];
      console.log('All tasks:', allTasks);
      
      setTasks(allTasks);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching tasks:', apiError);
      setError(apiError.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since taskService is stable

  // Define fetchStats with useCallback
  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const response = await taskService.getStats();
      setStats(response);
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching stats:', apiError);
    }
  }, []); // Empty dependency array since taskService is stable

  // Fix the useEffect with proper dependencies
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchTasks();
        await fetchStats();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchTasks, fetchStats]); // Add fetchTasks and fetchStats as dependencies

  // ... rest of your code remains exactly the same ...
  const handleDeleteTask = async (id: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDeletingId(id);
      try {
        await taskService.deleteTask(id);
        setSuccess('Task deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchTasks();
        await fetchStats();
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to delete task');
        setTimeout(() => setError(''), 3000);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string): Promise<void> => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setSuccess('Task status updated!');
      setTimeout(() => setSuccess(''), 2000);
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePriorityChange = async (taskId: number, newPriority: string): Promise<void> => {
    try {
      await taskService.updateTask(taskId, { priority: newPriority });
      setSuccess('Task priority updated!');
      setTimeout(() => setSuccess(''), 2000);
      await fetchTasks();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update priority');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewTask = (task: Task): void => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

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

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string | null): number | null => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate: string | null): { text: string; color: string } | null => {
    if (!dueDate) return null;
    const days = getDaysUntilDue(dueDate);
    if (days === null) return null;
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-400' };
    if (days === 0) return { text: 'Due today', color: 'text-orange-400' };
    if (days <= 3) return { text: `${days} days remaining`, color: 'text-yellow-400' };
    return { text: `${days} days remaining`, color: 'text-green-400' };
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aVal = a[sortBy as keyof Task];
      let bVal = b[sortBy as keyof Task];
      
      if (sortBy === 'due_date') {
        aVal = a.due_date || '9999-12-31';
        bVal = b.due_date || '9999-12-31';
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const statsCards = [
    {
      title: 'Total Tasks',
      value: stats?.total || 0,
      icon: Target,
      bgColor: 'from-blue-600/20 to-cyan-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      bgColor: 'from-green-600/20 to-emerald-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]',
    },
    {
      title: 'In Progress',
      value: stats?.in_progress || 0,
      icon: Clock,
      bgColor: 'from-yellow-600/20 to-orange-600/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]',
    },
    {
      title: 'High Priority',
      value: stats?.high_priority || 0,
      icon: AlertCircle,
      bgColor: 'from-red-600/20 to-pink-600/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      glowColor: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]',
    },
  ];

  const quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ];

  const canManageTask = (task: Task): boolean => {
    return task.user_id === currentUser.id;
  };

  const isAssignedToMe = (task: Task): boolean => {
    return task.assigned_to === currentUser.id;
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
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">LOADING TASKS...</p>
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
                    TASKS
                  </span>
                  <span className="absolute -inset-1 blur-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-50 animate-pulse"></span>
                </h1>
                <p className="text-gray-400 mt-1 font-mono tracking-wider text-sm">
                  <Zap className="w-4 h-4 inline mr-2 text-purple-400" />
                  MANAGE AND TRACK ALL YOUR TASKS
                </p>
              </div>
              <Link to="/tasks/create">
                <Button variant="primary" className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transform hover:scale-105 transition-all duration-300 font-mono">
                  <Plus className="w-4 h-4 mr-2" />
                  DEPLOY TASK
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-3 animate-shake backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-red-300 font-mono flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-950/50 border border-green-500/30 rounded-xl flex items-center gap-3 backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 animate-pulse" />
              <p className="text-sm text-green-300 font-mono flex-1">{success}</p>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`relative bg-black/40 backdrop-blur-2xl rounded-2xl border ${stat.borderColor} p-4 transition-all duration-500 hover:scale-105 group overflow-hidden ${stat.glowColor}`}
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.bgColor} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x`}></div>
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-mono tracking-wider">{stat.title}</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mt-1">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-5 h-5 ${stat.textColor}`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 mb-6 shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-2xl blur opacity-20"></div>
            
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group/input">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="SEARCH TASKS BY TITLE OR DESCRIPTION..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all duration-300 text-gray-400 hover:text-white font-mono"
                  >
                    <Filter className="w-4 h-4 text-purple-400" />
                    FILTERS
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterPriority('all');
                      setSortBy('created_at');
                      setSortOrder('desc');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all duration-300 text-gray-400 hover:text-white font-mono"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-400" />
                    RESET
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-mono ${
                      filterStatus === filter.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 font-mono tracking-wider mb-1.5">STATUS</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
                    >
                      <option value="all">ALL STATUS</option>
                      <option value="pending">PENDING</option>
                      <option value="in_progress">IN PROGRESS</option>
                      <option value="completed">COMPLETED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 font-mono tracking-wider mb-1.5">PRIORITY</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
                    >
                      <option value="all">ALL PRIORITY</option>
                      <option value="high">HIGH</option>
                      <option value="medium">MEDIUM</option>
                      <option value="low">LOW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 font-mono tracking-wider mb-1.5">SORT BY</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono"
                      >
                        <option value="created_at">CREATED DATE</option>
                        <option value="due_date">DUE DATE</option>
                        <option value="title">TITLE</option>
                        <option value="priority">PRIORITY</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 bg-black/50 border border-white/10 rounded-lg hover:border-purple-500/30 transition-all duration-300 text-gray-400 hover:text-white"
                      >
                        {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-400 font-mono tracking-wider">
              SHOWING {filteredTasks.length} OF {tasks.length} TASKS
            </p>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 text-center shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)] overflow-hidden">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-3xl blur opacity-20"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Search className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-white font-mono tracking-wider mb-4">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'NO TASKS MATCH YOUR SEARCH CRITERIA'
                    : 'NO TASKS DEPLOYED YET'}
                </p>
                {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') ? (
                  <Button variant="secondary" onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }} className="border border-white/10 hover:border-purple-500/30 font-mono">
                    CLEAR FILTERS
                  </Button>
                ) : (
                  <Link to="/tasks/create">
                    <Button variant="primary" className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono">
                      <Plus className="w-4 h-4 mr-2" />
                      DEPLOY FIRST TASK
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks.map((task) => {
                const dueStatus = getDueDateStatus(task.due_date);
                const canManage = canManageTask(task);
                const assignedToMe = isAssignedToMe(task);
                
                return (
                  <div key={task.id} className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 group overflow-hidden shadow-[0_0_80px_-20px_rgba(255,0,255,0.05)]">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-cyan-600/0 group-hover:from-purple-600/20 group-hover:via-pink-600/20 group-hover:to-cyan-600/20 rounded-2xl blur transition-all duration-1000"></div>
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 animate-shine"></div>
                    
                    <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-purple-400">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg font-mono tracking-wide break-words group-hover:text-purple-300 transition-colors">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 break-words font-mono">
                              {task.description || 'NO DESCRIPTION PROVIDED'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border font-mono tracking-wider ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)}
                                {task.status?.replace('_', ' ') || 'pending'}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full border font-mono tracking-wider ${getPriorityColor(task.priority)}`}>
                                <Tag className="w-3 h-3 inline mr-1" />
                                {task.priority || 'medium'}
                              </span>
                              {task.due_date && (
                                <span className={`text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1 font-mono tracking-wider ${dueStatus?.color || ''}`}>
                                  <Calendar className="w-3 h-3 text-purple-400" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                  {dueStatus && (
                                    <span className="ml-1 font-medium">({dueStatus.text})</span>
                                  )}
                                </span>
                              )}
                              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10 font-mono tracking-wider">
                                ID: #{task.id}
                              </span>
                              {assignedToMe && !canManage && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono tracking-wider">
                                  ASSIGNED TO ME
                                </span>
                              )}
                              {task.assignee_name && canManage && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono tracking-wider">
                                  → {task.assignee_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        {(canManage || assignedToMe) && (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-sm px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono tracking-wider hover:border-purple-500/30 transition-all duration-300"
                          >
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="completed">COMPLETED</option>
                          </select>
                        )}

                        {canManage && (
                          <select
                            value={task.priority}
                            onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                            className="text-sm px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono tracking-wider hover:border-purple-500/30 transition-all duration-300"
                          >
                            <option value="low">LOW</option>
                            <option value="medium">MEDIUM</option>
                            <option value="high">HIGH</option>
                          </select>
                        )}

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewTask(task)}
                            className="p-2 hover:bg-purple-500/10 rounded-lg transition-all duration-300 group/btn"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-purple-400 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          {canManage && (
                            <>
                              <Link to={`/tasks/${task.id}/edit`}>
                                <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-all duration-300 group/btn" title="Edit">
                                  <Edit className="w-4 h-4 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={deletingId === task.id}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50 group/btn"
                                title="Delete"
                              >
                                {deletingId === task.id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Trash2 className="w-4 h-4 text-red-400 group-hover/btn:scale-110 transition-transform" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] animate-slide-up">
            {/* Gradient border glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur opacity-20"></div>
            
            <div className="relative p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono">
                  {selectedTask.title}
                </h2>
                <p className="text-sm text-gray-400 font-mono mt-1 tracking-wider">TASK DETAILS</p>
              </div>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">DESCRIPTION</label>
                <p className="mt-1 text-gray-300 font-mono">{selectedTask.description || 'NO DESCRIPTION PROVIDED'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">STATUS</label>
                  <p className={`mt-1 text-sm px-2.5 py-1 rounded-full inline-block border font-mono tracking-wider ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status?.replace('_', ' ') || 'pending'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">PRIORITY</label>
                  <p className={`mt-1 text-sm px-2.5 py-1 rounded-full inline-block border font-mono tracking-wider ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority || 'medium'}
                  </p>
                </div>
              </div>
              {selectedTask.due_date && (
                <div>
                  <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">DUE DATE</label>
                  <p className="mt-1 text-gray-300 font-mono">
                    {new Date(selectedTask.due_date).toLocaleDateString()}
                    {getDueDateStatus(selectedTask.due_date) && (
                      <span className={`ml-2 text-sm ${getDueDateStatus(selectedTask.due_date)?.color}`}>
                        ({getDueDateStatus(selectedTask.due_date)?.text})
                      </span>
                    )}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">CREATED</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">
                    {new Date(selectedTask.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 font-mono tracking-wider">LAST UPDATED</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">
                    {new Date(selectedTask.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative p-6 border-t border-white/10 flex justify-end gap-3">
              <Link to={`/tasks/${selectedTask.id}/edit`}>
                <Button variant="primary" className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono">
                  <Edit className="w-4 h-4 mr-2" />
                  EDIT TASK
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => {
                setShowTaskModal(false);
                setSelectedTask(null);
              }} className="border border-white/10 hover:border-purple-500/30 font-mono text-gray-400 hover:text-white">
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
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
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-shine {
          animation: shine 4s ease-in-out infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
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
      `}</style>
    </div>
  );
};