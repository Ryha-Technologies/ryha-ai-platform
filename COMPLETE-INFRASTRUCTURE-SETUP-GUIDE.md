# 🚀 COMPLETE INFRASTRUCTURE SETUP GUIDE
## Step-by-Step Setup for GCP, AWS, Azure, GitHub & Development Environment

---

## 🌐 **CLOUD PLATFORMS SETUP**

### **1. Google Cloud Platform (GCP) Setup**

#### Initial Account Setup
```bash
# 1. Create GCP Account
# Go to: https://cloud.google.com/
# Sign up with your email
# Activate $300 free credits

# 2. Install Google Cloud SDK
# Windows:
# Download from: https://cloud.google.com/sdk/docs/install
# Run: GoogleCloudSDKInstaller.exe

# Linux/Mac:
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 3. Initialize gcloud CLI
gcloud init
gcloud auth login
gcloud config set project ryha-ai-platform-dev
```

#### Project and Services Setup
```bash
# 4. Create Projects
gcloud projects create ryha-ai-platform-dev --name="Ryha AI Development"
gcloud projects create ryha-ai-platform-prod --name="Ryha AI Production"

# 5. Set Billing Account (Required for resources)
# Get billing account ID
gcloud billing accounts list
# Link to projects
gcloud billing projects link ryha-ai-platform-dev --billing-account=YOUR_BILLING_ACCOUNT_ID
gcloud billing projects link ryha-ai-platform-prod --billing-account=YOUR_BILLING_ACCOUNT_ID

# 6. Enable Required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable redis.googleapis.com
```

#### GKE Cluster Setup (Development)
```bash
# 7. Create Kubernetes Cluster
gcloud container clusters create ryha-ai-dev-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2 \
  --disk-size=50GB \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade

# 8. Get Cluster Credentials
gcloud container clusters get-credentials ryha-ai-dev-cluster --zone=us-central1-a

# 9. Verify Cluster Access
kubectl cluster-info
kubectl get nodes
```

#### Database Setup
```bash
# 10. Create PostgreSQL Instance
gcloud sql instances create ryha-ai-postgres-dev \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=20GB \
  --backup-start-time=03:00

# 11. Create Database
gcloud sql databases create ryha_ai_dev --instance=ryha-ai-postgres-dev

# 12. Create Database User
gcloud sql users create ryha_user --instance=ryha-ai-postgres-dev --password=SecurePassword123

# 13. Create Redis Instance
gcloud redis instances create ryha-ai-redis-dev \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_6_x
```

---

### **2. Amazon Web Services (AWS) Setup**

#### Initial Account Setup
```bash
# 1. Create AWS Account
# Go to: https://aws.amazon.com/
# Sign up and verify email/phone
# Add payment method

# 2. Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/
# Linux/Mac:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 3. Create IAM User (Don't use root account)
# Go to AWS Console > IAM > Users > Create User
# Username: ryha-ai-admin
# Attach policy: AdministratorAccess
# Create Access Key (download CSV)
```

#### AWS CLI Configuration
```bash
# 4. Configure AWS CLI
aws configure
# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# 5. Verify Configuration
aws sts get-caller-identity
aws s3 ls
```

#### EKS Cluster Setup
```bash
# 6. Install eksctl
# Linux/Mac:
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Windows: Download from https://github.com/weaveworks/eksctl/releases

# 7. Create EKS Cluster
eksctl create cluster \
  --name ryha-ai-dev \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name ryha-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 6

# 8. Verify Cluster
kubectl config current-context
kubectl get nodes
```

#### AWS RDS Setup
```bash
# 9. Create RDS PostgreSQL Instance
aws rds create-db-instance \
  --db-instance-identifier ryha-ai-postgres-dev \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username ryhaadmin \
  --master-user-password SecurePassword123 \
  --allocated-storage 20 \
  --vpc-security-group-ids default \
  --backup-retention-period 7 \
  --port 5432

# 10. Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id ryha-ai-redis-dev \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379
```

---

### **3. Microsoft Azure Setup**

#### Initial Account Setup
```bash
# 1. Create Azure Account
# Go to: https://azure.microsoft.com/
# Sign up and get $200 free credits

# 2. Install Azure CLI
# Windows: Download from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
# Linux:
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
# Mac:
brew install azure-cli

# 3. Login to Azure
az login
# This opens browser for authentication

# 4. Set Subscription (if multiple)
az account list --output table
az account set --subscription "Your Subscription Name"
```

