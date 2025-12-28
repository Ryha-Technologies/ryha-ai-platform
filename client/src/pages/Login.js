import React, { useState } from 'react';
import { apiService } from '../services/api';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.login(credentials.username, credentials.password);
      onLogin(response.token, response.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-header">
          <h1>🚀 Ryha AI Dashboard</h1>
          <p className="login-subtitle">Cloud Cybersecurity Multi-Agent Pentest Platform</p>
          <p className="login-subtitle">Sign in to access your project management dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '🔄 Signing In...' : '🔐 Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p><strong>Demo Credentials:</strong></p>
          <p>CEO/CTO: <code>velluraju</code> / <code>velluraju</code></p>
          <p>Engineers: <code>alexchen</code> / <code>alexchen</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;