Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Import-DotEnvFile {
    param([string]$Path)

    $result = @{}
    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        return $result
    }

    foreach ($rawLine in Get-Content -LiteralPath $Path) {
        $line = $rawLine.Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#') -or -not $line.Contains('=')) {
            continue
        }

        $key, $value = $line -split '=', 2
        $trimmedKey = $key.Trim()
        $trimmedValue = $value.Trim()
        $result[$trimmedKey] = $trimmedValue

        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($trimmedKey))) {
            [Environment]::SetEnvironmentVariable($trimmedKey, $trimmedValue)
        }
    }

    return $result
}

function Parse-DatabaseUrl {
    param([Parameter(Mandatory = $true)][string]$DatabaseUrl)

    $pattern = '^mysql:\/\/(?<userinfo>.+)@(?<host>\[[^\]]+\]|[^:\/?#]+)(:(?<port>\d+))?\/(?<database>[^?]+)'
    $match = [regex]::Match($DatabaseUrl, $pattern)
    if (-not $match.Success) {
        throw "Unsupported or invalid DATABASE_URL format: $DatabaseUrl"
    }

    $userInfo = $match.Groups['userinfo'].Value
    $user = $userInfo
    $password = ''
    if ($userInfo.Contains(':')) {
        $user, $password = $userInfo -split ':', 2
    }

    $parsedHost = $match.Groups['host'].Value.Trim('[', ']')
    $port = if ($match.Groups['port'].Success) { [int]$match.Groups['port'].Value } else { 3306 }
    $database = $match.Groups['database'].Value

    return @{
        Host = [System.Uri]::UnescapeDataString($parsedHost)
        Port = $port
        Database = [System.Uri]::UnescapeDataString($database)
        User = [System.Uri]::UnescapeDataString($user)
        Password = [System.Uri]::UnescapeDataString($password)
    }
}

function Resolve-DatabaseConfig {
    param(
        [string]$DbHost,
        [int]$Port,
        [string]$Database,
        [string]$User,
        [string]$Password,
        [hashtable]$EnvValues
    )

    $resolvedHost = $DbHost
    $resolvedPort = $Port
    $resolvedDatabase = $Database
    $resolvedUser = $User
    $resolvedPassword = $Password

    $databaseUrl = $env:DATABASE_URL
    if ([string]::IsNullOrWhiteSpace($databaseUrl) -and $EnvValues.ContainsKey('DATABASE_URL')) {
        $databaseUrl = $EnvValues['DATABASE_URL']
    }

    if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
        $parsed = Parse-DatabaseUrl -DatabaseUrl $databaseUrl
        if ([string]::IsNullOrWhiteSpace($resolvedHost)) { $resolvedHost = $parsed.Host }
        if ($resolvedPort -le 0) { $resolvedPort = $parsed.Port }
        if ([string]::IsNullOrWhiteSpace($resolvedDatabase)) { $resolvedDatabase = $parsed.Database }
        if ([string]::IsNullOrWhiteSpace($resolvedUser)) { $resolvedUser = $parsed.User }
        if ([string]::IsNullOrWhiteSpace($resolvedPassword)) { $resolvedPassword = $parsed.Password }
    }

    if ([string]::IsNullOrWhiteSpace($resolvedHost)) { $resolvedHost = '127.0.0.1' }
    if ($resolvedPort -le 0) { $resolvedPort = 3306 }
    if ([string]::IsNullOrWhiteSpace($resolvedUser)) { $resolvedUser = 'root' }

    return @{
        Host = $resolvedHost
        Port = $resolvedPort
        Database = $resolvedDatabase
        User = $resolvedUser
        Password = $resolvedPassword
    }
}

function Resolve-MySqlExecutable {
    param(
        [Parameter(Mandatory = $true)][string]$BinaryName,
        [string]$PreferredPath
    )

    if (-not [string]::IsNullOrWhiteSpace($PreferredPath)) {
        if (-not (Test-Path -LiteralPath $PreferredPath)) {
            throw "MySQL executable not found: $PreferredPath"
        }
        return (Resolve-Path -LiteralPath $PreferredPath).Path
    }

    $pathCommand = Get-Command -Name $BinaryName -ErrorAction SilentlyContinue
    if ($pathCommand) {
        return $pathCommand.Source
    }

    $searchRoots = @(
        'C:\Program Files\MySQL',
        'C:\Program Files\MariaDB',
        'C:\xampp\mysql\bin'
    )

    foreach ($root in $searchRoots) {
        if (-not (Test-Path -LiteralPath $root)) {
            continue
        }

        $match = Get-ChildItem -Path $root -Recurse -Filter $BinaryName -File -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($match) {
            return $match.FullName
        }
    }

    throw "Unable to locate '$BinaryName'. Provide an explicit path."
}
