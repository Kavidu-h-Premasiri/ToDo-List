import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus,
  ArrowRight 
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
      
      // Fetch real data from backend
      const [statsData, tasksData] = await Promise.all([
        taskService.getStats(),
        taskService.getTasks({ limit: 5 })
      ]);
      
      // Update stats with real data from database
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

  // Use a mounted flag to prevent state updates after unmount
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
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'In Progress',
      value: stats.in_progress,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'High Priority',
      value: stats.high_priority,
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dashboard data from database...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8">
            <Card className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <AlertCircle className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button variant="primary" onClick={fetchDashboardData}>
                Try Again
              </Button>
            </Card>
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time task statistics from your database</p>
          </div>

          {/* Stats Grid - Real Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Tasks Section - Real Data */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Tasks</h2>
                <p className="text-sm text-gray-500 mt-1">Latest {recentTasks.length} tasks from your database</p>
              </div>
              <Link to="/tasks">
                <Button variant="primary" size="sm">
                  View All Tasks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentTasks.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No tasks in database. Create your first task!</p>
                  <Link to="/tasks/create">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  </Link>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {task.description || 'No description provided'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status?.replace('_', ' ') || 'pending'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority || 'medium'}
                          </span>
                          {task.due_date && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewDetails(task.id)}
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};