# Test AI Recommendations Feature

## Test Compression Tools
Write-Host "Testing AI Recommendations for 'compress'..."
$response = Invoke-RestMethod -Uri "https://quicksetup-pro-production.up.railway.app/api/ai/recommend" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"prompt":"compress"}'

Write-Host "`nPrompt: $($response.prompt)"
Write-Host "Count: $($response.count)`n"

if ($response.recommendations) {
    Write-Host "Recommended Apps:"
    foreach ($app in $response.recommendations) {
        Write-Host "  - $($app.name) ($($app.wingetId))"
    }
} else {
    Write-Host "No recommendations found!"
}

Write-Host "`n---`n"

## Test Other Keywords
$testPrompts = @("zip", "archive", "extract", "developer", "gaming", "music")

foreach ($prompt in $testPrompts) {
    Write-Host "Testing '$prompt'..."
    $r = Invoke-RestMethod -Uri "https://quicksetup-pro-production.up.railway.app/api/ai/recommend" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{`"prompt`":`"$prompt`"}"
    Write-Host "  → $($r.count) apps recommended`n"
}
