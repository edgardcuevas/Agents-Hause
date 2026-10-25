param(
    [int]$Port = 0,
    [switch]$NoOpen,
    [switch]$Mini,
    [string]$Source = $env:CASA_SOURCE,
    [switch]$NoOpenCodeAutostart
)

$ErrorActionPreference = 'Stop'

if (-not $Source) { $Source = 'opencode' }
if ($Port -eq 0) {
    if ($env:CASA_PORT) { $Port = [int]$env:CASA_PORT } else { $Port = 4317 }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $env:LOCALAPPDATA 'CasaDeAgentes'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'casa.log'
$errLog = Join-Path $logDir 'casa.err.log'
$pidFile = Join-Path $logDir 'casa.pid'

function Show-CasaMessage {
    param([string]$Message, [string]$Title = 'Casa de Agentes', [string]$Icon = 'Error')
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    $button = [System.Windows.Forms.MessageBoxButtons]::OK
    $image = [System.Windows.Forms.MessageBoxIcon]::$Icon
    [System.Windows.Forms.MessageBox]::Show($Message, $Title, $button, $image) | Out-Null
}

function Test-CasaHealth {
    param([int]$TimeoutSeconds = 20)
    $url = "http://127.0.0.1:$Port/api/health"
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $request = [System.Net.WebRequest]::Create($url)
            $request.Timeout = 2000
            $response = $request.GetResponse()
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $json = $reader.ReadToEnd()
            $response.Close()
            $health = $json | ConvertFrom-Json
            if ($health.ok) { return $true }
        } catch {
            # El servidor todavía no responde; se reintenta.
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Get-CasaProcess {
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $connection) { return $null }
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -like '*server/index.js*') {
        return $process
    }
    return $null
}

$existing = Get-CasaProcess
if (-not $existing) {
    $foreign = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foreign) {
        Show-CasaMessage "El puerto $Port ya está en uso por otro programa. Cierra ese programa o cambia CASA_PORT." 'Casa de Agentes'
        exit 1
    }

    $env:SOURCE = $Source
    if (-not $NoOpenCodeAutostart) {
        $env:OPENCODE_AUTOSTART = '1'
    } else {
        Remove-Item Env:OPENCODE_AUTOSTART -ErrorAction SilentlyContinue
    }
    if (-not $env:MAX_AGENTS) { $env:MAX_AGENTS = '6' }
    if (-not $env:MAX_IDLE) { $env:MAX_IDLE = '2' }

    $process = Start-Process -FilePath 'node' -ArgumentList 'server/index.js' -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errLog -PassThru
    $process.Id | Set-Content -Path $pidFile -Encoding ASCII

    if (-not (Test-CasaHealth)) {
        $detail = ''
        if (Test-Path $errLog) {
            $detail = (Get-Content $errLog -Tail 12 -ErrorAction SilentlyContinue) -join [Environment]::NewLine
        }
        Show-CasaMessage "No se pudo iniciar Casa de Agentes.`n`nRevisa el log:`n$log`n`n$detail" 'Casa de Agentes'
        exit 1
    }
} else {
    $existing.ProcessId | Set-Content -Path $pidFile -Encoding ASCII
}

if ($NoOpen) { exit 0 }

if ($Mini) {
    $url = "http://127.0.0.1:$Port/?mini=1"
} else {
    $url = "http://127.0.0.1:$Port"
}
$opened = $false

$edge = $null
$edgeCandidates = @(
    (Get-Command msedge.exe -ErrorAction SilentlyContinue).Source,
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
) | Where-Object { $_ -and (Test-Path $_) }
if ($edgeCandidates) { $edge = @($edgeCandidates)[0] }

$chrome = $null
$chromeCandidates = @(
    (Get-Command chrome.exe -ErrorAction SilentlyContinue).Source,
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
) | Where-Object { $_ -and (Test-Path $_) }
if ($chromeCandidates) { $chrome = @($chromeCandidates)[0] }

$browserArgs = "--app=$url"
if ($Mini) {
    Add-Type -AssemblyName System.Windows.Forms | Out-Null
    $area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
    $miniWidth = 360
    $miniHeight = 440
    $miniX = [Math]::Max(0, $area.Right - $miniWidth - 16)
    $miniY = [Math]::Max(0, $area.Bottom - $miniHeight - 16)
    $browserArgs = "--app=$url --window-size=$miniWidth,$miniHeight --window-position=$miniX,$miniY"
}

if ($edge) {
    Start-Process $edge $browserArgs | Out-Null
    $opened = $true
} elseif ($chrome) {
    Start-Process $chrome $browserArgs | Out-Null
    $opened = $true
} else {
    Start-Process $url | Out-Null
    $opened = $true
}

if (-not $opened) {
    Show-CasaMessage "El servidor está listo, pero no se pudo abrir el navegador.`nAbre manualmente: $url" 'Casa de Agentes'
    exit 1
}
