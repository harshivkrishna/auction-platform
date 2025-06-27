import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './components/Dashboard/Dashboard';
import AuctionRoom from './components/AuctionRoom/AuctionRoom';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterForm />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/auction/:id" 
        element={
          <ProtectedRoute>
            <AuctionRoom />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;