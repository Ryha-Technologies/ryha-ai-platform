# API Layer Design

**Comprehensive REST API Architecture for Ryha AI Platform**

---

## 10.1 API Architecture Overview

Ryha AI provides a **comprehensive REST API** that enables programmatic access to all platform capabilities while maintaining enterprise-grade security, scalability, and reliability.

### 🌐 API Stack

| Layer | Technology | Purpose | Scalability |
|-------|-----------|---------|-------------|
| **Gateway** | Cloud Endpoints / API Gateway | Rate limiting, authentication, routing | Auto-scaling |
| **Load Balancer** | Cloud Load Balancer | Traffic distribution, SSL termination | Multi-region |
| **API Service** | Node.js / Express | Business logic, validation | Horizontal scaling |
| **Cache** | Redis / Memcached | Response caching, session storage | Distributed |
| **Database** | Firestore / DynamoDB | Data persistence | Managed scaling |

### 🔗 API Design Principles

```yaml
Design Principles:
  - RESTful architecture with clear resource modeling
  - Consistent error handling and response formats
  - Comprehensive OpenAPI 3.0 documentation
  - Version management with backward compatibility
  - Rate limiting and quota management
  - Comprehensive audit logging
  - Security-first design with defense in depth
```

---

## 10.2 Base API Configuration

### 🚀 API Endpoints Structure

```
Production API:
  Base URL: https://api.ryha.ai/v1
  Regions: us-central1, europe-west1, asia-southeast1
  
Staging API:
  Base URL: https://api-staging.ryha.ai/v1
  Region: us-central1
  
Development API:
  Base URL: https://api-dev.ryha.ai/v1
  Region: us-central1
```

### 📋 API Versioning Strategy

```yaml
Versioning Strategy:
  Current Version: v1
  Version Format: /v{major}
  Deprecation Policy: 12 months notice
  Migration Support: Automated migration tools
  
Version Lifecycle:
  v1: Current stable (launched)
  v2: Development (Q2 2025)
  v0: Deprecated (sunset Q1 2025)
```

---

## 10.3 Authentication & Authorization

### 🔑 Authentication Methods

#### API Key Authentication
```http
GET /v1/jobs
Authorization: Bearer pk_live_abc123xyz789...
Content-Type: application/json
```

