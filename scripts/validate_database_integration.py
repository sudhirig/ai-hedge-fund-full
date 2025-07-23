#!/usr/bin/env python3
"""
AI Hedge Fund - Database Integration Validation Script

This script validates the complete end-to-end data flow:
1. Agent analysis execution
2. Automatic database storage
3. API retrieval of stored data
4. PostgREST direct access
5. Health monitoring
"""

import asyncio
import requests
import json
import time
from datetime import datetime, timedelta
import sys
import os
from typing import Dict, List, Any

# Configuration
BACKEND_URL = "http://localhost:8000"
POSTGREST_URL = "http://localhost:3001"
TEST_TICKERS = ["AAPL", "MSFT"]
TEST_TIMEOUT = 300  # 5 minutes

class ValidationColors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class DatabaseIntegrationValidator:
    def __init__(self):
        self.test_results = []
        self.stored_prediction_ids = []
        
    def log(self, message: str, status: str = "INFO"):
        colors = {
            "PASS": ValidationColors.GREEN,
            "FAIL": ValidationColors.RED,
            "WARN": ValidationColors.YELLOW,
            "INFO": ValidationColors.BLUE
        }
        color = colors.get(status, ValidationColors.BLUE)
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"{color}[{timestamp}] {status}: {message}{ValidationColors.END}")
        
        self.test_results.append({
            "timestamp": timestamp,
            "status": status,
            "message": message
        })
    
    def test_service_health(self) -> bool:
        """Test that all services are running and healthy"""
        self.log("Testing service health...", "INFO")
        
        # Test backend health
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                
                # Check overall status
                if health_data.get("status") == "healthy":
                    self.log("✅ Backend service is healthy", "PASS")
                else:
                    self.log(f"⚠️ Backend status: {health_data.get('status', 'unknown')}", "WARN")
                
                # Check database status
                db_status = health_data.get("database", {})
                if db_status.get("connected") and db_status.get("tables_exist"):
                    self.log("✅ Database connection and tables verified", "PASS")
                    return True
                else:
                    self.log(f"❌ Database issues: {db_status}", "FAIL")
                    return False
            else:
                self.log(f"❌ Backend health check failed: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"❌ Backend health check error: {e}", "FAIL")
            return False
    
    def test_postgrest_connection(self) -> bool:
        """Test PostgREST API connection"""
        self.log("Testing PostgREST connection...", "INFO")
        
        try:
            response = requests.get(f"{POSTGREST_URL}/", timeout=10)
            if response.status_code == 200:
                self.log("✅ PostgREST API is accessible", "PASS")
                
                # Test a simple table query
                response = requests.get(f"{POSTGREST_URL}/agent_predictions?limit=1", timeout=10)
                if response.status_code == 200:
                    self.log("✅ PostgREST database queries working", "PASS")
                    return True
                else:
                    self.log(f"❌ PostgREST query failed: {response.status_code}", "FAIL")
                    return False
            else:
                self.log(f"❌ PostgREST not accessible: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"❌ PostgREST connection error: {e}", "FAIL")
            return False
    
    def run_test_analysis(self) -> Dict[str, Any]:
        """Run a test analysis to generate predictions for storage"""
        self.log("Running test analysis...", "INFO")
        
        # Prepare test request
        test_request = {
            "tickers": ",".join(TEST_TICKERS),
            "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": datetime.now().strftime("%Y-%m-%d"),
            "initial_cash": 100000
        }
        
        try:
            self.log(f"Analyzing tickers: {test_request['tickers']}", "INFO")
            response = requests.post(
                f"{BACKEND_URL}/api/run",
                json=test_request,
                timeout=TEST_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    data = result.get("data", {})
                    metadata = result.get("metadata", {})
                    
                    agents_count = len(data.get("agents", {}))
                    decisions_count = len(data.get("decisions", {}))
                    stored_predictions = metadata.get("stored_predictions", 0)
                    
                    self.log(f"✅ Analysis completed: {agents_count} agents, {decisions_count} decisions", "PASS")
                    self.log(f"✅ Stored {stored_predictions} predictions in database", "PASS")
                    
                    return result
                else:
                    self.log(f"❌ Analysis failed: {result.get('message', 'Unknown error')}", "FAIL")
                    return {}
            else:
                self.log(f"❌ Analysis request failed: {response.status_code}", "FAIL")
                return {}
                
        except Exception as e:
            self.log(f"❌ Analysis execution error: {e}", "FAIL")
            return {}
    
    def validate_stored_predictions(self) -> bool:
        """Validate that predictions were stored correctly in database"""
        self.log("Validating stored predictions...", "INFO")
        
        try:
            # Get recent predictions via backend API
            response = requests.get(f"{BACKEND_URL}/api/analytics/predictions?limit=50", timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    predictions = result.get("data", [])
                    recent_predictions = [
                        p for p in predictions 
                        if any(ticker in p.get("ticker", "") for ticker in TEST_TICKERS)
                        and (datetime.now() - datetime.fromisoformat(p.get("timestamp", "").replace("Z", "+00:00"))).total_seconds() < 3600
                    ]
                    
                    if recent_predictions:
                        self.log(f"✅ Found {len(recent_predictions)} recent predictions in database", "PASS")
                        
                        # Store prediction IDs for later tests
                        self.stored_prediction_ids = [p.get("prediction_id") for p in recent_predictions[:5]]
                        
                        # Validate data structure
                        sample_prediction = recent_predictions[0]
                        required_fields = ["agent_name", "ticker", "signal", "confidence", "reasoning", "timestamp"]
                        missing_fields = [field for field in required_fields if field not in sample_prediction]
                        
                        if not missing_fields:
                            self.log("✅ Prediction data structure is complete", "PASS")
                            return True
                        else:
                            self.log(f"❌ Missing fields in predictions: {missing_fields}", "FAIL")
                            return False
                    else:
                        self.log("❌ No recent predictions found in database", "FAIL")
                        return False
                else:
                    self.log(f"❌ Failed to retrieve predictions: {result.get('message')}", "FAIL")
                    return False
            else:
                self.log(f"❌ Predictions API failed: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"❌ Prediction validation error: {e}", "FAIL")
            return False
    
    def test_analytics_apis(self) -> bool:
        """Test all analytics API endpoints"""
        self.log("Testing analytics APIs...", "INFO")
        
        api_tests = [
            {
                "name": "Performance Analytics",
                "url": f"{BACKEND_URL}/api/analytics/performance?days=30",
                "expected_keys": ["accuracy", "total_predictions"]
            },
            {
                "name": "Market Consensus", 
                "url": f"{BACKEND_URL}/api/analytics/consensus/{TEST_TICKERS[0]}?days=7",
                "expected_keys": ["bullish_percentage", "bearish_percentage", "neutral_percentage"]
            },
            {
                "name": "Market Trends",
                "url": f"{BACKEND_URL}/api/analytics/trends?days=30", 
                "expected_keys": []  # Structure may vary
            }
        ]
        
        all_passed = True
        
        for test in api_tests:
            try:
                response = requests.get(test["url"], timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success":
                        data = result.get("data", {})
                        
                        # Check for expected keys if specified
                        if test["expected_keys"]:
                            missing_keys = [key for key in test["expected_keys"] if key not in data]
                            if not missing_keys:
                                self.log(f"✅ {test['name']} API working correctly", "PASS")
                            else:
                                self.log(f"❌ {test['name']} missing keys: {missing_keys}", "FAIL")
                                all_passed = False
                        else:
                            self.log(f"✅ {test['name']} API responding", "PASS")
                    else:
                        self.log(f"❌ {test['name']} API error: {result.get('message')}", "FAIL")
                        all_passed = False
                else:
                    self.log(f"❌ {test['name']} API failed: {response.status_code}", "FAIL")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ {test['name']} API error: {e}", "FAIL")
                all_passed = False
        
        return all_passed
    
    def test_postgrest_queries(self) -> bool:
        """Test PostgREST direct database queries"""
        self.log("Testing PostgREST direct queries...", "INFO")
        
        postgrest_tests = [
            {
                "name": "Agent Predictions Table",
                "url": f"{POSTGREST_URL}/agent_predictions?limit=5&order=prediction_timestamp.desc"
            },
            {
                "name": "Market Consensus View",
                "url": f"{POSTGREST_URL}/market_consensus"
            },
            {
                "name": "Agent Performance View",
                "url": f"{POSTGREST_URL}/agent_performance_metrics"
            }
        ]
        
        all_passed = True
        
        for test in postgrest_tests:
            try:
                response = requests.get(test["url"], timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        self.log(f"✅ {test['name']}: Retrieved {len(data)} records", "PASS")
                    else:
                        self.log(f"✅ {test['name']}: Query successful", "PASS")
                else:
                    self.log(f"❌ {test['name']} failed: {response.status_code}", "FAIL")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ {test['name']} error: {e}", "FAIL")
                all_passed = False
        
        return all_passed
    
    def test_outcome_recording(self) -> bool:
        """Test recording prediction outcomes"""
        self.log("Testing prediction outcome recording...", "INFO")
        
        if not self.stored_prediction_ids:
            self.log("❌ No stored prediction IDs available for outcome testing", "FAIL")
            return False
        
        try:
            # Record a test outcome
            test_prediction_id = self.stored_prediction_ids[0]
            outcome_data = {
                "prediction_id": test_prediction_id,
                "actual_outcome": "bullish",
                "actual_price_change": 0.025
            }
            
            response = requests.post(
                f"{BACKEND_URL}/api/analytics/outcome",
                json=outcome_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log("✅ Prediction outcome recorded successfully", "PASS")
                    return True
                else:
                    self.log(f"❌ Outcome recording failed: {result.get('message')}", "FAIL")
                    return False
            else:
                self.log(f"❌ Outcome recording request failed: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"❌ Outcome recording error: {e}", "FAIL")
            return False
    
    def generate_summary_report(self) -> None:
        """Generate a comprehensive validation summary"""
        self.log("Generating validation summary report...", "INFO")
        
        # Count results by status
        status_counts = {}
        for result in self.test_results:
            status = result["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        total_tests = len([r for r in self.test_results if r["status"] in ["PASS", "FAIL"]])
        passed_tests = status_counts.get("PASS", 0)
        failed_tests = status_counts.get("FAIL", 0)
        
        print(f"\n{ValidationColors.BOLD}{'='*60}")
        print("DATABASE INTEGRATION VALIDATION SUMMARY")
        print(f"{'='*60}{ValidationColors.END}")
        
        print(f"\n{ValidationColors.BLUE}Test Results:{ValidationColors.END}")
        print(f"  Total Tests: {total_tests}")
        print(f"  {ValidationColors.GREEN}Passed: {passed_tests}{ValidationColors.END}")
        print(f"  {ValidationColors.RED}Failed: {failed_tests}{ValidationColors.END}")
        print(f"  {ValidationColors.YELLOW}Warnings: {status_counts.get('WARN', 0)}{ValidationColors.END}")
        
        if total_tests > 0:
            success_rate = (passed_tests / total_tests) * 100
            print(f"  Success Rate: {success_rate:.1f}%")
        
        # Overall status
        if failed_tests == 0:
            print(f"\n{ValidationColors.GREEN}{ValidationColors.BOLD}🎉 ALL VALIDATIONS PASSED!")
            print("Database integration is fully operational!{ValidationColors.END}")
        elif passed_tests > failed_tests:
            print(f"\n{ValidationColors.YELLOW}{ValidationColors.BOLD}⚠️ MOSTLY OPERATIONAL")
            print("Some issues detected but core functionality works{ValidationColors.END}")
        else:
            print(f"\n{ValidationColors.RED}{ValidationColors.BOLD}❌ CRITICAL ISSUES DETECTED")
            print("Database integration requires attention{ValidationColors.END}")
        
        # Detailed results
        if failed_tests > 0:
            print(f"\n{ValidationColors.RED}Failed Tests:{ValidationColors.END}")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['message']}")
        
        print(f"\n{ValidationColors.BLUE}Next Steps:{ValidationColors.END}")
        if failed_tests == 0:
            print("  ✅ Integration is ready for production use")
            print("  ✅ All database APIs are functional")
            print("  ✅ Data flow is working end-to-end")
        else:
            print("  🔧 Fix failed validations")
            print("  🔍 Check service logs for details")
            print("  📚 Review DATABASE_INTEGRATION_GUIDE.md")
        
        print(f"\n{ValidationColors.BLUE}Useful Commands:{ValidationColors.END}")
        print(f"  Health Check: curl {BACKEND_URL}/health")
        print(f"  Recent Predictions: curl {BACKEND_URL}/api/analytics/predictions?limit=10")
        print(f"  PostgREST API: curl {POSTGREST_URL}/agent_predictions?limit=5")
        print(f"  Docker Status: docker-compose ps")

async def main():
    """Main validation execution"""
    print(f"{ValidationColors.BOLD}🧪 AI Hedge Fund - Database Integration Validation{ValidationColors.END}")
    print(f"Testing comprehensive data flow: Agent Analysis → Database → API\n")
    
    validator = DatabaseIntegrationValidator()
    
    # Run validation tests in sequence
    validation_steps = [
        ("Service Health Check", validator.test_service_health),
        ("PostgREST Connection Test", validator.test_postgrest_connection),
        ("Agent Analysis Execution", lambda: bool(validator.run_test_analysis())),
        ("Stored Predictions Validation", validator.validate_stored_predictions),
        ("Analytics APIs Test", validator.test_analytics_apis),
        ("PostgREST Queries Test", validator.test_postgrest_queries),
        ("Outcome Recording Test", validator.test_outcome_recording)
    ]
    
    for step_name, step_function in validation_steps:
        validator.log(f"Starting: {step_name}", "INFO")
        
        try:
            success = step_function()
            if success:
                validator.log(f"Completed: {step_name}", "PASS")
            else:
                validator.log(f"Failed: {step_name}", "FAIL")
        except Exception as e:
            validator.log(f"Error in {step_name}: {e}", "FAIL")
        
        # Small delay between tests
        time.sleep(1)
    
    # Generate final report
    validator.generate_summary_report()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{ValidationColors.YELLOW}Validation interrupted by user{ValidationColors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{ValidationColors.RED}Validation failed with error: {e}{ValidationColors.END}")
        sys.exit(1)
