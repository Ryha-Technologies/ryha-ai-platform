# Docker & Tool Execution Architecture

**Centralized, Secure, Scalable CLI Tool Execution Environment**

---

## 8.1 Docker Architecture Overview

Ryha AI uses a **single, shared Docker image** containing all security tools, executed in isolated, ephemeral containers for maximum security, efficiency, and consistency.

### 🐳 Core Design Principles

| Principle | Implementation | Benefit |
|-----------|----------------|---------|
| **Single Source of Truth** | One Docker image with all tools | Consistent tool versions across all agents |
| **Ephemeral Execution** | Containers created and destroyed per task | No persistent state, maximum security |
| **Resource Isolation** | CPU, memory, and network limits per container | Prevent resource exhaustion |
| **Security Sandboxing** | Non-root execution, restricted filesystem | Contain potential security issues |
| **Horizontal Scaling** | Unlimited parallel container execution | Handle massive concurrent workloads |

---

## 8.2 Docker Image Architecture

### 🏗️ Image Structure

```dockerfile
FROM ubuntu:22.04

# System dependencies
RUN apt-get update && apt-get install -y \
    wget curl git python3 python3-pip nodejs npm \
    ca-certificates openssl jq unzip build-essential

# Security tools installation
COPY install-tools.sh /usr/local/bin/
RUN /usr/local/bin/install-tools.sh

# Tool execution wrapper
COPY tool-executor.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/tool-executor.sh

# Non-root security
RUN useradd -m -s /bin/bash ryha
USER ryha

ENTRYPOINT ["/usr/local/bin/tool-executor.sh"]
```

### 📦 Tool Categories & Installation

#### Reconnaissance Tools
```bash
# Subdomain enumeration
wget -O /usr/local/bin/subfinder https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_linux_amd64
wget -O /usr/local/bin/amass https://github.com/OWASP/Amass/releases/latest/download/amass_linux_amd64.zip

# URL discovery  
wget -O /usr/local/bin/httpx https://github.com/projectdiscovery/httpx/releases/latest/download/httpx_linux_amd64
wget -O /usr/local/bin/katana https://github.com/projectdiscovery/katana/releases/latest/download/katana_linux_amd64

# Technology fingerprinting
npm install -g wappalyzer-cli
pip3 install builtwith
```

#### Vulnerability Scanning Tools
```bash
# Safe vulnerability detection
wget -O /usr/local/bin/nuclei https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_linux_amd64
nuclei -update-templates

# Web server analysis
apt-get install -y nikto
git clone https://github.com/drwetter/testssl.sh.git /opt/testssl
ln -s /opt/testssl/testssl.sh /usr/local/bin/testssl.sh

# SSL/TLS analysis
apt-get install -y sslscan
```

#### Code Analysis Tools  
```bash
# Static Application Security Testing (SAST)
pip3 install semgrep bandit
npm install -g eslint eslint-plugin-security

# Secret detection
pip3 install trufflehog
wget -O /usr/local/bin/gitleaks https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64

# Dependency scanning
pip3 install safety pip-audit
wget -O /tmp/dependency-check.zip https://github.com/jeremylong/DependencyCheck/releases/latest/download/dependency-check-*-release.zip
unzip /tmp/dependency-check.zip -d /opt/
ln -s /opt/dependency-check/bin/dependency-check.sh /usr/local/bin/dependency-check
```

---

## 8.3 Tool Execution Engine

### ⚙️ Execution Workflow

```
Agent Request → Safety Validation → Container Spawn → Tool Execution → Result Parsing → Container Cleanup
```

#### Detailed Flow:
1. **Agent submits tool execution request**
2. **SafetyMonitor validates tool and arguments**
3. **ScopeGate verifies target is within authorized scope**
4. **Container Engine spawns isolated Docker container**
5. **Tool executes with timeout and resource limits**
6. **Output captured and sanitized**
7. **Results parsed and normalized**
8. **Container destroyed (ephemeral)**
9. **Parsed results returned to agent**

### 🔧 Tool Executor Script

