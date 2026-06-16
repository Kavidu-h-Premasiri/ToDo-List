import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Navbar } from '../../components/Layout/Navbar';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { taskService } from '../../services/api.ts';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const EditTaskPage: React.FC = () => {
  const { id } = useParams();
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
      const task = await taskService.getTask(id);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
      });
    } catch (err: any) {
      console.error('Error fetching task:', err);
      setError(err.message || 'Failed to load task');
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
      // Prepare data for API
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
      };
      
      // Only add due_date if it has a value
      if (formData.due_date) {
        const dueDate = new Date(formData.due_date);
        dueDate.setHours(23, 59, 59, 999);
        taskData.due_date = dueDate.toISOString();
      }
      
      await taskService.updateTask(id, taskData);
      setSuccess('Task updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/tasks');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Edit Task</h1>
            <p className="text-gray-500 mb-6">Update your task details</p>

            <Card className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-600 font-medium">Error</p>
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-600 font-medium">Success</p>
                    <p className="text-green-500 text-sm">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Enter task description (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">Optional - Select a due date for this task</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Task'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => navigate('/tasks')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};