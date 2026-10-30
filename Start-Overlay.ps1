$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$healthUrl = 'http://127.0.0.1:8765/health'

try {
    Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 | Out-Null
    Start-Process $healthUrl.Replace('/health', '/')
    exit 0
} catch {
    # Start the local server below if no instance is listening yet.
}

$pythonPath = $null
$pythonArgs = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonPath = (Get-Command py).Source
    $pythonArgs = @('-3', 'server.py')
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonPath = (Get-Command python).Source
    $pythonArgs = @('server.py')
} else {
    throw 'Python 3 was not found. Install Python or start the server manually.'
}

$outLog = Join-Path $projectDir 'server.log'
$errLog = Join-Path $projectDir 'server-error.log'
$serverProcess = Start-Process -FilePath $pythonPath -ArgumentList $pythonArgs -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 400
    try {
        Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 | Out-Null
        $ready = $true
        break
    } catch {
        if ($serverProcess.HasExited) { break }
    }
}

if (-not $ready) {
    throw "The local server did not start. Check $errLog for details."
}

Set-Content -LiteralPath (Join-Path $projectDir 'server.pid') -Value $serverProcess.Id -Encoding ascii
Start-Process 'http://127.0.0.1:8765/'
Write-Host 'Live Gift Counter is running at http://127.0.0.1:8765/'
