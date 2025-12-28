# Deployment Architecture

**Comprehensive Cloud Deployment Strategy for Ryha AI Platform**

---

## 25.1 Deployment Overview

The Ryha AI platform utilizes a **cloud-native, multi-region deployment strategy** with primary focus on Google Cloud Platform, secondary support for AWS, and tertiary Azure integration for maximum flexibility and disaster recovery.

### 🏗️ Architecture Principles

```yaml
Core Principles:
  Scalability:
    - Horizontal pod autoscaling for agent workloads
    - Vertical scaling for database and storage
    - Regional scaling for global performance
    
  Availability:
    - Multi-zone deployment within regions
    - Cross-region disaster recovery
    - 99.9% uptime SLA with automated failover
    
  Security:
    - Zero-trust network architecture
    - End-to-end encryption in transit and at rest
    - Isolated agent execution environments
    
  Cost Optimization:
    - Spot instances for non-critical workloads
    - Resource-based autoscaling
    - Reserved instances for baseline capacity
```

---

## 25.2 Multi-Cloud Architecture

### ☁️ Google Cloud Platform (Primary)

#### Core GCP Services Integration
```yaml
Compute Services:
  Google Kubernetes Engine (GKE):
    Configuration:
      - Node pools: 3 (system, agents, reports)
      - Machine type: n2-standard-4 (baseline)
      - Auto-scaling: 3-50 nodes per pool
      - Spot instances: 60% of agent nodes
    
    Security Features:
      - Workload Identity for secure service access
      - Binary Authorization for container security
      - Network policies for microsegmentation
      - Pod Security Standards enforcement

  Cloud Run (Serverless):
    Usage:
      - Report generation services
      - Webhook handlers
      - Administrative tools
      - Backup services
    
    Configuration:
      - Minimum instances: 1
      - Maximum instances: 100
      - CPU allocation: 2 vCPU per instance
      - Memory allocation: 4GB per instance

Storage Services:
  Firestore (Primary Database):
    Configuration:
      - Multi-regional deployment (us-central, europe-west)
      - Automatic scaling and backup
      - Point-in-time recovery enabled
      - Real-time synchronization
    
    Collections Structure:
      - jobs: Penetration testing job management
      - findings: Vulnerability and security findings
      - users: User management and authentication
      - reports: Generated report metadata
      - audit: Comprehensive audit logging

  Cloud Storage (File Storage):
    Buckets:
      - ryha-ai-reports (multi-regional)
      - ryha-ai-artifacts (regional)
      - ryha-ai-backups (nearline storage)
      - ryha-ai-logs (coldline storage)
    
    Security:
      - Customer-managed encryption keys (CMEK)
      - Uniform bucket-level access
      - Retention policies and lifecycle management
```

#### GCP Kubernetes Deployment Configuration
```yaml
# gcp-production-cluster.yaml
apiVersion: container/v1
kind: Cluster
metadata:
  name: ryha-ai-production
  zone: us-central1-a
spec:
  initialClusterVersion: "1.27"
  network: projects/ryha-ai/global/networks/ryha-vpc
  subnetwork: projects/ryha-ai/regions/us-central1/subnetworks/ryha-private
  
  nodePools:
  - name: system-pool
    initialNodeCount: 3
    config:
      machineType: n2-standard-2
      diskSizeGb: 50
      preemptible: false
      labels:
        workload: system
      taints:
      - key: node-role
        value: system
        effect: NoSchedule
  
  - name: agent-pool
    initialNodeCount: 3
    autoscaling:
      enabled: true
      minNodeCount: 3
      maxNodeCount: 50
    config:
      machineType: n2-standard-4
      diskSizeGb: 100
      preemptible: true
      labels:
        workload: agents
      oauthScopes:
      - https://www.googleapis.com/auth/cloud-platform
  
  - name: report-pool
    initialNodeCount: 2
    autoscaling:
      enabled: true
      minNodeCount: 2
      maxNodeCount: 10
    config:
      machineType: n2-standard-8
      diskSizeGb: 200
      labels:
        workload: reporting

  networkPolicy:
    enabled: true
  
  workloadIdentityConfig:
    identityNamespace: ryha-ai.svc.id.goog
  
  binaryAuthorization:
    enabled: true
    evaluationMode: PROJECT_SINGLETON_POLICY_ENFORCE
```

### 🚀 AWS (Secondary/Disaster Recovery)

