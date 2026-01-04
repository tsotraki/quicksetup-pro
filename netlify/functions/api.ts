// QuickSetup Pro - Netlify Serverless API Function
// Handles all /api/* routes
// Using Netlify Functions v1 format for compatibility

import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";

// ============================================
// TYPES
// ============================================
interface App {
    id: string;
    name: string;
    wingetId: string;
    category: string;
    description: string;
    icon: string;
    popular: boolean;
    tags: string[];
    version?: string;
    publisher?: string;
    homepage?: string;
    license?: string;
    installerType?: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    count: number;
}

// ============================================
// CONSTANTS
// ============================================
const POPULAR_IDS = [
    'Microsoft.Office',
    'TheDocumentFoundation.LibreOffice',
    'Notepad++.Notepad++',
    'Microsoft.VisualStudioCode',
    'VideoLAN.VLC',
    'Audacity.Audacity',
    'HandBrake.HandBrake',
    'ShareX.ShareX',
    'Bitwarden.Bitwarden',
    'Malwarebytes.Malwarebytes',
    'ProtonTechnologies.ProtonVPN',
    'Microsoft.PowerToys',
    'CPUID.CPU-Z',
    'Oracle.VirtualBox',
    'RevoUninstaller.RevoUninstaller',
    'voidtools.Everything.Lite',
];

const CUSTOM_QUERIES: Record<string, string> = {
    'Notepad++.Notepad++': 'Notepad++',
    'Audacity.Audacity': 'Audacity.aud',
    'ShareX.ShareX': 'ShareX',
    'VideoLAN.VLC': 'VLC media player',
    'TheDocumentFoundation.LibreOffice': 'LibreOffice',
    'Microsoft.PowerToys': 'PowerToys',
    'CPUID.CPU-Z': 'CPU-Z',
    'Oracle.VirtualBox': 'VirtualBox',
    'Microsoft.Office': 'Microsoft Office',
    'RevoUninstaller.RevoUninstaller': 'Revo Uninstaller',
    'ProtonTechnologies.ProtonVPN': 'ProtonVPN',
    'voidtools.Everything.Lite': 'Everything',
    'HandBrake.HandBrake': 'HandBrake',
    'Bitwarden.Bitwarden': 'Bitwarden',
    'Malwarebytes.Malwarebytes': 'Malwarebytes'
};

const CATEGORIES: Category[] = [
    { id: 'popular', name: 'Popular', icon: 'Star', count: 0 },
    { id: 'basics', name: 'Basics', icon: 'Globe', count: 0 },
    { id: 'utilities', name: 'Utilities', icon: 'Wrench', count: 0 },
    { id: 'developer', name: 'Developer', icon: 'Code', count: 0 },
    { id: 'media', name: 'Media', icon: 'PlayCircle', count: 0 },
    { id: 'gaming', name: 'Gaming', icon: 'Gamepad2', count: 0 },
    { id: 'design', name: 'Design', icon: 'Palette', count: 0 },
    { id: 'productivity', name: 'Productivity', icon: 'Briefcase', count: 0 },
    { id: 'security', name: 'Security', icon: 'Shield', count: 0 },
    { id: 'network', name: 'Network', icon: 'Network', count: 0 },
    { id: 'runtime', name: 'Runtime', icon: 'Cpu', count: 0 }
];

// ============================================
// WINGET API HELPERS
// ============================================
const API_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
};

function getIconForCategory(category: string): string {
    const icons: Record<string, string> = {
        'basics': 'Globe', 'utilities': 'Wrench', 'developer': 'Code',
        'media': 'PlayCircle', 'runtime': 'Cpu', 'gaming': 'Gamepad2',
        'design': 'Palette', 'productivity': 'Briefcase', 'security': 'Shield',
        'network': 'Network'
    };
    return icons[category] || 'Package';
}

