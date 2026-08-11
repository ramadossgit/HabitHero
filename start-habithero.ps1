# ============================================================================
# Habit Heroes one-click launcher (Windows)
#
# Brings up everything needed to run the app for the mobile/tablet pilot:
#   1. Checks prerequisites (Node, PostgreSQL binaries) and installs npm
#      dependencies when missing
#   2. Starts (or bootstraps) the project-local PostgreSQL on port 5433
#      and applies the database schema on first run
#   3. Starts the Habit Heroes server on port 5000 (if not already running)
#   4. Updates the mobile app's server URL to this PC's current LAN IP
#   5. Starts Expo for the mobile app (skip with -NoMobile)
#
# Usage:  .\start-habithero.ps1            # everything
#         .\start-habithero.ps1 -NoMobile  # backend only
# ============================================================================
param(
    [switch]$NoMobile
)

$ErrorActionPreference = 'Stop'
$AppDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$MobileDir = Join-Path $AppDir 'HabitHeroesMobile'
$DataDir  = Join-Path $AppDir '.localdb'
$PgBin    = 'C:\Program Files\PostgreSQL\17\bin'
$PgPort   = 5433
$AppPort  = 5000

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

# ── 1. Prerequisites ────────────────────────────────────────────────────────
Step "Checking prerequisites"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed or not on PATH. Install it from https://nodejs.org"
}
Ok "Node $(node --version)"

if (-not (Test-Path (Join-Path $PgBin 'pg_ctl.exe'))) {
    throw "PostgreSQL 17 binaries not found at $PgBin. Install PostgreSQL 17 or edit `$PgBin in this script."
}
Ok "PostgreSQL binaries found"

if (-not (Test-Path (Join-Path $AppDir 'node_modules'))) {
    Step "Installing server dependencies (first run only, takes a few minutes)"
    Push-Location $AppDir; npm install --no-audit --no-fund; Pop-Location
}
Ok "Server dependencies present"

# ── 2. Database ─────────────────────────────────────────────────────────────
Step "Starting database (port $PgPort)"
$freshDb = $false
if (-not (Test-Path $DataDir)) {
    Step "No local database found - creating one (first run only)"
    & "$PgBin\initdb.exe" -D $DataDir -U habithero -A trust -E UTF8 | Out-Null
    $freshDb = $true
}

& "$PgBin\pg_isready.exe" -p $PgPort *> $null
if ($LASTEXITCODE -ne 0) {
    Start-Process -FilePath "$PgBin\pg_ctl.exe" `
        -ArgumentList '-D', "`"$DataDir`"", '-o', "`"-p $PgPort`"", '-l', "`"$DataDir\pg.log`"", 'start' `
        -WindowStyle Hidden
    $deadline = (Get-Date).AddSeconds(60)
    do {
        Start-Sleep -Seconds 2
        & "$PgBin\pg_isready.exe" -p $PgPort *> $null
    } until ($LASTEXITCODE -eq 0 -or (Get-Date) -gt $deadline)
    if ($LASTEXITCODE -ne 0) { throw "Database did not start - see $DataDir\pg.log" }
}
Ok "Database is accepting connections"

# Create the habithero database + schema on first run
& "$PgBin\psql.exe" -p $PgPort -U habithero -d habithero -c "select 1" *> $null
if ($LASTEXITCODE -ne 0) {
    & "$PgBin\createdb.exe" -p $PgPort -U habithero habithero
    $freshDb = $true
}
if ($freshDb) {
    Step "Applying database schema (first run only)"
    Get-ChildItem (Join-Path $AppDir 'migrations') -Filter '*.sql' | Sort-Object Name | ForEach-Object {
        & "$PgBin\psql.exe" -p $PgPort -U habithero -d habithero -v ON_ERROR_STOP=1 -f $_.FullName | Out-Null
    }
    Ok "Schema applied"
}

