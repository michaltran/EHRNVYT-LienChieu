# Cài đặt Windows Service cho EHR-LienChieu (Next.js)
# Chạy với quyền Administrator
#Requires -RunAsAdministrator

$ErrorActionPreference = 'Stop'

$AppDir   = 'C:\Users\MAI_KHNV\Desktop\EHRNVYT-KVLienChieu-main\EHRNVYT-KVLienChieu-main'
$NssmExe  = 'C:\Users\MAI_KHNV\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe'
$NodeExe  = 'C:\Program Files\nodejs\node.exe'
$NextBin  = "$AppDir\node_modules\next\dist\bin\next"
$Service  = 'EHR-LienChieu'
$LogDir   = "$AppDir\logs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Gỡ service cũ nếu đã tồn tại
$existing = Get-Service -Name $Service -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing service $Service..."
    & $NssmExe stop $Service confirm 2>&1 | Out-Null
    & $NssmExe remove $Service confirm 2>&1 | Out-Null
    Start-Sleep 2
}

Write-Host "Installing service $Service..."
& $NssmExe install $Service $NodeExe $NextBin 'start' '-p' '3000'
& $NssmExe set $Service AppDirectory $AppDir
& $NssmExe set $Service AppStdout "$LogDir\app.log"
& $NssmExe set $Service AppStderr "$LogDir\app-error.log"
& $NssmExe set $Service AppRotateFiles 1
& $NssmExe set $Service AppRotateBytes 10485760
& $NssmExe set $Service Start SERVICE_AUTO_START
& $NssmExe set $Service AppExit Default Restart
& $NssmExe set $Service AppRestartDelay 5000
& $NssmExe set $Service Description 'EHR Lien Chieu - Next.js production server'

Write-Host "Starting service..."
Start-Service -Name $Service
Start-Sleep 5
Get-Service -Name $Service | Format-Table Name, Status, StartType
Write-Host "Service installed. Logs: $LogDir"
