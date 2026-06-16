const API_URL = 'http://localhost:8080/api';

// ============ TYPES ============
interface User {
  id: number;
  name: string;
  email: string;
  profile_photo?: string;
  created_at: string;
  updated_at?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface TaskData {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
}

interface TeamTaskData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
  assigned_to: number;
}

interface TeamData {
  name: string;
  description?: string;
}

interface TeamMemberData {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo?: string;
  joined_at?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T = unknown> {
  [key: string]: T;
}

// Notification Types
interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

interface UnreadCountResponse {
  unread_count: number;
}

// ============ MESSAGE TYPES ============
interface ChatMessage {
  id: number;
  team_id: number;
  sender_id: number;
  content: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Chat {
  team_id: number;
  team_name: string;
  last_message: string;
  last_message_at: string;
  sender_name: string;
  unread_count: number;
}

interface ChatsResponse {
  chats: Chat[];
}

interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

// Task Types
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

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

// Team Types
interface Team {
  id: number;
  name: string;
  description: string;
  role: string;
  created_at: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  profile_photo?: string;
}

interface TeamDetailsResponse {
  team: {
    id: number;
    name: string;
    description: string;
    created_by: number;
    created_at: string;
  };
  members: TeamMember[];
  user_role: string;
}

interface TeamsResponse {
  teams: Team[];
}

// ============ HELPERS ============
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const apiCall = async <T = ApiResponse>(
  endpoint: string,
  method: string = 'GET',
  data: unknown = null
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 204) {
      return {} as T;
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const fileUpload = async (endpoint: string, file: File): Promise<{ message: string; photo_url: string }> => {
  const token = getToken();
  const formData = new FormData();
  formData.append('profile_photo', file);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// ============ AUTH SERVICES ============
export const authService = {
  register: (userData: RegisterData): Promise<AuthResponse> =>
    apiCall<AuthResponse>('/auth/register', 'POST', userData),

  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    apiCall<AuthResponse>('/auth/login', 'POST', credentials),

  getCurrentUser: (): Promise<User> =>
    apiCall<User>('/user', 'GET'),

  uploadProfilePhoto: (file: File): Promise<{ message: string; photo_url: string }> =>
    fileUpload('/user/profile-photo', file),

  getProfilePhoto: (): Promise<{ profile_photo: string }> =>
    apiCall<{ profile_photo: string }>('/user/profile-photo', 'GET'),

  deleteProfilePhoto: (): Promise<{ message: string }> =>
    apiCall<{ message: string }>('/user/profile-photo', 'DELETE'),
};

// ============ TASK SERVICES ============
export const taskService = {
  getTasks: (params: Record<string, string | number> = {}): Promise<TasksResponse> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall<TasksResponse>(`/tasks${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  createTask: (taskData: TaskData): Promise<{ message: string; data: Task }> =>
    apiCall<{ message: string; data: Task }>('/tasks', 'POST', taskData),

  getTask: (id: number | string): Promise<Task> =>
    apiCall<Task>(`/tasks/${id}`, 'GET'),

  updateTask: (id: number | string, taskData: Partial<TaskData>): Promise<{ message: string; data: Task }> =>
    apiCall<{ message: string; data: Task }>(`/tasks/${id}`, 'PUT', taskData),

  deleteTask: (id: number | string): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/tasks/${id}`, 'DELETE'),

  getStats: (): Promise<TaskStats> =>
    apiCall<TaskStats>('/tasks/stats', 'GET'),
};

// ============ TEAM SERVICES ============
export const teamService = {
  createTeam: (teamData: TeamData): Promise<{ message: string; team: Team }> =>
    apiCall<{ message: string; team: Team }>('/teams', 'POST', teamData),

  getMyTeams: (): Promise<TeamsResponse> =>
    apiCall<TeamsResponse>('/teams', 'GET'),

  getTeamDetails: (teamId: number): Promise<TeamDetailsResponse> =>
    apiCall<TeamDetailsResponse>(`/teams/${teamId}`, 'GET'),

  inviteMember: (teamId: number, email: string, role: string): Promise<{ message: string; member: { email: string; role: string; status: string } }> =>
    apiCall<{ message: string; member: { email: string; role: string; status: string } }>(
      `/teams/${teamId}/invite`,
      'POST',
      { email, role }
    ),

  updateMemberRole: (teamId: number, memberId: number, role: string): Promise<{ message: string; role: string }> =>
    apiCall<{ message: string; role: string }>(
      `/teams/${teamId}/members/${memberId}`,
      'PUT',
      { role }
    ),

  removeMember: (teamId: number, memberId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/teams/${teamId}/members/${memberId}`, 'DELETE'),
};

// ============ TEAM TASK SERVICES ============
export const teamTaskService = {
  getTeamMembers: (teamId: number): Promise<{ members: TeamMemberData[]; user_role: string }> =>
    apiCall<{ members: TeamMemberData[]; user_role: string }>(`/teams/${teamId}/members`, 'GET'),

  createTeamTask: (teamId: number, taskData: TeamTaskData): Promise<{ message: string; task: Task; assignee_name: string }> =>
    apiCall<{ message: string; task: Task; assignee_name: string }>(
      `/teams/${teamId}/tasks`,
      'POST',
      taskData
    ),

  getTeamTasks: <T = ApiResponse>(teamId: number, filters: Record<string, string | number> = {}): Promise<T> => {
    const queryString = new URLSearchParams(filters as Record<string, string>).toString();
    return apiCall<T>(`/teams/${teamId}/tasks${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  updateTeamTask: (teamId: number, taskId: number, taskData: Partial<TeamTaskData>): Promise<{ message: string; task: Task }> =>
    apiCall<{ message: string; task: Task }>(
      `/teams/${teamId}/tasks/${taskId}`,
      'PUT',
      taskData
    ),

  deleteTeamTask: (teamId: number, taskId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/teams/${teamId}/tasks/${taskId}`, 'DELETE'),

  getMyAssignedTasks: (filters: Record<string, string | number> = {}): Promise<{ tasks: Task[]; total: number }> => {
    const queryString = new URLSearchParams(filters as Record<string, string>).toString();
    return apiCall<{ tasks: Task[]; total: number }>(
      `/my-tasks${queryString ? `?${queryString}` : ''}`,
      'GET'
    );
  },
};

// ============ NOTIFICATION SERVICES ============
export const notificationService = {
  getNotifications: (params: Record<string, string | number> = {}): Promise<NotificationResponse> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall<NotificationResponse>(`/notifications${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  getUnreadCount: (): Promise<UnreadCountResponse> =>
    apiCall<UnreadCountResponse>('/notifications/unread', 'GET'),

  markAsRead: (id: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/notifications/${id}/read`, 'PUT'),

  markAllAsRead: (): Promise<{ message: string }> =>
    apiCall<{ message: string }>('/notifications/read-all', 'PUT'),

  deleteNotification: (id: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/notifications/${id}`, 'DELETE'),
};

// ============ MESSAGE SERVICES ============
export const messageService = {
  getChats: (): Promise<ChatsResponse> =>
    apiCall<ChatsResponse>('/chats', 'GET'),

  getTeamMessages: (teamId: number): Promise<MessagesResponse> =>
    apiCall<MessagesResponse>(`/teams/${teamId}/messages`, 'GET'),

  sendMessage: (teamId: number, data: FormData): Promise<{ message: string; data: ChatMessage }> => {
    const token = getToken();
    return fetch(`${API_URL}/teams/${teamId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: data,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return response.json();
    });
  },

  markMessagesAsRead: (teamId: number): Promise<{ message: string }> =>
    apiCall<{ message: string }>(`/teams/${teamId}/messages/read`, 'PUT'),

  getTeamUnreadCount: (teamId: number): Promise<{ unread_count: number }> =>
    apiCall<{ unread_count: number }>(`/teams/${teamId}/messages/unread`, 'GET'),
};

// ============ EXPORT DEFAULT ============
export default {
  authService,
  taskService,
  teamService,
  teamTaskService,
  notificationService,
  messageService,
};