# Testing & Quality Assurance

**Comprehensive Testing Strategy for Ryha AI Platform**

---

## 26.1 Testing Overview

The Ryha AI platform implements a **multi-layered testing strategy** ensuring security, reliability, and performance across all components, from individual agents to the complete distributed system.

### 🎯 Testing Philosophy

```yaml
Testing Principles:
  Security-First Testing:
    - Security tests run before functional tests
    - Vulnerability scanning integrated in CI/CD
    - Penetration testing against our own platform
    - Compliance validation automation
    
  Quality Gates:
    - 90%+ code coverage requirement
    - Zero critical security vulnerabilities
    - Performance benchmarks must pass
    - Integration tests must pass 100%
    
  Continuous Testing:
    - Tests run on every commit
    - Production monitoring as testing
    - Automated regression testing
    - Chaos engineering for resilience
```

---

## 26.2 Unit Testing Framework

### 🧪 Python Unit Tests

#### Agent Unit Testing
```python
# tests/agents/test_nova_recon_agent.py
import pytest
from unittest.mock import Mock, patch, AsyncMock
from ryha.agents.web_app_team.nova_recon_agent import NovaReconAgent
from ryha.core.types import JobContext, Target, Finding

class TestNovaReconAgent:
    """Comprehensive unit tests for Nova Recon Agent"""
    
    def setup_method(self):
        """Setup test environment before each test"""
        self.agent = NovaReconAgent(
            agent_id="nova-recon-test",
            config={
                'timeout': 300,
                'max_subdomains': 100,
                'rate_limit': 10
            }
        )
        self.mock_context = JobContext(
            job_id="test-job-123",
            target=Target(
                domain="example.com",
                scope=['*.example.com'],
                exclusions=['admin.example.com']
            )
        )
    
    @pytest.mark.asyncio
    async def test_subdomain_discovery_success(self):
        """Test successful subdomain discovery"""
        # Mock external tool responses
        with patch('ryha.tools.subfinder.run_subfinder') as mock_subfinder, \
             patch('ryha.tools.amass.run_amass') as mock_amass:
            
            mock_subfinder.return_value = [
                'api.example.com',
                'app.example.com',
                'www.example.com'
            ]
            mock_amass.return_value = [
                'api.example.com',
                'staging.example.com',
                'dev.example.com'
            ]
            
            # Execute the test
            findings = await self.agent.discover_subdomains(self.mock_context)
            
            # Assertions
            assert len(findings) >= 4  # Unique subdomains found
            assert any(f.data.get('subdomain') == 'api.example.com' for f in findings)
            assert any(f.data.get('subdomain') == 'staging.example.com' for f in findings)
            
            # Verify tool execution
            mock_subfinder.assert_called_once_with(
                domain='example.com',
                timeout=300,
                rate_limit=10
            )
            mock_amass.assert_called_once_with(
                domain='example.com',
                timeout=300
            )
    
    @pytest.mark.asyncio
    async def test_scope_validation(self):
        """Test that agent respects target scope"""
        with patch('ryha.tools.subfinder.run_subfinder') as mock_subfinder:
            mock_subfinder.return_value = [
                'api.example.com',     # In scope
                'admin.example.com',   # Excluded
                'external.other.com'   # Out of scope
            ]
            
            findings = await self.agent.discover_subdomains(self.mock_context)
            
            # Should only include in-scope targets
            found_subdomains = [f.data.get('subdomain') for f in findings]
            assert 'api.example.com' in found_subdomains
            assert 'admin.example.com' not in found_subdomains
            assert 'external.other.com' not in found_subdomains
    
    @pytest.mark.asyncio
    async def test_error_handling_tool_failure(self):
        """Test error handling when tools fail"""
        with patch('ryha.tools.subfinder.run_subfinder') as mock_subfinder:
            mock_subfinder.side_effect = Exception("Tool execution failed")
            
            # Should handle error gracefully
            findings = await self.agent.discover_subdomains(self.mock_context)
            
            # Should return error finding
            assert len(findings) == 1
            assert findings[0].severity == 'info'
            assert 'error' in findings[0].title.lower()
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self):
        """Test rate limiting compliance"""
        with patch('asyncio.sleep') as mock_sleep:
            await self.agent.execute(self.mock_context)
            
            # Verify rate limiting was applied
            mock_sleep.assert_called()
    
    def test_configuration_validation(self):
        """Test agent configuration validation"""
        # Test invalid configuration
        with pytest.raises(ValueError):
            NovaReconAgent(
                agent_id="test",
                config={'timeout': -1}  # Invalid timeout
            )
        
        # Test missing required config
        with pytest.raises(KeyError):
            NovaReconAgent(
                agent_id="test",
                config={}  # Missing required config
            )

    @pytest.mark.performance
    def test_performance_benchmarks(self):
        """Test agent performance meets requirements"""
        import time
        
        start_time = time.time()
        
        # Run performance test with mock data
        with patch('ryha.tools.subfinder.run_subfinder') as mock_tool:
            mock_tool.return_value = ['test.example.com'] * 50
            
            # Execute synchronous version for timing
            result = self.agent.process_subdomains(['test.example.com'] * 50)
            
        execution_time = time.time() - start_time
        
        # Performance requirements
        assert execution_time < 5.0  # Must complete within 5 seconds
        assert len(result) <= 100    # Should not exceed max_subdomains config
```

