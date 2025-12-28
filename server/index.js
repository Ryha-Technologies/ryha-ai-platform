const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ryha-ai-secret-key-2026';

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    team TEXT,
    email TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    status TEXT DEFAULT 'not-started',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Agents table
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    status TEXT DEFAULT 'planning',
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Initialize default users
  const users = [
    { username: 'velluraju', password: 'velluraju', role: 'CEO & CTO', team: 'Leadership', email: 'velluraju@ryha-ai.com' },
    { username: 'alexchen', password: 'alexchen', role: 'Senior Full-Stack Engineer', team: 'Web App Security', email: 'alex@ryha-ai.com' },
    { username: 'sarahrodriguez', password: 'sarahrodriguez', role: 'Security Specialist', team: 'Web App Security', email: 'sarah@ryha-ai.com' },
    { username: 'mikethompson', password: 'mikethompson', role: 'Backend Engineer', team: 'Web App Security', email: 'mike@ryha-ai.com' },
    { username: 'lisawang', password: 'lisawang', role: 'Frontend Developer', team: 'Web App Security', email: 'lisa@ryha-ai.com' },
    { username: 'davidkumar', password: 'davidkumar', role: 'API Security Lead', team: 'API Security', email: 'david@ryha-ai.com' },
    { username: 'emmafoster', password: 'emmafoster', role: 'Security Engineer', team: 'API Security', email: 'emma@ryha-ai.com' },
    { username: 'jameswilson', password: 'jameswilson', role: 'Backend Developer', team: 'API Security', email: 'james@ryha-ai.com' },
    { username: 'rachelgreen', password: 'rachelgreen', role: 'Static Analysis Lead', team: 'Static Analysis', email: 'rachel@ryha-ai.com' },
    { username: 'tomanderson', password: 'tomanderson', role: 'Security Researcher', team: 'Static Analysis', email: 'tom@ryha-ai.com' },
    { username: 'annakowalski', password: 'annakowalski', role: 'DevSecOps Engineer', team: 'Static Analysis', email: 'anna@ryha-ai.com' },
    { username: 'chrismartinez', password: 'chrismartinez', role: 'Infrastructure Lead', team: 'Infrastructure', email: 'chris@ryha-ai.com' },
    { username: 'sophieturner', password: 'sophieturner', role: 'Cloud Security Engineer', team: 'Infrastructure', email: 'sophie@ryha-ai.com' },
    { username: 'ryanoconnor', password: 'ryanoconnor', role: 'DevOps Engineer', team: 'Infrastructure', email: 'ryan@ryha-ai.com' },
    { username: 'mariasantos', password: 'mariasantos', role: 'Site Reliability Engineer', team: 'Infrastructure', email: 'maria@ryha-ai.com' },
    { username: 'kevinpark', password: 'kevinpark', role: 'Data Engineer', team: 'Reporting', email: 'kevin@ryha-ai.com' },
    { username: 'jenniferliu', password: 'jenniferliu', role: 'Frontend Developer', team: 'Reporting', email: 'jennifer@ryha-ai.com' }
  ];

  // Check if users exist, if not, create them
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      users.forEach(user => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        db.run(`INSERT INTO users (username, password, role, team, email) VALUES (?, ?, ?, ?, ?)`,
          [user.username, hashedPassword, user.role, user.team, user.email]);
      });
    }
  });

  // Initialize default agents
  const agents = [
    { name: 'SQL Injection Hunter', category: 'Web Security', description: 'Detect SQL injection vulnerabilities', assignee: 'alexchen', status: 'development', progress: 25 },
    { name: 'XSS Guardian', category: 'Web Security', description: 'Cross-site scripting detection', assignee: 'alexchen', status: 'development', progress: 20 },
    { name: 'CSRF Defender', category: 'Web Security', description: 'Cross-site request forgery testing', assignee: 'sarahrodriguez', status: 'planning', progress: 0 },
    { name: 'Auth Bypass Detector', category: 'Web Security', description: 'Authentication bypass testing', assignee: 'sarahrodriguez', status: 'planning', progress: 0 },
    { name: 'REST API Tester', category: 'API Security', description: 'RESTful API security testing', assignee: 'davidkumar', status: 'planning', progress: 0 },
    { name: 'SAST Scanner', category: 'Static Analysis', description: 'Static application security testing', assignee: 'rachelgreen', status: 'development', progress: 10 },
    { name: 'Network Scanner', category: 'Infrastructure', description: 'Network security assessment', assignee: 'chrismartinez', status: 'planning', progress: 0 },
    { name: 'Report Generator', category: 'Reporting', description: 'Automated report generation', assignee: 'kevinpark', status: 'planning', progress: 0 }
  ];

  db.get("SELECT COUNT(*) as count FROM agents", (err, row) => {
    if (row.count === 0) {
      agents.forEach(agent => {
        db.run(`INSERT INTO agents (name, category, description, assignee, status, progress) VALUES (?, ?, ?, ?, ?, ?)`,
          [agent.name, agent.category, agent.description, agent.assignee, agent.status, agent.progress]);
      });
    }
  });
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
} else {
  // Development mode - serve a simple HTML page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>🚀 Ryha AI Dashboard</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              text-align: center; 
              padding: 50px; 
              margin: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1); 
              padding: 40px; 
              border-radius: 15px; 
            }
            .login-form { 
              background: white; 
              color: #333; 
              padding: 30px; 
              border-radius: 10px; 
              margin-top: 30px; 
            }
            input { 
              width: 100%; 
              padding: 12px; 
              margin: 10px 0; 
              border: 1px solid #ddd; 
              border-radius: 5px; 
              box-sizing: border-box;
            }
            button { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              border: none; 
              padding: 15px 30px; 
              border-radius: 5px; 
              cursor: pointer; 
              font-size: 16px; 
              width: 100%;
            }
            button:hover { 
              opacity: 0.9; 
            }
            .credentials { 
              font-size: 12px; 
              margin-top: 15px; 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 5px; 
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Ryha AI Dashboard</h1>
            <p>Cloud Cybersecurity Multi-Agent Pentest Platform</p>
            <p>Project Management Dashboard</p>
            
            <div class="login-form">
              <h3>Login to Dashboard</h3>
              <form id="loginForm">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">🔐 Sign In</button>
              </form>
              
              <div class="credentials">
                <strong>Demo Credentials:</strong><br>
                • CEO/CTO: <code>velluraju</code> / <code>velluraju</code><br>
                • Engineers: <code>alexchen</code> / <code>alexchen</code><br>
                • All team members: username/username
              </div>
            </div>
          </div>
          
          <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;
              
              try {
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  window.location.href = '/dashboard';
                } else {
                  const error = await response.json();
                  alert('Login failed: ' + error.error);
                }
              } catch (error) {
                alert('Login error: ' + error.message);
              }
            });
          </script>
        </body>
      </html>
    `);
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(`SELECT * FROM users WHERE username = ? AND status = 'active'`, [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, team: user.team },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        team: user.team,
        email: user.email
      }
    });
  });
});

// Dashboard data routes
app.get('/api/dashboard/overview', authenticateToken, (req, res) => {
  const queries = {
    totalUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
    totalAgents: "SELECT COUNT(*) as count FROM agents",
    completedAgents: "SELECT COUNT(*) as count FROM agents WHERE status = 'completed'",
    inProgressTasks: "SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'"
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, row) => {
      if (err) {
        results[key] = 0;
      } else {
        results[key] = row.count;
      }
      
      completed++;
      if (completed === total) {
        // Calculate overall progress
        const overallProgress = results.totalAgents > 0 ? 
          Math.round((results.completedAgents / results.totalAgents) * 100) : 0;
        
        res.json({
          ...results,
          overallProgress,
          projectStatus: 'Active',
          timeline: '4-Month Aggressive Timeline',
          budget: {
            total: 2500000,
            used: 540000,
            remaining: 1960000
          }
        });
      }
    });
  });
});

// Users routes
app.get('/api/users', authenticateToken, (req, res) => {
  db.all(`SELECT id, username, role, team, email, status, created_at FROM users ORDER BY role, username`, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Agents routes
app.get('/api/agents', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM agents ORDER BY category, name`, (err, agents) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(agents);
  });
});