```bash
#!/bin/bash
# tool-executor.sh - Safe tool execution wrapper

TOOL=$1
shift
ARGS=("$@")

# Security validations
source /usr/local/bin/security-checks.sh

# Validate tool is allowed
if ! is_tool_allowed "$TOOL"; then
    echo '{"error": "Tool not in allowlist", "tool": "'$TOOL'"}' >&2
    exit 1
fi

# Validate arguments are safe
if ! are_args_safe "$TOOL" "${ARGS[@]}"; then
    echo '{"error": "Unsafe arguments detected", "tool": "'$TOOL'"}' >&2
    exit 1
fi

# Execute with timeout and capture output
TIMEOUT=300  # 5 minute default timeout
START_TIME=$(date +%s)

# Execute tool with timeout
timeout $TIMEOUT "$TOOL" "${ARGS[@]}" 2>&1 | tee /tmp/tool_output.txt
EXIT_CODE=${PIPESTATUS[0]}

END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

# Parse and normalize output
OUTPUT=$(cat /tmp/tool_output.txt)
PARSED_OUTPUT=$(parse_tool_output "$TOOL" "$OUTPUT")

# Return structured result
cat <<EOF
{
  "tool": "$TOOL",
  "arguments": [$(printf '"%s",' "${ARGS[@]}" | sed 's/,$//')],
  "exit_code": $EXIT_CODE,
  "execution_time": $EXECUTION_TIME,
  "raw_output": $(echo "$OUTPUT" | jq -Rs .),
  "parsed_output": $PARSED_OUTPUT,
  "timestamp": "$(date -Iseconds)"
}
EOF
```

---

## 8.4 Security & Safety Framework

### 🛡️ Multi-Layer Security

#### Container Security:
```yaml
Security Measures:
  User: Non-root execution (uid 1000)
  Filesystem: Read-only root filesystem  
  Network: Restricted outbound only
  Resources: CPU/Memory limits enforced
  Privileges: No privileged operations allowed
  Capabilities: Minimal Linux capabilities
```

#### Tool Allowlist:
```json
{
  "allowed_tools": {
    "reconnaissance": ["subfinder", "amass", "httpx", "katana", "waybackurls"],
    "vulnerability_scanning": ["nuclei", "testssl.sh", "sslscan"],
    "code_analysis": ["semgrep", "bandit", "eslint"],
    "secret_detection": ["trufflehog", "gitleaks"],
    "dependency_scanning": ["npm audit", "pip-audit", "safety"]
  },
  "forbidden_tools": ["nmap", "sqlmap", "ffuf", "hydra", "john"],
  "forbidden_flags": ["--exploit", "--brute", "--attack", "--force"]
}
```

#### Argument Validation:
```bash
function are_args_safe() {
    local tool="$1"
    shift
    local args=("$@")
    
    # Check for forbidden flags
    for arg in "${args[@]}"; do
        if [[ "$arg" =~ ^--(exploit|attack|brute|force) ]]; then
            return 1
        fi
    done
    
    # Tool-specific validations
    case "$tool" in
        "nuclei")
            # Only allow safe nuclei templates
            if [[ ! "${args[*]}" =~ -t.*-(safe|info|low) ]]; then
                return 1
            fi
            ;;
        "nmap")
            # nmap generally forbidden except safe discovery
            return 1
            ;;
    esac
    
    return 0
}
```

---

## 8.5 Output Parsing & Normalization

### 📊 Unified Output Format

Every tool execution returns standardized JSON:

```json
{
  "tool": "subfinder",
  "arguments": ["-d", "example.com", "-silent"],
  "exit_code": 0,
  "execution_time": 12.4,
  "raw_output": "api.example.com\nwww.example.com\n",
  "parsed_output": {
    "subdomains": ["api.example.com", "www.example.com"],
    "count": 2
  },
  "timestamp": "2025-12-28T15:30:00Z",
  "metadata": {
    "container_id": "abc123",
    "resource_usage": {
      "cpu_seconds": 8.2,
      "memory_mb": 45
    }
  }
}
```

### 🔄 Tool-Specific Parsers

