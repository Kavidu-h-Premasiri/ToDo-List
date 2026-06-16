import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { taskService } from '../../services/api';
import { ArrowLeft, Edit, Calendar, AlertCircle } from 'lucide-react';

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
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8 flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading task...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <div className="p-8">
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500">{error || 'Task not found'}</p>
              <Button variant="primary" onClick={handleGoBack} className="mt-4">
                Back to Tasks
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
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{task.title}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status?.replace('_', ' ') || 'pending'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'medium'}
                    </span>
                    {task.assigned_to && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        Assigned to: {task.assignee_name || 'User'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {task.description || 'No description provided'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Updated</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(task.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {task.due_date && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 text-gray-400 flex items-center justify-center font-bold text-lg">#</div>
                    <div>
                      <p className="text-xs text-gray-500">Task ID</p>
                      <p className="text-sm font-medium text-gray-800">{task.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};