#### Master Orchestrator Unit Tests
```python
# tests/core/test_master_orchestrator.py
import pytest
from unittest.mock import Mock, AsyncMock, patch
from ryha.core.master_orchestrator import MasterOrchestrator
from ryha.core.types import Job, JobStatus, AgentType

class TestMasterOrchestrator:
    """Unit tests for Master Orchestrator"""
    
    def setup_method(self):
        self.orchestrator = MasterOrchestrator()
        self.mock_job = Job(
            job_id="test-job-123",
            target_domain="example.com",
            job_type="comprehensive",
            status=JobStatus.PENDING
        )
    
    @pytest.mark.asyncio
    async def test_job_planning(self):
        """Test intelligent job planning"""
        plan = await self.orchestrator.create_execution_plan(self.mock_job)
        
        # Verify plan structure
        assert 'phases' in plan
        assert len(plan['phases']) > 0
        assert 'reconnaissance' in [p['name'] for p in plan['phases']]
        assert 'scanning' in [p['name'] for p in plan['phases']]
        
        # Verify dependencies
        recon_phase = next(p for p in plan['phases'] if p['name'] == 'reconnaissance')
        scan_phase = next(p for p in plan['phases'] if p['name'] == 'scanning')
        
        assert 'reconnaissance' in scan_phase.get('depends_on', [])
    
    @pytest.mark.asyncio
    async def test_agent_coordination(self):
        """Test agent coordination and communication"""
        with patch('ryha.agents.web_app_team.nova_recon_agent.NovaReconAgent.execute') as mock_execute:
            mock_execute.return_value = [Mock()]  # Mock findings
            
            result = await self.orchestrator.execute_job(self.mock_job)
            
            assert result.status == JobStatus.COMPLETED
            assert len(result.findings) > 0
    
    @pytest.mark.asyncio
    async def test_error_recovery(self):
        """Test error recovery and resilience"""
        with patch('ryha.agents.web_app_team.nova_recon_agent.NovaReconAgent.execute') as mock_execute:
            mock_execute.side_effect = Exception("Agent failure")
            
            result = await self.orchestrator.execute_job(self.mock_job)
            
            # Should handle error gracefully
            assert result.status == JobStatus.FAILED
            assert any('error' in f.title.lower() for f in result.findings)
    
    def test_resource_allocation(self):
        """Test dynamic resource allocation"""
        allocation = self.orchestrator.calculate_resource_requirements(self.mock_job)
        
        assert 'cpu' in allocation
        assert 'memory' in allocation
        assert 'estimated_duration' in allocation
        assert allocation['cpu'] > 0
        assert allocation['memory'] > 0
```

---

## 26.3 Integration Testing

### 🔗 API Integration Tests

