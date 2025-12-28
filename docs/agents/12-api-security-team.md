# API Security Team

**Specialized Agents for Comprehensive API Security Testing**

---

## 12.1 Team Overview

The **API Security Team** consists of 5 specialized agents focused on securing REST APIs, GraphQL endpoints, and microservice architectures through advanced testing methodologies.

### 👥 Team Composition

| Agent | Primary Focus | Key Capabilities | Complexity |
|-------|--------------|------------------|------------|
| **ApiHunter** | API Discovery & Enumeration | Endpoint discovery, specification analysis | Medium |
| **GraphQLScan** | GraphQL Security Testing | Query manipulation, schema introspection | High |
| **RestAssault** | REST API Vulnerability Testing | OWASP API Top 10, business logic | Very High |
| **RateLimitTest** | Rate Limiting & Throttling | DoS testing, resource exhaustion | Medium |
| **AuthzChecker** | API Authorization Testing | JWT, OAuth, API key security | High |

### 🎯 Team Coordination

```yaml
Coordination Model:
  - Sequential discovery followed by parallel testing
  - Shared API specification analysis
  - Cross-agent payload validation
  - Integrated authentication context sharing
  - Unified API security assessment reporting
```

---

## 12.2 ApiHunter Agent

### 🔍 Core Capabilities

**ApiHunter** specializes in **comprehensive API discovery and enumeration**, mapping hidden endpoints and analyzing API specifications.

#### Primary Functions
```yaml
API Discovery:
  - Passive endpoint enumeration
  - Active endpoint brute forcing
  - OpenAPI/Swagger specification analysis
  - API versioning detection
  - Hidden parameter discovery
  
Specification Analysis:
  - OpenAPI 3.0/Swagger analysis
  - GraphQL schema introspection
  - API documentation parsing
  - Endpoint relationship mapping
  - Authentication requirement analysis
```

### 🛠️ Tool Integration

| Tool | Purpose | Usage Pattern |
|------|---------|---------------|
| **ffuf** | API endpoint fuzzing | Primary discovery method |
| **gobuster** | Directory/endpoint enumeration | Comprehensive discovery |
| **arjun** | HTTP parameter discovery | Parameter enumeration |
| **kiterunner** | API endpoint discovery | Content-type aware scanning |
| **nuclei** | API-specific vulnerability templates | Initial assessment |

### 📋 Discovery Workflow

```python
class ApiHunterAgent:
    def execute_api_discovery(self, target_info):
        """Comprehensive API discovery and enumeration"""
        
        # Phase 1: Passive API Discovery
        passive_apis = self.discover_apis_passive(target_info)
        
        # Phase 2: Active Endpoint Enumeration
        active_endpoints = self.enumerate_endpoints_active(target_info)
        
        # Phase 3: Specification Discovery
        api_specs = self.discover_api_specifications(target_info)
        
        # Phase 4: Parameter Discovery
        hidden_params = self.discover_hidden_parameters(active_endpoints)
        
        # Phase 5: Version Detection
        api_versions = self.detect_api_versions(active_endpoints)
        
        return {
            'discovered_apis': passive_apis + active_endpoints,
            'api_specifications': api_specs,
            'hidden_parameters': hidden_params,
            'api_versions': api_versions,
            'authentication_endpoints': self.identify_auth_endpoints(),
            'api_documentation': self.find_api_documentation()
        }
    
    def discover_api_specifications(self, target_info):
        """Discover and analyze API specifications"""
        specifications = []
        
        common_spec_paths = [
            '/swagger.json', '/swagger.yaml',
            '/openapi.json', '/openapi.yaml',
            '/api-docs', '/docs/swagger',
            '/graphql', '/v1/graphql',
            '/api/schema', '/schema.json'
        ]
        
        for base_url in target_info.base_urls:
            for spec_path in common_spec_paths:
                spec_url = f"{base_url}{spec_path}"
                
                try:
                    response = self.make_request(spec_url)
                    if self.is_valid_api_spec(response):
                        spec_analysis = self.analyze_api_specification(response)
                        specifications.append({
                            'url': spec_url,
                            'type': spec_analysis.spec_type,
                            'version': spec_analysis.version,
                            'endpoints': spec_analysis.endpoints,
                            'authentication': spec_analysis.auth_methods,
                            'security_issues': spec_analysis.security_concerns
                        })
                except Exception as e:
                    self.log_error(f"Error accessing {spec_url}: {e}")
                    
        return specifications
```

