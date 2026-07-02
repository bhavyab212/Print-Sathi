!include "MUI2.nsh"

Name "Print-Sathi AI Engine"
OutFile "PrintSathi_AI_Server_Setup.exe"
InstallDir "$PROGRAMFILES\PrintSathi Server"
InstallDirRegKey HKCU "Software\PrintSathiServer" ""
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Main Section" SecMain
  SetOutPath "$INSTDIR"
  
  # Copy the PyInstaller bundled executable
  File "dist\PrintSathiServerManager.exe"
  
  # Store installation folder
  WriteRegStr HKCU "Software\PrintSathiServer" "" $INSTDIR
  
  # Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  # Create shortcuts
  CreateDirectory "$SMPROGRAMS\Print-Sathi"
  CreateShortcut "$SMPROGRAMS\Print-Sathi\Print-Sathi AI Engine.lnk" "$INSTDIR\PrintSathiServerManager.exe"
  CreateShortcut "$DESKTOP\Print-Sathi AI Engine.lnk" "$INSTDIR\PrintSathiServerManager.exe"

  # Run the app automatically after installation
  Exec "$INSTDIR\PrintSathiServerManager.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\PrintSathiServerManager.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  
  Delete "$SMPROGRAMS\Print-Sathi\Print-Sathi AI Engine.lnk"
  RMDir "$SMPROGRAMS\Print-Sathi"
  Delete "$DESKTOP\Print-Sathi AI Engine.lnk"
  
  DeleteRegKey HKCU "Software\PrintSathiServer"
  
  # Optional: Delete AppData
  # RMDir /r "$LOCALAPPDATA\PrintSathiServer"
SectionEnd