#### REST API Integration Tests
```python
# tests/integration/test_api_integration.py
import pytest
import httpx
from fastapi.testclient import TestClient
from ryha.api.main import app
from ryha.core.database import get_database
from ryha.core.types import Job, User, Finding

class TestAPIIntegration:
    """Integration tests for REST API"""
    
    def setup_method(self):
        self.client = TestClient(app)
        self.test_user = {
            'email': 'test@example.com',
            'password': 'secure_password_123',
            'organization': 'Test Org'
        }
    
    def test_user_registration_and_authentication(self):
        """Test complete user registration and auth flow"""
        # Register new user
        response = self.client.post('/api/v1/auth/register', json=self.test_user)
        assert response.status_code == 201
        
        user_data = response.json()
        assert 'user_id' in user_data
        assert 'api_key' in user_data
        
        # Login with credentials
        login_response = self.client.post('/api/v1/auth/login', json={
            'email': self.test_user['email'],
            'password': self.test_user['password']
        })
        assert login_response.status_code == 200
        
        token_data = login_response.json()
        assert 'access_token' in token_data
        assert 'token_type' in token_data
        
        # Test authenticated request
        headers = {'Authorization': f'Bearer {token_data["access_token"]}'}
        profile_response = self.client.get('/api/v1/user/profile', headers=headers)
        assert profile_response.status_code == 200
    
    def test_job_lifecycle(self):
        """Test complete job lifecycle"""
        # Authenticate first
        auth_token = self._get_auth_token()
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Create new job
        job_data = {
            'target_domain': 'example.com',
            'job_type': 'comprehensive',
            'scope': ['*.example.com'],
            'exclusions': ['admin.example.com']
        }
        
        create_response = self.client.post(
            '/api/v1/jobs', 
            json=job_data, 
            headers=headers
        )
        assert create_response.status_code == 201
        
        job = create_response.json()
        job_id = job['job_id']
        
        # Check job status
        status_response = self.client.get(f'/api/v1/jobs/{job_id}', headers=headers)
        assert status_response.status_code == 200
        
        job_status = status_response.json()
        assert job_status['status'] in ['pending', 'running']
        
        # List user jobs
        list_response = self.client.get('/api/v1/jobs', headers=headers)
        assert list_response.status_code == 200
        
        jobs_list = list_response.json()
        assert any(j['job_id'] == job_id for j in jobs_list['jobs'])
    
    def test_findings_api(self):
        """Test findings retrieval and filtering"""
        auth_token = self._get_auth_token()
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Create test job first
        job_id = self._create_test_job(headers)
        
        # Get findings for job
        findings_response = self.client.get(
            f'/api/v1/jobs/{job_id}/findings', 
            headers=headers
        )
        assert findings_response.status_code == 200
        
        # Test filtering by severity
        high_findings_response = self.client.get(
            f'/api/v1/jobs/{job_id}/findings?severity=high',
            headers=headers
        )
        assert high_findings_response.status_code == 200
        
        findings = high_findings_response.json()
        if findings['findings']:
            assert all(f['severity'] == 'high' for f in findings['findings'])
    
    def test_report_generation(self):
        """Test report generation API"""
        auth_token = self._get_auth_token()
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        job_id = self._create_test_job(headers)
        
        # Generate report
        report_response = self.client.post(
            f'/api/v1/jobs/{job_id}/report',
            json={'format': 'pdf', 'template': 'executive'},
            headers=headers
        )
        assert report_response.status_code == 202  # Accepted for async processing
        
        report_data = report_response.json()
        assert 'report_id' in report_data
        
        # Check report status
        report_id = report_data['report_id']
        status_response = self.client.get(
            f'/api/v1/reports/{report_id}/status',
            headers=headers
        )
        assert status_response.status_code == 200
    
    def test_api_rate_limiting(self):
        """Test API rate limiting"""
        auth_token = self._get_auth_token()
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Make multiple rapid requests
        responses = []
        for i in range(100):
            response = self.client.get('/api/v1/user/profile', headers=headers)
            responses.append(response)
            
            if response.status_code == 429:  # Rate limited
                break
        
        # Should eventually get rate limited
        assert any(r.status_code == 429 for r in responses)
    
    def test_input_validation(self):
        """Test API input validation"""
        auth_token = self._get_auth_token()
        headers = {'Authorization': f'Bearer {auth_token}'}
        
        # Test invalid domain
        invalid_job = {
            'target_domain': 'invalid..domain',
            'job_type': 'comprehensive'
        }
        
        response = self.client.post('/api/v1/jobs', json=invalid_job, headers=headers)
        assert response.status_code == 422
        
        # Test SQL injection attempt
        malicious_job = {
            'target_domain': "example.com'; DROP TABLE jobs; --",
            'job_type': 'comprehensive'
        }
        
        response = self.client.post('/api/v1/jobs', json=malicious_job, headers=headers)
        assert response.status_code == 422
    
    def _get_auth_token(self):
        """Helper to get authentication token"""
        # Register and login user
        self.client.post('/api/v1/auth/register', json=self.test_user)
        login_response = self.client.post('/api/v1/auth/login', json={
            'email': self.test_user['email'],
            'password': self.test_user['password']
        })
        return login_response.json()['access_token']
    
    def _create_test_job(self, headers):
        """Helper to create test job"""
        job_data = {
            'target_domain': 'test.example.com',
            'job_type': 'basic'
        }
        response = self.client.post('/api/v1/jobs', json=job_data, headers=headers)
        return response.json()['job_id']
```

### 🔄 Agent Integration Tests