### 📊 API Discovery Output

```json
{
  "agent": "ApiHunter",
  "target": "api.example.com",
  "discovery_summary": {
    "total_endpoints_found": 47,
    "authenticated_endpoints": 31,
    "public_endpoints": 16,
    "api_versions": ["v1", "v2", "beta"],
    "specification_formats": ["OpenAPI 3.0", "GraphQL"]
  },
  
  "discovered_endpoints": [
    {
      "url": "https://api.example.com/v1/users",
      "methods": ["GET", "POST"],
      "authentication_required": true,
      "parameters": {
        "query_params": ["limit", "offset", "filter"],
        "body_params": ["username", "email", "password"],
        "headers": ["Authorization", "Content-Type"]
      },
      "response_formats": ["application/json"],
      "rate_limiting": {
        "detected": true,
        "limit": 1000,
        "window": "hour"
      }
    }
  ],
  
  "api_specifications": [
    {
      "type": "OpenAPI",
      "version": "3.0.2",
      "url": "https://api.example.com/openapi.json",
      "security_schemes": ["bearerAuth", "apiKeyAuth"],
      "exposed_internal_endpoints": [
        "/internal/admin/users",
        "/debug/metrics"
      ],
      "security_concerns": [
        "Sensitive endpoints exposed in specification",
        "Weak authentication schemes documented",
        "Internal server information leaked"
      ]
    }
  ]
}
```

---

## 12.3 GraphQLScan Agent

### 🕸️ Core Capabilities

**GraphQLScan** provides **specialized GraphQL security testing** covering introspection, query complexity, and GraphQL-specific vulnerabilities.

#### Primary Functions
```yaml
GraphQL Security Testing:
  - Schema introspection and analysis
  - Query complexity and depth limiting testing
  - Injection vulnerability detection (NoSQL, SQL)
  - Authorization bypass testing
  - Information disclosure testing
  
Advanced Techniques:
  - Query batching exploitation
  - Alias-based DoS attacks
  - Circular query detection
  - Field suggestion exploitation
  - Subscription abuse testing
```

### 🎯 GraphQL Testing Matrix

```python
class GraphQLScanAgent:
    def execute_graphql_security_testing(self, graphql_endpoint):
        """Comprehensive GraphQL security assessment"""
        
        findings = []
        
        # Phase 1: Schema Introspection
        introspection_results = self.test_schema_introspection(graphql_endpoint)
        findings.extend(introspection_results)
        
        # Phase 2: Query Complexity Testing
        complexity_results = self.test_query_complexity_limits(graphql_endpoint)
        findings.extend(complexity_results)
        
        # Phase 3: Authorization Testing
        authz_results = self.test_graphql_authorization(graphql_endpoint)
        findings.extend(authz_results)
        
        # Phase 4: Injection Testing
        injection_results = self.test_graphql_injections(graphql_endpoint)
        findings.extend(injection_results)
        
        # Phase 5: DoS Testing
        dos_results = self.test_graphql_dos_attacks(graphql_endpoint)
        findings.extend(dos_results)
        
        return findings
    
    def test_schema_introspection(self, endpoint):
        """Test GraphQL schema introspection vulnerabilities"""
        findings = []
        
        introspection_query = """
        query IntrospectionQuery {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
            types {
              ...FullType
            }
            directives {
              name
              description
              locations
              args {
                ...InputValue
              }
            }
          }
        }
        
        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              ...InputValue
            }
            type {
              ...TypeRef
            }
            isDeprecated
            deprecationReason
          }
          inputFields {
            ...InputValue
          }
          interfaces {
            ...TypeRef
          }
          enumValues(includeDeprecated: true) {
            name
            description
            isDeprecated
            deprecationReason
          }
          possibleTypes {
            ...TypeRef
          }
        }
        
        fragment InputValue on __InputValue {
          name
          description
          type { ...TypeRef }
          defaultValue
        }
        
        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """
        
        response = self.send_graphql_query(endpoint, introspection_query)
        
        if response.status_code == 200 and 'data' in response.json():
            schema = response.json()['data']['__schema']
            
            findings.append({
                'vulnerability': 'GraphQL Introspection Enabled',
                'severity': 'medium',
                'description': 'GraphQL introspection is enabled, exposing the entire schema',
                'evidence': {
                    'exposed_types': len(schema.get('types', [])),
                    'exposed_queries': len(schema.get('queryType', {}).get('fields', [])),
                    'exposed_mutations': len(schema.get('mutationType', {}).get('fields', [])),
                    'sensitive_fields': self.identify_sensitive_fields(schema)
                },
                'impact': 'Information disclosure of API structure and business logic',
                'remediation': 'Disable introspection in production environments'
            })
            
        return findings
    
    def test_query_complexity_limits(self, endpoint):
        """Test GraphQL query complexity and depth limits"""
        findings = []
        
        # Test depth limit bypass
        deeply_nested_query = self.generate_deeply_nested_query(depth=50)
        depth_response = self.send_graphql_query(endpoint, deeply_nested_query)
        
        if depth_response.status_code == 200:
            findings.append({
                'vulnerability': 'GraphQL Query Depth Limit Not Enforced',
                'severity': 'medium',
                'description': 'Server accepts deeply nested queries that could cause DoS',
                'evidence': {
                    'max_depth_tested': 50,
                    'response_time': depth_response.elapsed.total_seconds(),
                    'status_code': depth_response.status_code
                }
            })
            
        # Test complexity limit bypass using aliases
        complex_alias_query = self.generate_complex_alias_query(aliases=1000)
        alias_response = self.send_graphql_query(endpoint, complex_alias_query)
        
        if alias_response.status_code == 200:
            findings.append({
                'vulnerability': 'GraphQL Query Complexity Limit Not Enforced', 
                'severity': 'high',
                'description': 'Server accepts complex queries with many aliases, potential DoS',
                'evidence': {
                    'aliases_count': 1000,
                    'response_time': alias_response.elapsed.total_seconds(),
                    'resource_consumption': 'high'
                }
            })
            
        return findings
```

