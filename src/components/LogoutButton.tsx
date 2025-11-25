// src/components/LogoutButton.tsx
import React from 'react';
import { useAuth } from '../AuthContext';
import './LogoutButton.css';

const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Está seguro de que desea cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="logout-container">
      <span className="user-info">👤 {user}</span>
      <button onClick={handleLogout} className="btn-logout">
        🚪 Cerrar Sesión
      </button>
    </div>
  );
};

export default LogoutButton;