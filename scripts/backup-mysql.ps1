param(
    [Alias('Host')]
    [string]$DbHost,
    [int]$Port,
    [string]$Database,
    [string]$User,
    [string]$Password,
    [string]$EnvFile = '..\.env',
    [string]$MySqlDumpPath,
    [string]$OutputDir = '.ops-backups',
    [string]$Label = 'backup'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'mysql-common.ps1')

$envFilePath = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $scriptDir $EnvFile }
$envValues = Import-DotEnvFile -Path $envFilePath
$dbConfig = Resolve-DatabaseConfig -DbHost $DbHost -Port $Port -Database $Database -User $User -Password $Password -EnvValues $envValues
$mySqlDumpExe = Resolve-MySqlExecutable -BinaryName 'mysqldump.exe' -PreferredPath $MySqlDumpPath

if ([string]::IsNullOrWhiteSpace($dbConfig.Database)) {
    throw 'Database name is required. Provide -Database or set DATABASE_URL.'
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$targetDir = Resolve-Path -LiteralPath '.' | Select-Object -ExpandProperty Path
$backupDir = Join-Path $targetDir $OutputDir
if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$fileName = '{0}-{1}-{2}.sql' -f $Label, $dbConfig.Database, $timestamp
$outputPath = Join-Path $backupDir $fileName

$args = @(
    '--single-transaction',
    '--routines',
    '--triggers',
    '--set-gtid-purged=OFF',
    '-h', $dbConfig.Host,
    '-P', [string]$dbConfig.Port,
    '-u', $dbConfig.User
)

if (-not [string]::IsNullOrWhiteSpace($dbConfig.Password)) {
    $args += "-p$($dbConfig.Password)"
}

$args += $dbConfig.Database

Write-Host "Creating dump for database '$($dbConfig.Database)' -> $outputPath"
& $mySqlDumpExe @args > $outputPath

if (-not (Test-Path -LiteralPath $outputPath)) {
    throw "Backup file was not created: $outputPath"
}

$file = Get-Item -LiteralPath $outputPath
Write-Host ('Backup completed: {0} ({1} bytes)' -f $file.FullName, $file.Length)
