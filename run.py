#!/usr/bin/env python3
import os
import sys
import socket
import subprocess
import threading
import signal
import time
import shutil

PORTS = (8000, 3000)

def color(text, code):
    return f"\033[{code}m{text}\033[0m"

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

def command_exists(command):
    return shutil.which(command) is not None

def has_next_build(frontend_dir):
    return os.path.exists(os.path.join(frontend_dir, ".next", "BUILD_ID"))

def run_checked(command, cwd, label):
    print(color(f"{label}...", "93"))
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError(f"{label} failed with exit code {result.returncode}")

def free_ports():
    if not command_exists("fuser"):
        print(color("fuser not found; skipping automatic port cleanup.", "93"))
        return

    for port in PORTS:
        try:
            subprocess.run(
                ["fuser", "-k", f"{port}/tcp"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass

def main():
    print("=" * 60)
    print(color("             Print Sathi Server Launcher", "95"))
    print("=" * 60)
    print("Select run mode:")
    print("  [1] Development mode - Localhost (127.0.0.1)")
    print("  [2] Development mode - Local Network (WiFi)")
    print("  [3] Production / Pre-compiled mode - Localhost (127.0.0.1)")
    print("  [4] Production / Pre-compiled mode - Local Network (WiFi)")
    
    try:
        choice = input("Enter choice [1/2/3/4, default: 1]: ").strip()
    except EOFError:
        choice = ""
        print("\nNo interactive input detected; using default mode 1.")
    except KeyboardInterrupt:
        print("\nExiting.")
        return

    if choice not in ("", "1", "2", "3", "4"):
        print(color(f"Invalid choice '{choice}', using default mode 1.", "93"))
        choice = "1"

    is_prod = choice in ("3", "4")
    is_wifi = choice in ("2", "4")

    if is_wifi:
        host = "0.0.0.0"
        display_ip = get_local_ip()
        mode_str = "Local Network (WiFi)"
    else:
        host = "127.0.0.1"
        display_ip = "127.0.0.1"
        mode_str = "Localhost"

    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "apps", "processing")
    frontend_dir = os.path.join(root_dir, "apps", "web")

    runtime_label = "Production (Pre-compiled)" if is_prod else "Development (On-demand)"
    display_host = display_ip if is_wifi else "localhost"

    print(f"\nMode: {color(f'{mode_str} - {runtime_label}', '93')}")
    print(f"Frontend: {color(f'http://{display_host}:3000', '96')}")
    print(f"Backend API:  {color(f'http://{display_host}:8000/docs', '96')}")

    if is_wifi and display_ip == "127.0.0.1":
        print(color("Warning: could not detect a LAN IP. Check WiFi/network connection.", "93"))

    if is_prod:
        if not has_next_build(frontend_dir):
            run_checked(["npm", "run", "build"], frontend_dir, "Creating production Next.js build")
        else:
            print(color("Using existing production Next.js build.", "92"))

    print("\nStarting servers (Ctrl+C to stop)...")

    # Free ports if already in use from a previous session
    free_ports()
    time.sleep(0.8)  # let the OS reclaim the ports
    
    backend_cmd = [
        os.path.join(".venv", "bin", "python"),
        "-m", "uvicorn", "main:app",
        "--host", host,
        "--port", "8000"
    ]
    if not is_prod:
        backend_cmd.append("--reload")
        
    frontend_cmd = [
        "npx", "next",
        "start" if is_prod else "dev",
        "--hostname", host,
        "--port", "3000"
    ]

    backend_proc = None
    frontend_proc = None
    
    try:
        # Start Backend
        print("Starting FastAPI backend...")
        print(color("Command: " + " ".join(backend_cmd), "90"))
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid
        )
        
        # Start Frontend
        print("Starting Next.js frontend...")
        print(color("Command: " + " ".join(frontend_cmd), "90"))
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
                print(f"\n{color(f'Backend process exited with code {backend_proc.returncode}', '91')}")
                print(color("Check the [BACKEND-ERR] lines above. For missing dependencies, run setup in apps/processing.", "93"))
                break
            if frontend_proc.poll() is not None:
                print(f"\n{color(f'Frontend process exited with code {frontend_proc.returncode}', '91')}")
                if is_prod:
                    print(color("Production mode requires a valid .next build. Run: npm run build in apps/web.", "93"))
                else:
                    print(color("Check the [FRONTEND-ERR] lines above. Run npm install if dependencies are missing.", "93"))
                break
            time.sleep(1)
            
    except KeyboardInterrupt:
        print(f"\n{color('Stopping all processes gracefully...', '93')}")
    finally:
        kill_process_group(backend_proc)
        kill_process_group(frontend_proc)
        print("All processes stopped.")

if __name__ == "__main__":
    main()
