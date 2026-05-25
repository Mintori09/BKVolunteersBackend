param(
    [string]$LogsDir = 'logs',
    [int]$Tail = 200,
    [string]$OutputDir = '.ops-snapshots'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$workspaceRoot = (Resolve-Path -LiteralPath '.').Path
$snapshotDir = Join-Path $workspaceRoot $OutputDir
if (-not (Test-Path -LiteralPath $snapshotDir)) {
    New-Item -ItemType Directory -Path $snapshotDir | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$snapshotFile = Join-Path $snapshotDir ("ops-snapshot-$timestamp.txt")

$sections = @()
$sections += "BKVolunteers ops snapshot"
$sections += "Generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$sections += "Workspace: $workspaceRoot"
$sections += ''

$files = @('combined.log', 'error.log')
foreach ($fileName in $files) {
    $logPath = Join-Path $workspaceRoot (Join-Path $LogsDir $fileName)
    $sections += "===== $fileName ====="
    if (Test-Path -LiteralPath $logPath) {
        $sections += Get-Content -LiteralPath $logPath -Tail $Tail
    } else {
        $sections += "(missing) $logPath"
    }
    $sections += ''
}

$sections | Set-Content -LiteralPath $snapshotFile
Write-Host "Operational snapshot written to $snapshotFile"