#### AWS Services for Backup and DR
```yaml
Disaster Recovery Architecture:
  Route 53 (DNS Management):
    Health Checks:
      - Primary GCP endpoint monitoring
      - Automatic failover to AWS endpoints
      - Latency-based routing for performance
    
    Failover Configuration:
      - Primary: GCP Load Balancer
      - Secondary: AWS Application Load Balancer
      - Health check frequency: 30 seconds
      - Failover threshold: 3 consecutive failures

  EKS (Backup Kubernetes):
    Cluster Configuration:
      - Node groups: 2 (minimal system + agents)
      - Instance types: m5.large (cost-optimized)
      - Scaling: Manual scaling for DR scenarios
      - AMI: Amazon Linux 2 with EKS optimized
    
    Standby Mode:
      - Database: Read replicas only
      - Compute: Minimal baseline capacity
      - Storage: Cross-region replication
      - Activation: Automated scaling on failover

  RDS (Database Backup):
    Configuration:
      - PostgreSQL 14 for relational data backup
      - Multi-AZ deployment for high availability
      - Automated backups with 30-day retention
      - Cross-region read replicas
    
    Data Synchronization:
      - Real-time sync from Firestore to RDS
      - Batch synchronization for large datasets
      - Conflict resolution for failover scenarios
```

### 🔄 Azure (Tertiary/Global Expansion)

#### Azure Integration Points
```yaml
Azure Services (Future Expansion):
  Azure Kubernetes Service (AKS):
    Purpose: Global expansion into European markets
    Configuration: Similar to GCP setup with regional optimization
    
  Cosmos DB:
    Purpose: Global document database for international compliance
    Configuration: Multi-master setup with regional write preference
    
  Azure Functions:
    Purpose: Regional report processing and compliance services
    Configuration: Premium plan for consistent performance
```

---

## 25.3 Container Architecture

### 🐳 Docker Container Strategy

#### Base Container Images
```dockerfile
# Base Agent Container
FROM python:3.11-slim as base

# Security updates and essential tools
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        build-essential \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash ryha \
    && usermod -aG sudo ryha

# Install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Security scanning tools layer
FROM base as security-tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    gobuster \
    ffuf \
    nuclei \
    subfinder \
    && rm -rf /var/lib/apt/lists/*

# Final agent image
FROM security-tools as agent
WORKDIR /app
COPY --chown=ryha:ryha . /app/
USER ryha
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
CMD ["python", "-m", "ryha.agent.main"]
```

#### Container Security Configuration
```yaml
Security Hardening:
  Image Security:
    - Base image: Distroless or slim variants
    - Vulnerability scanning: Trivy/Snyk integration
    - Image signing: Cosign for supply chain security
    - Registry security: Private container registry
  
  Runtime Security:
    - Non-root user execution
    - Read-only root filesystem
    - Dropped capabilities (CAP_NET_RAW, etc.)
    - SecComp and AppArmor profiles
  
  Network Security:
    - Network policies for pod-to-pod communication
    - Service mesh (Istio) for mTLS
    - Ingress TLS termination
    - Zero-trust network architecture
```

### 📊 Container Orchestration

#### Kubernetes Deployment Manifests
```yaml
# master-orchestrator-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: master-orchestrator
  namespace: ryha-ai
  labels:
    app: master-orchestrator
    version: v1.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: master-orchestrator
  template:
    metadata:
      labels:
        app: master-orchestrator
        version: v1.0
    spec:
      serviceAccountName: master-orchestrator
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: orchestrator
        image: gcr.io/ryha-ai/master-orchestrator:v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8090
          name: metrics
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
          readOnlyRootFilesystem: true

---
# Service for Master Orchestrator
apiVersion: v1
kind: Service
metadata:
  name: master-orchestrator-service
  namespace: ryha-ai
spec:
  selector:
    app: master-orchestrator
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 8090
  type: ClusterIP

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: master-orchestrator-hpa
  namespace: ryha-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: master-orchestrator
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 25.4 Network Architecture

### 🌐 Network Security and Segmentation

#### VPC and Subnet Configuration
```yaml
Network Architecture:
  Primary VPC (GCP):
    CIDR: 10.0.0.0/16
    Subnets:
      Public Subnet:
        CIDR: 10.0.1.0/24
        Purpose: Load balancers and ingress
        Internet Gateway: Attached
      
      Private Subnet (Kubernetes):
        CIDR: 10.0.2.0/24
        Purpose: GKE cluster nodes
        NAT Gateway: For outbound internet access
      
      Database Subnet:
        CIDR: 10.0.3.0/24
        Purpose: Firestore and Redis instances
        Access: Private only
      
      Management Subnet:
        CIDR: 10.0.4.0/24
        Purpose: Administrative and monitoring tools
        Access: VPN gateway only