#### Subdomain Tools (subfinder, amass):
```python
def parse_subdomain_output(raw_output):
    lines = raw_output.strip().split('\n')
    subdomains = [line.strip() for line in lines if line.strip()]
    
    return {
        "subdomains": subdomains,
        "count": len(subdomains),
        "unique_count": len(set(subdomains))
    }
```

#### Nuclei Output Parser:
```python
def parse_nuclei_output(raw_output):
    findings = []
    
    for line in raw_output.strip().split('\n'):
        if line.startswith('['):
            try:
                # Parse nuclei JSON output
                finding = json.loads(line)
                findings.append({
                    "template": finding.get("template-id"),
                    "severity": finding.get("info", {}).get("severity", "info"),
                    "url": finding.get("matched-at"),
                    "description": finding.get("info", {}).get("description")
                })
            except json.JSONDecodeError:
                continue
    
    return {
        "findings": findings,
        "total_findings": len(findings),
        "severities": count_severities(findings)
    }
```

#### Semgrep Output Parser:
```python
def parse_semgrep_output(raw_output):
    try:
        semgrep_data = json.loads(raw_output)
        findings = []
        
        for result in semgrep_data.get("results", []):
            findings.append({
                "rule_id": result.get("check_id"),
                "file": result.get("path"),
                "line": result.get("start", {}).get("line"),
                "severity": result.get("extra", {}).get("severity", "WARNING"),
                "message": result.get("extra", {}).get("message"),
                "cwe": extract_cwe_from_metadata(result)
            })
        
        return {
            "sast_findings": findings,
            "total_findings": len(findings),
            "files_scanned": len(set([f["file"] for f in findings]))
        }
    except json.JSONDecodeError:
        return {"error": "Invalid semgrep JSON output"}
```

---

## 8.6 Resource Management & Scaling

### ⚡ Container Resource Limits

```yaml
Resource Limits:
  CPU: 2 vCPUs per container
  Memory: 1GB RAM per container  
  Disk: 500MB temporary storage
  Network: 10Mbps outbound bandwidth
  Execution Time: 5 minutes default, 15 minutes maximum
  
Scaling Configuration:
  Max Concurrent Containers: 100 per region
  Auto-scaling Trigger: >80% capacity utilization
  Scale-down Trigger: <20% capacity utilization for 5 minutes
```

### 📈 Performance Optimization

#### Container Warmup Pool:
```python
class ContainerPool:
    def __init__(self, pool_size=10):
        self.warm_containers = []
        self.pool_size = pool_size
        self.maintain_warm_pool()
    
    def get_container(self):
        if self.warm_containers:
            return self.warm_containers.pop()
        else:
            return self.create_new_container()
    
    def maintain_warm_pool(self):
        while len(self.warm_containers) < self.pool_size:
            container = self.create_warm_container()
            self.warm_containers.append(container)
```

#### Image Layer Caching:
- Base Ubuntu layer cached across all containers
- Tool installation layer cached and reused  
- Only configuration changes require new builds
- Multi-stage builds for optimal layer reuse

---

## 8.7 Tool Update & Versioning

### 🔄 Automated Tool Updates

#### Update Strategy:
```yaml
Update Schedule:
  Security Tools: Weekly (automated)
  Base OS Packages: Monthly (tested)
  Critical Security Patches: Within 24 hours
  
Update Process:
  1. Build new image with updated tools
  2. Run automated test suite
  3. Deploy to staging environment
  4. Canary deployment (10% traffic)
  5. Full deployment if tests pass
  6. Rollback mechanism if issues detected
```

#### Version Management:
```dockerfile
# Dockerfile with version pinning
ENV SUBFINDER_VERSION="2.6.3"
ENV NUCLEI_VERSION="3.1.0"  
ENV SEMGREP_VERSION="1.45.0"

# Download specific versions for reproducibility
RUN wget https://github.com/projectdiscovery/subfinder/releases/download/v${SUBFINDER_VERSION}/subfinder_${SUBFINDER_VERSION}_linux_amd64.zip
```

### 📊 Tool Performance Monitoring

