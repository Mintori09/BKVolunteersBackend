param(
    [string]$UploadBasePath,
    [string]$OutputDir = '.ops-backups',
    [string]$Label = 'uploads'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-UploadPath {
    param([string]$PathValue)

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        $PathValue = $env:UPLOAD_BASE_PATH
    }
    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        $PathValue = 'uploads'
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        if ($PathValue.StartsWith('/') -or $PathValue.StartsWith('\')) {
            $driveRoot = (Get-Location).Drive.Root
            return Join-Path $driveRoot $PathValue.TrimStart('/','\')
        }
        return $PathValue
    }

    return Join-Path (Resolve-Path -LiteralPath '.').Path $PathValue
}

$resolvedUploadPath = Resolve-UploadPath -PathValue $UploadBasePath
if (-not (Test-Path -LiteralPath $resolvedUploadPath)) {
    throw "Upload path not found: $resolvedUploadPath"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path (Resolve-Path -LiteralPath '.').Path $OutputDir
if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$archivePath = Join-Path $backupDir ('{0}-{1}.zip' -f $Label, $timestamp)
Write-Host "Archiving uploads from '$resolvedUploadPath' -> $archivePath"
Compress-Archive -Path (Join-Path $resolvedUploadPath '*') -DestinationPath $archivePath -Force
Write-Host "Upload backup completed: $archivePath"
