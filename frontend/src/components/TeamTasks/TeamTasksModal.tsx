import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../UI/Button';
import { teamTaskService } from '../../services/api';
import { Edit, Trash2, Plus, X, Calendar, AlertCircle, CheckCircle, Clock, User, Crown, Lock, Zap, Tag } from 'lucide-react';

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

interface TasksResponse {
  tasks: Task[];
  user_role?: string;
  total?: number;
  is_admin?: boolean;
}

interface MembersResponse {
  members: Member[];
  user_role?: string;
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
      const tasksResponse = await teamTaskService.getTeamTasks(teamId) as TasksResponse;
      console.log('Tasks response:', tasksResponse);
      
      const tasksData: Task[] = tasksResponse?.tasks || [];
      setTasks(tasksData);
      
      if (isAdmin) {
        const membersResponse = await teamTaskService.getTeamMembers(teamId) as MembersResponse;
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
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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

  const canViewTask = (task: Task): boolean => {
    return isAdmin || task.assigned_to === task.user_id;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 w-full max-w-6xl p-8 shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)]">
          <div className="flex justify-center py-12">
            <div className="text-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 blur-2xl animate-pulse"></div>
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)]"></div>
                <p className="text-purple-400 font-mono tracking-wider animate-pulse">LOADING TASKS...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_80px_-20px_rgba(255,0,255,0.1)] animate-slide-up">
        {/* Gradient border glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
        
        {/* Header */}
        <div className="relative flex justify-between items-center p-6 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-wider">
              {teamName} - TASKS
            </h2>
            <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
              <Zap className="w-3 h-3 text-purple-400" />
              {isAdmin ? 'MANAGE ALL TEAM TASKS' : 'YOUR ASSIGNED TASKS ONLY'}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-mono ${
                isAdmin ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {isAdmin ? 'ADMIN' : 'MEMBER'}
              </span>
              {!isAdmin && (
                <span className="ml-2 text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> STATUS ONLY
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono"
              >
                <Plus className="w-4 h-4 mr-2" />
                ASSIGN TASK
              </Button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/5 rounded-lg transition-all duration-300 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="relative mx-6 mt-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-sm font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {error}
            <button 
              onClick={fetchData} 
              className="ml-3 text-purple-400 hover:text-purple-300 transition-colors"
            >
              RETRY
            </button>
          </div>
        )}

        <div className="relative flex-1 overflow-auto p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <CheckCircle className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 font-mono">
                {isAdmin ? 'NO TASKS ASSIGNED IN THIS TEAM' : 'NO TASKS ASSIGNED TO YOU'}
              </p>
              {isAdmin && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateForm(true)} 
                  className="mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] font-mono"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  ASSIGN FIRST TASK
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

                if (!canViewTask(task)) {
                  return null;
                }

                return (
                  <div 
                    key={task.id} 
                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                      isAssignedToMe 
                        ? 'bg-purple-500/5 border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.1)]' 
                        : 'bg-white/5 border-white/10'
                    } ${isReadOnly ? 'opacity-75' : ''} hover:border-purple-500/30 group`}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-pink-600/10 group-hover:to-cyan-600/10 rounded-xl transition-all duration-500"></div>
                    
                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-white font-mono tracking-wide">{task.title}</h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border font-mono tracking-wider ${getPriorityColor(task.priority)}`}>
                            <Tag className="w-3 h-3" />
                            {task.priority.toUpperCase()}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border font-mono tracking-wider ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status?.replace('_', ' ') || 'pending'}
                          </span>
                          {isAdmin && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full flex items-center gap-1 font-mono">
                              <Crown className="w-3 h-3" />
                              ADMIN
                            </span>
                          )}
                          {!isAdmin && isAssignedToMe && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center gap-1 font-mono">
                              <User className="w-3 h-3" />
                              MY TASK
                            </span>
                          )}
                          {isReadOnly && (
                            <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full flex items-center gap-1 font-mono">
                              <Lock className="w-3 h-3" />
                              READ ONLY
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 font-mono mb-2">{task.description || 'NO DESCRIPTION'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-purple-400" />
                            ASSIGNED TO: <strong className="text-gray-300">{task.assignee_name || 'Unassigned'}</strong>
                          </span>
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-cyan-400" />
                              DUE: {new Date(task.due_date).toLocaleDateString()}
                              {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                                <span className="text-red-400 ml-1 animate-pulse">(OVERDUE)</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canUpdate ? (
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-sm px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono tracking-wider hover:border-purple-500/30 transition-all duration-300"
                          >
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="completed">COMPLETED</option>
                          </select>
                        ) : (
                          <span className="text-sm px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg flex items-center gap-1 font-mono border border-white/10">
                            <Lock className="w-3 h-3" />
                            READ ONLY
                          </span>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-2 hover:bg-purple-500/10 rounded-lg transition-all duration-300 group/btn"
                            title="Edit Task"
                          >
                            <Edit className="w-4 h-4 text-purple-400 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-300 group/btn"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 group-hover/btn:scale-110 transition-transform" />
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

      {/* Create/Edit Form Modal */}
      {(showCreateForm || (editingTask && isAdmin)) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="relative bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-[0_0_80px_-20px_rgba(255,0,255,0.15)] animate-slide-up">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
            
            <div className="relative">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-mono tracking-wider mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                {editingTask ? 'EDIT TASK (ADMIN ONLY)' : 'ASSIGN NEW TASK (ADMIN ONLY)'}
              </h3>
              
              <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">TITLE <span className="text-purple-400">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                    required
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">DESCRIPTION</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono resize-none"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">PRIORITY</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                      disabled={!isAdmin}
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">DUE DATE</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={handleDateChange}
                      min={getMinDate()}
                      className={`w-full px-4 py-2 bg-black/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono ${
                        dateError ? 'border-red-500' : 'border-white/10'
                      }`}
                      disabled={!isAdmin}
                    />
                    {dateError && <p className="text-xs text-red-400 font-mono mt-1">{dateError}</p>}
                  </div>
                </div>
                {!editingTask && (
                  <div>
                    <label className="block text-sm font-mono tracking-wider text-gray-300 mb-2">ASSIGN TO <span className="text-purple-400">*</span></label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-mono"
                      required
                      disabled={!isAdmin}
                    >
                      <option value="">SELECT MEMBER</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id} className="bg-black text-white">
                          {member.name} ({member.email}) - {member.role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="submit" 
                    disabled={!!dateError || !isAdmin}
                    className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold py-2.5 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_-5px_rgba(168,85,247,0.5)] transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 font-mono tracking-wider"
                  >
                    {editingTask ? 'UPDATE TASK' : 'ASSIGN TASK'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTask(null);
                      setFormData({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
                      setDateError('');
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white font-bold py-2.5 rounded-xl transition-all duration-300 font-mono tracking-wider"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};