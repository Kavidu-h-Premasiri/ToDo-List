import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
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
  User,
  Tag,
  Eye,
  RefreshCw
} from 'lucide-react';
import { taskService } from '../../services/api.ts';
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

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await taskService.getTasks();
      setTasks(response.tasks || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = async () => {
    try {
      const response = await taskService.getStats();
      setStats(response);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDeletingId(id);
      try {
        await taskService.deleteTask(id);
        setSuccess('Task deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchTasks();
        await fetchStats();
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
        setTimeout(() => setError(''), 3000);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setSuccess('Task status updated!');
      setTimeout(() => setSuccess(''), 2000);
      await fetchTasks();
      await fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePriorityChange = async (taskId: number, newPriority: string) => {
    try {
      await taskService.updateTask(taskId, { priority: newPriority });
      setSuccess('Task priority updated!');
      setTimeout(() => setSuccess(''), 2000);
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update priority');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = getDaysUntilDue(dueDate);
    if (days === null) return null;
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-600' };
    if (days === 0) return { text: 'Due today', color: 'text-orange-600' };
    if (days <= 3) return { text: `${days} days remaining`, color: 'text-yellow-600' };
    return { text: `${days} days remaining`, color: 'text-green-600' };
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
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'In Progress',
      value: stats?.in_progress || 0,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'High Priority',
      value: stats?.high_priority || 0,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  const quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tasks</h1>
              <p className="text-gray-500 mt-1">Manage and track all your tasks</p>
            </div>
            <Link to="/tasks/create">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600 flex-1">{success}</p>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Search and Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setSortBy('created_at');
                    setSortOrder('desc');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {/* Quick Status Filters */}
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                      filterStatus === filter.value
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="created_at">Created Date</option>
                        <option value="due_date">Due Date</option>
                        <option value="title">Title</option>
                        <option value="priority">Priority</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Results Count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'No tasks match your search criteria'
                  : 'No tasks created yet. Create your first task!'}
              </p>
              {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all') ? (
                <Button variant="secondary" onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                }}>
                  Clear Filters
                </Button>
              ) : (
                <Link to="/tasks/create">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Task
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks.map((task) => {
                const dueStatus = getDueDateStatus(task.due_date);
                return (
                  <Card key={task.id} className="p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 text-lg break-words">
                              {task.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 break-words">
                              {task.description || 'No description provided'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)}
                                {task.status?.replace('_', ' ') || 'pending'}
                              </span>
                              <span className={`text-xs px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                <Tag className="w-3 h-3 inline mr-1" />
                                {task.priority || 'medium'}
                              </span>
                              {task.due_date && (
                                <span className={`text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1 ${dueStatus?.color || ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                  {dueStatus && (
                                    <span className="ml-1 font-medium">({dueStatus.text})</span>
                                  )}
                                </span>
                              )}
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        {/* Status Update */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        {/* Priority Update */}
                        <select
                          value={task.priority}
                          onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                          className="text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewTask(task)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <Link to={`/tasks/${task.id}/edit`}>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={deletingId === task.id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === task.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Task Details Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedTask.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Task Details</p>
              </div>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setSelectedTask(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-600">{selectedTask.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className={`mt-1 text-sm px-2.5 py-1 rounded-full inline-block border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status?.replace('_', ' ') || 'pending'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <p className={`mt-1 text-sm px-2.5 py-1 rounded-full inline-block border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority || 'medium'}
                  </p>
                </div>
              </div>
              {selectedTask.due_date && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <p className="mt-1 text-gray-600">
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
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(selectedTask.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(selectedTask.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Link to={`/tasks/${selectedTask.id}/edit`}>
                <Button variant="primary">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => {
                setShowTaskModal(false);
                setSelectedTask(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};