#### Multi-Agent Coordination Tests
```python
# tests/integration/test_agent_coordination.py
import pytest
import asyncio
from unittest.mock import Mock, patch
from ryha.core.master_orchestrator import MasterOrchestrator
from ryha.agents.web_app_team.nova_recon_agent import NovaReconAgent
from ryha.agents.web_app_team.vega_scan_agent import VegaScanAgent

class TestAgentCoordination:
    """Integration tests for multi-agent coordination"""
    
    def setup_method(self):
        self.orchestrator = MasterOrchestrator()
        
    @pytest.mark.asyncio
    async def test_reconnaissance_to_scanning_flow(self):
        """Test data flow from reconnaissance to scanning agents"""
        # Mock external dependencies
        with patch('ryha.tools.subfinder.run_subfinder') as mock_subfinder, \
             patch('ryha.tools.nuclei.run_nuclei') as mock_nuclei:
            
            # Setup mock responses
            mock_subfinder.return_value = [
                'api.example.com',
                'app.example.com'
            ]
            mock_nuclei.return_value = [
                {
                    'host': 'api.example.com',
                    'vulnerability': 'Open API endpoint',
                    'severity': 'medium'
                }
            ]
            
            # Create test job
            job = Mock()
            job.target_domain = 'example.com'
            job.job_type = 'comprehensive'
            
            # Execute job with coordination
            result = await self.orchestrator.execute_job(job)
            
            # Verify coordination worked
            assert result.status == 'completed'
            assert len(result.findings) > 0
            
            # Verify data was passed between agents
            recon_findings = [f for f in result.findings if f.agent_type == 'nova-recon']
            scan_findings = [f for f in result.findings if f.agent_type == 'vega-scan']
            
            assert len(recon_findings) > 0
            assert len(scan_findings) > 0
            
            # Verify scan agent used recon results
            mock_nuclei.assert_called()
            call_args = mock_nuclei.call_args
            assert 'api.example.com' in str(call_args) or 'app.example.com' in str(call_args)
    
    @pytest.mark.asyncio
    async def test_parallel_agent_execution(self):
        """Test parallel execution of independent agents"""
        start_time = asyncio.get_event_loop().time()
        
        # Create agents that can run in parallel
        agents = [
            NovaReconAgent(agent_id="recon-1"),
            NovaReconAgent(agent_id="recon-2"),
            NovaReconAgent(agent_id="recon-3")
        ]
        
        # Execute in parallel
        tasks = [agent.execute(Mock()) for agent in agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        execution_time = asyncio.get_event_loop().time() - start_time
        
        # Parallel execution should be faster than sequential
        assert execution_time < 30  # Should complete quickly in parallel
        assert len(results) == 3
    
    @pytest.mark.asyncio
    async def test_error_propagation(self):
        """Test error handling across agent coordination"""
        with patch('ryha.agents.web_app_team.nova_recon_agent.NovaReconAgent.execute') as mock_execute:
            mock_execute.side_effect = Exception("Network error")
            
            job = Mock()
            job.target_domain = 'example.com'
            
            result = await self.orchestrator.execute_job(job)
            
            # Error should be handled gracefully
            assert result.status == 'failed'
            assert any('error' in f.title.lower() for f in result.findings)
```

---

## 26.4 End-to-End Testing

### 🌐 E2E Test Suite

