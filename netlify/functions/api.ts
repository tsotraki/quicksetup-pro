// QuickSetup Pro - Netlify Serverless API Function
// Handles all /api/* routes
// Deployment: 2026-01-04T15:00:00+02:00

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

interface NetlifyEvent {
    httpMethod: string;
    path: string;
    queryStringParameters: Record<string, string> | null;
    body: string | null;
}

interface NetlifyResponse {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
        gaming: ['game', 'gaming', 'steam', 'epic', 'gog', 'launcher', 'xbox'],
        design: ['design', 'graphic', 'photo editor', 'creative', 'adobe', 'sketch', 'figma'],
        productivity: ['office', 'productivity', 'document', 'spreadsheet', 'note', 'calendar'],
        security: ['security', 'antivirus', 'firewall', 'password', 'encryption', 'malware'],
        network: ['network', 'ftp', 'ssh', 'remote', 'server', 'download', 'torrent'],
        developer: ['code', 'ide', 'git', 'sdk', 'program', 'node', 'python', 'java', 'compiler'],
        media: ['video', 'audio', 'music', 'player', 'image', 'photo', 'stream', 'vlc'],
        basics: ['browser', 'chat', 'communicat', 'message', 'social', 'web', 'chrome', 'firefox'],
        runtime: ['runtime', 'framework', 'redistributable', 'library', 'driver', 'directx']
    };

    for (const [cat, keywords] of Object.entries(patterns)) {
        if (keywords.some(k => text.includes(k))) return cat;
    }
    return 'utilities';
}

async function fetchJson(url: string): Promise<any> {
    const response = await fetch(url, { headers: API_HEADERS });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
                pkg = data.Packages.find((p: any) => p.Id.toLowerCase() === packageId.toLowerCase());
            }
        } catch (e) {
            console.warn(`[Winget] Direct lookup failed for ${packageId}`);
        }

        // Strategy 2: Search
        if (!pkg) {
            try {
                const query = CUSTOM_QUERIES[packageId] || packageId;
                const searchUrl = `https://api.winget.run/v2/packages?query=${encodeURIComponent(query)}&take=5`;
                const data = await fetchJson(searchUrl);
                const candidates = data.Packages || [];
                pkg = candidates.find((c: any) => c.Id.toLowerCase() === packageId.toLowerCase());
            } catch (e) {
                console.error(`[Winget] Search failed for ${packageId}`);
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
            popular: POPULAR_IDS.includes(pkg.Id),
            tags: pkg.Tags || latestVersion.Tags || [],
            version: latestVersion.Version || 'latest',
            publisher: pkg.Publisher || '',
            homepage: pkg.Homepage || '',
            license: pkg.License || '',
            installerType: latestVersion.InstallerType || 'exe'
        };
    } catch (error) {
        console.error(`[Winget] Error fetching ${packageId}:`, error);
        return null;
    }
}