#### Resource Group and AKS Setup
```bash
# 5. Create Resource Group
az group create --name ryha-ai-dev --location eastus

# 6. Create AKS Cluster
az aks create \
  --resource-group ryha-ai-dev \
  --name ryha-ai-dev-cluster \
  --node-count 3 \
  --node-vm-size Standard_B2s \
  --enable-addons monitoring \
  --generate-ssh-keys

# 7. Get AKS Credentials
az aks get-credentials --resource-group ryha-ai-dev --name ryha-ai-dev-cluster

# 8. Verify Cluster
kubectl get nodes
```

#### Azure Database Setup
```bash
# 9. Create PostgreSQL Server
az postgres server create \
  --resource-group ryha-ai-dev \
  --name ryha-ai-postgres-dev \
  --location eastus \
  --admin-user ryhaadmin \
  --admin-password SecurePassword123 \
  --sku-name B_Gen5_1 \
  --version 15

# 10. Create Database
az postgres db create \
  --resource-group ryha-ai-dev \
  --server-name ryha-ai-postgres-dev \
  --name ryha_ai_dev

# 11. Create Redis Cache
az redis create \
  --resource-group ryha-ai-dev \
  --name ryha-ai-redis-dev \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

---

## 🐙 **GITHUB SETUP**

### Repository and Organization Setup
```bash
# 1. Create GitHub Account (if not exists)
# Go to: https://github.com/signup

# 2. Create Organization (Optional but recommended)
# Go to: https://github.com/organizations/new
# Name: ryha-ai (or your preference)

# 3. Install GitHub CLI
# Windows: 
# Download from: https://cli.github.com/
# Linux/Mac:
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# 4. Authenticate GitHub CLI
gh auth login
# Choose: GitHub.com
# Choose: HTTPS
# Choose: Login with a web browser
# Follow browser prompts
```

### Repository Creation and Setup
```bash
# 5. Create Repository
gh repo create ryha-ai-platform --public --description "World's Most Comprehensive AI-Powered Cybersecurity Platform"

# 6. Clone Repository (if not already done)
git clone https://github.com/yourusername/ryha-ai-platform.git
cd ryha-ai-platform

# 7. Setup GitHub Actions Secrets (for CI/CD)
gh secret set GCP_PROJECT_ID --body "ryha-ai-platform-dev"
gh secret set GCP_SA_KEY --body "$(cat path/to/service-account-key.json)"
gh secret set DOCKER_USERNAME --body "yourdockerusername"
gh secret set DOCKER_PASSWORD --body "yourdockerpassword"

# 8. Create Basic GitHub Actions Workflow
mkdir -p .github/workflows
```

### GitHub Actions CI/CD Setup
```yaml
# Create .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Run tests
      run: |
        pytest tests/
        
    - name: Security scan
      run: |
        bandit -r src/
        safety check

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker images
      run: |
        docker build -t ryha-ai-platform:latest .
        
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        docker tag ryha-ai-platform:latest ${{ secrets.DOCKER_USERNAME }}/ryha-ai-platform:latest
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ${{ secrets.DOCKER_USERNAME }}/ryha-ai-platform:latest
```

---

## 💻 **LOCAL DEVELOPMENT ENVIRONMENT**

### Essential Software Installation

#### 1. Docker Desktop
```bash
# Windows: 
# Download from: https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe
# Install and restart

# Linux (Ubuntu/Debian):
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Mac:
# Download from: https://desktop.docker.com/mac/stable/Docker.dmg

# Verify Installation
docker --version
docker-compose --version
```

#### 2. Python Development Environment
```bash
# Install Python 3.11+
# Windows: Download from https://www.python.org/downloads/
# Linux (Ubuntu):
sudo apt update
sudo apt install python3.11 python3.11-pip python3.11-venv
# Mac:
brew install python@3.11

# Create Virtual Environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install Poetry (Package Manager)
curl -sSL https://install.python-poetry.org | python3 -
# or
pip install poetry

# Verify Installation
python --version
pip --version
poetry --version
```

#### 3. Node.js Development Environment
```bash
# Install Node.js 18.x
# Windows/Mac: Download from https://nodejs.org/

# Linux (Ubuntu):
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn (Alternative package manager)
npm install -g yarn