### 🔍 GraphQL Injection Testing

```python
def test_graphql_injections(self, endpoint):
    """Test for injection vulnerabilities in GraphQL"""
    findings = []
    
    # SQL Injection payloads for GraphQL
    sql_payloads = [
        "' OR 1=1--",
        "') OR 1=1--", 
        "\"; DROP TABLE users; --",
        "' UNION SELECT password FROM users--"
    ]
    
    # NoSQL Injection payloads
    nosql_payloads = [
        "' || this.password != 'invalid' || '",
        "'; return db.users.find(); var t='",
        "' || 1==1 || '"
    ]
    
    # Test in various GraphQL contexts
    for field in self.get_string_fields(endpoint):
        for payload in sql_payloads + nosql_payloads:
            injection_query = f"""
            query {{
                {field}(input: "{payload}") {{
                    id
                    name
                }}
            }}
            """
            
            response = self.send_graphql_query(endpoint, injection_query)
            
            if self.detect_injection_success(response):
                findings.append({
                    'vulnerability': 'GraphQL Injection Vulnerability',
                    'severity': 'critical',
                    'field': field,
                    'payload': payload,
                    'injection_type': self.classify_injection_type(payload),
                    'evidence': response.text[:500]
                })
                
    return findings
```

---

## 12.4 RestAssault Agent

### ⚔️ Core Capabilities

**RestAssault** performs **comprehensive REST API security testing** focusing on the OWASP API Security Top 10 and advanced business logic vulnerabilities.

#### Primary Functions
```yaml
OWASP API Top 10 Testing:
  - API1: Broken Object Level Authorization
  - API2: Broken User Authentication  
  - API3: Excessive Data Exposure
  - API4: Lack of Resources & Rate Limiting
  - API5: Broken Function Level Authorization
  - API6: Mass Assignment
  - API7: Security Misconfiguration
  - API8: Injection
  - API9: Improper Assets Management
  - API10: Insufficient Logging & Monitoring
  
Advanced Testing:
  - Business logic manipulation
  - API versioning vulnerabilities
  - HTTP method tampering
  - Content-type confusion attacks
  - API chaining exploitation
```

### 📊 OWASP API Top 10 Testing Matrix