#### JWT Token Authentication
```http
POST /v1/jobs
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 🛡️ Authorization Scopes

| Scope | Permissions | Use Case |
|-------|-------------|-----------|
| `jobs:read` | Read job data and results | Dashboard, reporting |
| `jobs:write` | Create and modify jobs | Job submission |
| `findings:read` | Access vulnerability findings | Security analysis |
| `reports:read` | Download reports | Report access |
| `admin:read` | System administration (read) | Monitoring, audit |
| `admin:write` | System administration (write) | User management |

### 🔐 Token Management

```json
// JWT Token Structure
{
  "iss": "https://api.ryha.ai",
  "sub": "user_abc123",
  "aud": "ryha-api",
  "exp": 1672531200,
  "iat": 1672527600,
  "scopes": ["jobs:read", "jobs:write", "findings:read"],
  "user_id": "user_abc123",
  "company_id": "company_xyz789",
  "subscription_tier": "enterprise"
}
```

---

## 10.4 Job Management API

### 📝 Create Pentest Job

**Endpoint:** `POST /v1/jobs`

#### Request Structure
```json
{
  "job_config": {
    "test_mode": "white_box",
    "priority": "high",
    "testing_window": {
      "start": "2025-12-28T10:00:00Z",
      "end": "2025-12-28T18:00:00Z"
    },
    "notification_settings": {
      "email_on_completion": true,
      "webhook_url": "https://client.com/webhook",
      "slack_channel": "#security-alerts"
    }
  },
  
  "target_assets": {
    "urls": [
      "https://app.example.com",
      "https://api.example.com"
    ],
    "source_code": {
      "repository_url": "https://github.com/example/app",
      "branch": "main",
      "access_token": "github_pat_123..."
    },
    "api_documentation": [
      {
        "type": "openapi",
        "url": "https://api.example.com/docs/openapi.json"
      }
    ],
    "credentials": {
      "test_users": [
        {
          "username": "test_user_1", 
          "password": "SecurePass123!",
          "role": "user"
        },
        {
          "username": "admin_user",
          "password": "AdminPass456!",
          "role": "admin"
        }
      ],
      "api_keys": [
        {
          "name": "test_api_key",
          "value": "sk_test_123abc...",
          "scope": "read_only"
        }
      ]
    }
  },
  
  "test_scope": {
    "included_domains": ["*.example.com", "api.example.com"],
    "excluded_paths": ["/admin/debug", "/internal/*"],
    "max_depth": 5,
    "rate_limit": {
      "requests_per_second": 10,
      "concurrent_requests": 5
    }
  },
  
  "agent_configuration": {
    "enabled_teams": [
      "web_application_team", 
      "api_security_team",
      "static_analysis_team"
    ],
    "disabled_agents": ["InfraRecon"],
    "custom_agent_configs": {
      "VegaScan": {
        "max_scan_time": 1800,
        "scan_intensity": "thorough"
      }
    }
  },
  
  "compliance_requirements": {
    "standards": ["owasp_top10", "pci_dss"],
    "report_format": "enterprise",
    "executive_summary": true
  }
}
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "job_id": "job_20251228_001",
    "status": "queued",
    "estimated_completion": "2025-12-28T11:30:00Z",
    "websocket_url": "wss://api.ryha.ai/v1/jobs/job_20251228_001/status",
    "created_at": "2025-12-28T10:00:00Z"
  },
  "meta": {
    "request_id": "req_abc123",
    "version": "1.0.0"
  }
}
```

### 📊 Get Job Status

**Endpoint:** `GET /v1/jobs/{job_id}`

#### Response Structure
```json
{
  "success": true,
  "data": {
    "job_id": "job_20251228_001",
    "status": "running",
    "progress": {
      "percentage": 65,
      "current_phase": "vulnerability_scanning",
      "completed_phases": [
        "asset_discovery",
        "reconnaissance", 
        "initial_scanning"
      ],
      "remaining_phases": [
        "deep_analysis",
        "validation",
        "report_generation"
      ]
    },
    
    "live_metrics": {
      "findings_count": 8,
      "agents_active": 3,
      "agents_completed": 7,
      "current_activity": [
        {
          "agent": "VegaScan",
          "activity": "Scanning authentication endpoints",
          "progress": 45
        },
        {
          "agent": "StaticScan", 
          "activity": "Analyzing React components for XSS",
          "progress": 78
        }
      ]
    },
    
    "timing": {
      "started_at": "2025-12-28T10:05:00Z",
      "estimated_completion": "2025-12-28T11:30:00Z",
      "elapsed_seconds": 2400
    },
    
    "resource_usage": {
      "cpu_usage_percent": 45,
      "memory_usage_mb": 1024,
      "network_requests": 1247
    }
  }
}
```

### 📋 List Jobs

**Endpoint:** `GET /v1/jobs`

#### Query Parameters
```
GET /v1/jobs?
  status=completed&
  limit=50&
  offset=0&
  sort=-created_at&
  date_from=2025-12-01&
  date_to=2025-12-31&
  test_mode=white_box
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "job_id": "job_20251228_001",
        "status": "completed",
        "target_url": "https://app.example.com", 
        "findings_count": 12,
        "severity_breakdown": {
          "critical": 1,
          "high": 3,
          "medium": 5,
          "low": 3
        },
        "created_at": "2025-12-28T10:00:00Z",
        "completed_at": "2025-12-28T11:28:00Z",
        "duration_minutes": 88
      }
    ],
    "pagination": {
      "total": 143,
      "limit": 50, 
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

## 10.5 Findings API

### 🔍 Get Job Findings

**Endpoint:** `GET /v1/jobs/{job_id}/findings`

#### Query Parameters
```
GET /v1/jobs/{job_id}/findings?
  severity=high,critical&
  category=injection&
  status=open&
  limit=25&
  sort=-cvss_score
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "findings": [
      {
        "finding_id": "F001",
        "title": "SQL Injection in Login Endpoint",
        "severity": "critical",
        "confidence": "high",
        "cvss_score": 9.8,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        
        "location": {
          "url": "https://api.example.com/auth/login",
          "method": "POST", 
          "parameter": "username",
          "file_path": "src/auth/login.py",
          "line_number": 45
        },
        
        "classification": {
          "category": "injection",
          "cwe_id": "CWE-89",
          "owasp_category": "A03:2021 - Injection"
        },
        
        "technical_details": {
          "description": "The login endpoint is vulnerable to SQL injection through the username parameter.",
          "attack_vector": "Union-based SQL injection",
          "payload_example": "admin' UNION SELECT 1,2,user_password FROM users--",
          "evidence_url": "https://api.ryha.ai/v1/findings/F001/evidence"
        },
        
        "impact": {
          "business_impact": "Critical - Full database compromise possible",
          "affected_systems": ["User database", "Authentication system"],
          "data_at_risk": ["User credentials", "Personal information"]
        },
        
        "remediation": {
          "priority": "immediate", 
          "effort_estimate": "2-4 hours",
          "recommendations": [
            "Implement parameterized queries",
            "Add input validation",
            "Enable SQL query logging"
          ],
          "code_fix_example": "cursor.execute('SELECT * FROM users WHERE username = ?', (username,))"
        },
        
        "discovery": {
          "discovered_by": "VegaScan",
          "discovery_method": "parameter_fuzzing",
          "discovered_at": "2025-12-28T10:23:15Z"
        },
        
        "status": {
          "current_status": "open",
          "assigned_to": null,
          "created_at": "2025-12-28T10:23:15Z",
          "updated_at": "2025-12-28T10:23:15Z"
        }
      }
    ],
    
    "summary": {
      "total_findings": 12,
      "by_severity": {
        "critical": 1,
        "high": 3,
        "medium": 5,
        "low": 3
      },
      "by_status": {
        "open": 10,
        "in_progress": 2,
        "resolved": 0
      }
    }
  }
}
```

### 🎯 Get Single Finding

**Endpoint:** `GET /v1/findings/{finding_id}`

#### Response includes full technical details, evidence files, and remediation guidance

### 📎 Get Finding Evidence

**Endpoint:** `GET /v1/findings/{finding_id}/evidence`

#### Response Structure
```json
{
  "success": true,
  "data": {
    "evidence_files": [
      {
        "type": "screenshot",
        "filename": "sql_injection_proof.png",
        "url": "https://storage.ryha.ai/evidence/F001/screenshot.png",
        "size_bytes": 145230,
        "created_at": "2025-12-28T10:23:16Z"
      },
      {
        "type": "http_request",
        "filename": "malicious_request.txt",
        "content": "POST /auth/login HTTP/1.1\nHost: api.example.com\n...",
        "created_at": "2025-12-28T10:23:15Z"
      },
      {
        "type": "http_response", 
        "filename": "vulnerable_response.txt",
        "content": "HTTP/1.1 200 OK\nContent-Type: application/json\n...",
        "created_at": "2025-12-28T10:23:15Z"
      }
    ]
  }
}
```

---

## 10.6 Reports API

### 📊 Generate Report

**Endpoint:** `POST /v1/jobs/{job_id}/reports`

#### Request Structure
```json
{
  "report_config": {
    "format": "pdf",
    "template": "enterprise",
    "language": "english",
    "sections": [
      "executive_summary",
      "findings_details", 
      "remediation_guide",
      "appendix"
    ],
    "branding": {
      "company_logo": "https://client.com/logo.png",
      "company_name": "Example Corp",
      "report_title": "Security Assessment Report"
    },
    "customizations": {
      "exclude_info_findings": true,
      "group_by_severity": true,
      "include_cvss_details": true
    }
  }
}
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "report_id": "report_job_20251228_001",
    "status": "generating",
    "estimated_completion": "2025-12-28T12:05:00Z",
    "download_url": null,
    "preview_url": "https://api.ryha.ai/v1/reports/report_job_20251228_001/preview"
  }
}
```

### 📥 Download Report

**Endpoint:** `GET /v1/reports/{report_id}/download`

#### Query Parameters
```
GET /v1/reports/{report_id}/download?
  format=pdf&
  disposition=attachment
```

#### Response: Binary file download with proper headers

---

## 10.7 Real-time Updates API

### 🔗 WebSocket Connection

**Endpoint:** `wss://api.ryha.ai/v1/jobs/{job_id}/status`

#### Connection Authentication
```javascript
const socket = new WebSocket(
  'wss://api.ryha.ai/v1/jobs/job_20251228_001/status',
  ['Bearer', 'pk_live_abc123...']
);
```

#### Message Types
```json
// Status Update
{
  "type": "status_update",
  "timestamp": "2025-12-28T10:15:00Z",
  "data": {
    "job_id": "job_20251228_001",
    "status": "running", 
    "progress": 35,
    "current_phase": "vulnerability_scanning"
  }
}

// New Finding
{
  "type": "new_finding",
  "timestamp": "2025-12-28T10:23:15Z", 
  "data": {
    "finding_id": "F001",
    "severity": "critical",
    "title": "SQL Injection in Login Endpoint",
    "quick_summary": "Critical SQL injection vulnerability discovered"
  }
}

// Agent Activity
{
  "type": "agent_activity",
  "timestamp": "2025-12-28T10:30:00Z",
  "data": {
    "agent": "VegaScan",
    "activity": "Starting API endpoint enumeration",
    "status": "started"
  }
}

// Completion
{
  "type": "job_completed",
  "timestamp": "2025-12-28T11:28:00Z",
  "data": {
    "job_id": "job_20251228_001", 
    "total_findings": 12,
    "duration_minutes": 88,
    "report_available": true
  }
}
```

---

## 10.8 User & Account Management API

### 👤 User Profile

**Endpoint:** `GET /v1/user/profile`

#### Response Structure
```json
{
  "success": true,
  "data": {
    "user_id": "user_abc123",
    "email": "security@example.com",
    "company": {
      "company_id": "company_xyz789",
      "name": "Example Corp",
      "subscription_tier": "enterprise"
    },
    "preferences": {
      "timezone": "UTC",
      "email_notifications": true,
      "webhook_notifications": false
    },
    "api_access": {
      "scopes": ["jobs:read", "jobs:write", "findings:read"],
      "rate_limits": {
        "requests_per_hour": 1000,
        "concurrent_jobs": 5
      }
    }
  }
}
```

### 🔑 API Key Management

**Endpoint:** `POST /v1/user/api-keys`

#### Request Structure
```json
{
  "name": "Production API Key",
  "scopes": ["jobs:read", "jobs:write", "findings:read"],
  "expires_at": "2026-12-28T00:00:00Z"
}
```

---

## 10.9 Webhooks API

### 🔔 Configure Webhooks

**Endpoint:** `POST /v1/webhooks`

#### Request Structure  
```json
{
  "url": "https://example.com/webhooks/ryha",
  "events": [
    "job.completed",
    "finding.critical_discovered",
    "report.generated"
  ],
  "secret": "webhook_secret_abc123",
  "active": true,
  "retry_config": {
    "max_retries": 3,
    "retry_delay_seconds": 60
  }
}
```

#### Webhook Payload Example
```json
{
  "event": "job.completed",
  "timestamp": "2025-12-28T11:28:00Z",
  "job_id": "job_20251228_001",
  "data": {
    "status": "completed",
    "findings_count": 12,
    "severity_breakdown": {
      "critical": 1,
      "high": 3,
      "medium": 5, 
      "low": 3
    },
    "report_url": "https://api.ryha.ai/v1/reports/report_job_20251228_001/download",
    "duration_minutes": 88
  },
  "signature": "sha256=abc123..."
}
```

---

## 10.10 Rate Limiting & Quotas

### ⚡ Rate Limit Structure

| Endpoint Type | Free Tier | Professional | Enterprise |
|---------------|-----------|--------------|------------|
| **Job Creation** | 10/day | 100/day | Unlimited |
| **API Calls** | 1,000/hour | 10,000/hour | 100,000/hour |
| **Concurrent Jobs** | 1 | 3 | 10 |
| **Webhook Calls** | 100/day | 1,000/day | 10,000/day |
| **Report Downloads** | 50/day | 500/day | Unlimited |

### 📊 Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1672531200
X-RateLimit-Window: 3600
Retry-After: 300
```

### 🚫 Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 1000,
      "window_seconds": 3600,
      "reset_at": "2025-12-28T12:00:00Z",
      "retry_after_seconds": 300
    }
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

---

## 10.11 Error Handling

### ❌ Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field_errors": [
        {
          "field": "target_assets.urls",
          "message": "At least one URL is required",
          "code": "REQUIRED_FIELD"
        },
        {
          "field": "test_scope.included_domains[0]",
          "message": "Invalid domain format",
          "code": "INVALID_FORMAT"
        }
      ]
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-12-28T10:00:00Z"
  }
}
```

### 📋 Common Error Codes

| HTTP Status | Error Code | Description | Action Required |
|-------------|------------|-------------|-----------------|
| `400` | `VALIDATION_ERROR` | Request validation failed | Fix request parameters |
| `401` | `AUTHENTICATION_FAILED` | Invalid or missing credentials | Provide valid API key |
| `403` | `INSUFFICIENT_PERMISSIONS` | Missing required scopes | Request additional permissions |
| `404` | `RESOURCE_NOT_FOUND` | Job/finding not found | Verify resource ID |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `500` | `INTERNAL_SERVER_ERROR` | Server error | Retry later |
| `503` | `SERVICE_UNAVAILABLE` | System maintenance | Check status page |

---

## 10.12 API Security Features

### 🔒 Security Measures

```yaml
Security Features:
  Authentication: API Keys + JWT tokens
  Authorization: Scope-based permissions
  Rate Limiting: Per-user and per-endpoint
  Input Validation: Comprehensive request validation
  Output Sanitization: Response data sanitization 
  Audit Logging: Complete request/response logging
  IP Allowlisting: Optional IP restrictions
  CORS: Configurable cross-origin policies
  HTTPS Only: TLS 1.3 enforced
  Request Signing: Optional webhook signatures
```

### 🛡️ Security Headers

```http
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff  
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
X-Request-ID: req_abc123
X-API-Version: 1.0.0
```

---

## 10.13 API Documentation

### 📚 OpenAPI Specification

**Endpoint:** `GET /v1/openapi.json`

Full OpenAPI 3.0 specification including:
- Complete endpoint documentation
- Request/response schemas
- Authentication requirements  
- Rate limiting information
- Error response formats
- Code examples in multiple languages

### 🔧 Interactive Documentation

**URL:** `https://docs.api.ryha.ai`

Features:
- Interactive API explorer
- Live request testing
- Code generation
- Authentication testing
- Response examples
- SDK downloads

---

## Next Steps

1. **Explore** [Web Application Team](../agents/11-web-application-team.md)
2. **Review** [Security & Safety](../security/14-security-safety.md)
3. **Check** [Monitoring & Operations](../operations/20-monitoring-alerting.md)

---

[← Back to Database Schema](./09-database-schema.md) | [Next: Web Application Team →](../agents/11-web-application-team.md)