# QuickSetup Pro - Example Working Script
# This demonstrates how the generated scripts work

#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QuickSetup Pro - App Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Winget is installed
try {
    $wingetPath = Get-Command winget -ErrorAction Stop
    Write-Host "[OK] Winget found at: $($wingetPath.Source)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Winget is not installed!" -ForegroundColor Red
    Write-Host "Please install Winget from: https://aka.ms/getwinget" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Example apps list (you can customize this)
$apps = @(
    @{ Name = "Google Chrome"; Id = "Google.Chrome" },
    @{ Name = "Visual Studio Code"; Id = "Microsoft.VisualStudioCode" },
    @{ Name = "Git"; Id = "Git.Git" },
    @{ Name = "7-Zip"; Id = "7zip.7zip" },
    @{ Name = "VLC Media Player"; Id = "VideoLAN.VLC" }
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
        
        if ($LASTEXITCODE -eq 0 -and $installed -match $app.Id) {
            Write-Host "    [SKIP] Already installed" -ForegroundColor Yellow
            $skipCount++
        }
        else {
            # Install the app silently
            Write-Host "    [INSTALLING] Please wait..." -ForegroundColor Cyan
            
            $installResult = winget install --id $app.Id --exact --silent --accept-package-agreements --accept-source-agreements 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    [SUCCESS] Installed successfully" -ForegroundColor Green
                $successCount++
            }
            else {
                Write-Host "    [FAILED] Installation failed" -ForegroundColor Red
                Write-Host "    Error: $installResult" -ForegroundColor Red
                $failCount++
            }
        }
    }
    catch {
        Write-Host "    [ERROR] $($_.Exception.Message)" -ForegroundColor Red
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

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
