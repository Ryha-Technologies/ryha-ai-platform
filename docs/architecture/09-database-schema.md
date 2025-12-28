# Database Schema Design

**Comprehensive Data Architecture for Ryha AI Platform**

---

## 9.1 Database Architecture Overview

Ryha AI uses a **multi-database strategy** optimized for different data types, access patterns, and performance requirements.

### 🗄️ Database Stack

| Database | Use Case | Technology | Retention |
|----------|----------|------------|-----------|
| **Primary DB** | Real-time operational data | Firestore (GCP) / DynamoDB (AWS) | 30 days active |
| **Long-term Storage** | Reports, evidence, archives | Cloud Storage / S3 / Blob Storage | 1-7 years |
| **Analytics DB** | Metrics, trends, business intelligence | BigQuery / Redshift / Synapse | 2 years |
| **Cache Layer** | Session data, temporary results | Redis / Memcached | 24 hours |

### 🔄 Data Flow Architecture

```
API Gateway → Primary DB (Hot Data)
     ↓
Scheduled Export → Long-term Storage (Cold Data)  
     ↓
ETL Pipeline → Analytics DB (Aggregated Data)
```

---

## 9.2 Primary Database Schema (Firestore)

### 📊 Collections Structure

```
ryha-ai-production/
├── jobs/                    # Pentest job metadata
├── findings/               # Vulnerability findings  
├── reports/               # Report metadata & links
├── logs/                  # Structured application logs
├── users/                 # User accounts & settings
├── continuous_scans/      # Continuous monitoring data
├── agent_performance/     # Agent execution metrics
├── tool_metrics/          # Tool performance data
└── audit_trail/           # Compliance & security logs
```

---

## 9.3 Jobs Collection Schema

### 📝 Document Structure: `jobs/{job_id}`

```json
{
  "job_id": "job_20251228_001",
  "created_at": "2025-12-28T10:30:00Z",
  "updated_at": "2025-12-28T10:45:30Z",
  "status": "completed",
  
  // Client information
  "client": {
    "company_name": "TechCorp Inc",
    "contact_email": "security@techcorp.com",
    "user_id": "user_abc123"
  },
  
  // Test configuration
  "test_config": {
    "test_mode": "white_box",
    "scope": ["*.techcorp.com", "api.techcorp.com"],
    "excluded_scope": ["dev.techcorp.com"],
    "testing_window": {
      "start": "2025-12-28T10:30:00Z",
      "end": "2025-12-28T18:00:00Z"
    }
  },
  
  // Input assets
  "assets": {
    "urls": ["https://app.techcorp.com", "https://api.techcorp.com"],
    "source_code_repo": "https://github.com/techcorp/main-app",
    "api_documentation": "https://docs.techcorp.com/api",
    "credentials_provided": true,
    "architecture_docs": ["system-diagram.pdf"]
  },
  
  // Execution metadata
  "execution": {
    "started_at": "2025-12-28T10:30:05Z",
    "completed_at": "2025-12-28T10:44:30Z", 
    "total_duration_seconds": 865,
    "agents_used": [
      "NovaRecon", "VegaScan", "StaticScan", 
      "SecretHunter", "TokenGuardian"
    ],
    "tools_executed": [
      "subfinder", "nuclei", "semgrep", 
      "trufflehog", "testssl.sh"
    ]
  },
  
  // Results summary
  "results_summary": {
    "total_findings": 12,
    "severity_breakdown": {
      "critical": 1,
      "high": 3,
      "medium": 5,
      "low": 2,
      "info": 1
    },
    "coverage_metrics": {
      "urls_tested": 15,
      "api_endpoints_found": 47,
      "lines_of_code_analyzed": 125000,
      "dependencies_checked": 234
    }
  },
  
  // Compliance & audit
  "compliance": {
    "authorization_verified": true,
    "scope_validated": true,
    "safety_compliance": "full",
    "audit_trail_complete": true
  }
}
```

### 🔍 Indexes for Jobs Collection

```javascript
// Firestore indexes for efficient queries
db.collection("jobs").createIndex(
  { "client.user_id": 1, "created_at": -1 }
);

db.collection("jobs").createIndex(
  { "status": 1, "created_at": -1 }
);

db.collection("jobs").createIndex(
  { "test_config.test_mode": 1, "results_summary.total_findings": -1 }
);
```

---

## 9.4 Findings Collection Schema

### 🔍 Document Structure: `findings/{job_id}_{finding_id}`

