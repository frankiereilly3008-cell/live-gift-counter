$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://127.0.0.1:8765/'
$serverReady = $false
try {
  $null = Invoke-WebRequest -Uri ($url + 'state') -TimeoutSec 1
  $serverReady = $true
} catch { }

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command py -ErrorAction SilentlyContinue }
if (-not $serverReady -and -not $python) {
  Write-Host 'Python is needed to run this local overlay. Install Python, then run this file again.' -ForegroundColor Yellow
  Read-Host 'Press Enter to close'
  exit 1
}
if (-not $serverReady) {
  $exe = $python.Source
  $pythonArgs = if ((Split-Path -Leaf $exe) -match '^py(\.exe)?$') { @('-3',(Join-Path $project 'server.py')) } else { @((Join-Path $project 'server.py')) }
  Start-Process -FilePath $exe -ArgumentList $pythonArgs -WorkingDirectory $project -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 250
    try { $null = Invoke-WebRequest -Uri ($url + 'state') -TimeoutSec 1; $serverReady = $true; break } catch { }
  }
}
if (-not $serverReady) {
  Write-Host 'The local overlay server did not start on 127.0.0.1:8765. Check whether another app is using port 8765, then run this file again.' -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}
Start-Process $url
Write-Host 'Overlay server is responding at http://127.0.0.1:8765/. Keep it running while you stream.'