```python
class RestAssaultAgent:
    def execute_comprehensive_api_testing(self, api_endpoints):
        """Execute OWASP API Security Top 10 testing"""
        
        findings = []
        
        for endpoint in api_endpoints:
            # API1: Broken Object Level Authorization
            bola_findings = self.test_broken_object_level_authorization(endpoint)
            findings.extend(bola_findings)
            
            # API2: Broken User Authentication
            auth_findings = self.test_broken_authentication(endpoint)
            findings.extend(auth_findings)
            
            # API3: Excessive Data Exposure
            data_exposure_findings = self.test_excessive_data_exposure(endpoint)
            findings.extend(data_exposure_findings)
            
            # API4: Lack of Resources & Rate Limiting
            rate_limit_findings = self.test_rate_limiting(endpoint)
            findings.extend(rate_limit_findings)
            
            # API5: Broken Function Level Authorization
            bfla_findings = self.test_broken_function_level_authorization(endpoint)
            findings.extend(bfla_findings)
            
            # API6: Mass Assignment
            mass_assignment_findings = self.test_mass_assignment(endpoint)
            findings.extend(mass_assignment_findings)
            
            # Continue with remaining OWASP API Top 10...
            
        return findings
    
    def test_broken_object_level_authorization(self, endpoint):
        """Test for Broken Object Level Authorization (BOLA/IDOR)"""
        findings = []
        
        if not self.has_object_id_parameter(endpoint):
            return findings
            
        # Extract object ID patterns
        object_ids = self.extract_object_ids(endpoint)
        
        for object_id in object_ids:
            # Test horizontal privilege escalation
            test_cases = [
                # Sequential ID manipulation
                str(int(object_id) + 1) if object_id.isdigit() else None,
                str(int(object_id) - 1) if object_id.isdigit() else None,
                
                # GUID/UUID manipulation
                self.generate_similar_guid(object_id) if self.is_guid(object_id) else None,
                
                # Common test IDs
                '1', '2', '999', '1000',
                'admin', 'test', 'user',
                '00000000-0000-0000-0000-000000000000'
            ]
            
            for test_id in filter(None, test_cases):
                modified_endpoint = endpoint.replace(object_id, test_id)
                response = self.make_authenticated_request(modified_endpoint)
                
                if response.status_code == 200:
                    # Check if different data is returned
                    if self.is_different_user_data(response, object_id, test_id):
                        findings.append({
                            'vulnerability': 'Broken Object Level Authorization (BOLA)',
                            'severity': 'high',
                            'endpoint': endpoint,
                            'evidence': {
                                'original_id': object_id,
                                'manipulated_id': test_id,
                                'unauthorized_data_accessed': True,
                                'response_snippet': response.text[:200]
                            },
                            'impact': 'Unauthorized access to other users\' data',
                            'cwe': 'CWE-639'
                        })
                        
        return findings
    
    def test_mass_assignment(self, endpoint):
        """Test for Mass Assignment vulnerabilities"""
        findings = []
        
        if endpoint.method not in ['POST', 'PUT', 'PATCH']:
            return findings
            
        # Get original request body
        original_body = self.get_endpoint_body_template(endpoint)
        if not original_body:
            return findings
            
        # Generate test parameters for mass assignment
        mass_assignment_params = [
            'is_admin', 'admin', 'role', 'user_role', 
            'is_verified', 'verified', 'status',
            'balance', 'credit', 'points', 'level',
            'permissions', 'groups', 'scope'
        ]
        
        for param in mass_assignment_params:
            # Test with various privilege escalation values
            test_values = [True, 1, 'admin', 'administrator', 'root', 999999]
            
            for value in test_values:
                modified_body = original_body.copy()
                modified_body[param] = value
                
                response = self.make_request(
                    endpoint.url, 
                    method=endpoint.method,
                    json=modified_body
                )
                
                if response.status_code in [200, 201]:
                    # Verify if the mass-assigned parameter was accepted
                    if self.verify_mass_assignment_success(response, param, value):
                        findings.append({
                            'vulnerability': 'Mass Assignment',
                            'severity': 'high', 
                            'parameter': param,
                            'assigned_value': value,
                            'evidence': {
                                'request_body': modified_body,
                                'response_indicates_success': True
                            },
                            'impact': 'Privilege escalation through parameter injection'
                        })
                        
        return findings
```

---

## 12.5 RateLimitTest Agent

### 🚦 Core Capabilities

**RateLimitTest** specializes in **rate limiting and resource exhaustion testing**, identifying DoS vulnerabilities and resource abuse scenarios.

#### Primary Functions
```yaml
Rate Limiting Tests:
  - Request rate limit bypass
  - Concurrent connection testing
  - Resource exhaustion attacks
  - Cost-based DoS testing
  - Distributed rate limit bypass
  
Resource Testing:
  - Memory exhaustion attacks
  - CPU exhaustion testing
  - Database connection exhaustion
  - File descriptor exhaustion
  - Bandwidth consumption testing
```

### ⚡ Rate Limiting Test Suite

