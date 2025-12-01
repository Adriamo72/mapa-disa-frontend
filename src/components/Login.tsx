// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError('Credenciales incorrectas');
    }
  };

  // IDs únicos para evitar el warning
  const usernameId = 'login-username-' + Date.now();
  const passwordId = 'login-password-' + Date.now();

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-form">
          <div className="loading">Verificando sesión...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h1>🏥 DISA - Sistema de Gestión</h1>
          <p>Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor={usernameId}>Usuario:</label>
            <input
              type="text"
              id={usernameId}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor={passwordId}>Contraseña:</label>
            <input
              type="password"
              id={passwordId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-login" disabled={isLoading}>
            🔐 {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <small>Contacte al administrador para obtener acceso</small>
          <div className="login-credentials">
            <strong>Credenciales de prueba:</strong><br />
            admin / admin123<br />
            disa / disa2024<br />
            usuario / usuario123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;