import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Edit, Trash2, Plus, Search, Filter, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { taskService } from '../../services/api';
import { Link } from 'react-router-dom';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await taskService.getTasks();
      setTasks(data.tasks || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        await fetchTasks(); // Refresh the list after deletion
      } catch (err: any) {
        console.error('Error deleting task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'in_progress': return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks from database...</p>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tasks</h1>
              <p className="text-gray-500 mt-1">Manage {tasks.length} tasks from your database</p>
            </div>
            <Link to="/tasks/create">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </Link>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchTasks} className="mt-2">
                Retry
              </Button>
            </Card>
          )}

          <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Status ({tasks.length})</option>
                  <option value="pending">Pending ({tasks.filter(t => t.status === 'pending').length})</option>
                  <option value="in_progress">In Progress ({tasks.filter(t => t.status === 'in_progress').length})</option>
                  <option value="completed">Completed ({tasks.filter(t => t.status === 'completed').length})</option>
                </select>
              </div>
            )}
          </Card>

          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No tasks match your search criteria' 
                  : 'No tasks in database. Create your first task!'}
              </p>
              {(searchTerm || filterStatus !== 'all') ? (
                <Button variant="secondary" onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
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
              {filteredTasks.map((task) => (
                <Card key={task.id} className="p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-1">{task.title}</h3>
                          <p className="text-sm text-gray-500 mb-3">
                            {task.description || 'No description provided'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}>
                              {getStatusIcon(task.status)}
                              {task.status?.replace('_', ' ') || 'pending'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority || 'medium'} priority
                            </span>
                            {task.due_date && (
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              Created: {new Date(task.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/tasks/${task.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};