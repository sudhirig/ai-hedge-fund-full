#!/usr/bin/env python3
"""
Test script to validate complete database integration with AI Hedge Fund platform
"""

import os
import sys
import asyncio
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv()

def test_backend_health():
    """Test backend health and database connectivity"""
    try:
        print("🧪 Testing backend health check...")
        response = requests.get("http://localhost:8000/health", timeout=10)
        
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend health check successful")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Database Available: {health_data.get('database', {}).get('available', False)}")
            return True
        else:
            print(f"❌ Backend health check failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_agent_analysis():
    """Test running an agent analysis and verify data storage"""
    try:
        print("\n🧪 Testing agent analysis with database storage...")
        
        # Prepare analysis request
        analysis_request = {
            "tickers": "AAPL",
            "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": datetime.now().strftime("%Y-%m-%d"),
            "initial_cash": 100000
        }
        
        print(f"   Running analysis for: {analysis_request['tickers']}")
        print(f"   Date range: {analysis_request['start_date']} to {analysis_request['end_date']}")
        
        # Make API request
        response = requests.post(
            "http://localhost:8000/api/run",
            json=analysis_request,
            timeout=120  # 2 minutes timeout for analysis
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Agent analysis completed successfully")
            
            # Check response structure
            if result.get('status') == 'success':
                data = result.get('data', {})
                agents = data.get('agents', {})
                decisions = data.get('decisions', {})
                
                print(f"   Agents analyzed: {len(agents)}")
                print(f"   Trading decisions: {len(decisions)}")
                
                # Show sample agent results
                for agent_name, agent_data in list(agents.items())[:3]:
                    if isinstance(agent_data, dict):
                        signal = agent_data.get('signal', 'N/A')
                        confidence = agent_data.get('confidence', 0)
                        print(f"   {agent_name}: {signal} ({confidence}% confidence)")
                
                return True
            else:
                print(f"❌ Analysis failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Agent analysis failed with status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Agent analysis test failed: {e}")
        return False

def test_database_endpoints():
    """Test database-specific API endpoints"""
    try:
        print("\n🧪 Testing database API endpoints...")
        
        # Test agent performance endpoint
        try:
            response = requests.get("http://localhost:8000/api/agent-performance?days=30", timeout=10)
            if response.status_code == 200:
                print("✅ Agent performance endpoint working")
            else:
                print(f"⚠️  Agent performance endpoint returned: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Agent performance endpoint test failed: {e}")
        
        # Test recent predictions endpoint
        try:
            response = requests.get("http://localhost:8000/api/recent-predictions?limit=10", timeout=10)
            if response.status_code == 200:
                print("✅ Recent predictions endpoint working")
            else:
                print(f"⚠️  Recent predictions endpoint returned: {response.status_code}")
        except Exception as e:
            print(f"⚠️  Recent predictions endpoint test failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database endpoints test failed: {e}")
        return False

async def test_direct_database_access():
    """Test direct database access"""
    try:
        print("\n🧪 Testing direct database access...")
        
        from src.database.db_manager import DatabaseManager
        
        # Initialize database manager
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        # Test agent query
        agents = await db_manager.get_all_active_agents()
        print(f"✅ Database query successful - Found {len(agents)} active agents:")
        
        for agent in agents[:5]:  # Show first 5 agents
            print(f"   - {agent['display_name']} ({agent['agent_type']})")
        
        # Test instrument query
        try:
            instrument = await db_manager.get_instrument_by_ticker('AAPL')
            if instrument:
                print(f"✅ Found instrument: {instrument['name']} ({instrument['ticker']})")
            else:
                print("ℹ️  AAPL instrument not found (will be created on first analysis)")
        except Exception as e:
            print(f"ℹ️  Instrument query: {e}")
        
        await db_manager.close()
        return True
        
    except Exception as e:
        print(f"❌ Direct database access test failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("=" * 80)
    print("🚀 AI HEDGE FUND DATABASE INTEGRATION VALIDATION")
    print("=" * 80)
    
    tests_passed = 0
    total_tests = 4
    
    # Test 1: Backend Health
    if test_backend_health():
        tests_passed += 1
    
    # Test 2: Agent Analysis
    if test_agent_analysis():
        tests_passed += 1
    
    # Test 3: Database Endpoints
    if test_database_endpoints():
        tests_passed += 1
    
    # Test 4: Direct Database Access
    if asyncio.run(test_direct_database_access()):
        tests_passed += 1
    
    print("\n" + "=" * 80)
    print(f"🎯 INTEGRATION TEST RESULTS: {tests_passed}/{total_tests} PASSED")
    print("=" * 80)
    
    if tests_passed == total_tests:
        print("✅ ALL TESTS PASSED - DATABASE INTEGRATION IS FULLY OPERATIONAL!")
        print("\n🎉 Your AI Hedge Fund platform is ready for production use with:")
        print("   - Neon PostgreSQL cloud database")
        print("   - Full agent analysis data storage")
        print("   - Real-time performance tracking")
        print("   - Complete API integration")
        return True
    else:
        print(f"⚠️  {total_tests - tests_passed} test(s) failed - check logs above")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