```python
class RateLimitTestAgent:
    def execute_rate_limiting_tests(self, api_endpoints):
        """Comprehensive rate limiting and DoS testing"""
        
        findings = []
        
        for endpoint in api_endpoints:
            # Test 1: Basic Rate Limit Detection
            rate_limit_info = self.detect_rate_limits(endpoint)
            
            # Test 2: Rate Limit Bypass Techniques
            bypass_findings = self.test_rate_limit_bypass(endpoint, rate_limit_info)
            findings.extend(bypass_findings)
            
            # Test 3: Resource Exhaustion
            resource_findings = self.test_resource_exhaustion(endpoint)
            findings.extend(resource_findings)
            
            # Test 4: Application-Level DoS
            dos_findings = self.test_application_dos(endpoint)
            findings.extend(dos_findings)
            
        return findings
    
    def test_rate_limit_bypass(self, endpoint, rate_limit_info):
        """Test various rate limit bypass techniques"""
        findings = []
        
        if not rate_limit_info.has_rate_limit:
            return findings
            
        bypass_techniques = [
            # Header-based bypass
            {'X-Originating-IP': '127.0.0.1'},
            {'X-Forwarded-For': '127.0.0.1'},
            {'X-Remote-IP': '127.0.0.1'},
            {'X-Remote-Addr': '127.0.0.1'},
            {'X-Client-IP': '127.0.0.1'},
            {'X-Real-IP': '127.0.0.1'},
            
            # User-Agent rotation
            {'User-Agent': self.get_random_user_agent()},
            
            # HTTP method bypass
            None  # Will test different HTTP methods
        ]
        
        for technique in bypass_techniques:
            if self.test_bypass_technique(endpoint, technique, rate_limit_info):
                findings.append({
                    'vulnerability': 'Rate Limit Bypass',
                    'severity': 'medium',
                    'bypass_method': technique or 'HTTP method tampering',
                    'evidence': {
                        'rate_limit_bypassed': True,
                        'requests_sent': rate_limit_info.limit * 2,
                        'success_rate': self.calculate_bypass_success_rate()
                    }
                })
                
        return findings
```

---

## 12.6 AuthzChecker Agent  

### 🔐 Core Capabilities

**AuthzChecker** focuses on **API authorization and token security testing**, specializing in JWT, OAuth, and API key vulnerabilities.

#### Primary Functions
```yaml
Authorization Testing:
  - JWT token manipulation and bypass
  - OAuth flow exploitation
  - API key enumeration and abuse
  - Scope escalation testing
  - Token lifecycle vulnerabilities
  
Advanced Techniques:
  - Algorithm confusion attacks
  - Key confusion testing
  - Token replay attacks
  - Cross-service token abuse
  - Refresh token exploitation
```

### 🔑 JWT Security Testing

```python
class AuthzCheckerAgent:
    def test_jwt_security(self, jwt_token):
        """Comprehensive JWT security testing"""
        
        findings = []
        
        # Decode JWT without verification
        try:
            header = jwt.get_unverified_header(jwt_token)
            payload = jwt.decode(jwt_token, options={"verify_signature": False})
        except Exception as e:
            return [{'error': f'Invalid JWT format: {e}'}]
            
        # Test 1: Algorithm Confusion
        alg_findings = self.test_algorithm_confusion(jwt_token, header, payload)
        findings.extend(alg_findings)
        
        # Test 2: None Algorithm Bypass
        none_alg_findings = self.test_none_algorithm_bypass(jwt_token, header, payload)
        findings.extend(none_alg_findings)
        
        # Test 3: Weak Secret Detection
        weak_secret_findings = self.test_weak_jwt_secret(jwt_token)
        findings.extend(weak_secret_findings)
        
        # Test 4: Claims Manipulation
        claims_findings = self.test_claims_manipulation(jwt_token, payload)
        findings.extend(claims_findings)
        
        # Test 5: Key Confusion Attack
        key_confusion_findings = self.test_key_confusion(jwt_token, header)
        findings.extend(key_confusion_findings)
        
        return findings
```

---

## Next Steps

1. **Review** [Static Analysis Team](./13-static-analysis-team.md)
2. **Explore** [Security & Safety](../security/14-security-safety.md)
3. **Check** [Workflows & Orchestration](../workflows/17-execution-workflows.md)

---

[← Back to Web Application Team](./11-web-application-team.md) | [Next: Static Analysis Team →](./13-static-analysis-team.md)