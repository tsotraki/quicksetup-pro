interface App {
    name: string;
    wingetId: string;
}

/**
 * Generate a PowerShell script that installs selected apps using Winget
 */
export function generatePowerShellScript(apps: App[]): string {
    const appList = apps.map(app => `    @{ Name = "${app.name.replace(/"/g, '""')}"; Id = "${app.wingetId}" }`).join(',\n');
    const timestamp = new Date().toISOString();

    // Use single quotes for the return so we don't have to escape backticks inside the PS script
    // No, wait, it's easier to use a template literal and escape correctly.
    return `# QuickSetup Pro - Automated App Installer
# Generated: ${timestamp}
# Apps to install: ${apps.length}

# Auto-elevate to Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    try {
        # Using -File with $PSCommandPath is the most robust way to relaunch
        Start-Process powershell.exe -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "\`"$PSCommandPath\`"" -Verb RunAs
    } catch {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host " [!] Error: This script requires Administrator privileges." -ForegroundColor Red
        Write-Host " Please click 'Yes' when the UAC prompt appears." -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Red
        Read-Host "Press Enter to exit"
    }
    exit
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QuickSetup Pro - App Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Winget is installed
try {
    $wingetPath = Get-Command winget -ErrorAction Stop
    Write-Host "✓ Winget found at: $($wingetPath.Source)" -ForegroundColor Green
} catch {
    Write-Host "✗ Winget is not installed!" -ForegroundColor Red
    Write-Host "Please install Winget from: https://aka.ms/getwinget" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# List of apps to install
$apps = @(
${appList}
)

$totalApps = $apps.Count
$currentApp = 0
$successCount = 0
$skipCount = 0
$failCount = 0

Write-Host "Installing $totalApps applications..." -ForegroundColor Cyan
Write-Host ""

foreach ($app in $apps) {
    $currentApp++
    
    Write-Host "[$currentApp/$totalApps] $($app.Name)" -ForegroundColor White
    Write-Host "    Package ID: $($app.Id)" -ForegroundColor Gray
    
    try {
        # Check if already installed
        $installed = winget list --id $app.Id --exact 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $installed -match [regex]::Escape($app.Id)) {
            Write-Host "    ⊙ Already installed, skipping..." -ForegroundColor Yellow
            $skipCount++
        } else {
            # Install the app silently
            Write-Host "    ↓ Installing..." -ForegroundColor Cyan
            
            $installResult = winget install --id $app.Id --exact --silent --accept-package-agreements --accept-source-agreements 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✓ Installed successfully" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "    ✗ Installation failed" -ForegroundColor Red
                Write-Host "    Error: $installResult" -ForegroundColor Red
                $failCount++
            }
        }
    } catch {
        Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Total apps:      $totalApps" -ForegroundColor White
Write-Host "  Installed:       $successCount" -ForegroundColor Green
Write-Host "  Already present: $skipCount" -ForegroundColor Yellow
Write-Host "  Failed:          $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "Some installations failed. Check the output above for details." -ForegroundColor Yellow
}

Write-Host "Press Enter to exit..."
Read-Host
`;
}

/**
 * Generate a Windows Batch script that installs selected apps using Winget
 */
export function generateBatchScript(apps: App[]): string {
    const timestamp = new Date().toISOString();

    let script = `@echo off
setlocal enabledelayedexpansion

:: QuickSetup Pro - Automated App Installer
:: Generated: ${timestamp}
:: Apps to install: ${apps.length}

title QuickSetup Pro - App Installer
echo ========================================
echo    QuickSetup Pro - App Installer
echo ========================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:: Check if Winget is installed
where winget >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [!] Error: Winget is not installed!
    echo Please install Winget from: https://aka.ms/getwinget
    echo.
    pause
    exit /b 1
)

echo [v] Winget found.
echo Installing ${apps.length} applications...
echo.

set "total=${apps.length}"
set "current=0"
set "success=0"
set "failed=0"

`;

    apps.forEach((app, _index) => {
        script += `set /a current+=1
echo [!current!/!total!] ${app.name}
echo     Package ID: ${app.wingetId}

:: Checking status
echo     Checking if already installed...
winget list --id "${app.wingetId}" --exact >nul 2>&1

if errorlevel 1 (
    echo     Status: Not found. Starting installation...
    echo     Please wait, this may take a moment...
    
    :: Attempting installation
    winget install --id "${app.wingetId}" --exact --silent --accept-package-agreements --accept-source-agreements
    
    if errorlevel 1 (
        echo     Status: [FAIL] Installation failed or was cancelled.
        set /a failed+=1
    ) else (
        echo     Status: [OK] Installed successfully.
        set /a success+=1
    )
) else (
    echo     Status: [SKIP] Already installed.
    set /a success+=1
)
echo.
`;
    });

    script += `
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo Summary:
echo   Total apps:      !total!
echo   Success/Skip:    !success!
echo   Failed:          !failed!
echo.
if !failed! gtr 0 (
    echo [!] Some installations failed. Check the output above.
)

echo Press any key to exit...
pause >nul
`;

    return script;
}