#### Complete Platform E2E Tests
```python
# tests/e2e/test_platform_e2e.py
import pytest
import asyncio
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import requests

class TestPlatformE2E:
    """End-to-end tests for complete platform functionality"""
    
    def setup_method(self):
        # Setup headless Chrome for web testing
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.base_url = "https://app.ryha-ai.com"  # Test environment
        self.api_url = "https://api.ryha-ai.com"
    
    def teardown_method(self):
        if self.driver:
            self.driver.quit()
    
    def test_complete_penetration_testing_workflow(self):
        """Test complete penetration testing workflow"""
        
        # Step 1: User Registration and Login
        self._register_and_login()
        
        # Step 2: Create New Penetration Test Job
        job_id = self._create_penetration_test_job()
        
        # Step 3: Monitor Job Execution
        self._monitor_job_execution(job_id)
        
        # Step 4: Review Findings
        findings = self._review_findings(job_id)
        assert len(findings) > 0
        
        # Step 5: Generate Report
        report_url = self._generate_and_download_report(job_id)
        assert report_url is not None
        
        # Step 6: Verify Report Content
        self._verify_report_content(report_url)
    
    def test_api_and_ui_consistency(self):
        """Test consistency between API and UI"""
        
        # Login via UI
        self._register_and_login()
        
        # Get API token from UI
        api_token = self._get_api_token_from_ui()
        
        # Create job via API
        api_job = self._create_job_via_api(api_token)
        
        # Verify job appears in UI
        ui_jobs = self._get_jobs_from_ui()
        assert any(job['id'] == api_job['job_id'] for job in ui_jobs)
        
        # Verify job details match
        ui_job_details = self._get_job_details_from_ui(api_job['job_id'])
        assert ui_job_details['target_domain'] == api_job['target_domain']
    
    def test_real_time_updates(self):
        """Test real-time job progress updates"""
        
        self._register_and_login()
        job_id = self._create_penetration_test_job()
        
        # Monitor real-time updates
        updates_received = []
        start_time = time.time()
        
        while time.time() - start_time < 300:  # Monitor for 5 minutes
            # Check for UI updates
            status_element = self.driver.find_element(By.ID, f"job-status-{job_id}")
            current_status = status_element.text
            
            if current_status not in updates_received:
                updates_received.append(current_status)
            
            if current_status == "Completed":
                break
                
            time.sleep(10)  # Check every 10 seconds
        
        # Should have received multiple status updates
        assert len(updates_received) >= 3
        assert "Running" in updates_received
        assert "Completed" in updates_received
    
    def test_multi_user_isolation(self):
        """Test user data isolation"""
        
        # Create two different users
        user1_token = self._create_user_and_get_token("user1@example.com")
        user2_token = self._create_user_and_get_token("user2@example.com")
        
        # User 1 creates a job
        user1_job = self._create_job_via_api(user1_token)
        
        # User 2 should not see User 1's job
        user2_jobs = self._get_jobs_via_api(user2_token)
        assert not any(job['job_id'] == user1_job['job_id'] for job in user2_jobs)
        
        # User 2 should get 403 when accessing User 1's job
        response = requests.get(
            f"{self.api_url}/api/v1/jobs/{user1_job['job_id']}",
            headers={'Authorization': f'Bearer {user2_token}'}
        )
        assert response.status_code == 403
    
    def test_performance_under_load(self):
        """Test platform performance under load"""
        
        # Create multiple concurrent jobs
        tokens = []
        for i in range(5):
            token = self._create_user_and_get_token(f"loadtest{i}@example.com")
            tokens.append(token)
        
        # Create jobs concurrently
        start_time = time.time()
        
        job_ids = []
        for token in tokens:
            job = self._create_job_via_api(token)
            job_ids.append(job['job_id'])
        
        creation_time = time.time() - start_time
        
        # All jobs should be created within reasonable time
        assert creation_time < 30  # 30 seconds for 5 jobs
        
        # Monitor all jobs to completion
        start_execution = time.time()
        
        completed_jobs = 0
        while completed_jobs < len(job_ids) and time.time() - start_execution < 1800:  # 30 min timeout
            for i, job_id in enumerate(job_ids):
                status = self._get_job_status_via_api(tokens[i], job_id)
                if status == 'completed':
                    completed_jobs += 1
            
            time.sleep(30)  # Check every 30 seconds
        
        assert completed_jobs == len(job_ids)
    
    # Helper methods
    def _register_and_login(self):
        """Helper to register and login user"""
        self.driver.get(f"{self.base_url}/register")
        
        # Fill registration form
        self.driver.find_element(By.ID, "email").send_keys("test@example.com")
        self.driver.find_element(By.ID, "password").send_keys("SecurePassword123!")
        self.driver.find_element(By.ID, "company").send_keys("Test Company")
        self.driver.find_element(By.ID, "submit-register").click()
        
        # Wait for redirect to dashboard
        time.sleep(3)
        assert "/dashboard" in self.driver.current_url
    
    def _create_penetration_test_job(self):
        """Helper to create penetration test job"""
        self.driver.find_element(By.ID, "new-job-button").click()
        
        # Fill job form
        self.driver.find_element(By.ID, "target-domain").send_keys("example.com")
        self.driver.find_element(By.ID, "job-type").send_keys("comprehensive")
        self.driver.find_element(By.ID, "scope").send_keys("*.example.com")
        self.driver.find_element(By.ID, "create-job").click()
        
        # Get job ID from URL or response
        time.sleep(2)
        job_id = self.driver.current_url.split("/")[-1]
        return job_id
    
    def _monitor_job_execution(self, job_id):
        """Helper to monitor job execution"""
        start_time = time.time()
        
        while time.time() - start_time < 1800:  # 30 minute timeout
            status_element = self.driver.find_element(By.ID, "job-status")
            status = status_element.text
            
            if status == "Completed":
                return True
            elif status == "Failed":
                pytest.fail(f"Job {job_id} failed during execution")
            
            time.sleep(30)
        
        pytest.fail(f"Job {job_id} did not complete within timeout")
    
    def _create_user_and_get_token(self, email):
        """Helper to create user and get API token"""
        # Registration
        response = requests.post(f"{self.api_url}/api/v1/auth/register", json={
            'email': email,
            'password': 'SecurePassword123!',
            'company': 'Test Company'
        })
        assert response.status_code == 201
        
        # Login
        response = requests.post(f"{self.api_url}/api/v1/auth/login", json={
            'email': email,
            'password': 'SecurePassword123!'
        })
        assert response.status_code == 200
        return response.json()['access_token']
```

---

## 26.5 Security Testing

### 🔒 Security Test Suite