```json
{
  "finding_id": "F001",
  "job_id": "job_20251228_001",
  "created_at": "2025-12-28T10:35:20Z",
  
  // Finding classification
  "classification": {
    "title": "Missing Content Security Policy Header",
    "severity": "medium",
    "confidence": "high",
    "category": "security_misconfiguration",
    "cwe_id": "CWE-693",
    "cvss_score": 5.3,
    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N"
  },
  
  // Location information
  "location": {
    "url": "https://app.techcorp.com/dashboard",
    "endpoint": "/dashboard",
    "method": "GET",
    "file_path": null,
    "line_number": null,
    "parameter": null
  },
  
  // Technical details
  "technical_details": {
    "description": "The application does not implement Content Security Policy headers, allowing potential XSS attacks from any domain.",
    "evidence": {
      "request_headers": {
        "Host": "app.techcorp.com",
        "User-Agent": "Ryha-AI/1.0"
      },
      "response_headers": {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache"
        // Note: No CSP header present
      },
      "response_snippet": "<html><head><title>Dashboard</title>..."
    },
    "attack_vector": "External script injection via reflected XSS",
    "impact": "Medium - Potential for session hijacking and data theft"
  },
  
  // Remediation guidance
  "remediation": {
    "recommendation": "Implement a strict Content Security Policy header",
    "fix_complexity": "low",
    "estimated_effort_hours": 2,
    "implementation_steps": [
      "Add CSP header to web server configuration",
      "Define allowed script sources",
      "Test CSP policy with report-only mode",
      "Deploy to production with enforcement"
    ],
    "code_example": "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'"
  },
  
  // Discovery metadata
  "discovery": {
    "discovered_by_agent": "VegaScan",
    "discovery_method": "nuclei_template",
    "tool_used": "nuclei",
    "template_id": "missing-csp-header",
    "confidence_score": 0.95
  },
  
  // Validation & quality assurance
  "validation": {
    "validated": true,
    "validated_by": "FindingsValidator",
    "false_positive_probability": 0.05,
    "similar_findings_merged": 0,
    "peer_review_status": "approved"
  },
  
  // Status tracking
  "status": {
    "current_status": "open",
    "assigned_to": null,
    "due_date": null,
    "resolution_notes": null,
    "retest_required": true
  }
}
```

### 🏷️ Finding Status Workflow

```yaml
Finding Lifecycle:
  discovered → validated → assigned → in_progress → resolved → verified → closed
  
Status Definitions:
  discovered: Initial finding by agent
  validated: Confirmed by FindingsValidator  
  assigned: Assigned to development team
  in_progress: Being actively worked on
  resolved: Fix implemented
  verified: Fix confirmed by retest
  closed: Finding completed and documented
```

---

## 9.5 Reports Collection Schema

### 📋 Document Structure: `reports/{job_id}`

```json
{
  "job_id": "job_20251228_001",
  "created_at": "2025-12-28T10:44:45Z",
  "report_version": "1.0.0",
  
  // Report metadata
  "metadata": {
    "report_type": "comprehensive_pentest",
    "format_version": "2024.1",
    "template_version": "enterprise_v3",
    "language": "english",
    "timezone": "UTC"
  },
  
  // File locations
  "files": {
    "pdf": {
      "url": "gs://ryha-reports/job_20251228_001/report.pdf",
      "size_bytes": 2547890,
      "sha256": "a1b2c3d4...",
      "expires_at": "2026-12-28T10:44:45Z"
    },
    "html": {
      "url": "gs://ryha-reports/job_20251228_001/report.html", 
      "size_bytes": 1234567,
      "sha256": "e5f6g7h8...",
      "expires_at": "2026-12-28T10:44:45Z"
    },
    "json": {
      "url": "gs://ryha-reports/job_20251228_001/report.json",
      "size_bytes": 456789,
      "sha256": "i9j0k1l2...",
      "expires_at": "2026-12-28T10:44:45Z"
    }
  },
  
  // Executive summary
  "executive_summary": {
    "overall_risk_level": "medium",
    "key_findings_count": 3,
    "critical_issues": [
      "Weak JWT signing algorithm allows token forgery",
      "Admin endpoint accessible without authentication"
    ],
    "business_impact": "Medium risk to customer data and system integrity",
    "recommended_actions": [
      "Implement stronger JWT algorithms",
      "Secure admin endpoints with proper authentication"
    ],
    "compliance_status": {
      "owasp_top10": "8/10 compliant",
      "pci_dss": "requires_attention", 
      "gdpr": "compliant"
    }
  },
  
  // Detailed statistics
  "statistics": {
    "total_findings": 12,
    "findings_by_severity": {
      "critical": 1,
      "high": 3, 
      "medium": 5,
      "low": 2,
      "info": 1
    },
    "findings_by_category": {
      "injection": 2,
      "authentication": 3,
      "security_misconfiguration": 4,
      "sensitive_data_exposure": 2,
      "access_control": 1
    },
    "coverage_metrics": {
      "endpoints_tested": 47,
      "parameters_tested": 156,
      "files_analyzed": 342,
      "dependencies_checked": 234
    }
  },
  
  // Generation metadata
  "generation": {
    "generated_by": "ReportCommander",
    "generation_time_seconds": 23,
    "template_customizations": [
      "executive_summary_enhanced",
      "technical_details_expanded"
    ],
    "quality_score": 0.94
  }
}
```

