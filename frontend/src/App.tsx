import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login/page';
import { RegisterPage } from './pages/Register/page';
import { DashboardPage } from './pages/Dashboard/page';
import { TasksPage } from './pages/Tasks/page';
import { CreateTaskPage } from './pages/CreateTask/page';
import { EditTaskPage } from './pages/EditTask/page';
import { ProfilePage } from './pages/Profile/page';
import { TeamsPage } from './pages/Teams/page';
import { MessagesPage } from './pages/Messages/page';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route wrapper
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);

    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setIsAuthenticated(!!newToken);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      } />
      <Route path="/tasks/create" element={
        <ProtectedRoute>
          <CreateTaskPage />
        </ProtectedRoute>
      } />
      <Route path="/tasks/:id/edit" element={
        <ProtectedRoute>
          <EditTaskPage />
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute>
          <TeamsPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      
      {/* Default Route */}
      <Route path="/" element={
        <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
      } />
      
      {/* Catch all */}
      <Route path="*" element={
        <Navigate to="/" replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;