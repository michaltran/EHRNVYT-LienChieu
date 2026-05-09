#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

$NssmExe     = 'C:\Users\MAI_KHNV\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe'
$Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$ConfigFile  = "$env:USERPROFILE\.cloudflared\config.yml"
$Service     = 'Cloudflared-EHR'
$LogDir      = 'C:\Users\MAI_KHNV\Desktop\EHRNVYT-KVLienChieu-main\EHRNVYT-KVLienChieu-main\logs'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (Get-Service -Name $Service -ErrorAction SilentlyContinue) {
    & $NssmExe stop $Service confirm 2>&1 | Out-Null
    & $NssmExe remove $Service confirm 2>&1 | Out-Null
    Start-Sleep 2
}

& $NssmExe install $Service $Cloudflared 'tunnel' '--config' $ConfigFile 'run' 'ehr-lienchieu'
& $NssmExe set $Service AppStdout "$LogDir\cloudflared.log"
& $NssmExe set $Service AppStderr "$LogDir\cloudflared-error.log"
& $NssmExe set $Service AppRotateFiles 1
& $NssmExe set $Service AppRotateBytes 10485760
& $NssmExe set $Service Start SERVICE_AUTO_START
& $NssmExe set $Service AppExit Default Restart
& $NssmExe set $Service AppRestartDelay 5000
& $NssmExe set $Service Description 'Cloudflare Tunnel for EHR Lien Chieu'

Start-Service -Name $Service
Start-Sleep 5
Get-Service -Name $Service | Format-Table Name, Status, StartType
