$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidPath = Join-Path $projectDir 'server.pid'
if (-not (Test-Path -LiteralPath $pidPath)) {
    Write-Host 'No background server PID file was found.'
    exit 0
}
$serverId = [int](Get-Content -LiteralPath $pidPath -Raw)
$serverProcess = Get-Process -Id $serverId -ErrorAction SilentlyContinue
if ($serverProcess -and $serverProcess.ProcessName -match 'python') {
    Stop-Process -Id $serverId
    Write-Host 'Live Gift Counter server stopped.'
} else {
    Write-Host 'The saved server process is no longer running.'
}
Remove-Item -LiteralPath $pidPath -ErrorAction SilentlyContinue
