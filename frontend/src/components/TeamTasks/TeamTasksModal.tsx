import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../UI/Button';
import { teamTaskService } from '../../services/api';
import { Edit, Trash2, Plus, X, Calendar, AlertCircle, CheckCircle, Clock, User, Crown, Lock } from 'lucide-react';

interface TeamTasksModalProps {
  teamId: number;
  teamName: string;
  userRole: string;
  onClose: () => void;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  assignee_name: string;
  assignee_email: string;
  creator_name: string;
  assigned_to: number;
  user_id: number;
}

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ApiError {
  message: string;
}

interface TaskData {
  title: string;
  description: string;
  priority: string;
  assigned_to: number;
  due_date?: string | null;
  status?: string;
}

interface TeamTaskResponse {
  tasks: Task[];
  user_role: string;
  total: number;
  is_admin: boolean;
}

interface MembersResponse {
  members: Member[];
  user_role: string;
}

export const TeamTasksModal: React.FC<TeamTasksModalProps> = ({ teamId, teamName, userRole, onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  });

  const isAdmin = userRole === 'admin';

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const tasksResponse = await teamTaskService.getTeamTasks<TeamTaskResponse>(teamId);
      console.log('Tasks response:', tasksResponse);
      
      const tasksData = tasksResponse?.tasks || [];
      setTasks(tasksData);
      
      // Only fetch members if user is admin
      if (isAdmin) {
        const membersResponse = await teamTaskService.getTeamMembers<MembersResponse>(teamId);
        setMembers(membersResponse?.members || []);
      } else {
        setMembers([]);
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error fetching data:', apiError);
      setError(apiError.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [teamId, isAdmin]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async (): Promise<void> => {
      if (isMounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setDateError('Due date cannot be in the past');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newDate = e.target.value;
    setFormData({ ...formData, due_date: newDate });
    validateDate(newDate);
  };

  const formatDateForAPI = (dateString: string): string | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  };

  const handleCreateTask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only team admins can create tasks');
      return;
    }
    if (formData.due_date && !validateDate(formData.due_date)) {
      return;
    }
    try {
      const assignedToNum = parseInt(formData.assigned_to);
      if (isNaN(assignedToNum)) {
        alert('Please select a member to assign the task to');
        return;
      }
      
      const taskData: TaskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_to: assignedToNum,
      };
      if (formData.due_date) {
        taskData.due_date = formatDateForAPI(formData.due_date);
      }
      await teamTaskService.createTeamTask(teamId, taskData);
      setShowCreateForm(false);
      setFormData({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      setDateError('');
      await fetchData();
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error creating task:', apiError);
      alert('Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only team admins can edit task details');
      return;
    }
    if (formData.due_date && !validateDate(formData.due_date)) {
      return;
    }
    try {
      const taskData: Partial<TaskData> = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      };
      if (formData.due_date) {
        taskData.due_date = formatDateForAPI(formData.due_date);
      }

      await teamTaskService.updateTeamTask(teamId, editingTask!.id, taskData);
      setEditingTask(null);
      setFormData({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
      setDateError('');
      await fetchData();
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error updating task:', apiError);
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number): Promise<void> => {
    if (!isAdmin) {
      alert('Only team admins can delete tasks');
      return;
    }
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await teamTaskService.deleteTeamTask(teamId, taskId);
        await fetchData();
      } catch (err) {
        const apiError = err as ApiError;
        console.error('Error deleting task:', apiError);
        alert('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string): Promise<void> => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Check if user is admin OR task is assigned to them
      const isAssignedToMe = task.assigned_to === task.user_id;
      if (!isAdmin && !isAssignedToMe) {
        alert('You can only change status of tasks assigned to you');
        return;
      }

      const updateData: Partial<TaskData> = { status: newStatus };
      await teamTaskService.updateTeamTask(teamId, taskId, updateData);
      await fetchData();
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error updating status:', apiError);
      alert('You can only update the status of this task');
    }
  };

  const handleEditClick = (task: Task): void => {
    if (!isAdmin) {
      alert('Only team admins can edit task details');
      return;
    }
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to?.toString() || '',
    });
    setDateError('');
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'in_progress': return <Clock className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if user can view task details (admin or assigned to them)
  const canViewTask = (task: Task): boolean => {
    return isAdmin || task.assigned_to === task.user_id;
  };

  // Check if user can update task status
  const canUpdateStatus = (task: Task): boolean => {
    return isAdmin || task.assigned_to === task.user_id;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl p-8">
          <div className="flex justify-center py-12">
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{teamName} - Tasks</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAdmin ? 'Manage all team tasks' : 'Your assigned tasks only'}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isAdmin ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                {isAdmin ? 'Admin' : 'Member'}
              </span>
              {!isAdmin && (
                <span className="ml-2 text-xs text-gray-400">
                  <Lock className="w-3 h-3 inline" /> Status only
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Task
              </Button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            <button onClick={fetchData} className="ml-3 text-blue-600 hover:text-blue-700">
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {isAdmin ? 'No tasks assigned in this team' : 'No tasks assigned to you'}
              </p>
              {isAdmin && (
                <Button variant="primary" onClick={() => setShowCreateForm(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isAssignedToMe = task.assigned_to === task.user_id;
                const canEdit = isAdmin;
                const canDelete = isAdmin;
                const canUpdate = isAdmin || isAssignedToMe;
                const isReadOnly = !isAdmin && !isAssignedToMe;

                // Only show tasks that user can view
                if (!canViewTask(task)) {
                  return null;
                }

                return (
                  <div key={task.id} className={`p-4 border rounded-xl transition-all ${
                    isAssignedToMe ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
                  } ${isReadOnly ? 'opacity-75' : ''} hover:shadow-md`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 border ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status?.replace('_', ' ') || 'pending'}
                          </span>
                          {isAdmin && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Admin View
                            </span>
                          )}
                          {!isAdmin && isAssignedToMe && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                              <User className="w-3 h-3" />
                              My Task
                            </span>
                          )}
                          {isReadOnly && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Read Only
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{task.description || 'No description'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Assigned to: <strong>{task.assignee_name || 'Unassigned'}</strong>
                          </span>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                              {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                                <span className="text-red-500 ml-1">(Overdue)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status - Members can ONLY change status of their tasks */}
                        {canUpdate ? (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-sm px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        ) : (
                          <span className="text-sm px-3 py-1 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Read Only
                          </span>
                        )}

                        {/* Edit - ONLY Admin */}
                        {canEdit && (
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </button>
                        )}

                        {/* Delete - ONLY Admin */}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal - ONLY Admin */}
      {(showCreateForm || (editingTask && isAdmin)) && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingTask ? 'Edit Task (Admin Only)' : 'Assign New Task (Admin Only)'}
            </h3>
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={!isAdmin}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={!isAdmin}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      dateError ? 'border-red-500' : 'border-gray-200'
                    }`}
                    disabled={!isAdmin}
                  />
                  {dateError && <p className="text-xs text-red-500 mt-1">{dateError}</p>}
                </div>
              </div>
              {!editingTask && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                    disabled={!isAdmin}
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email}) - {member.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={!!dateError || !isAdmin}>
                  {editingTask ? 'Update Task' : 'Assign Task'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTask(null);
                    setFormData({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
                    setDateError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};