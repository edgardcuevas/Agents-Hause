param(
    [switch]$Desktop = $true,
    [switch]$Startup = $true,
    [switch]$StopShortcut = $true
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptsDir = Join-Path $repoRoot 'scripts'
$assetsDir = Join-Path $repoRoot 'assets'
$iconPath = Join-Path $assetsDir 'casa.ico'
$logDir = Join-Path $env:LOCALAPPDATA 'CasaDeAgentes'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

# Genera un icono pixel-art si todavía no existe.
if (-not (Test-Path $iconPath)) {
    Add-Type -AssemblyName System.Drawing
    $size = 32
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $roofBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 107, 58, 42))
    $graphics.FillPolygon($roofBrush, @(
        [System.Drawing.Point]::new(4, 15),
        [System.Drawing.Point]::new(16, 4),
        [System.Drawing.Point]::new(28, 15)
    ))

    $wallBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 139, 90, 60))
    $graphics.FillRectangle($wallBrush, 6, 15, 20, 13)

    $doorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 58, 42, 26))
    $graphics.FillRectangle($doorBrush, 13, 20, 6, 8)

    $windowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 135, 206, 235))
    $graphics.FillRectangle($windowBrush, 8, 18, 4, 4)
    $graphics.FillRectangle($windowBrush, 20, 18, 4, 4)

    $graphics.Dispose()
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $stream = [System.IO.File]::Create($iconPath)
    $icon.Save($stream)
    $stream.Close()
    $icon.Dispose()
    $bitmap.Dispose()
}

$vbsLanzar = Join-Path $scriptsDir 'lanzar-casa.vbs'
$vbsServidor = Join-Path $scriptsDir 'lanzar-servidor.vbs'
$vbsDetener = Join-Path $scriptsDir 'detener-casa.vbs'

$lanzarContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$repoRoot\scripts\iniciar-casa.ps1""", 0, False
"@
Set-Content -Path $vbsLanzar -Value $lanzarContent -Encoding ASCII

$lanzarMiniContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$repoRoot\scripts\iniciar-casa.ps1"" -Mini", 0, False
"@
Set-Content -Path (Join-Path $scriptsDir 'lanzar-mini.vbs') -Value $lanzarMiniContent -Encoding ASCII

$servidorContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$repoRoot\scripts\iniciar-casa.ps1"" -NoOpen", 0, False
"@
Set-Content -Path $vbsServidor -Value $servidorContent -Encoding ASCII

$detenerContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$repoRoot\scripts\detener-casa.ps1""", 0, False
"@
Set-Content -Path $vbsDetener -Value $detenerContent -Encoding ASCII

$shell = New-Object -ComObject WScript.Shell

if ($Desktop) {
    $desktopPath = [Environment]::GetFolderPath('Desktop')
    $shortcut = $shell.CreateShortcut((Join-Path $desktopPath 'Casa de Agentes.lnk'))
    $shortcut.TargetPath = 'wscript.exe'
    $shortcut.Arguments = "`"$vbsLanzar`""
    $shortcut.WorkingDirectory = $repoRoot
    $shortcut.IconLocation = "$iconPath,0"
    $shortcut.Description = 'Casa de Agentes - OpenCode en vivo'
    $shortcut.Save()
}

if ($Startup) {
    $startupPath = [Environment]::GetFolderPath('Startup')
    $startupShortcut = $shell.CreateShortcut((Join-Path $startupPath 'Casa de Agentes (servidor).lnk'))
    $startupShortcut.TargetPath = 'wscript.exe'
    $startupShortcut.Arguments = "`"$vbsServidor`""
    $startupShortcut.WorkingDirectory = $repoRoot
    $startupShortcut.IconLocation = "$iconPath,0"
    $startupShortcut.Description = 'Arranca el servidor de Casa de Agentes al iniciar sesion'
    $startupShortcut.Save()
}

Write-Host 'Acceso directo instalado.'
Write-Host "Icono: $iconPath"
if ($Desktop) { Write-Host 'Escritorio: Casa de Agentes' }
if ($Startup) { Write-Host 'Inicio: Casa de Agentes (servidor)' }