app.put('/api/agents/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, progress } = req.body;
  
  db.run(`UPDATE agents SET status = ?, progress = ? WHERE id = ?`, 
    [status, progress, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Agent updated successfully' });
  });
});

// Tasks routes
app.get('/api/tasks', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM tasks ORDER BY priority DESC, due_date ASC`, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(tasks);
  });
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, assignee, priority, due_date } = req.body;
  
  db.run(`INSERT INTO tasks (title, description, assignee, priority, due_date) VALUES (?, ?, ?, ?, ?)`,
    [title, description, assignee, priority, due_date], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ id: this.lastID, message: 'Task created successfully' });
  });
});

// Dashboard route
app.get('/dashboard', authenticateToken, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>🚀 Ryha AI Dashboard</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
          }
          .header { 
            background: white; 
            padding: 15px 30px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .title { display: flex; align-items: center; gap: 10px; }
          .title h1 { color: #333; font-size: 24px; }
          .user-info { display: flex; align-items: center; gap: 15px; }
          .logout-btn { 
            background: #e74c3c; 
            color: white; 
            border: none; 
            padding: 8px 15px; 
            border-radius: 5px; 
            cursor: pointer; 
          }
          .content { padding: 30px; }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .stat-card { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            text-align: center; 
          }
          .stat-icon { font-size: 40px; margin-bottom: 10px; }
          .stat-number { 
            font-size: 32px; 
            font-weight: bold; 
            margin: 10px 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .stat-label { color: #666; font-size: 14px; }
          .sections { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
          }
          .section-card { 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden; 
          }
          .section-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px 20px; 
            font-size: 18px; 
            font-weight: bold; 
          }
          .section-content { padding: 20px; }
          .loading { text-align: center; padding: 20px; color: #666; }
          .welcome-message {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
          }
          .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          .feature-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">
            <span>🚀</span>
            <h1>Ryha AI - Project Dashboard</h1>
          </div>
          <div class="user-info">
            <div>
              <div style="font-weight: bold;">Welcome, <span id="username"></span></div>
              <div style="font-size: 12px; color: #666;"><span id="userRole"></span></div>
            </div>
            <button class="logout-btn" onclick="logout()">Logout</button>
          </div>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <h2>🎉 Welcome to Ryha AI Project Dashboard!</h2>
            <p>Cloud Cybersecurity Multi-Agent Pentest Platform</p>
            <p><strong>4-Month Aggressive Development Timeline</strong></p>
            
            <div class="feature-list">
              <div class="feature-item">
                <div>👥</div>
                <div>16 Engineers</div>
              </div>
              <div class="feature-item">
                <div>🤖</div>
                <div>25 AI Agents</div>
              </div>
              <div class="feature-item">
                <div>💰</div>
                <div>$2.5M Budget</div>
              </div>
              <div class="feature-item">
                <div>📈</div>
                <div>Live Tracking</div>
              </div>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-number" id="totalUsers">16</div>
              <div class="stat-label">Team Members</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🤖</div>
              <div class="stat-number" id="totalAgents">25</div>
              <div class="stat-label">AI Agents</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-number" id="completedAgents">3</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-number" id="overallProgress">12%</div>
              <div class="stat-label">Overall Progress</div>
            </div>
          </div>
          
          <div class="sections">
            <div class="section-card">
              <div class="section-header">👥 Team Overview</div>
              <div class="section-content">
                <div class="loading">Loading team data...</div>
                <div id="teamData"></div>
              </div>
            </div>
            
            <div class="section-card">
              <div class="section-header">🤖 AI Agents Progress</div>
              <div class="section-content">
                <div class="loading">Loading agents data...</div>
                <div id="agentsData"></div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Load user data
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          document.getElementById('username').textContent = user.username || 'User';
          document.getElementById('userRole').textContent = (user.role || 'Team Member') + ' • ' + (user.team || 'General');
          
          // Load dashboard data
          async function loadDashboardData() {
            const token = localStorage.getItem('token');
            if (!token) {
              window.location.href = '/';
              return;
            }
            
            try {
              // Load overview data
              const overviewResponse = await fetch('/api/dashboard/overview', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (overviewResponse.ok) {
                const overview = await overviewResponse.json();
                document.getElementById('totalUsers').textContent = overview.totalUsers;
                document.getElementById('totalAgents').textContent = overview.totalAgents;
                document.getElementById('completedAgents').textContent = overview.completedAgents;
                document.getElementById('overallProgress').textContent = overview.overallProgress + '%';
              }
              
              // Load team data
              const usersResponse = await fetch('/api/users', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (usersResponse.ok) {
                const users = await usersResponse.json();
                const teamHtml = users.slice(0, 5).map(user => 
                  '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">' +
                  '<div><strong>' + user.username + '</strong><br><small>' + user.role + '</small></div>' +
                  '<div><span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 12px; font-size: 11px;">ACTIVE</span></div>' +
                  '</div>'
                ).join('');
                document.getElementById('teamData').innerHTML = teamHtml + 
                  (users.length > 5 ? '<div style="text-align: center; margin-top: 15px; color: #666;">+' + (users.length - 5) + ' more members</div>' : '');
                document.querySelector('#teamData').previousElementSibling.style.display = 'none';
              }
              
              // Load agents data
              const agentsResponse = await fetch('/api/agents', {
                headers: { 'Authorization': 'Bearer ' + token }
              });
              if (agentsResponse.ok) {
                const agents = await agentsResponse.json();
                const agentsHtml = agents.slice(0, 5).map(agent => 
                  '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">' +
                  '<div><strong>' + agent.name + '</strong><br><small>' + agent.category + ' • ' + agent.assignee + '</small></div>' +
                  '<div style="text-align: right;"><strong style="color: #667eea;">' + agent.progress + '%</strong><br>' +
                  '<span style="background: ' + (agent.status === 'development' ? '#fff3cd' : '#d1ecf1') + '; color: ' + (agent.status === 'development' ? '#856404' : '#0c5460') + '; padding: 3px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">' + agent.status + '</span>' +
                  '</div></div>'
                ).join('');
                document.getElementById('agentsData').innerHTML = agentsHtml + 
                  (agents.length > 5 ? '<div style="text-align: center; margin-top: 15px; color: #666;">+' + (agents.length - 5) + ' more agents</div>' : '');
                document.querySelector('#agentsData').previousElementSibling.style.display = 'none';
              }
              
            } catch (error) {
              console.error('Error loading dashboard data:', error);
            }
          }
          
          function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }
          
          // Load data on page load
          loadDashboardData();
          
          // Refresh data every 30 seconds
          setInterval(loadDashboardData, 30000);
        </script>
      </body>
    </html>
  `);
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Ryha AI Dashboard Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔐 Login: velluraju/velluraju (CEO & CTO)`);
});

module.exports = app;