```python
class ToolMetrics:
    def __init__(self):
        self.execution_times = {}
        self.success_rates = {}
        self.resource_usage = {}
    
    def record_execution(self, tool, duration, success, resources):
        if tool not in self.execution_times:
            self.execution_times[tool] = []
        
        self.execution_times[tool].append(duration)
        self.success_rates[tool] = self.calculate_success_rate(tool, success)
        self.resource_usage[tool] = resources
        
    def get_performance_report(self):
        return {
            "average_execution_times": {
                tool: sum(times) / len(times) 
                for tool, times in self.execution_times.items()
            },
            "success_rates": self.success_rates,
            "resource_utilization": self.resource_usage
        }
```

---

## 8.8 Error Handling & Resilience

### 🔄 Failure Recovery Mechanisms

#### Timeout Handling:
```python
def execute_tool_with_timeout(tool, args, timeout=300):
    try:
        result = subprocess.run(
            [tool] + args,
            timeout=timeout,
            capture_output=True,
            text=True
        )
        return {
            "success": True,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Tool execution timed out",
            "timeout": timeout
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

#### Retry Logic:
```python
def execute_with_retry(tool, args, max_retries=3):
    for attempt in range(max_retries):
        result = execute_tool_with_timeout(tool, args)
        
        if result["success"]:
            return result
        
        if attempt < max_retries - 1:
            wait_time = 2 ** attempt  # Exponential backoff
            time.sleep(wait_time)
    
    return {"success": False, "error": "Max retries exceeded"}
```

---

## 8.9 Multi-Cloud Deployment

### ☁️ Cloud-Agnostic Architecture

#### Google Cloud Platform:
```yaml
GCP Deployment:
  Compute: Cloud Run (containers)
  Container Registry: Artifact Registry
  Networking: Private VPC with Cloud NAT
  Storage: Persistent disk for caching
```

#### Amazon Web Services:
```yaml  
AWS Deployment:
  Compute: AWS Lambda (containers) + ECS
  Container Registry: ECR
  Networking: Private VPC with NAT Gateway
  Storage: EBS volumes for caching
```

#### Microsoft Azure:
```yaml
Azure Deployment:
  Compute: Container Instances + Functions
  Container Registry: ACR
  Networking: Private VNet with NAT
  Storage: Managed disks for caching
```

### 🌍 Global Distribution Strategy

```python
class GlobalToolExecution:
    def __init__(self):
        self.regions = {
            "us-central1": {"provider": "gcp", "capacity": 100},
            "europe-west1": {"provider": "gcp", "capacity": 50}, 
            "asia-southeast1": {"provider": "aws", "capacity": 50}
        }
    
    def select_optimal_region(self, target_location, tool_requirements):
        # Choose region based on:
        # 1. Geographic proximity to target
        # 2. Available capacity
        # 3. Tool-specific requirements
        # 4. Cost optimization
        pass
```

---

## 8.10 Security Testing & Validation

### 🧪 Container Security Testing

#### Security Scan Pipeline:
```bash
# Dockerfile security scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ryha-tools:latest

# Container runtime security
docker run --rm --privileged \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp \
  quay.io/kube-bench/kube-bench:latest run --targets=node

# Network security validation
docker run --rm ryha-tools:latest /usr/local/bin/network-test.sh
```

#### Tool Integrity Validation:
```python
def validate_tool_integrity():
    """Verify all tools are functioning correctly"""
    test_cases = {
        "subfinder": {
            "args": ["-d", "example.com", "-silent"],
            "expected_output_pattern": r".*\.example\.com"
        },
        "nuclei": {
            "args": ["-t", "dns", "-target", "example.com"],
            "expected_exit_code": 0
        }
    }
    
    for tool, test in test_cases.items():
        result = execute_tool(tool, test["args"])
        assert validate_output(result, test), f"{tool} validation failed"
```

---

## Next Steps

1. **Review** [Database Schema](./09-database-schema.md)
2. **Understand** [API Layer Design](./10-api-layer.md)
3. **Explore** [Agent Team Specifications](../agents/web-application-team.md)

---

[← Back to Multi-Agent System](./07-multi-agent-system.md) | [Next: Database Schema →](./09-database-schema.md)