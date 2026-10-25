$ErrorActionPreference = 'Stop'

$desktopPath = [Environment]::GetFolderPath('Desktop')
$startupPath = [Environment]::GetFolderPath('Startup')

$names = @(
    'Casa de Agentes.lnk',
    'Casa de Agentes Mini.lnk',
    'Detener Casa de Agentes.lnk'
)

foreach ($name in $names) {
    $desktopFile = Join-Path $desktopPath $name
    if (Test-Path $desktopFile) { Remove-Item $desktopFile -Force }
}

$startupFile = Join-Path $startupPath 'Casa de Agentes (servidor).lnk'
if (Test-Path $startupFile) { Remove-Item $startupFile -Force }

Write-Host 'Accesos directos eliminados.'
Write-Host 'Los scripts y el icono se mantienen en el proyecto.'
