import os
import sys
import threading
import subprocess
import urllib.request
import zipfile
import json
import time
from pathlib import Path

import customtkinter as ctk
import pystray
from PIL import Image, ImageDraw

# Configure CustomTkinter appearance
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class PrintSathiServerApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Print-Sathi AI Server Manager")
        self.geometry("600x500")
        self.resizable(False, False)

        # Paths
        self.app_data_dir = Path(os.getenv("LOCALAPPDATA", os.path.expanduser("~"))) / "PrintSathiServer"
        self.app_data_dir.mkdir(parents=True, exist_ok=True)
        self.env_dir = self.app_data_dir / "env"
        self.backend_dir = self.app_data_dir / "backend"
        self.uv_exe = self.app_data_dir / "uv.exe"
        
        self.bundle_dir = getattr(sys, '_MEIPASS', os.path.abspath(os.path.dirname(__file__)))
        if hasattr(sys, '_MEIPASS'):
            self.assets_dir = Path(self.bundle_dir) / "assets"
        else:
            self.assets_dir = Path(self.bundle_dir).parent / "assets"
            
        self.logo_path = self.assets_dir / "logo.png"

        self.server_process = None
        self.tray_icon = None

        # Settings
        self.server_host = "0.0.0.0"
        self.server_port = 8000

        # Bind close window protocol to hide instead of destroy
        self.protocol("WM_DELETE_WINDOW", self.hide_window)

        self.setup_ui()
        self.setup_tray()
        
    def get_logo_image(self, size=(64, 64)):
        if self.logo_path.exists():
            return ctk.CTkImage(light_image=Image.open(self.logo_path), dark_image=Image.open(self.logo_path), size=size)
        return None
        
    def get_pil_logo(self):
        if self.logo_path.exists():
            return Image.open(self.logo_path)
        # fallback
        image = Image.new('RGB', (64, 64), color='#1a1a1e')
        dc = ImageDraw.Draw(image)
        dc.ellipse((12, 12, 52, 52), fill='#0078D4')
        return image

    def setup_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.main_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.main_frame.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(1, weight=1)

        # Header with Logo
        self.header_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.header_frame.grid(row=0, column=0, pady=(0, 20))
        
        logo_img = self.get_logo_image(size=(48, 48))
        if logo_img:
            self.logo_label = ctk.CTkLabel(self.header_frame, image=logo_img, text="")
            self.logo_label.pack(side="left", padx=10)
            
        self.title_label = ctk.CTkLabel(
            self.header_frame, text="Print-Sathi AI Engine", font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.pack(side="left")

        # Content Frame
        self.content_frame = ctk.CTkFrame(self.main_frame)
        self.content_frame.grid(row=1, column=0, sticky="nsew")
        self.content_frame.grid_columnconfigure(0, weight=1)
        
        # Start at Welcome Page
        self.show_welcome_page()

    def clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def show_welcome_page(self):
        self.clear_content()
        
        lbl = ctk.CTkLabel(self.content_frame, text="Welcome to Print-Sathi Local AI Setup", font=ctk.CTkFont(size=18, weight="bold"))
        lbl.pack(pady=(40, 20))
        
        desc = ctk.CTkLabel(self.content_frame, text="To process files locally and securely, we need to verify\nyour system environment and AI models.", text_color="gray")
        desc.pack(pady=(0, 40))
        
        btn = ctk.CTkButton(self.content_frame, text="Check My System", font=ctk.CTkFont(weight="bold", size=14), height=40, command=self.run_system_check)
        btn.pack()

    def run_system_check(self):
        self.clear_content()
        
        lbl = ctk.CTkLabel(self.content_frame, text="Checking System...", font=ctk.CTkFont(size=18, weight="bold"))
        lbl.pack(pady=(50, 20))
        
        progress = ctk.CTkProgressBar(self.content_frame, mode="indeterminate", width=300)
        progress.pack(pady=20)
        progress.start()
        
        self.check_log = ctk.CTkLabel(self.content_frame, text="Scanning for Python Virtual Environment...", text_color="gray")
        self.check_log.pack()

        # Run check in thread to simulate animation
        threading.Thread(target=self._check_logic, args=(progress,), daemon=True).start()

    def _check_logic(self, progress):
        time.sleep(1.5)
        
        python_exe = self.env_dir / "Scripts" / "python.exe"
        if python_exe.exists() and self.backend_dir.exists():
            self.after(0, progress.stop)
            self.after(0, self.show_dashboard_page)
        else:
            self.check_log.configure(text="Missing Requirements Found.")
            time.sleep(1.0)
            self.after(0, progress.stop)
            self.after(0, self.show_prereq_page)

    def show_prereq_page(self):
        self.clear_content()
        
        lbl = ctk.CTkLabel(self.content_frame, text="Missing Requirements", font=ctk.CTkFont(size=18, weight="bold"), text_color="orange")
        lbl.pack(pady=(20, 10))
        
        list_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        list_frame.pack(pady=10)
        
        reqs = [
            "1. Python Virtual Environment (3.11)",
            "2. Local Backend Engine Code",
            "3. AI Core Dependencies (~2.5 GB)"
        ]
        
        for r in reqs:
            r_lbl = ctk.CTkLabel(list_frame, text=f"• {r}", font=ctk.CTkFont(size=14))
            r_lbl.pack(anchor="w", pady=2)
            
        desc = ctk.CTkLabel(self.content_frame, text="These packages will be downloaded and installed automatically.", text_color="gray")
        desc.pack(pady=(20, 20))
        
        self.dl_btn = ctk.CTkButton(self.content_frame, text="Download & Install", font=ctk.CTkFont(weight="bold", size=14), height=40, command=self.start_install)
        self.dl_btn.pack()

    def start_install(self):
        self.clear_content()
        
        lbl = ctk.CTkLabel(self.content_frame, text="Downloading & Installing", font=ctk.CTkFont(size=18, weight="bold"))
        lbl.pack(pady=(20, 10))
        
        self.install_status = ctk.CTkLabel(self.content_frame, text="Initializing...", text_color="gray", font=ctk.CTkFont(size=12))
        self.install_status.pack(pady=5)
        
        self.install_progress = ctk.CTkProgressBar(self.content_frame, width=350)
        self.install_progress.pack(pady=15)
        self.install_progress.set(0)
        
        self.install_metrics = ctk.CTkLabel(self.content_frame, text="Size: 0 MB / ~2.5 GB", text_color="gray", font=ctk.CTkFont(size=11))
        self.install_metrics.pack()
        
        # We simulate pause functionality for UV download, but for PIP install we can't pause natively.
        self.pause_btn = ctk.CTkButton(self.content_frame, text="Pause (Unavailable)", state="disabled", fg_color="gray")
        self.pause_btn.pack(pady=20)
        
        threading.Thread(target=self.install_process, daemon=True).start()

    def update_install_ui(self, status=None, progress=None, metrics=None):
        if status:
            self.install_status.configure(text=status)
        if progress is not None:
            if progress == "indeterminate":
                self.install_progress.configure(mode="indeterminate")
                self.install_progress.start()
            elif progress == "stop":
                self.install_progress.stop()
                self.install_progress.configure(mode="determinate")
            else:
                self.install_progress.configure(mode="determinate")
                self.install_progress.set(progress)
        if metrics:
            self.install_metrics.configure(text=metrics)

    def install_process(self):
        try:
            self.update_install_ui("Downloading UV Package Manager...", 0.05, "Size: 0 MB / 18 MB")
            self.download_uv()

            self.update_install_ui("Setting up Python Environment...", 0.15, "Configuring VENV...")
            self.setup_python_env()

            self.update_install_ui("Installing AI Dependencies...", "indeterminate", "Size: ~2.5 GB")
            self.install_dependencies()

            self.update_install_ui("Extracting backend code...", "stop", "Unpacking...")
            self.install_progress.set(0.9)
            self.extract_backend()

            self.update_install_ui("Installation Complete!", 1.0, "Ready to launch")
            time.sleep(1.5)
            self.after(0, self.show_dashboard_page)
        except Exception as e:
            self.update_install_ui(f"Error: {e}", "stop")
            self.after(0, lambda: self.pause_btn.configure(text="Retry", state="normal", fg_color="#D32F2F", command=self.start_install))

    def download_uv(self):
        if not self.uv_exe.exists():
            url = "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip"
            zip_path = self.app_data_dir / "uv.zip"
            urllib.request.urlretrieve(url, zip_path)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.app_data_dir)
            
            extracted_uv = list(self.app_data_dir.glob("**/uv.exe"))
            if extracted_uv:
                if extracted_uv[0] != self.uv_exe:
                    extracted_uv[0].rename(self.uv_exe)
            zip_path.unlink()

    def setup_python_env(self):
        subprocess.run(
            [str(self.uv_exe), "venv", "--python", "3.11", str(self.env_dir)],
            check=True,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )

    def install_dependencies(self):
        reqs = """fastapi==0.109.2
uvicorn==0.27.0.post1
python-multipart==0.0.9
rembg[cpu]==2.0.53
Pillow==10.2.0
numpy==1.26.4
opencv-python-headless==4.9.0.80
"""
        req_path = self.app_data_dir / "backend_requirements.txt"
        req_path.write_text(reqs)

        # Run with stderr pipe to capture progress text
        process = subprocess.Popen(
            [str(self.uv_exe), "pip", "install", "-r", str(req_path)],
            env={**os.environ, "VIRTUAL_ENV": str(self.env_dir)},
            stderr=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        while True:
            line = process.stderr.readline()
            if not line and process.poll() is not None:
                break
            if line:
                # Clean up uv's output which contains ANSI escape sequences
                clean_line = line.strip()
                if "Fetching" in clean_line or "Installing" in clean_line:
                    # Update status but limit string length
                    self.after(0, self.update_install_ui, f"Processing: {clean_line[:60]}...")
        
        if process.returncode != 0:
            raise Exception("Failed to install dependencies.")

    def extract_backend(self):
        zip_path = self.assets_dir / "backend.zip"
        self.backend_dir.mkdir(parents=True, exist_ok=True)
        
        if zip_path.exists():
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.backend_dir)
        else:
            self.write_minimal_backend()

    def write_minimal_backend(self):
        code = '''
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
@app.get("/health")
def health(): return {"status": "ok", "total_tasks_processed": 0, "active_model_sessions": []}
'''
        (self.backend_dir / "main.py").write_text(code)

    def show_dashboard_page(self):
        self.clear_content()
        
        self.dash_status = ctk.CTkLabel(self.content_frame, text="Server Stopped", font=ctk.CTkFont(size=20, weight="bold"), text_color="gray")
        self.dash_status.pack(pady=(30, 20))
        
        btn_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        btn_frame.pack(pady=10)
        
        self.toggle_btn = ctk.CTkButton(btn_frame, text="Start Server", font=ctk.CTkFont(weight="bold"), fg_color="green", hover_color="darkgreen", command=self.toggle_server, width=150)
        self.toggle_btn.grid(row=0, column=0, padx=10)
        
        self.test_btn = ctk.CTkButton(btn_frame, text="Test Server", command=self.test_server, width=150)
        self.test_btn.grid(row=0, column=1, padx=10)
        
        self.custom_btn = ctk.CTkButton(self.content_frame, text="Custom Settings", fg_color="transparent", border_width=1, command=self.show_custom_settings)
        self.custom_btn.pack(pady=(20, 0))
        
        if self.server_process:
            self.dash_status.configure(text=f"Running on {self.server_host}:{self.server_port}", text_color="green")
            self.toggle_btn.configure(text="Stop Server", fg_color="#D32F2F", hover_color="#B71C1C")

    def toggle_server(self):
        if self.server_process is None:
            self.start_server()
        else:
            self.stop_server()

    def start_server(self):
        self.toggle_btn.configure(state="disabled", text="Starting...")
        python_exe = self.env_dir / "Scripts" / "python.exe"
        
        self.server_process = subprocess.Popen(
            [str(python_exe), "-m", "uvicorn", "main:app", "--host", self.server_host, "--port", str(self.server_port)],
            cwd=str(self.backend_dir),
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        time.sleep(1) # wait for uvicorn to boot up
        self.show_dashboard_page()

    def stop_server(self):
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            self.server_process = None
        self.show_dashboard_page()

    def test_server(self):
        if not self.server_process:
            self.show_alert("Error", "Start the server first before testing.")
            return
            
        def _ping():
            try:
                url = f"http://{'127.0.0.1' if self.server_host == '0.0.0.0' else self.server_host}:{self.server_port}/health"
                req = urllib.request.Request(url, method="GET")
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.loads(res.read().decode())
                    self.after(0, lambda: self.show_alert("Success", f"Server is Healthy!\n\nDetails: {json.dumps(data, indent=2)}"))
            except Exception as e:
                self.after(0, lambda: self.show_alert("Failed", f"Server test failed:\n{str(e)}"))
        
        threading.Thread(target=_ping, daemon=True).start()

    def show_alert(self, title, message):
        top = ctk.CTkToplevel(self)
        top.title(title)
        top.geometry("300x200")
        top.resizable(False, False)
        # Make modal
        top.transient(self)
        top.grab_set()
        
        lbl = ctk.CTkLabel(top, text=message, wraplength=260)
        lbl.pack(pady=30, padx=20)
        
        btn = ctk.CTkButton(top, text="OK", command=top.destroy)
        btn.pack(side="bottom", pady=20)

    def show_custom_settings(self):
        top = ctk.CTkToplevel(self)
        top.title("Custom Settings")
        top.geometry("300x250")
        top.resizable(False, False)
        top.transient(self)
        top.grab_set()
        
        ctk.CTkLabel(top, text="Host:").pack(pady=(20, 5))
        host_entry = ctk.CTkEntry(top)
        host_entry.insert(0, self.server_host)
        host_entry.pack()
        
        ctk.CTkLabel(top, text="Port:").pack(pady=(10, 5))
        port_entry = ctk.CTkEntry(top)
        port_entry.insert(0, str(self.server_port))
        port_entry.pack()
        
        def save():
            self.server_host = host_entry.get()
            self.server_port = int(port_entry.get())
            top.destroy()
            if self.server_process:
                self.stop_server()
                self.start_server()
                
        ctk.CTkButton(top, text="Save & Restart", command=save).pack(pady=30)

    def setup_tray(self):
        def on_clicked(icon, item):
            action = str(item)
            if action == "Show App":
                self.show_window()
            elif action == "Start Server":
                self.start_server()
            elif action == "Stop Server":
                self.stop_server()
            elif action == "Exit":
                self.quit_app()

        menu = pystray.Menu(
            pystray.MenuItem("Show App", on_clicked, default=True),
            pystray.MenuItem("Start Server", on_clicked, visible=lambda item: self.server_process is None),
            pystray.MenuItem("Stop Server", on_clicked, visible=lambda item: self.server_process is not None),
            pystray.MenuItem("Exit", on_clicked)
        )

        self.tray_icon = pystray.Icon("PrintSathi", self.get_pil_logo(), "Print-Sathi AI Engine", menu)
        threading.Thread(target=self.tray_icon.run, daemon=True).start()

    def hide_window(self):
        self.withdraw()
        if not hasattr(self, 'first_hide'):
            self.first_hide = True
            try:
                self.tray_icon.notify("Print-Sathi AI Engine is running in the system tray.", "Minimized to Tray")
            except Exception:
                pass

    def show_window(self):
        self.deiconify()
        self.focus_force()

    def quit_app(self):
        self.stop_server()
        if self.tray_icon:
            self.tray_icon.stop()
        self.destroy()
        sys.exit(0)

if __name__ == "__main__":
    app = PrintSathiServerApp()
    app.mainloop()
