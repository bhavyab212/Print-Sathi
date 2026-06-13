#!/usr/bin/env python3
import os
import sys
import socket
import subprocess
import threading
import signal
import time

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def log_stream(stream, prefix):
    for line in iter(stream.readline, b''):
        sys.stdout.write(f"{prefix} {line.decode('utf-8', errors='ignore')}")
        sys.stdout.flush()

def kill_process_group(proc):
    if proc:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception:
            try:
                proc.terminate()
            except Exception:
                pass

def main():
    print("=" * 60)
    print("\033[95m             Print Sathi Server Launcher\033[0m")
    print("=" * 60)
    print("Select run mode:")
    print("  [1] Run locally (localhost / 127.0.0.1)")
    print("  [2] Run on local network (accessible to other devices on WiFi)")
    
    try:
        choice = input("Enter choice [1/2, default: 1]: ").strip()
    except KeyboardInterrupt:
        print("\nExiting.")
        return

    if choice == "2":
        host = "0.0.0.0"
        display_ip = get_local_ip()
        print(f"\nMode: \033[93mLocal Network\033[0m")
        print(f"Frontend: \033[96mhttp://{display_ip}:3000\033[0m")
        print(f"Backend API:  \033[96mhttp://{display_ip}:8000/docs\033[0m")
    else:
        host = "127.0.0.1"
        display_ip = "127.0.0.1"
        print(f"\nMode: \033[92mLocalhost\033[0m")
        print(f"Frontend: \033[96mhttp://localhost:3000\033[0m")
        print(f"Backend API:  \033[96mhttp://localhost:8000/docs\033[0m")

    print("\nStarting servers (Ctrl+C to stop)...")
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "apps", "processing")
    frontend_dir = os.path.join(root_dir, "apps", "web")
    
    backend_cmd = [
        os.path.join(".venv", "bin", "python"),
        "-m", "uvicorn", "main:app",
        "--reload",
        "--host", host,
        "--port", "8000"
    ]
    
    frontend_cmd = [
        "npx", "next", "dev",
        "--hostname", host,
        "--port", "3000"
    ]

    backend_proc = None
    frontend_proc = None
    
    try:
        # Start Backend
        print("Starting FastAPI backend...")
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid
        )
        
        # Start Frontend
        print("Starting Next.js frontend...")
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid
        )
        
        # Start logging threads
        t1 = threading.Thread(target=log_stream, args=(backend_proc.stdout, "\033[94m[BACKEND]\033[0m"), daemon=True)
        t2 = threading.Thread(target=log_stream, args=(backend_proc.stderr, "\033[94m[BACKEND-ERR]\033[0m"), daemon=True)
        t3 = threading.Thread(target=log_stream, args=(frontend_proc.stdout, "\033[92m[FRONTEND]\033[0m"), daemon=True)
        t4 = threading.Thread(target=log_stream, args=(frontend_proc.stderr, "\033[92m[FRONTEND-ERR]\033[0m"), daemon=True)
        
        t1.start()
        t2.start()
        t3.start()
        t4.start()
        
        # Monitor processes
        while True:
            if backend_proc.poll() is not None:
                print(f"\n\033[91mBackend process exited with code {backend_proc.returncode}\033[0m")
                break
            if frontend_proc.poll() is not None:
                print(f"\n\033[91mFrontend process exited with code {frontend_proc.returncode}\033[0m")
                break
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\033[93mStopping all processes gracefully...\033[0m")
    finally:
        kill_process_group(backend_proc)
        kill_process_group(frontend_proc)
        print("All processes stopped.")

if __name__ == "__main__":
    main()