# Verify Installation
node --version
npm --version
yarn --version
```

#### 4. Kubernetes Tools
```bash
# Install kubectl
# Linux:
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Windows: 
# Download from: https://dl.k8s.io/release/v1.28.0/bin/windows/amd64/kubectl.exe

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify Installation
kubectl version --client
helm version
```

---

## 🛠️ **SECURITY TOOLS INSTALLATION**

### Web Security Tools
```bash
# 1. OWASP ZAP
docker pull owasp/zap2docker-stable
# Create alias for easy use
echo "alias zap='docker run -t owasp/zap2docker-stable zap-cli quick-scan'" >> ~/.bashrc

# 2. Nikto Web Scanner
# Linux:
sudo apt install nikto
# Mac:
brew install nikto

# 3. SQLMap
git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap
echo 'export PATH="/opt/sqlmap:$PATH"' >> ~/.bashrc

# 4. XSSer
git clone https://github.com/epsylon/xsser.git /opt/xsser
cd /opt/xsser
python setup.py install

# 5. w3af
git clone --depth 1 https://github.com/andresriancho/w3af.git /opt/w3af
cd /opt/w3af
./w3af_console
```

### Network Security Tools
```bash
# 6. Nmap
# Linux:
sudo apt install nmap
# Mac:
brew install nmap
# Windows: Download from https://nmap.org/download.html

# 7. Masscan
# Linux:
sudo apt install masscan
# Mac:
brew install masscan

# 8. Gobuster
# Install Go first
wget https://golang.org/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Gobuster
go install github.com/OJ/gobuster/v3@latest

# 9. Sublist3r
git clone https://github.com/aboul3la/Sublist3r.git /opt/sublist3r
cd /opt/sublist3r
pip install -r requirements.txt
```

### Static Analysis Tools
```bash
# 10. Bandit (Python Security)
pip install bandit[toml]

# 11. Safety (Python Dependencies)
pip install safety

# 12. ESLint Security (JavaScript)
npm install -g eslint eslint-plugin-security

# 13. SonarQube Community
docker pull sonarqube:community
docker run -d --name sonarqube -p 9000:9000 sonarqube:community

# 14. Semgrep
python -m pip install semgrep
```

### Container Security Tools
```bash
# 15. Trivy
# Linux:
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy

# 16. Docker Bench Security
git clone https://github.com/docker/docker-bench-security.git /opt/docker-bench-security
cd /opt/docker-bench-security
sudo sh docker-bench-security.sh
```

---

## 🗄️ **DATABASE SETUP**

### PostgreSQL Local Setup
```bash
# 1. Install PostgreSQL
# Linux (Ubuntu):
sudo apt update
sudo apt install postgresql postgresql-contrib

# Mac:
brew install postgresql
brew services start postgresql

# Windows: Download from https://www.postgresql.org/download/windows/

# 2. Create Database and User
sudo -u postgres createuser --interactive
# Username: ryha_user
# Superuser: y

sudo -u postgres createdb ryha_ai_dev

# 3. Set Password
sudo -u postgres psql
ALTER USER ryha_user PASSWORD 'SecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE ryha_ai_dev TO ryha_user;
\q

# 4. Test Connection
psql -h localhost -U ryha_user -d ryha_ai_dev
```

### Redis Local Setup
```bash
# 1. Install Redis
# Linux (Ubuntu):
sudo apt update
sudo apt install redis-server

# Mac:
brew install redis
brew services start redis

# Windows: 
# Download from: https://github.com/microsoftarchive/redis/releases

# 2. Test Redis
redis-cli ping
# Should return: PONG

# 3. Configure Redis (Optional)
sudo nano /etc/redis/redis.conf
# Uncomment and modify:
# maxmemory 256mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis.service
```

### Elasticsearch Setup
```bash
# 1. Install Elasticsearch using Docker (Easiest)
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# 2. Test Elasticsearch
curl -X GET "localhost:9200/_cluster/health?pretty"

# 3. Install Kibana (Optional)
docker run -d \
  --name kibana \
  --link elasticsearch:elasticsearch \
  -p 5601:5601 \
  docker.elastic.co/kibana/kibana:8.11.0
```

---

## 📊 **MONITORING & OBSERVABILITY**

### Prometheus and Grafana Setup
```bash
# 1. Create Monitoring Directory
mkdir -p ~/ryha-ai-monitoring
cd ~/ryha-ai-monitoring

# 2. Create docker-compose.yml for Monitoring Stack
cat > docker-compose.yml << EOF
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana

volumes:
  grafana-storage:
EOF

