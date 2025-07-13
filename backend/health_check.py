#!/usr/bin/env python3
"""
Health Check System for AI Hedge Fund Backend
Provides comprehensive health monitoring and diagnostics
"""

import os
import sys
import asyncio
import aiohttp
import psutil
from datetime import datetime
from pathlib import Path

# Add the src directory to Python path
backend_dir = Path(__file__).parent
src_dir = backend_dir / "src"
sys.path.insert(0, str(src_dir))

try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
except ImportError:
    print("⚠️  Warning: python-dotenv not available, environment variables may not be loaded")

class HealthChecker:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.issues = []
        self.warnings = []
        
    def log_issue(self, message):
        """Log a critical issue"""
        self.issues.append(message)
        print(f"❌ ISSUE: {message}")
        
    def log_warning(self, message):
        """Log a warning"""
        self.warnings.append(message)
        print(f"⚠️  WARNING: {message}")
        
    def log_success(self, message):
        """Log a success"""
        print(f"✅ SUCCESS: {message}")

    def check_environment(self):
        """Check environment variables and configuration"""
        print("\n🔍 Checking Environment Configuration...")
        
        required_vars = [
            "ALPHA_VANTAGE_API_KEY",
            "OPENAI_API_KEY"
        ]
        
        for var in required_vars:
            if not os.getenv(var):
                self.log_issue(f"Required environment variable {var} is not set")
            else:
                self.log_success(f"Environment variable {var} is configured")
                
        # Check .env file exists
        env_file = backend_dir / ".env"
        if not env_file.exists():
            self.log_warning(".env file not found - environment variables may not load properly")
        else:
            self.log_success(".env file found")

    def check_dependencies(self):
        """Check Python dependencies"""
        print("\n📦 Checking Dependencies...")
        
        required_packages = [
            "fastapi",
            "uvicorn",
            "aiohttp",
            "pandas",
            "numpy",
            "python-dotenv"
        ]
        
        for package in required_packages:
            try:
                __import__(package.replace("-", "_"))
                self.log_success(f"Package {package} is available")
            except ImportError:
                self.log_issue(f"Required package {package} is not installed")

    def check_system_resources(self):
        """Check system resources"""
        print("\n💻 Checking System Resources...")
        
        # Memory check
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            self.log_warning(f"High memory usage: {memory.percent}%")
        else:
            self.log_success(f"Memory usage: {memory.percent}%")
            
        # Disk space check
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            self.log_warning(f"Low disk space: {disk.percent}% used")
        else:
            self.log_success(f"Disk space: {disk.percent}% used")

    async def check_backend_health(self):
        """Check backend service health"""
        print("\n🌐 Checking Backend Service...")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Check if backend is responding
                async with session.get(f"{self.backend_url}/health", timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_success("Backend health endpoint is responding")
                        return True
                    else:
                        self.log_issue(f"Backend health endpoint returned status {response.status}")
                        return False
        except aiohttp.ClientConnectorError:
            self.log_issue("Cannot connect to backend service - is it running?")
            return False
        except asyncio.TimeoutError:
            self.log_issue("Backend service is not responding (timeout)")
            return False
        except Exception as e:
            self.log_issue(f"Backend health check failed: {str(e)}")
            return False

    async def check_api_endpoints(self):
        """Check critical API endpoints"""
        print("\n🔌 Checking API Endpoints...")
        
        endpoints = [
            "/",
            "/api/run",
        ]
        
        try:
            async with aiohttp.ClientSession() as session:
                for endpoint in endpoints:
                    try:
                        async with session.get(f"{self.backend_url}{endpoint}", timeout=5) as response:
                            if response.status in [200, 422]:  # 422 is expected for missing params
                                self.log_success(f"Endpoint {endpoint} is accessible")
                            else:
                                self.log_warning(f"Endpoint {endpoint} returned status {response.status}")
                    except Exception as e:
                        self.log_warning(f"Endpoint {endpoint} check failed: {str(e)}")
        except Exception as e:
            self.log_issue(f"API endpoint checks failed: {str(e)}")

    def check_ports(self):
        """Check if required ports are available"""
        print("\n🔌 Checking Port Availability...")
        
        ports = [8000]  # Backend port
        
        for port in ports:
            connections = psutil.net_connections()
            port_in_use = any(conn.laddr.port == port for conn in connections if conn.laddr)
            
            if port_in_use:
                self.log_success(f"Port {port} is in use (service running)")
            else:
                self.log_warning(f"Port {port} is available (service may not be running)")

    async def run_full_health_check(self):
        """Run comprehensive health check"""
        print("🏥 AI HEDGE FUND BACKEND HEALTH CHECK")
        print("=" * 50)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all checks
        self.check_environment()
        self.check_dependencies()
        self.check_system_resources()
        self.check_ports()
        
        backend_healthy = await self.check_backend_health()
        if backend_healthy:
            await self.check_api_endpoints()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 HEALTH CHECK SUMMARY")
        print("=" * 50)
        
        if not self.issues:
            print("✅ ALL CHECKS PASSED - Backend is healthy!")
            return True
        else:
            print(f"❌ {len(self.issues)} CRITICAL ISSUES FOUND:")
            for issue in self.issues:
                print(f"   • {issue}")
                
        if self.warnings:
            print(f"⚠️  {len(self.warnings)} WARNINGS:")
            for warning in self.warnings:
                print(f"   • {warning}")
                
        return len(self.issues) == 0

async def main():
    """Main health check function"""
    checker = HealthChecker()
    healthy = await checker.run_full_health_check()
    
    # Exit with appropriate code
    sys.exit(0 if healthy else 1)

if __name__ == "__main__":
    asyncio.run(main())