---

## 9.6 Logs Collection Schema

### 📝 Document Structure: `logs/{timestamp}_{log_id}`

```json
{
  "log_id": "log_001234",
  "timestamp": "2025-12-28T10:32:15.234Z",
  "job_id": "job_20251228_001",
  
  // Log classification
  "level": "INFO",
  "category": "agent_execution",
  "source": {
    "agent": "NovaRecon", 
    "component": "subdomain_discovery",
    "function": "execute_subfinder",
    "version": "1.2.3"
  },
  
  // Log content
  "message": "Subfinder discovered 23 subdomains for techcorp.com",
  "details": {
    "tool": "subfinder",
    "target": "techcorp.com",
    "execution_time_ms": 12340,
    "results_count": 23,
    "exit_code": 0
  },
  
  // Context information
  "context": {
    "user_id": "user_abc123",
    "session_id": "sess_xyz789", 
    "request_id": "req_def456",
    "correlation_id": "corr_ghi789"
  },
  
  // Technical metadata
  "system": {
    "hostname": "ryha-worker-03",
    "region": "us-central1",
    "container_id": "container_abc123",
    "memory_usage_mb": 234,
    "cpu_usage_percent": 15.3
  }
}
```

### 📈 Log Aggregation Views

```javascript
// Log aggregation for monitoring dashboards
const errorsByAgent = db.collection("logs")
  .where("level", "==", "ERROR")
  .where("timestamp", ">=", last24Hours)
  .orderBy("timestamp", "desc");

const performanceMetrics = db.collection("logs")
  .where("category", "==", "agent_execution")  
  .where("timestamp", ">=", lastHour)
  .select("details.execution_time_ms", "source.agent");
```

---

## 9.7 Continuous Scans Collection Schema  

### 🔄 Document Structure: `continuous_scans/{job_id}_{scan_iteration}`

```json
{
  "scan_id": "job_20251228_001_iter_005",
  "job_id": "job_20251228_001", 
  "iteration": 5,
  "scan_type": "incremental",
  "triggered_by": "code_commit_detected",
  
  // Timing information
  "timing": {
    "scheduled_at": "2025-12-28T14:00:00Z",
    "started_at": "2025-12-28T14:00:05Z",
    "completed_at": "2025-12-28T14:03:20Z",
    "duration_seconds": 195
  },
  
  // Changes detected
  "changes_detected": {
    "new_endpoints": [
      "https://app.techcorp.com/api/v2/payments",
      "https://app.techcorp.com/admin/reports"
    ],
    "modified_files": [
      "src/authentication/jwt.py",
      "config/security.yml"
    ],
    "dependency_updates": [
      {"package": "express", "old_version": "4.18.1", "new_version": "4.18.2"}
    ],
    "infrastructure_changes": [
      "SSL certificate renewed"
    ]
  },
  
  // Scan results
  "results": {
    "new_findings": [
      {
        "finding_id": "F013",
        "severity": "high", 
        "title": "New admin endpoint without authentication"
      }
    ],
    "resolved_findings": [
      {
        "finding_id": "F003",
        "resolution": "JWT algorithm updated to RS256"
      }
    ],
    "modified_findings": [
      {
        "finding_id": "F007",
        "change": "severity_reduced_to_medium"
      }
    ]
  },
  
  // Performance metrics
  "performance": {
    "agents_executed": ["NovaRecon", "VegaScan", "StaticScan"],
    "tools_run": ["subfinder", "nuclei", "semgrep"],
    "total_execution_time_ms": 195000,
    "resource_usage": {
      "cpu_seconds": 45,
      "memory_peak_mb": 512
    }
  }
}
```