# 3. Create Prometheus Configuration
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
EOF

# 4. Start Monitoring Stack
docker-compose up -d

# 5. Access Services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

---

## 🔧 **DEVELOPMENT TOOLS CONFIGURATION**

### VS Code Setup with Extensions
```bash
# 1. Install VS Code
# Download from: https://code.visualstudio.com/download

# 2. Install Essential Extensions via CLI
code --install-extension ms-python.python
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools
code --install-extension GitLab.gitlab-workflow
code --install-extension esbenp.prettier-vscode
code --install-extension ms-python.black-formatter
code --install-extension ms-python.isort
code --install-extension ms-python.pylint

# 3. Create Workspace Settings
mkdir -p .vscode
cat > .vscode/settings.json << EOF
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.formatting.provider": "black",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    },
    "files.exclude": {
        "**/__pycache__": true,
        "**/*.pyc": true
    }
}
EOF
```

### Git Configuration
```bash
# 1. Configure Git Global Settings
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main

# 2. Setup SSH Key for GitHub
ssh-keygen -t ed25519 -C "your.email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copy this key to GitHub: Settings > SSH and GPG keys > New SSH key

# 3. Test SSH Connection
ssh -T git@github.com

# 4. Setup Git Hooks (Optional)
cat > .git/hooks/pre-commit << EOF
#!/bin/sh
# Run security checks before commit
bandit -r src/ || exit 1
safety check || exit 1
pytest tests/ || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

---

## ✅ **VERIFICATION CHECKLIST**

### Cloud Platforms Verification
```bash
# Verify GCP
gcloud projects list
gcloud container clusters list
kubectl config get-contexts

# Verify AWS
aws sts get-caller-identity
aws eks list-clusters
eksctl get cluster

# Verify Azure
az account show
az aks list
az group list
```

### Local Environment Verification
```bash
# Verify Development Tools
docker --version
python --version
node --version
kubectl version --client
helm version

# Verify Security Tools
nmap --version
sqlmap --version
bandit --version
trivy --version

# Verify Databases
psql --version
redis-cli --version
curl -X GET "localhost:9200"
```

### Services Health Check
```bash
# Check Local Services
docker ps
systemctl status postgresql
systemctl status redis

# Check Kubernetes Clusters
kubectl get nodes --all-namespaces
kubectl get pods --all-namespaces

# Check Monitoring
curl http://localhost:9090/api/v1/status/config
curl http://localhost:3000/api/health
```

---

## 🚀 **NEXT STEPS AFTER SETUP**

### 1. Initialize Project Structure
```bash
# Clone your repository
git clone https://github.com/yourusername/ryha-ai-platform.git
cd ryha-ai-platform

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
npm install
```

### 2. Setup Environment Variables
```bash
# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://ryha_user:SecurePassword123@localhost:5432/ryha_ai_dev
REDIS_URL=redis://localhost:6379/0

# Cloud Configuration
GCP_PROJECT_ID=ryha-ai-platform-dev
AWS_REGION=us-east-1
AZURE_RESOURCE_GROUP=ryha-ai-dev

# API Keys (Update with real values)
VIRUSTOTAL_API_KEY=your_virustotal_api_key
SHODAN_API_KEY=your_shodan_api_key
SECURITYTRAILS_API_KEY=your_securitytrails_api_key
EOF
```

### 3. Run Initial Tests
```bash
# Test Python environment
python -c "import sys; print(sys.version)"

# Test Node.js environment
node -e "console.log(process.version)"

# Test Database connections
python -c "import psycopg2; print('PostgreSQL connection OK')"
python -c "import redis; r=redis.Redis(); print('Redis connection OK')"

# Run security tools test
bandit --version
safety --version
```

---

## 📞 **TROUBLESHOOTING COMMON ISSUES**

### Docker Issues
```bash
# Permission denied (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Docker daemon not running
sudo systemctl start docker
sudo systemctl enable docker
```

### Kubernetes Issues
```bash
# Context not found
kubectl config get-contexts
kubectl config use-context CONTEXT_NAME

# Permission denied
kubectl auth can-i create pods
```

### Database Connection Issues
```bash
# PostgreSQL connection refused
sudo systemctl status postgresql
sudo systemctl start postgresql

# Redis connection refused
sudo systemctl status redis
sudo systemctl start redis
```

**🎯 SETUP COMPLETE! You now have a fully configured development environment ready for building the Ryha AI Cybersecurity Platform!** 🚀