# Test AI Recommendations Feature - Intelligent Search

Write-Host "=== Testing AI Recommendations with Intelligent Search ===" -ForegroundColor Cyan
Write-Host "Now works with ANY keyword!`n" -ForegroundColor Green

$testPrompts = @(
    "compress",
    "browser",
    "video editor", 
    "python",
    "game",
    "photo",
    "music",
    "pdf",
    "terminal",
    "torrent"
)

foreach ($prompt in $testPrompts) {
    Write-Host "Testing: '$prompt'" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "https://quicksetup-pro-production.up.railway.app/api/ai/recommend" `
            -Method POST `
            -ContentType "application/json" `
            -Body "{`"prompt`":`"$prompt`"}"
        
        Write-Host "  ✓ Found $($response.count) apps" -ForegroundColor Green
        
        if ($response.recommendations -and $response.count -gt 0) {
            $response.recommendations | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - $($_.name)" -ForegroundColor Gray
            }
            if ($response.count -gt 3) {
                Write-Host "    ... and $($response.count - 3) more" -ForegroundColor DarkGray
            }
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "`n=== All tests completed ===" -ForegroundColor Cyan
