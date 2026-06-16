const API_URL = 'http://localhost:8080/api';

// ============ TYPES ============
interface User {
  id: number;
  name: string;
  email: string;
  profile_photo?: string;
  created_at: string;
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
  status?: string;  // Add this line
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

interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

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

interface UnreadCountResponse {
  unread_count: number;
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
  getTasks: <T = ApiResponse>(params: Record<string, string | number> = {}): Promise<T> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall<T>(`/tasks${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  createTask: <T = ApiResponse>(taskData: TaskData): Promise<T> =>
    apiCall<T>('/tasks', 'POST', taskData),

  getTask: <T = ApiResponse>(id: number | string): Promise<T> =>
    apiCall<T>(`/tasks/${id}`, 'GET'),

  updateTask: <T = ApiResponse>(id: number | string, taskData: Partial<TaskData>): Promise<T> =>
    apiCall<T>(`/tasks/${id}`, 'PUT', taskData),

  deleteTask: <T = ApiResponse>(id: number | string): Promise<T> =>
    apiCall<T>(`/tasks/${id}`, 'DELETE'),

  getStats: <T = ApiResponse>(): Promise<T> =>
    apiCall<T>('/tasks/stats', 'GET'),
};

// ============ TEAM SERVICES ============
export const teamService = {
  createTeam: <T = ApiResponse>(teamData: TeamData): Promise<T> =>
    apiCall<T>('/teams', 'POST', teamData),

  getMyTeams: <T = ApiResponse>(): Promise<T> =>
    apiCall<T>('/teams', 'GET'),

  getTeamDetails: <T = ApiResponse>(teamId: number): Promise<T> =>
    apiCall<T>(`/teams/${teamId}`, 'GET'),

  inviteMember: <T = ApiResponse>(teamId: number, email: string, role: string): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/invite`, 'POST', { email, role }),

  updateMemberRole: <T = ApiResponse>(teamId: number, memberId: number, role: string): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/members/${memberId}`, 'PUT', { role }),

  removeMember: <T = ApiResponse>(teamId: number, memberId: number): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/members/${memberId}`, 'DELETE'),
};

// ============ TEAM TASK SERVICES ============
export const teamTaskService = {
  getTeamMembers: <T = { members: TeamMemberData[] }>(teamId: number): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/members`, 'GET'),

  createTeamTask: <T = ApiResponse>(teamId: number, taskData: TeamTaskData): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/tasks`, 'POST', taskData),

  getTeamTasks: <T = ApiResponse>(teamId: number, filters: Record<string, string | number> = {}): Promise<T> => {
    const queryString = new URLSearchParams(filters as Record<string, string>).toString();
    return apiCall<T>(`/teams/${teamId}/tasks${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  updateTeamTask: <T = ApiResponse>(teamId: number, taskId: number, taskData: Partial<TeamTaskData>): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/tasks/${taskId}`, 'PUT', taskData),

  deleteTeamTask: <T = ApiResponse>(teamId: number, taskId: number): Promise<T> =>
    apiCall<T>(`/teams/${teamId}/tasks/${taskId}`, 'DELETE'),

  getMyAssignedTasks: <T = ApiResponse>(filters: Record<string, string | number> = {}): Promise<T> => {
    const queryString = new URLSearchParams(filters as Record<string, string>).toString();
    return apiCall<T>(`/my-tasks${queryString ? `?${queryString}` : ''}`, 'GET');
  },
};

// ============ NOTIFICATION SERVICES ============
export const notificationService = {
  getNotifications: <T = NotificationResponse>(params: Record<string, string | number> = {}): Promise<T> => {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    return apiCall<T>(`/notifications${queryString ? `?${queryString}` : ''}`, 'GET');
  },

  getUnreadCount: (): Promise<UnreadCountResponse> =>
    apiCall<UnreadCountResponse>('/notifications/unread', 'GET'),

  markAsRead: <T = { message: string }>(id: number): Promise<T> =>
    apiCall<T>(`/notifications/${id}/read`, 'PUT'),

  markAllAsRead: <T = { message: string }>(): Promise<T> =>
    apiCall<T>('/notifications/read-all', 'PUT'),

  deleteNotification: <T = { message: string }>(id: number): Promise<T> =>
    apiCall<T>(`/notifications/${id}`, 'DELETE'),
};

// ============ EXPORT DEFAULT ============
export default {
  authService,
  taskService,
  teamService,
  teamTaskService,
  notificationService,
};