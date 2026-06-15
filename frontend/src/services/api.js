const API_URL = 'http://localhost:8080/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('token');

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (response.status === 204) {
      return null;
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

// Auth Services
export const authService = {
  register: async (userData) => {
    const response = await apiCall('/auth/register', 'POST', userData);
    return response;
  },
  
  login: async (credentials) => {
    const response = await apiCall('/auth/login', 'POST', credentials);
    return response;
  },
  
  getCurrentUser: () => apiCall('/user', 'GET'),
};

// Task Services
export const taskService = {
  getTasks: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiCall(`/tasks${queryString ? `?${queryString}` : ''}`, 'GET');
    return response;
  },
  
  createTask: async (taskData) => {
    const response = await apiCall('/tasks', 'POST', taskData);
    return response;
  },
  
  getTask: async (id) => {
    const response = await apiCall(`/tasks/${id}`, 'GET');
    return response;
  },
  
  updateTask: async (id, taskData) => {
    const response = await apiCall(`/tasks/${id}`, 'PUT', taskData);
    return response;
  },
  
  deleteTask: async (id) => {
    const response = await apiCall(`/tasks/${id}`, 'DELETE');
    return response;
  },
  
  getStats: async () => {
    const response = await apiCall('/tasks/stats', 'GET');
    return response;
  },
};

// Teams Services (for future implementation)
export const teamService = {
  getTeams: () => apiCall('/teams', 'GET'),
  getTeamMembers: (teamId) => apiCall(`/teams/${teamId}/members`, 'GET'),
  inviteMember: (email, role) => apiCall('/teams/invite', 'POST', { email, role }),
};

export default { authService, taskService, teamService };