# Cloudflare Tunnel setup cho EHR Lien Chieu
# Chạy SAU KHI đã: cloudflared tunnel login (xác thực domain qua browser)
#Requires -RunAsAdministrator
param(
    [Parameter(Mandatory=$true)]
    [string]$Hostname    # vd: ehr.yourdomain.com
)

$ErrorActionPreference = 'Stop'

$Cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$TunnelName  = 'ehr-lienchieu'
$ConfigDir   = "$env:USERPROFILE\.cloudflared"
$ConfigFile  = "$ConfigDir\config.yml"

if (-not (Test-Path "$ConfigDir\cert.pem")) {
    Write-Error "Chưa có cert.pem. Hãy chạy 'cloudflared tunnel login' trước khi gọi script này."
    exit 1
}

# Tạo tunnel (nếu chưa có)
$existing = & $Cloudflared tunnel list 2>&1 | Select-String -Pattern $TunnelName
if (-not $existing) {
    Write-Host "Creating tunnel $TunnelName..."
    & $Cloudflared tunnel create $TunnelName
} else {
    Write-Host "Tunnel $TunnelName already exists."
}

# Lấy tunnel UUID
$tunnelInfo = & $Cloudflared tunnel list 2>&1 | Select-String -Pattern $TunnelName
$tunnelId   = ($tunnelInfo -split '\s+')[0]
Write-Host "Tunnel ID: $tunnelId"

# Tạo config file
$credFile = "$ConfigDir\$tunnelId.json"
$configYaml = @"
tunnel: $tunnelId
credentials-file: $credFile

ingress:
  - hostname: $Hostname
    service: http://localhost:3000
  - service: http_status:404
"@
$configYaml | Out-File -FilePath $ConfigFile -Encoding utf8 -Force
Write-Host "Config written: $ConfigFile"

# Route DNS
Write-Host "Routing DNS $Hostname -> $TunnelName..."
& $Cloudflared tunnel route dns $TunnelName $Hostname

# Cài service Windows
Write-Host "Installing cloudflared as Windows Service..."
& $Cloudflared service uninstall 2>&1 | Out-Null
& $Cloudflared --config $ConfigFile service install
Start-Sleep 3
Start-Service -Name 'Cloudflared' -ErrorAction SilentlyContinue
Get-Service -Name 'Cloudflared' | Format-Table Name, Status, StartType

Write-Host ""
Write-Host "===== DONE =====" -ForegroundColor Green
Write-Host "Domain: https://$Hostname"
Write-Host "Tunnel: $TunnelName ($tunnelId)"
Write-Host "Config: $ConfigFile"
