param(
    [int]$Port = 0
)

$ErrorActionPreference = 'Stop'

if ($Port -eq 0) {
    if ($env:CASA_PORT) { $Port = [int]$env:CASA_PORT } else { $Port = 4317 }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $env:LOCALAPPDATA 'CasaDeAgentes'
$pidFile = Join-Path $logDir 'casa.pid'

function Stop-ById {
    param([int]$ProcessId)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if (-not $process) { return $false }
    if ($process.CommandLine -notlike '*server/index.js*') { return $false }
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    return $true
}

$stopped = $false

if (Test-Path $pidFile) {
    $savedId = 0
    [int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$savedId) | Out-Null
    if ($savedId -gt 0) {
        $stopped = Stop-ById -ProcessId $savedId
    }
}

if (-not $stopped) {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) {
        $stopped = Stop-ById -ProcessId $connection.OwningProcess
    }
}

Remove-Item $pidFile -ErrorAction SilentlyContinue

if ($stopped) {
    Write-Host 'Casa de Agentes detenida.'
} else {
    Write-Host "No hay un servidor de Casa de Agentes corriendo en el puerto $Port."
}