function determineCategory(pkg: any): string {
    const text = [
        pkg.Id, pkg.Name, pkg.Latest?.Name, pkg.Description,
        pkg.Latest?.Description, ...(pkg.Tags || []), ...(pkg.Latest?.Tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const patterns: Record<string, string[]> = {
        gaming: ['game', 'gaming', 'steam', 'epic', 'gog', 'launcher', 'xbox', 'playstation', 'origin', 'ubisoft', 'blizzard', 'riot'],
        design: ['design', 'graphic', 'photo editor', 'creative', 'adobe', 'sketch', 'figma', 'illustrator', 'photoshop', 'inkscape', 'krita', 'blender'],
        productivity: ['office', 'productivity', 'document', 'spreadsheet', 'note', 'calendar', 'outlook', 'word', 'excel', 'onenote', 'notion', 'trello', 'asana'],
        security: ['security', 'antivirus', 'firewall', 'password', 'encryption', 'malware', 'kaspersky', 'norton', 'mcafee', 'bitdefender', 'avast'],
        network: ['network', 'ftp', 'ssh', 'remote', 'server', 'download', 'torrent', 'putty', 'filezilla', 'winscp', 'vnc', 'rdp', 'teamviewer'],
        developer: ['code', 'ide', 'git', 'sdk', 'program', 'node', 'python', 'java', 'compiler', 'debug', 'studio', 'vs', 'develop', 'powershell', 'terminal', 'editor', 'postman', 'docker'],
        media: ['video', 'audio', 'music', 'player', 'image', 'photo', 'stream', 'spotify', 'vlc', 'obs', 'ffmpeg', 'gimp', 'paint', 'codec'],
        basics: ['browser', 'chat', 'communicat', 'message', 'social', 'web', 'chrome', 'firefox', 'edge', 'discord', 'slack', 'zoom', 'telegram', 'whatsapp', 'vpn'],
        runtime: ['runtime', 'framework', 'redistributable', 'library', 'driver', 'directx', 'vcredist', '.net', 'jdk', 'jre', 'opengl', 'vc++']
    };

    for (const [cat, keywords] of Object.entries(patterns)) {
        if (keywords.some(k => text.includes(k))) return cat;
    }
    return 'utilities';
}

async function fetchJson(url: string, options: any = {}): Promise<any> {
    const response = await fetch(url, {
        headers: API_HEADERS,
        ...options
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}

async function getWingetPackageInfo(packageId: string): Promise<App | null> {
    try {
        let pkg = null;

        // Strategy 1: Direct ID lookup
        try {
            const url = `https://api.winget.run/v2/packages/${encodeURIComponent(packageId)}`;
            const data = await fetchJson(url);

            if (data?.Packages?.length > 0) {
                const exactMatch = data.Packages.find((p: any) =>
                    p.Id.toLowerCase() === packageId.toLowerCase()
                );
                if (exactMatch) pkg = exactMatch;
            }
        } catch (error: any) {
            console.warn(`[Winget] Direct lookup failed for ${packageId}`);
        }

        // Strategy 2: Search with Custom Queries
        if (!pkg) {
            try {
                const query = CUSTOM_QUERIES[packageId] || packageId;
                const searchUrl = `https://api.winget.run/v2/packages?query=${encodeURIComponent(query)}&take=5`;
                const data = await fetchJson(searchUrl);

                const candidates = data.Packages || [];
                pkg = candidates.find((c: any) => c.Id.toLowerCase() === packageId.toLowerCase());
            } catch (e) {
                console.error(`[Winget] Fallback search failed for ${packageId}`);
            }
        }

        if (!pkg) return null;

        const latestVersion = pkg.Versions?.[0] || {};
        const category = determineCategory(pkg);

        return {
            id: pkg.Id,
            name: pkg.Name || latestVersion.Name || pkg.Id,
            wingetId: pkg.Id,
            category,
            description: pkg.Description || latestVersion.Description || 'No description available',
            icon: getIconForCategory(category),
            popular: POPULAR_IDS.includes(packageId) || POPULAR_IDS.includes(pkg.Id),
            tags: pkg.Tags || latestVersion.Tags || [],
            version: latestVersion.Version || 'latest',
            publisher: pkg.Publisher || '',
            homepage: pkg.Homepage || '',
            license: pkg.License || '',
            installerType: latestVersion.InstallerType || 'exe'
        };
    } catch (error) {
        console.error(`[Winget] Fatal error fetching ${packageId}:`, error);
        return null;
    }
}

async function getPopularPackages(take: number = 12, skip: number = 0): Promise<App[]> {
    const idsToFetch = POPULAR_IDS.slice(skip, skip + take);
    const BATCH_SIZE = 4;
    const results: (App | null)[] = [];

    for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
        const batch = idsToFetch.slice(i, i + BATCH_SIZE);
        const promises = batch.map(id => getWingetPackageInfo(id));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        if (i + BATCH_SIZE < idsToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results.filter((r): r is App => r !== null);
}

async function searchPackages(query: string = '', take: number = 12, skip: number = 0): Promise<App[]> {
    try {
        // If query looks like a specific ID, try direct fetch first
        if (query && query.includes('.') && !query.includes(' ')) {
            const exactMatch = await getWingetPackageInfo(query);
            if (exactMatch && exactMatch.id.toLowerCase() === query.toLowerCase()) {
                return [exactMatch];
            }
        }

        // Standard search
        const searchQuery = query || 'app';
        const url = `https://api.winget.run/v2/packages?query=${encodeURIComponent(searchQuery)}&take=${take}&skip=${skip}`;
        const data = await fetchJson(url);

        const packages = data.Packages || [];

        return packages.map((pkg: any) => {
            const category = determineCategory(pkg);
            return {
                id: pkg.Id,
                name: pkg.Name || pkg.Latest?.Name || pkg.Id,
                wingetId: pkg.Id,
                category,
                description: pkg.Description || pkg.Latest?.Description || pkg.Versions?.[0]?.Description || 'No description available',
                icon: getIconForCategory(category),
                popular: POPULAR_IDS.includes(pkg.Id),
                tags: pkg.Tags || pkg.Latest?.Tags || []
            };
        });
    } catch (error) {
        console.error('Failed to search Winget packages:', error);
        return [];
    }
}

// ============================================
// SCRIPT GENERATOR
// ============================================
function generatePowerShellScript(apps: { name: string; wingetId: string }[]): string {
    const appList = apps.map(app => `    @{ Name = "${app.name.replace(/"/g, '""')}"; Id = "${app.wingetId}" }`).join(',\n');
    const timestamp = new Date().toISOString();

    return `# QuickSetup Pro - Automated App Installer
# Generated: ${timestamp}
# Apps to install: ${apps.length}

# Auto-elevate to Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    try {
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
        $installed = winget list --id $app.Id --exact 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $installed -match [regex]::Escape($app.Id)) {
            Write-Host "    ⊙ Already installed, skipping..." -ForegroundColor Yellow
            $skipCount++
        } else {
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

function generateBatchScript(apps: { name: string; wingetId: string }[]): string {
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

    apps.forEach((app) => {
        script += `set /a current+=1
echo [!current!/!total!] ${app.name}
echo     Package ID: ${app.wingetId}

:: Checking status
echo     Checking if already installed...
winget list --id "${app.wingetId}" --exact >nul 2>&1

if errorlevel 1 (
    echo     Status: Not found. Starting installation...
    echo     Please wait, this may take a moment...
    
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

// ============================================
// AI RECOMMENDATIONS
// ============================================
function calculateRelevanceScore(app: App, prompt: string): number {
    const promptLower = prompt.toLowerCase();
    const words = promptLower.split(/\s+/);
    let score = 0;

    const name = app.name.toLowerCase();
    const description = app.description.toLowerCase();
    const tags = app.tags.map(t => t.toLowerCase()).join(' ');
    const wingetId = app.wingetId.toLowerCase();

    if (name === promptLower) score += 100;
    else if (name.includes(promptLower)) score += 50;

    words.forEach(word => {
        if (word.length < 2) return;
        if (name.includes(word)) score += 20;
        if (wingetId.includes(word)) score += 15;
        if (tags.includes(word)) score += 10;
        if (description.includes(word)) score += 5;
    });

    if (app.popular) score += 5;
    return score;
}

async function getAIRecommendations(prompt: string): Promise<App[]> {
    try {
        const searchResults = await searchPackages(prompt, 20, 0);
        if (!searchResults || searchResults.length === 0) return [];

        const scoredResults = searchResults
            .map(app => ({ app, score: calculateRelevanceScore(app, prompt) }))
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score);

        return scoredResults.slice(0, 8).map(r => r.app);
    } catch (error) {
        console.error('[AI Recommendations] Error:', error);
        return [];
    }
}

// ============================================
// HELPERS
// ============================================
function jsonResponse(data: any, statusCode: number = 200): HandlerResponse {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(data)
    };
}

// ============================================
// MAIN HANDLER
// ============================================
const handler: Handler = async (event: HandlerEvent, _context: HandlerContext): Promise<HandlerResponse> => {
    const method = event.httpMethod;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    // Parse path from the URL - remove /api prefix if present
    let path = event.path
        .replace(/^\/.netlify\/functions\/api/, '')  // Remove Netlify function prefix
        .replace(/^\/api/, '');                       // Remove /api prefix

    if (!path) path = '/';

    console.log(`[API] ${method} ${path}`);

    try {
        // GET /health
        if (method === 'GET' && path === '/health') {
            return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        }

        // GET /apps/meta/categories
        if (method === 'GET' && path === '/apps/meta/categories') {
            return jsonResponse(CATEGORIES);
        }

        // GET /apps/:id
        if (method === 'GET' && path.startsWith('/apps/') && !path.includes('/meta/')) {
            const id = path.replace('/apps/', '');
            const wingetInfo = await getWingetPackageInfo(id);

            if (!wingetInfo) {
                return jsonResponse({ error: 'App not found' }, 404);
            }

            return jsonResponse({
                ...wingetInfo,
                id,
                name: wingetInfo.name || id,
                wingetId: id,
                category: wingetInfo.category || 'utilities',
                description: wingetInfo.description || 'Fetched from Winget',
                icon: wingetInfo.icon || 'Package',
                popular: wingetInfo.popular || false,
                tags: wingetInfo.tags || []
            });
        }

        // GET /apps
        if (method === 'GET' && path === '/apps') {
            const params = event.queryStringParameters || {};
            const search = params.search || '';
            const category = params.category || '';
            const take = parseInt(params.take || '12');
            const skip = parseInt(params.skip || '0');

            // Popular category
            if (category === 'popular' && !search) {
                const results = await getPopularPackages(take, skip);
                return jsonResponse(results);
            }

            // Category search mapping
            let searchQuery = search;
            if (!searchQuery && category) {
                const categoryQueries: Record<string, string> = {
                    'basics': 'browser communication social vpn chat message',
                    'developer': 'code ide editor git sdk program develop terminal',
                    'media': 'video audio music player image photo stream codec',
                    'runtime': 'runtime framework redistributable library driver directx',
                    'utilities': 'utility tool archive compress file system utility',
                    'gaming': 'game gaming steam epic gog launcher platform',
                    'design': 'design graphic photo editor creative adobe sketch',
                    'productivity': 'office productivity document spreadsheet note calendar',
                    'security': 'security antivirus firewall vpn password encryption',
                    'network': 'network ftp ssh remote server download torrent'
                };
                searchQuery = categoryQueries[category] || '';
            }

            // Search
            if (searchQuery || skip > 0) {
                const fetchCount = category && category !== 'popular' ? take * 3 : take;
                let results = await searchPackages(searchQuery, fetchCount, skip);

                if (category && category !== 'popular') {
                    results = results.filter(app => app.category === category);
                }

                return jsonResponse(results.slice(0, take));
            }

            // Default: initial load
            const results = await searchPackages('', take, skip);
            return jsonResponse(results);
        }

        // POST /script/generate
        if (method === 'POST' && path === '/script/generate') {
            const body = JSON.parse(event.body || '{}');
            const { apps: selectedApps, format = 'ps1' } = body;

            if (!selectedApps || !Array.isArray(selectedApps) || selectedApps.length === 0) {
                return jsonResponse({ error: 'No apps selected' }, 400);
            }

            const script = format === 'bat'
                ? generateBatchScript(selectedApps)
                : generatePowerShellScript(selectedApps);

            return jsonResponse({
                script,
                appCount: selectedApps.length,
                apps: selectedApps.map((app: any) => ({
                    id: app.id,
                    name: app.name,
                    wingetId: app.wingetId
                }))
            });
        }

        // POST /ai/recommend
        if (method === 'POST' && path === '/ai/recommend') {
            const body = JSON.parse(event.body || '{}');
            const { prompt } = body;

            if (!prompt || typeof prompt !== 'string') {
                return jsonResponse({ error: 'Prompt is required' }, 400);
            }

            const recommendations = await getAIRecommendations(prompt);

            return jsonResponse({
                prompt,
                recommendations,
                count: recommendations.length
            });
        }

        // Not found
        return jsonResponse({ error: 'Not found', path }, 404);

    } catch (error) {
        console.error('Handler error:', error);
        return jsonResponse({ error: 'Internal server error' }, 500);
    }
};

export { handler };