#### Vulnerability Testing
```python
# tests/security/test_security_vulnerabilities.py
import pytest
import requests
import json
from urllib.parse import quote
import subprocess

class TestSecurityVulnerabilities:
    """Security vulnerability tests"""
    
    def setup_method(self):
        self.base_url = "https://api.ryha-ai.com"
        self.auth_token = self._get_test_token()
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        
        # Test various SQL injection payloads
        payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users (admin) VALUES (1); --"
        ]
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        for payload in payloads:
            # Test in domain parameter
            response = requests.post(
                f"{self.base_url}/api/v1/jobs",
                json={'target_domain': payload, 'job_type': 'basic'},
                headers=headers
            )
            
            # Should reject malicious input
            assert response.status_code == 422
            
            # Test in query parameters
            response = requests.get(
                f"{self.base_url}/api/v1/jobs?search={quote(payload)}",
                headers=headers
            )
            
            # Should not cause internal server error
            assert response.status_code != 500
    
    def test_xss_prevention(self):
        """Test XSS prevention"""
        
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ]
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        for payload in xss_payloads:
            # Test in job creation
            response = requests.post(
                f"{self.base_url}/api/v1/jobs",
                json={
                    'target_domain': 'example.com',
                    'job_type': 'basic',
                    'notes': payload  # XSS in notes field
                },
                headers=headers
            )
            
            if response.status_code == 201:
                job_data = response.json()
                
                # Retrieve job and check if XSS is sanitized
                job_response = requests.get(
                    f"{self.base_url}/api/v1/jobs/{job_data['job_id']}",
                    headers=headers
                )
                
                job_details = job_response.json()
                
                # XSS payload should be sanitized
                assert '<script>' not in job_details.get('notes', '')
                assert 'javascript:' not in job_details.get('notes', '')
    
    def test_authentication_bypass_attempts(self):
        """Test authentication bypass prevention"""
        
        # Test accessing protected endpoints without token
        protected_endpoints = [
            '/api/v1/jobs',
            '/api/v1/user/profile',
            '/api/v1/jobs/123/findings'
        ]
        
        for endpoint in protected_endpoints:
            response = requests.get(f"{self.base_url}{endpoint}")
            assert response.status_code == 401
        
        # Test with invalid token
        invalid_headers = {'Authorization': 'Bearer invalid_token_here'}
        for endpoint in protected_endpoints:
            response = requests.get(f"{self.base_url}{endpoint}", headers=invalid_headers)
            assert response.status_code == 401
    
    def test_authorization_bypass_attempts(self):
        """Test authorization bypass prevention (IDOR)"""
        
        # Create two users
        user1_token = self._create_test_user("user1@test.com")
        user2_token = self._create_test_user("user2@test.com")
        
        # User 1 creates a job
        response = requests.post(
            f"{self.base_url}/api/v1/jobs",
            json={'target_domain': 'example.com', 'job_type': 'basic'},
            headers={'Authorization': f'Bearer {user1_token}'}
        )
        job_data = response.json()
        job_id = job_data['job_id']
        
        # User 2 tries to access User 1's job (IDOR attempt)
        response = requests.get(
            f"{self.base_url}/api/v1/jobs/{job_id}",
            headers={'Authorization': f'Bearer {user2_token}'}
        )
        assert response.status_code == 403
    
    def test_rate_limiting_security(self):
        """Test rate limiting for security"""
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        # Make rapid requests to trigger rate limiting
        responses = []
        for i in range(200):
            response = requests.get(f"{self.base_url}/api/v1/user/profile", headers=headers)
            responses.append(response.status_code)
            
            if response.status_code == 429:
                break
        
        # Should eventually get rate limited
        assert 429 in responses
    
    def test_input_size_limits(self):
        """Test input size limits to prevent DoS"""
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        # Test large payload
        large_data = {
            'target_domain': 'example.com',
            'job_type': 'basic',
            'notes': 'A' * 1000000  # 1MB of data
        }
        
        response = requests.post(
            f"{self.base_url}/api/v1/jobs",
            json=large_data,
            headers=headers
        )
        
        # Should reject overly large payload
        assert response.status_code == 413
    
    def test_security_headers(self):
        """Test security headers presence"""
        
        response = requests.get(f"{self.base_url}/api/v1/health")
        
        # Check for security headers
        assert 'X-Content-Type-Options' in response.headers
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        
        assert 'X-Frame-Options' in response.headers
        assert response.headers['X-Frame-Options'] == 'DENY'
        
        assert 'X-XSS-Protection' in response.headers
        assert 'Strict-Transport-Security' in response.headers
    
    def test_tls_configuration(self):
        """Test TLS configuration security"""
        
        # Use external tool to test TLS
        result = subprocess.run([
            'testssl.sh',
            '--quiet',
            '--jsonfile', '/tmp/tls_test.json',
            f"{self.base_url.replace('https://', '')}"
        ], capture_output=True, text=True)
        
        # Parse results
        with open('/tmp/tls_test.json', 'r') as f:
            tls_results = json.load(f)
        
        # Check for secure TLS configuration
        assert any(
            protocol.get('finding') == 'TLS 1.3' 
            for protocol in tls_results.get('protocols', [])
        )
        
        # Should not support weak protocols
        weak_protocols = ['SSLv2', 'SSLv3', 'TLS 1.0']
        for protocol in tls_results.get('protocols', []):
            assert protocol.get('finding') not in weak_protocols
    
    def _get_test_token(self):
        """Helper to get test authentication token"""
        response = requests.post(f"{self.base_url}/api/v1/auth/register", json={
            'email': 'security-test@example.com',
            'password': 'SecureTestPassword123!',
            'company': 'Security Test'
        })
        
        login_response = requests.post(f"{self.base_url}/api/v1/auth/login", json={
            'email': 'security-test@example.com',
            'password': 'SecureTestPassword123!'
        })
        
        return login_response.json()['access_token']
    
    def _create_test_user(self, email):
        """Helper to create test user and return token"""
        requests.post(f"{self.base_url}/api/v1/auth/register", json={
            'email': email,
            'password': 'TestPassword123!',
            'company': 'Test Company'
        })
        
        login_response = requests.post(f"{self.base_url}/api/v1/auth/login", json={
            'email': email,
            'password': 'TestPassword123!'
        })
        
        return login_response.json()['access_token']
```

