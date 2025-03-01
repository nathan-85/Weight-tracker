#!/usr/bin/env python
"""
Restart Helper for Weight Tracker Application
This script helps restart both the server and client components.
"""

import os
import sys
import platform
import subprocess
import time
import signal
import psutil

def find_process_by_name(name):
    """Find process by name and return the process IDs"""
    result = []
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if name is in process name or cmdline
            if name.lower() in proc.info['name'].lower():
                result.append(proc.info['pid'])
            elif proc.info['cmdline']:
                cmdline = ' '.join(proc.info['cmdline']).lower()
                if name.lower() in cmdline:
                    result.append(proc.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return result

def kill_process(pid):
    """Kill a process by PID"""
    try:
        process = psutil.Process(pid)
        process.terminate()
        print(f"Process {pid} terminated.")
        return True
    except:
        print(f"Could not terminate process {pid}. Trying force kill...")
        try:
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/F", "/PID", str(pid)], 
                              check=False, capture_output=True)
            else:
                os.kill(pid, signal.SIGKILL)
            print(f"Process {pid} force killed.")
            return True
        except:
            print(f"Failed to kill process {pid}")
            return False

def main():
    """Main function to restart all components"""
    system = platform.system()
    print(f"Detected operating system: {system}")
    
    print("Weight Tracker Restart Utility")
    print("==============================")
    print("This utility will help you stop and restart both the server and client.")
    print()
    
    # Check for running server process (Flask)
    flask_pids = find_process_by_name("flask")
    python_pids = find_process_by_name("python app.py")
    server_pids = flask_pids + python_pids
    
    if server_pids:
        print(f"Found {len(server_pids)} running server process(es): {server_pids}")
        stop_server = input("Do you want to stop the server? (y/n): ").lower() == 'y'
        if stop_server:
            for pid in server_pids:
                kill_process(pid)
            print("Server processes stopped.")
        else:
            print("Server processes left running.")
    else:
        print("No server processes found.")
    
    # Check for running client processes (Node/npm)
    client_pids = find_process_by_name("npm start")
    node_pids = find_process_by_name("node")
    
    # Filter node PIDs to only include those likely related to the frontend
    frontend_node_pids = []
    for pid in node_pids:
        try:
            process = psutil.Process(pid)
            cmdline = ' '.join(process.cmdline()).lower()
            if 'webpack' in cmdline or 'react' in cmdline or 'frontend' in cmdline:
                frontend_node_pids.append(pid)
        except:
            pass
    
    client_pids = client_pids + frontend_node_pids
    
    if client_pids:
        print(f"Found {len(client_pids)} running client process(es): {client_pids}")
        stop_client = input("Do you want to stop the client? (y/n): ").lower() == 'y'
        if stop_client:
            for pid in client_pids:
                kill_process(pid)
            print("Client processes stopped.")
        else:
            print("Client processes left running.")
    else:
        print("No client processes found.")
    
    # Ask to start server
    start_server = input("Do you want to start the server with debug mode? (y/n): ").lower() == 'y'
    if start_server:
        if system == "Windows":
            print("Starting server with run_debug.bat...")
            subprocess.Popen(["cmd", "/c", "start", "cmd", "/k", "run_debug.bat"])
        else:
            print("Starting server with run_debug.py...")
            subprocess.Popen(["python", "run_debug.py"])
    
    # Ask to start client
    start_client = input("Do you want to start the client? (y/n): ").lower() == 'y'
    if start_client:
        frontend_path = os.path.join(os.getcwd(), "frontend")
        if not os.path.exists(frontend_path):
            print(f"Error: Frontend directory not found at {frontend_path}")
        else:
            if system == "Windows":
                print("Starting client with npm start...")
                subprocess.Popen(["cmd", "/c", "start", "cmd", "/k", 
                                 f"cd {frontend_path} && npm start"])
            else:
                print("Starting client with npm start...")
                # Use a shell script to start npm in a new terminal
                with open("start_client.sh", "w") as f:
                    f.write(f"""#!/bin/bash
cd {frontend_path}
npm start
""")
                os.chmod("start_client.sh", 0o755)
                
                if system == "Darwin":  # macOS
                    subprocess.Popen(["open", "-a", "Terminal", "start_client.sh"])
                else:  # Linux
                    try:
                        subprocess.Popen(["gnome-terminal", "--", "./start_client.sh"])
                    except:
                        try:
                            subprocess.Popen(["xterm", "-e", "./start_client.sh"])
                        except:
                            print("Could not open a new terminal. Please start the client manually:")
                            print(f"cd {frontend_path} && npm start")
    
    print()
    print("Restart operations completed!")
    print("If you encounter any issues, you can manually start the components:")
    print("Server: python run_debug.py")
    print("Client: cd frontend && npm start")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
    
    if platform.system() == "Windows":
        input("Press Enter to exit...") 