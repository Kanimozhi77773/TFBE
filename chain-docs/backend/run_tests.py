#!/usr/bin/env python3
"""
Script to run all tests for the FastAPI backend.
"""

import subprocess
import sys
import os

def run_tests():
    """Run all tests using pytest."""
    # Change to the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Run pytest
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", 
            "-v", 
            "--tb=short"
        ], check=True)
        return result.returncode
    except subprocess.CalledProcessError as e:
        return e.returncode

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)