---

## 26.6 Performance Testing

### ⚡ Load Testing Suite

#### Apache JMeter Test Plans
```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Ryha AI Load Test">
      <stringProp name="TestPlan.comments">Load testing for Ryha AI Platform</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    
    <hashTree>
      <!-- Load Test Scenario 1: API Baseline Performance -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="API Baseline Load">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">100</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
      </ThreadGroup>
      
      <hashTree>
        <!-- HTTP Request for Job Creation -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Create Job Request">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{"target_domain": "test${__threadNum}.example.com", "job_type": "basic"}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">api.ryha-ai.com</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.path">/api/v1/jobs</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        
        <!-- Response Assertions -->
        <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Assertion">
          <collectionProp name="Asserion.test_strings">
            <stringProp name="1482051582">job_id</stringProp>
          </collectionProp>
          <stringProp name="Assertion.test_field">Assertion.response_data</stringProp>
          <boolProp name="Assertion.assume_success">false</boolProp>
          <intProp name="Assertion.test_type">2</intProp>
        </ResponseAssertion>
        
        <!-- Duration Assertion -->
        <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="Duration Assertion">
          <stringProp name="DurationAssertion.duration">2000</stringProp>
        </DurationAssertion>
      </hashTree>
      
      <!-- Load Test Scenario 2: High Concurrency Job Execution -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="High Concurrency Test">
        <stringProp name="ThreadGroup.num_threads">200</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <stringProp name="LoopController.loops">10</stringProp>
        </elementProp>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

#### Python Performance Tests
```python
# tests/performance/test_performance_benchmarks.py
import pytest
import time
import asyncio
import statistics
from concurrent.futures import ThreadPoolExecutor
import requests

