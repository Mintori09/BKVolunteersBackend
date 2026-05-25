param(
    [Parameter(Mandatory = $true)]
    [string]$DumpFile,
    [Alias('Host')]
    [string]$DbHost,
    [int]$Port,
    [string]$Database,
    [string]$User,
    [string]$Password,
    [string]$EnvFile = '..\.env',
    [string]$MySqlPath,
    [switch]$CreateDatabase,
    [switch]$ReplaceDatabase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'mysql-common.ps1')

if (-not (Test-Path -LiteralPath $DumpFile)) {
    throw "Dump file not found: $DumpFile"
}

$envFilePath = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $scriptDir $EnvFile }
$envValues = Import-DotEnvFile -Path $envFilePath
$dbConfig = Resolve-DatabaseConfig -DbHost $DbHost -Port $Port -Database $Database -User $User -Password $Password -EnvValues $envValues
$mySqlExe = Resolve-MySqlExecutable -BinaryName 'mysql.exe' -PreferredPath $MySqlPath

if ([string]::IsNullOrWhiteSpace($dbConfig.Database)) {
    throw 'Database name is required. Provide -Database or set DATABASE_URL.'
}

$args = @(
    '-h', $dbConfig.Host,
    '-P', [string]$dbConfig.Port,
    '-u', $dbConfig.User
)

if (-not [string]::IsNullOrWhiteSpace($dbConfig.Password)) {
    $args += "-p$($dbConfig.Password)"
}

$args += $dbConfig.Database

if ($CreateDatabase -or $ReplaceDatabase) {
    $createDbArgs = @(
        '-h', $dbConfig.Host,
        '-P', [string]$dbConfig.Port,
        '-u', $dbConfig.User
    )
    if (-not [string]::IsNullOrWhiteSpace($dbConfig.Password)) {
        $createDbArgs += "-p$($dbConfig.Password)"
    }

    if ($ReplaceDatabase) {
        $dropDbQuery = "DROP DATABASE IF EXISTS ``$($dbConfig.Database)``;"
        & $mySqlExe @createDbArgs -e $dropDbQuery
    }

    $createDbQuery = "CREATE DATABASE IF NOT EXISTS ``$($dbConfig.Database)`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    & $mySqlExe @createDbArgs -e $createDbQuery
}

Write-Host "Restoring dump '$DumpFile' into database '$($dbConfig.Database)'"
Get-Content -LiteralPath $DumpFile | & $mySqlExe @args
Write-Host 'Restore completed.'