async function getPopularPackages(take: number = 12, skip: number = 0): Promise<App[]> {
    const idsToFetch = POPULAR_IDS.slice(skip, skip + take);
    const results: (App | null)[] = [];

    for (let i = 0; i < idsToFetch.length; i += 4) {
        const batch = idsToFetch.slice(i, i + 4);
        const batchResults = await Promise.all(batch.map(id => getWingetPackageInfo(id)));
        results.push(...batchResults);
        if (i + 4 < idsToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results.filter((r): r is App => r !== null);
}

async function searchPackages(query: string = '', take: number = 12, skip: number = 0): Promise<App[]> {
    try {
        if (query && query.includes('.') && !query.includes(' ')) {
            const exactMatch = await getWingetPackageInfo(query);
            if (exactMatch) return [exactMatch];
        }

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
                description: pkg.Description || pkg.Latest?.Description || 'No description',
                icon: getIconForCategory(category),
                popular: POPULAR_IDS.includes(pkg.Id),
                tags: pkg.Tags || []
            };
        });
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

// ============================================
// SCRIPT GENERATOR (simplified)
// ============================================
function generatePowerShellScript(apps: { name: string; wingetId: string }[]): string {
    const appList = apps.map(app => `    @{ Name = "${app.name}"; Id = "${app.wingetId}" }`).join(',\n');
    return `# QuickSetup Pro Installer
# Apps: ${apps.length}

$apps = @(
${appList}
)

foreach ($app in $apps) {
    Write-Host "Installing $($app.Name)..."
    winget install --id $app.Id --exact --silent --accept-package-agreements --accept-source-agreements
}
Write-Host "Done!"
Read-Host
`;
}

function generateBatchScript(apps: { name: string; wingetId: string }[]): string {
    let script = `@echo off\necho Installing ${apps.length} apps...\n`;
    apps.forEach(app => {
        script += `winget install --id "${app.wingetId}" --exact --silent --accept-package-agreements --accept-source-agreements\n`;
    });
    script += `echo Done!\npause\n`;
    return script;
}

// ============================================
// AI RECOMMENDATIONS
// ============================================
async function getAIRecommendations(prompt: string): Promise<App[]> {
    const results = await searchPackages(prompt, 20, 0);
    const promptLower = prompt.toLowerCase();

    return results
        .map(app => {
            let score = 0;
            const name = app.name.toLowerCase();
            if (name.includes(promptLower)) score += 50;
            promptLower.split(/\s+/).forEach(word => {
                if (word.length > 1 && name.includes(word)) score += 20;
            });
            return { app, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(r => r.app);
}

// ============================================
// RESPONSE HELPER
// ============================================
function jsonResponse(data: any, statusCode: number = 200): NetlifyResponse {
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
// MAIN HANDLER - Using CommonJS export for Netlify
// ============================================
exports.handler = async function (event: NetlifyEvent): Promise<NetlifyResponse> {
    const method = event.httpMethod;

    // CORS preflight
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

    // Parse path
    let path = (event.path || '')
        .replace(/^\/.netlify\/functions\/api/, '')
        .replace(/^\/api/, '');
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
            const app = await getWingetPackageInfo(id);
            if (!app) return jsonResponse({ error: 'App not found' }, 404);
            return jsonResponse(app);
        }

        // GET /apps
        if (method === 'GET' && path === '/apps') {
            const params = event.queryStringParameters || {};
            const search = params.search || '';
            const category = params.category || '';
            const take = parseInt(params.take || '12');
            const skip = parseInt(params.skip || '0');

            if (category === 'popular' && !search) {
                return jsonResponse(await getPopularPackages(take, skip));
            }

            let searchQuery = search;
            if (!searchQuery && category) {
                const catQueries: Record<string, string> = {
                    'basics': 'browser chat communication',
                    'developer': 'code ide editor git',
                    'media': 'video audio music player',
                    'runtime': 'runtime framework redistributable',
                    'utilities': 'utility tool archive',
                    'gaming': 'game gaming steam',
                    'design': 'design graphic photo',
                    'productivity': 'office document spreadsheet',
                    'security': 'security antivirus firewall',
                    'network': 'network ftp ssh remote'
                };
                searchQuery = catQueries[category] || '';
            }

            let results = await searchPackages(searchQuery, take * 2, skip);
            if (category && category !== 'popular') {
                results = results.filter(app => app.category === category);
            }
            return jsonResponse(results.slice(0, take));
        }

        // POST /script/generate
        if (method === 'POST' && path === '/script/generate') {
            const body = JSON.parse(event.body || '{}');
            const { apps: selectedApps, format = 'ps1' } = body;
            if (!selectedApps?.length) return jsonResponse({ error: 'No apps' }, 400);

            const script = format === 'bat'
                ? generateBatchScript(selectedApps)
                : generatePowerShellScript(selectedApps);

            return jsonResponse({ script, appCount: selectedApps.length });
        }

        // POST /ai/recommend
        if (method === 'POST' && path === '/ai/recommend') {
            const body = JSON.parse(event.body || '{}');
            if (!body.prompt) return jsonResponse({ error: 'Prompt required' }, 400);
            const recommendations = await getAIRecommendations(body.prompt);
            return jsonResponse({ recommendations, count: recommendations.length });
        }

        return jsonResponse({ error: 'Not found', path }, 404);

    } catch (error) {
        console.error('Handler error:', error);
        return jsonResponse({ error: 'Internal server error' }, 500);
    }
};
