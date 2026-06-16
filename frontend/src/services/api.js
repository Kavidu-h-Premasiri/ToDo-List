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

// File upload helper
const fileUpload = async (endpoint, file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('profile_photo', file);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  
  // Profile photo methods
  uploadProfilePhoto: async (file) => {
    const response = await fileUpload('/user/profile-photo', file);
    return response;
  },
  
  getProfilePhoto: async () => {
    try {
      const response = await apiCall('/user/profile-photo', 'GET');
      return response;
    } catch (error) {
      console.error('Error getting profile photo:', error);
      return { profile_photo: null };
    }
  },
  
  deleteProfilePhoto: () => apiCall('/user/profile-photo', 'DELETE'),
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

export default { authService, taskService };