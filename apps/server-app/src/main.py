import os
import sys
import threading
import subprocess
import urllib.request
import zipfile
import json
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
        self.geometry("500x420")
        self.resizable(False, False)

        # Paths
        self.app_data_dir = Path(os.getenv("LOCALAPPDATA", os.path.expanduser("~"))) / "PrintSathiServer"
        self.app_data_dir.mkdir(parents=True, exist_ok=True)
        self.env_dir = self.app_data_dir / "env"
        self.backend_dir = self.app_data_dir / "backend"
        self.uv_exe = self.app_data_dir / "uv.exe"

        self.server_process = None
        self.tray_icon = None

        # Bind close window protocol to hide instead of destroy
        self.protocol("WM_DELETE_WINDOW", self.hide_window)

        self.setup_ui()
        self.check_status()
        self.setup_tray()

    def setup_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.main_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.main_frame.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)

        # Header
        self.title_label = ctk.CTkLabel(
            self.main_frame, text="Print-Sathi AI Engine", font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.grid(row=0, column=0, pady=(10, 5))

        self.subtitle_label = ctk.CTkLabel(
            self.main_frame, text="Local Processing Server", font=ctk.CTkFont(size=14), text_color="gray"
        )
        self.subtitle_label.grid(row=1, column=0, pady=(0, 20))

        # Status
        self.status_frame = ctk.CTkFrame(self.main_frame)
        self.status_frame.grid(row=2, column=0, sticky="ew", pady=10, ipadx=10, ipady=10)
        self.status_frame.grid_columnconfigure(0, weight=1)

        self.status_label = ctk.CTkLabel(
            self.status_frame, text="Checking requirements...", font=ctk.CTkFont(size=14)
        )
        self.status_label.grid(row=0, column=0, pady=10)

        self.progress_bar = ctk.CTkProgressBar(self.status_frame)
        self.progress_bar.grid(row=1, column=0, sticky="ew", padx=20, pady=(0, 10))
        self.progress_bar.set(0)
        self.progress_bar.grid_remove()

        # Actions
        self.action_btn = ctk.CTkButton(
            self.main_frame, text="Install AI Engine (~2.5 GB)", command=self.start_install, font=ctk.CTkFont(weight="bold")
        )
        self.action_btn.grid(row=3, column=0, pady=20)
        self.action_btn.configure(state="disabled")

        self.open_dashboard_btn = ctk.CTkButton(
            self.main_frame, text="Open Web Dashboard", command=self.open_dashboard, fg_color="transparent", border_width=1
        )
        self.open_dashboard_btn.grid(row=4, column=0, pady=5)
        self.open_dashboard_btn.grid_remove()

    def check_status(self):
        # Check if venv exists and is valid
        python_exe = self.env_dir / "Scripts" / "python.exe"
        if python_exe.exists() and self.backend_dir.exists():
            self.status_label.configure(text="Ready to Start Server", text_color="green")
            self.action_btn.configure(text="Start Server", command=self.toggle_server, state="normal")
            self.open_dashboard_btn.grid()
        else:
            self.status_label.configure(text="Required AI Models & Packages missing.", text_color="orange")
            self.action_btn.configure(text="Download & Install (~2.5 GB)", command=self.start_install, state="normal")

    def start_install(self):
        self.action_btn.configure(state="disabled")
        self.progress_bar.grid()
        self.progress_bar.set(0)
        threading.Thread(target=self.install_process, daemon=True).start()

    def update_status(self, text, progress=None):
        self.status_label.configure(text=text)
        if progress is not None:
            self.progress_bar.set(progress)

    def install_process(self):
        try:
            self.update_status("Downloading UV Package Manager...", 0.1)
            self.download_uv()

            self.update_status("Setting up Python Environment...", 0.3)
            self.setup_python_env()

            self.update_status("Installing AI Dependencies (This takes a while)...", 0.5)
            self.install_dependencies()

            self.update_status("Extracting backend code...", 0.9)
            self.extract_backend()

            self.update_status("Installation Complete!", 1.0)
            self.after(1000, self.check_status)
        except Exception as e:
            self.update_status(f"Error: {e}", 0)
            self.action_btn.configure(state="normal")

    def download_uv(self):
        if not self.uv_exe.exists():
            url = "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip"
            zip_path = self.app_data_dir / "uv.zip"
            urllib.request.urlretrieve(url, zip_path)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.app_data_dir)
            
            # The executable is likely inside a folder like uv-x86_64-pc-windows-msvc/uv.exe
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
        # We write a requirements.txt to disk
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

        subprocess.run(
            [str(self.uv_exe), "pip", "install", "-r", str(req_path)],
            env={**os.environ, "VIRTUAL_ENV": str(self.env_dir)},
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )

    def extract_backend(self):
        bundle_dir = getattr(sys, '_MEIPASS', os.path.abspath(os.path.dirname(__file__)))
        
        # If running from source during dev, the zip is at ../assets/backend.zip
        # If packed with PyInstaller, it's at _MEIPASS/assets/backend.zip
        if hasattr(sys, '_MEIPASS'):
            zip_path = Path(bundle_dir) / "assets" / "backend.zip"
        else:
            zip_path = Path(bundle_dir).parent / "assets" / "backend.zip"
        
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

    def toggle_server(self):
        if self.server_process is None:
            self.start_server()
        else:
            self.stop_server()

    def start_server(self):
        self.action_btn.configure(state="disabled", text="Starting...")
        python_exe = self.env_dir / "Scripts" / "python.exe"
        
        # Start uvicorn subprocess
        self.server_process = subprocess.Popen(
            [str(python_exe), "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
            cwd=str(self.backend_dir),
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        self.status_label.configure(text="Server Running on port 8000", text_color="green")
        self.action_btn.configure(state="normal", text="Stop Server")

    def stop_server(self):
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            self.server_process = None
        
        self.status_label.configure(text="Server Stopped", text_color="gray")
        self.action_btn.configure(text="Start Server")

    def open_dashboard(self):
        import webbrowser
        webbrowser.open("https://print-sathi.onrender.com")

    def create_tray_image(self):
        # Generate simple blue circular icon
        image = Image.new('RGB', (64, 64), color='#1a1a1e')
        dc = ImageDraw.Draw(image)
        dc.ellipse((12, 12, 52, 52), fill='#0078D4')
        return image

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

        self.tray_icon = pystray.Icon("PrintSathi", self.create_tray_image(), "Print-Sathi AI Engine", menu)
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
