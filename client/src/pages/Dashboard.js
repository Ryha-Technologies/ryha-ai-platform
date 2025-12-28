import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const Dashboard = ({ user, onLogout }) => {
  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, agentsData, usersData] = await Promise.all([
        apiService.getDashboardOverview(),
        apiService.getAgents(),
        apiService.getUsers()
      ]);
      
      setOverview(overviewData);
      setAgents(agentsData);
      setUsers(usersData);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#28a745',
      'development': '#ffc107',
      'planning': '#17a2b8',
      'completed': '#28a745',
      'on-hold': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <span>🚀</span>
          <h1>Ryha AI - Project Dashboard</h1>
        </div>
        <div className="user-info">
          <div className="user-details">
            <div className="name">Welcome, {user.username}</div>
            <div className="role">{user.role} • {user.team}</div>
          </div>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{overview?.totalUsers || 0}</div>
            <div className="stat-label">Team Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🤖</div>
            <div className="stat-number">{overview?.totalAgents || 0}</div>
            <div className="stat-label">AI Agents</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{overview?.completedAgents || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-number">{overview?.overallProgress || 0}%</div>
            <div className="stat-label">Overall Progress</div>
          </div>
        </div>

        {/* Budget Overview */}
        {overview?.budget && (
          <div className="section-card" style={{ marginBottom: '30px' }}>
            <div className="section-header">💰 Budget Overview</div>
            <div className="section-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <div className="stat-label">Total Budget</div>
                  <div className="stat-number" style={{ fontSize: '24px' }}>
                    {formatBudget(overview.budget.total)}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Used</div>
                  <div className="stat-number" style={{ fontSize: '24px', color: '#e74c3c' }}>
                    {formatBudget(overview.budget.used)}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Remaining</div>
                  <div className="stat-number" style={{ fontSize: '24px', color: '#28a745' }}>
                    {formatBudget(overview.budget.remaining)}
                  </div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: '15px' }}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${(overview.budget.used / overview.budget.total) * 100}%` }}
                ></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                {((overview.budget.used / overview.budget.total) * 100).toFixed(1)}% of budget used
              </div>
            </div>
          </div>
        )}

        {/* Main Sections */}
        <div className="dashboard-sections">
          {/* Team Overview */}
          <div className="section-card">
            <div className="section-header">👥 Team Members ({users.length})</div>
            <div className="section-content">
              {users.slice(0, 8).map((member, index) => (
                <div key={index} className="team-member">
                  <div className="member-info">
                    <div className="member-name">{member.username}</div>
                    <div className="member-role">{member.role} • {member.team}</div>
                  </div>
                  <div className={`status-badge status-${member.status}`}>
                    {member.status}
                  </div>
                </div>
              ))}
              {users.length > 8 && (
                <div style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
                  +{users.length - 8} more team members
                </div>
              )}
            </div>
          </div>

          {/* Agents Progress */}
          <div className="section-card">
            <div className="section-header">🤖 AI Agents Progress ({agents.length})</div>
            <div className="section-content">
              {agents.slice(0, 8).map((agent, index) => (
                <div key={index} className="agent-item">
                  <div className="agent-info">
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-assignee">
                      {agent.category} • {agent.assignee}
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${agent.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="agent-progress">
                    <div className="progress-percentage">{agent.progress}%</div>
                    <div className={`status-badge status-${agent.status}`}>
                      {agent.status}
                    </div>
                  </div>
                </div>
              ))}
              {agents.length > 8 && (
                <div style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
                  +{agents.length - 8} more agents
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Timeline */}
        <div className="section-card" style={{ marginTop: '30px' }}>
          <div className="section-header">📅 4-Month Aggressive Timeline</div>
          <div className="section-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div className="timeline-phase">
                <h4 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Month 1: Foundation</h4>
                <p>Core infrastructure & first 5 agents</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
                <small>75% Complete</small>
              </div>
              <div className="timeline-phase">
                <h4 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Month 2: MVP</h4>
                <p>Complete 2-month MVP with 15 agents</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '45%' }}></div>
                </div>
                <small>45% Complete</small>
              </div>
              <div className="timeline-phase">
                <h4 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Month 3: Enhancement</h4>
                <p>Complete all 25 agents + features</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '15%' }}></div>
                </div>
                <small>15% Complete</small>
              </div>
              <div className="timeline-phase">
                <h4 style={{ color: '#667eea', margin: '0 0 10px 0' }}>Month 4: Launch</h4>
                <p>Production ready + global launch</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '5%' }}></div>
                </div>
                <small>5% Complete</small>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-card" style={{ marginTop: '30px' }}>
          <div className="section-header">⚡ Quick Actions</div>
          <div className="section-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <button className="action-button" style={{ background: '#28a745', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}>
                📊 View Full Reports
              </button>
              <button className="action-button" style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}>
                👨‍💻 Assign New Task
              </button>
              <button className="action-button" style={{ background: '#ffc107', color: 'black', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}>
                🔄 Update Progress
              </button>
              <button className="action-button" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}>
                🚨 View Blockers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;