Security Groups and Firewall Rules:
  Load Balancer Security Group:
    Ingress:
      - Port 80/443 from 0.0.0.0/0 (HTTP/HTTPS)
      - Port 22 from management subnet (SSH)
    Egress:
      - Port 8080 to Kubernetes subnet (API)
  
  Kubernetes Security Group:
    Ingress:
      - Port 8080 from load balancer (API traffic)
      - Port 443 from management (Kubernetes API)
      - Inter-cluster communication (all ports)
    Egress:
      - Port 443 to internet (container registry, updates)
      - Port 5432/27017 to database subnet
  
  Database Security Group:
    Ingress:
      - Port 5432 from Kubernetes subnet (PostgreSQL)
      - Port 6379 from Kubernetes subnet (Redis)
    Egress:
      - None (database instances don't need outbound)
```

#### Service Mesh Configuration (Istio)
```yaml
# istio-gateway.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ryha-ai-gateway
  namespace: ryha-ai
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: ryha-ai-tls-secret
    hosts:
    - api.ryha-ai.com
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - api.ryha-ai.com
    tls:
      httpsRedirect: true

---
# Virtual Service for routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ryha-ai-vs
  namespace: ryha-ai
spec:
  hosts:
  - api.ryha-ai.com
  gateways:
  - ryha-ai-gateway
  http:
  - match:
    - uri:
        prefix: /api/v1/
    route:
    - destination:
        host: master-orchestrator-service
        port:
          number: 80
    fault:
      delay:
        percentage:
          value: 0.1
        fixedDelay: 100ms
    retries:
      attempts: 3
      perTryTimeout: 10s

---
# Destination Rule for load balancing
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: master-orchestrator-dr
  namespace: ryha-ai
spec:
  host: master-orchestrator-service
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

---

## 25.5 Database and Storage Architecture

### 🗄️ Database Deployment Strategy

#### Firestore Production Configuration
```python
# firestore-config.py
from google.cloud import firestore
from google.api_core import retry
import json

class FirestoreProduction:
    def __init__(self):
        self.db = firestore.Client(
            project='ryha-ai-production',
            database='ryha-ai-primary'
        )
        
    def configure_production_indexes(self):
        """Configure production-optimized indexes"""
        indexes = [
            {
                'collection_id': 'jobs',
                'fields': [
                    {'field_path': 'status', 'order': 'ASCENDING'},
                    {'field_path': 'created_at', 'order': 'DESCENDING'},
                    {'field_path': 'user_id', 'order': 'ASCENDING'}
                ]
            },
            {
                'collection_id': 'findings',
                'fields': [
                    {'field_path': 'severity', 'order': 'DESCENDING'},
                    {'field_path': 'job_id', 'order': 'ASCENDING'},
                    {'field_path': 'created_at', 'order': 'DESCENDING'}
                ]
            },
            {
                'collection_id': 'users',
                'fields': [
                    {'field_path': 'organization_id', 'order': 'ASCENDING'},
                    {'field_path': 'role', 'order': 'ASCENDING'},
                    {'field_path': 'active', 'order': 'ASCENDING'}
                ]
            }
        ]
        
        for index_config in indexes:
            self.create_composite_index(index_config)
    
    @retry.Retry(deadline=300)
    def create_composite_index(self, config):
        """Create composite index with retry logic"""
        try:
            # Index creation logic
            print(f"Creating index for collection: {config['collection_id']}")
            # Implementation would use Admin SDK
        except Exception as e:
            print(f"Index creation failed: {e}")
            raise

class DatabaseBackupStrategy:
    def __init__(self):
        self.backup_schedule = {
            'daily_backups': {
                'frequency': 'daily',
                'retention_days': 30,
                'time': '02:00 UTC'
            },
            'weekly_backups': {
                'frequency': 'weekly', 
                'retention_weeks': 12,
                'day': 'sunday'
            },
            'monthly_backups': {
                'frequency': 'monthly',
                'retention_months': 12,
                'day': 1
            }
        }
    
    def setup_automated_backups(self):
        """Configure automated backup policies"""
        return {
            'firestore_export': {
                'destination': 'gs://ryha-ai-backups/firestore/',
                'collection_filter': 'all',
                'compression': 'gzip',
                'encryption': 'customer_managed'
            },
            'cross_region_replication': {
                'primary_region': 'us-central1',
                'backup_regions': ['us-east1', 'europe-west1'],
                'sync_frequency': 'real_time'
            }
        }
```

#### Cloud Storage Configuration
```yaml
Storage Buckets:
  Production Buckets:
    ryha-ai-reports-prod:
      Location: Multi-regional (US/EU)
      Storage Class: Standard
      Versioning: Enabled
      Lifecycle:
        - Delete after 7 years (compliance)
        - Transition to Nearline after 1 year
        - Transition to Coldline after 3 years
      
    ryha-ai-artifacts-prod:
      Location: Regional (us-central1)
      Storage Class: Standard
      Public Access: Blocked
      Encryption: Customer-managed keys
      
    ryha-ai-backups-prod:
      Location: Multi-regional (Global)
      Storage Class: Nearline
      Versioning: Enabled
      Retention Policy: 7 years
      
    ryha-ai-logs-prod:
      Location: Regional (us-central1)
      Storage Class: Coldline
      Lifecycle: Delete after 2 years
      Log Sink: Cloud Logging integration

Security Configuration:
  IAM Policies:
    - Service Account Access Only
    - Uniform bucket-level access
    - Conditional IAM based on request attributes
    - Audit logging for all access
    
  Encryption:
    - Customer-Managed Encryption Keys (CMEK)
    - Envelope encryption for additional security
    - Key rotation every 90 days
    - HSM-backed key storage
```

---

## 25.6 Monitoring and Observability

### 📊 Monitoring Infrastructure

#### Prometheus and Grafana Setup
```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring

---
# Prometheus Server
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.40.0
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
          - '--web.console.libraries=/etc/prometheus/console_libraries'
          - '--web.console.templates=/etc/prometheus/consoles'
          - '--storage.tsdb.retention.time=30d'
          - '--web.enable-lifecycle'
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        persistentVolumeClaim:
          claimName: prometheus-pvc

---
# Prometheus Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "ryha_ai_rules.yml"
    
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
    
    - job_name: 'master-orchestrator'
      static_configs:
      - targets: ['master-orchestrator-service:9090']
      
    - job_name: 'agent-metrics'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - ryha-ai
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_label_component]
        action: keep
        regex: agent
  
  ryha_ai_rules.yml: |
    groups:
    - name: ryha_ai_alerts
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High error rate detected
          
      - alert: AgentJobFailed
        expr: increase(agent_job_failures_total[5m]) > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Agent job failure detected
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Ryha AI Platform Overview",
    "panels": [
      {
        "title": "Active Jobs",
        "type": "stat",
        "targets": [
          {
            "expr": "count(jobs{status=\"running\"})",
            "legendFormat": "Running Jobs"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 50},
                {"color": "red", "value": 100}
              ]
            }
          }
        }
      },
      {
        "title": "API Response Times",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th Percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th Percentile"
          }
        ]
      },
      {
        "title": "Agent Performance",
        "type": "table",
        "targets": [
          {
            "expr": "avg_over_time(agent_execution_time_seconds[1h]) by (agent_type)",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

---

## 25.7 CI/CD Pipeline

### 🚀 Deployment Automation

#### GitHub Actions CI/CD
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'k8s/**'

env:
  PROJECT_ID: ryha-ai-production
  GKE_CLUSTER: ryha-ai-cluster
  GKE_ZONE: us-central1-a
  DEPLOYMENT_NAME: master-orchestrator

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run tests
      run: |
        pytest tests/ --cov=src/ --cov-report=xml
    
    - name: Run security scan
      run: |
        bandit -r src/
        safety check
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    name: Build and Push Container
    runs-on: ubuntu-latest
    needs: test
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Configure Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ env.PROJECT_ID }}
    
    - name: Configure Docker for GCR
      run: gcloud auth configure-docker
    
    - name: Build and push container image
      run: |
        docker buildx build \
          --platform linux/amd64,linux/arm64 \
          --tag gcr.io/$PROJECT_ID/master-orchestrator:$GITHUB_SHA \
          --tag gcr.io/$PROJECT_ID/master-orchestrator:latest \
          --push .

  deploy:
    name: Deploy to GKE
    runs-on: ubuntu-latest
    needs: build
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure Google Cloud CLI
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ env.PROJECT_ID }}
    
    - name: Get GKE credentials
      run: |
        gcloud container clusters get-credentials $GKE_CLUSTER --zone $GKE_ZONE
    
    - name: Deploy to Kubernetes
      run: |
        sed -i "s|IMAGE_TAG|$GITHUB_SHA|g" k8s/production/*.yaml
        kubectl apply -f k8s/production/
    
    - name: Verify deployment
      run: |
        kubectl rollout status deployment/$DEPLOYMENT_NAME -n ryha-ai
        kubectl get services -n ryha-ai

  security-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    needs: build
    steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: gcr.io/${{ env.PROJECT_ID }}/master-orchestrator:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'
```

---

## Next Steps

1. **Review** [Testing & Quality Assurance](../testing/26-testing-qa.md)
2. **Explore** [Implementation Roadmap](../implementation/24-implementation-roadmap.md)
3. **Check** [Final Documentation Index](../README.md)

---

[← Back to Implementation Roadmap](../implementation/24-implementation-roadmap.md) | [Next: Testing & QA →](../testing/26-testing-qa.md)