class TestPerformanceBenchmarks:
    """Performance benchmark tests"""
    
    def setup_method(self):
        self.base_url = "https://api.ryha-ai.com"
        self.auth_token = self._get_test_token()
        self.performance_thresholds = {
            'api_response_time': 2.0,  # seconds
            'job_creation_time': 5.0,  # seconds
            'concurrent_requests': 100,  # simultaneous requests
            'throughput': 50  # requests per second
        }
    
    def test_api_response_time_benchmark(self):
        """Benchmark API response times"""
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response_times = []
        
        # Test 100 requests
        for i in range(100):
            start_time = time.time()
            
            response = requests.get(
                f"{self.base_url}/api/v1/user/profile",
                headers=headers
            )
            
            response_time = time.time() - start_time
            response_times.append(response_time)
            
            assert response.status_code == 200
        
        # Calculate statistics
        avg_response_time = statistics.mean(response_times)
        p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
        p99_response_time = statistics.quantiles(response_times, n=100)[98]  # 99th percentile
        
        # Performance assertions
        assert avg_response_time < self.performance_thresholds['api_response_time']
        assert p95_response_time < self.performance_thresholds['api_response_time'] * 1.5
        assert p99_response_time < self.performance_thresholds['api_response_time'] * 2
        
        print(f"Average response time: {avg_response_time:.3f}s")
        print(f"95th percentile: {p95_response_time:.3f}s")
        print(f"99th percentile: {p99_response_time:.3f}s")
    
    def test_concurrent_job_creation(self):
        """Test concurrent job creation performance"""
        
        def create_job(thread_num):
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            start_time = time.time()
            
            response = requests.post(
                f"{self.base_url}/api/v1/jobs",
                json={
                    'target_domain': f'test{thread_num}.example.com',
                    'job_type': 'basic'
                },
                headers=headers
            )
            
            creation_time = time.time() - start_time
            return {
                'status_code': response.status_code,
                'response_time': creation_time,
                'job_id': response.json().get('job_id') if response.status_code == 201 else None
            }
        
        # Test with multiple concurrent threads
        with ThreadPoolExecutor(max_workers=20) as executor:
            start_time = time.time()
            
            futures = [executor.submit(create_job, i) for i in range(50)]
            results = [future.result() for future in futures]
            
            total_time = time.time() - start_time
        
        # Analyze results
        successful_requests = [r for r in results if r['status_code'] == 201]
        response_times = [r['response_time'] for r in successful_requests]
        
        # Performance assertions
        assert len(successful_requests) >= 45  # At least 90% success rate
        assert statistics.mean(response_times) < self.performance_thresholds['job_creation_time']
        assert total_time < 60  # Should complete within 1 minute
        
        print(f"Successfully created {len(successful_requests)} jobs in {total_time:.2f}s")
        print(f"Average job creation time: {statistics.mean(response_times):.3f}s")
    
    def test_throughput_benchmark(self):
        """Test API throughput under sustained load"""
        
        def make_request():
            headers = {'Authorization': f'Bearer {self.auth_token}'}
            start_time = time.time()
            
            response = requests.get(
                f"{self.base_url}/api/v1/jobs",
                headers=headers
            )
            
            return {
                'response_time': time.time() - start_time,
                'status_code': response.status_code
            }
        
        # Sustained load for 60 seconds
        test_duration = 60
        start_test = time.time()
        requests_made = 0
        successful_requests = 0
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            while time.time() - start_test < test_duration:
                batch_futures = [executor.submit(make_request) for _ in range(10)]
                batch_results = [f.result() for f in batch_futures]
                
                requests_made += len(batch_results)
                successful_requests += sum(1 for r in batch_results if r['status_code'] == 200)
                
                time.sleep(0.1)  # Brief pause between batches
        
        total_test_time = time.time() - start_test
        throughput = successful_requests / total_test_time
        success_rate = successful_requests / requests_made
        
        # Performance assertions
        assert throughput >= self.performance_thresholds['throughput']
        assert success_rate >= 0.95  # 95% success rate
        
        print(f"Throughput: {throughput:.2f} requests/second")
        print(f"Success rate: {success_rate:.2%}")
        print(f"Total requests: {requests_made}")
    
    def test_memory_usage_under_load(self):
        """Test memory usage during high load"""
        import psutil
        
        # Monitor memory usage during load test
        def monitor_memory():
            memory_usage = []
            start_time = time.time()
            
            while time.time() - start_time < 120:  # Monitor for 2 minutes
                memory_percent = psutil.virtual_memory().percent
                memory_usage.append(memory_percent)
                time.sleep(5)
            
            return memory_usage
        
        # Start memory monitoring
        with ThreadPoolExecutor(max_workers=1) as monitor_executor:
            memory_future = monitor_executor.submit(monitor_memory)
            
            # Generate load
            with ThreadPoolExecutor(max_workers=50) as load_executor:
                load_futures = []
                
                for i in range(200):
                    future = load_executor.submit(self._make_test_request)
                    load_futures.append(future)
                    time.sleep(0.1)
                
                # Wait for load test completion
                for future in load_futures:
                    future.result()
            
            # Get memory usage results
            memory_usage = memory_future.result()
        
        # Analyze memory usage
        max_memory = max(memory_usage)
        avg_memory = statistics.mean(memory_usage)
        
        # Memory usage should be reasonable
        assert max_memory < 90  # Should not exceed 90% memory usage
        assert avg_memory < 70  # Average should be under 70%
        
        print(f"Maximum memory usage: {max_memory:.1f}%")
        print(f"Average memory usage: {avg_memory:.1f}%")
    
    def _make_test_request(self):
        """Helper method to make test request"""
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        response = requests.get(f"{self.base_url}/api/v1/jobs", headers=headers)
        return response.status_code == 200
    
    def _get_test_token(self):
        """Helper to get test authentication token"""
        # Implementation similar to previous examples
        pass
```

---

## Next Steps

1. **Review** [Deployment Architecture](../deployment/25-deployment-architecture.md)
2. **Explore** [Implementation Roadmap](../implementation/24-implementation-roadmap.md)
3. **Check** [Final Documentation Index](../README.md)

---

[← Back to Deployment Architecture](../deployment/25-deployment-architecture.md) | [Next: Final Documentation Index →](../README.md)