---

## 9.8 Analytics Database Schema (BigQuery)

### 📊 Data Warehouse Tables

#### Agent Performance Table
```sql
CREATE TABLE `ryha-ai.analytics.agent_performance` (
  job_id STRING,
  agent_name STRING,
  execution_date DATE,
  execution_time_ms INT64,
  success_rate FLOAT64,
  findings_count INT64,
  false_positive_rate FLOAT64,
  resource_usage_cpu FLOAT64,
  resource_usage_memory INT64,
  tool_success_rates STRUCT<
    tool_name STRING,
    success_count INT64,
    failure_count INT64
  > REPEATED
);
```

#### Customer Usage Analytics
```sql  
CREATE TABLE `ryha-ai.analytics.customer_usage` (
  user_id STRING,
  company_name STRING,
  subscription_tier STRING,
  month_year STRING,
  jobs_executed INT64,
  total_findings INT64,
  api_calls INT64,
  storage_used_gb FLOAT64,
  compute_seconds INT64,
  cost_usd FLOAT64
);
```

#### Vulnerability Trends Table
```sql
CREATE TABLE `ryha-ai.analytics.vulnerability_trends` (
  week_start_date DATE,
  cwe_id STRING,
  severity STRING,
  industry STRING,
  occurrences INT64,
  avg_cvss_score FLOAT64,
  remediation_time_avg_days FLOAT64,
  false_positive_rate FLOAT64
);
```

---

## 9.9 Data Lifecycle Management

### 🔄 Data Retention Policies

```yaml
Retention Policies:
  Hot Data (Firestore):
    jobs: 90 days
    findings: 1 year  
    logs: 30 days
    reports: 90 days (metadata only)
    
  Cold Storage (Cloud Storage):
    job_archives: 7 years
    report_files: 7 years
    evidence_files: 5 years
    audit_logs: 10 years
    
  Analytics (BigQuery):
    aggregated_metrics: 2 years
    raw_performance_data: 1 year
    customer_usage: 5 years
```

### 📦 Data Archival Process

```python
class DataLifecycleManager:
    def __init__(self):
        self.firestore = firestore.Client()
        self.storage = storage.Client()
        self.bigquery = bigquery.Client()
    
    def archive_old_jobs(self, days_old=90):
        """Archive jobs older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        
        old_jobs = self.firestore.collection('jobs').where(
            'created_at', '<', cutoff_date
        ).stream()
        
        for job in old_jobs:
            # Archive to cold storage
            self.archive_to_storage(job)
            
            # Extract analytics data
            self.extract_to_bigquery(job)
            
            # Delete from hot storage
            job.reference.delete()
    
    def cleanup_expired_reports(self):
        """Remove expired report files"""
        expired_reports = self.firestore.collection('reports').where(
            'files.pdf.expires_at', '<', datetime.now()
        ).stream()
        
        for report in expired_reports:
            self.delete_report_files(report)
```

---

## 9.10 Database Security & Access Control

### 🔒 Security Measures

#### Access Control Rules (Firestore)
```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Jobs accessible only by owner
    match /jobs/{jobId} {
      allow read, write: if request.auth.uid == resource.data.client.user_id;
    }
    
    // Findings readable by job owner, writable by system
    match /findings/{findingId} {
      allow read: if request.auth.uid == get(/databases/$(database)/documents/jobs/$(resource.data.job_id)).data.client.user_id;
      allow write: if request.auth.token.service_account == true;
    }
    
    // Logs only accessible by system
    match /logs/{logId} {
      allow read, write: if request.auth.token.service_account == true;
    }
  }
}
```

#### Encryption & Privacy
```yaml
Security Measures:
  Encryption at Rest: AES-256 (automatic)
  Encryption in Transit: TLS 1.3
  Field-Level Encryption: PII and credentials
  Key Management: Cloud KMS with rotation
  Access Logging: All database operations logged
  Audit Trail: Immutable audit log for compliance
```

---

## Next Steps

1. **Review** [API Layer Design](./10-api-layer.md)
2. **Explore** [Agent Team Specifications](../agents/web-application-team.md)
3. **Understand** [Security & Compliance](../security/14-security-safety.md)

---

[← Back to Docker & Tools](./08-docker-tools.md) | [Next: API Layer Design →](./10-api-layer.md)