# ── 3. App server ───────────────────────────────────────────────────────────
Step "Starting Habit Heroes server (port $AppPort)"
function Test-AppHealth {
    # curl.exe ships with Windows 10+; Invoke-WebRequest can hang on proxy autodetection
    $code = & curl.exe -s -o NUL -m 4 -w '%{http_code}' "http://localhost:$AppPort/api/health" 2>$null
    return $code -eq '200'
}
if (Test-AppHealth) {
    Ok "Server already running"
} else {
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "cd /d `"$AppDir`" && npm run dev" -WindowStyle Minimized
    $deadline = (Get-Date).AddSeconds(120)
    $healthy = $false
    do {
        Start-Sleep -Seconds 3
        $healthy = Test-AppHealth
    } until ($healthy -or (Get-Date) -gt $deadline)
    if (-not $healthy) { throw "Server did not become healthy within 2 minutes - check the minimized server window" }
    Ok "Server is healthy"
}

# ── 4. LAN address for phones/tablets ──────────────────────────────────────
Step "Detecting LAN address for mobile devices"
# Parse ipconfig (instant) instead of CIM cmdlets (can stall for minutes)
$lanIp = (ipconfig | Select-String 'IPv4 Address[ .]*: *([0-9.]+)' |
          ForEach-Object { $_.Matches[0].Groups[1].Value } |
          Where-Object { $_ -match '^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)' } |
          Select-Object -First 1)
if (-not $lanIp) { $lanIp = 'localhost'; Warn "No LAN adapter found - phones will not be able to connect" }
$lanUrl = "http://${lanIp}:$AppPort"
Ok "This PC: $lanUrl"

# Keep the mobile shell pointed at the current LAN IP (it can change after reboots)
$appJsonPath = Join-Path $MobileDir 'app.json'
if (Test-Path $appJsonPath) {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    if ($appJson.expo.extra.serverUrl -ne $lanUrl) {
        $appJson.expo.extra.serverUrl = $lanUrl
        # Write WITHOUT a BOM: JSON.parse (tests, Metro/Expo) rejects BOM-prefixed JSON
        $jsonText = $appJson | ConvertTo-Json -Depth 20
        [System.IO.File]::WriteAllText($appJsonPath, $jsonText, (New-Object System.Text.UTF8Encoding($false)))
        Ok "Updated HabitHeroesMobile/app.json serverUrl -> $lanUrl"
    } else {
        Ok "Mobile app already points at $lanUrl"
    }
}

# Open Windows Firewall for the app port so phones/tablets can actually
# reach the server. Without this, devices time out ("Can't reach Habit
# Heroes") even though the server is running — Windows silently drops the
# inbound packets. (netsh is instant; NetSecurity cmdlets can stall.)
Step "Checking Windows Firewall for port $AppPort"
$fwName = "Habit Heroes Dev Server ($AppPort)"
$fwOut  = netsh advfirewall firewall show rule name="$fwName" 2>$null
$fwRule = ($fwOut -join ' ') -notmatch 'No rules match'
if ($fwRule) {
    Ok "Firewall already allows port $AppPort"
} else {
    # Try to add it directly (works if this window is already elevated)
    $added = $false
    try {
        netsh advfirewall firewall add rule name="$fwName" dir=in action=allow protocol=TCP localport=$AppPort profile=private,domain | Out-Null
        if ($LASTEXITCODE -eq 0) { $added = $true }
    } catch { }

    if (-not $added) {
        # Not elevated — ask Windows to add just this rule via one UAC prompt
        Warn "Opening the firewall for phones/tablets (approve the Windows prompt)..."
        $ruleCmd = "netsh advfirewall firewall add rule name=`"$fwName`" dir=in action=allow protocol=TCP localport=$AppPort profile=private,domain"
        try {
            Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $ruleCmd -Verb RunAs -Wait -WindowStyle Hidden
            Start-Sleep -Milliseconds 500
            $fwOut2 = netsh advfirewall firewall show rule name="$fwName" 2>$null
            if ((($fwOut2 -join ' ') -notmatch 'No rules match')) { $added = $true }
        } catch { }
    }

    if ($added) {
        Ok "Firewall now allows port $AppPort for this network"
    } else {
        Warn "Could not open the firewall automatically. Run this ONCE in an"
        Warn "Administrator PowerShell, then restart the app:"
        Warn "  netsh advfirewall firewall add rule name=`"$fwName`" dir=in action=allow protocol=TCP localport=$AppPort profile=private,domain"
    }
}

# ── 5. Expo mobile app ──────────────────────────────────────────────────────
if (-not $NoMobile) {
    Step "Starting Expo for the mobile app"
    if (-not (Test-Path (Join-Path $MobileDir 'node_modules'))) {
        Step "Installing mobile dependencies (first run only)"
        Push-Location $MobileDir; npm install --no-audit --no-fund; Pop-Location
    }
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$MobileDir`" && npx expo start"
    Ok "Expo window opened - scan the QR code with Expo Go (phone must be on the same Wi-Fi)"
}

# ── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================= Habit Heroes is up =================" -ForegroundColor Magenta
Write-Host "  On this PC:        http://localhost:$AppPort"
Write-Host "  Phones / tablets:  $lanUrl  (same Wi-Fi)"
if (-not $NoMobile) {
    Write-Host "  Mobile app:        scan the QR in the Expo window with Expo Go"
}
Write-Host "  Stop everything:   close the server/Expo windows;"
Write-Host "                     database: `"$PgBin\pg_ctl.exe`" -D `"$DataDir`" stop"
Write-Host "======================================================" -ForegroundColor Magenta
exit 0
