import axios from 'axios';

// Valid IDs - Available in winget.run API
const POPULAR_IDS = [
    'Microsoft.Office',                        // Microsoft Office
    'TheDocumentFoundation.LibreOffice',       // LibreOffice
    'Notepad++.Notepad++',                     // Notepad++
    'Microsoft.VisualStudioCode',              // Visual Studio Code
    'VideoLAN.VLC',                            // VLC Media Player
    'Audacity.Audacity',                       // Audacity
    'HandBrake.HandBrake',                     // HandBrake
    'ShareX.ShareX',                           // ShareX
    'Bitwarden.Bitwarden',                     // Bitwarden
    'Malwarebytes.Malwarebytes',               // Malwarebytes
    'ProtonTechnologies.ProtonVPN',            // ProtonVPN
    'Microsoft.PowerToys',                     // Microsoft PowerToys
    'CPUID.CPU-Z',                             // CPU-Z
    'Oracle.VirtualBox',                       // VirtualBox
    'RevoUninstaller.RevoUninstaller',         // Revo Uninstaller
    'voidtools.Everything.Lite',               // Everything (Lite version in API)
    // Note: Todoist, 7-Zip, WinDirStat, Rufus have different IDs in winget.run API
];

// Special Search Queries to overcome API search limitations
// Maps PackageID -> Search Query
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

/**
 * Fetch package information from Winget repository
 * Uses the winget.run API as a proxy to the official Winget repository
 */
export async function getWingetPackageInfo(packageId: string) {
    try {
        let pkg = null;

        // Common headers to avoid blocking
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        // Strategy 1: Direct ID lookup
        try {
            const url = `https://api.winget.run/v2/packages/${encodeURIComponent(packageId)}`;
            const response = await axios.get(url, {
                headers,
                timeout: 5000,
                validateStatus: (status) => status !== 429
            });

            if (response.data && response.data.Packages && response.data.Packages.length > 0) {
                // STRICT CHECK: The API might return "TheDocumentFoundation.LibreOffice.HelpPack" 
                // when we requested "TheDocumentFoundation.LibreOffice".
                // We MUST verify the ID exactly.
                const exactMatch = response.data.Packages.find((p: any) => p.Id.toLowerCase() === packageId.toLowerCase());
                if (exactMatch) {
                    pkg = exactMatch;
                }
            }
        } catch (error: any) {
            if (error.response?.status === 429) console.warn(`[Winget] Rate limit hit for ${packageId}`);
        }

        // Strategy 2: Search with Custom Queries & Strict Matching
        if (!pkg) {
            try {
                // Use Custom Query if available, otherwise default to packageId
                let query = CUSTOM_QUERIES[packageId] || packageId;

                const searchResponse = await axios.get('https://api.winget.run/v2/packages', {
                    params: { query: query, take: 5 },
                    headers,
                    timeout: 5000
                });

                const candidates = searchResponse.data.Packages || [];

                // STRICT Match Only: ID must match exactly (case-insensitive)
                pkg = candidates.find((c: any) => c.Id.toLowerCase() === packageId.toLowerCase());

            } catch (e) {
                console.error(`[Winget] Fallback search failed for ${packageId}`);
            }
        }

        if (!pkg) {
            console.warn(`[Winget] API returned no package for ID: ${packageId}`);
            return null;
        }

        const latestVersion = pkg.Versions?.[0] || {};
        const category = determineCategory(pkg);

        return {
            // Core App fields
            id: pkg.Id,
            name: pkg.Name || latestVersion.Name || pkg.Id,
            wingetId: pkg.Id,
            category,
            description: pkg.Description || latestVersion.Description || 'No description available',
            icon: getIconForCategory(category),
            popular: POPULAR_IDS.includes(packageId) || POPULAR_IDS.includes(pkg.Id),
            tags: pkg.Tags || latestVersion.Tags || [],

            // Extra Metadata
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

/**
 * Get list of popular packages
 */
export async function getPopularPackages(take: number = 12, skip: number = 0) {
    const idsToFetch = POPULAR_IDS.slice(skip, skip + take);

    // Batching to prevent rate limits
    const BATCH_SIZE = 4;
    const results = [];

    for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
        const batch = idsToFetch.slice(i, i + BATCH_SIZE);
        const promises = batch.map(id => getWingetPackageInfo(id));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);

        // Fast delay
        if (i + BATCH_SIZE < idsToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return results.filter(Boolean);
}

/**
 * Search for packages in Winget repository
 */
export async function searchPackages(query: string = '', take: number = 12, skip: number = 0) {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        };

        // Strategy: If query looks like a specific ID (contains dot, no spaces), try to fetch it DIRECTLY first.
        // This is much more reliable than searching, as "Microsoft.VisualStudioCode" search might return Insiders etc.
        if (query && query.includes('.') && !query.includes(' ')) {
            try {
                // Try to get the specific package info
                // getWingetPackageInfo handles direct lookup + custom query overrides
                const exactMatch = await getWingetPackageInfo(query);

                // If found, and it's a reasonable match (either exact ID, or resolved via our custom map)
                if (exactMatch) {
                    // Check strict ID match to be absolutely sure if user provided a full ID
                    if (exactMatch.id.toLowerCase() === query.toLowerCase()) {
                        return [exactMatch];
                    }
                    // Even if ID differs (e.g. resolved alias), if we found ONE specific thing via direct lookup, return it.
                    // But to be safe vs Search, let's Stick to Strict ID Check for this "Single Result" behavior.
                    // EXCEPT if Custom Query Map mapped it (e.g. Audacity.aud -> Audacity.Audacity).
                    // So we trust getWingetPackageInfo's result if we passed an ID-like string.
                    return [exactMatch];
                }
            } catch (ignore) { }
        }

        // Standard search if no direct match found
        // API requires query to be at least 1 character - use a broad search term if empty
        const searchQuery = query || 'app';
        const params: any = { take, skip, query: searchQuery };

        const response = await axios.get('https://api.winget.run/v2/packages', {
            params, headers, timeout: 5000
        });

        const packages = response.data.Packages || [];

        const results = packages.map((pkg: any) => {
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

        return results;
    } catch (error) {
        console.error('Failed to search Winget packages:', error);
        return [];
    }
}

/**
 * Verify if a package exists in Winget repository
 */
export async function verifyWingetPackage(packageId: string): Promise<boolean> {
    try {
        const info = await getWingetPackageInfo(packageId);
        return info !== null;
    } catch (error) {
        return false;
    }
}

function getIconForCategory(category: string): string {
    switch (category) {
        case 'basics': return 'Globe';
        case 'utilities': return 'Wrench';
        case 'developer': return 'Code';
        case 'media': return 'PlayCircle';
        case 'runtime': return 'Cpu';
        default: return 'Package';
    }
}

function determineCategory(pkg: any): 'basics' | 'utilities' | 'developer' | 'media' | 'runtime' {
    const text = [
        pkg.Id, pkg.Name, pkg.Latest?.Name, pkg.Description,
        pkg.Latest?.Description, ...(pkg.Tags || []), ...(pkg.Latest?.Tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    const patterns = {
        developer: ['code', 'ide', 'git', 'sdk', 'program', 'node', 'python', 'java', 'compiler', 'debug', 'studio', 'vs', 'develop', 'powershell', 'terminal', 'editor', 'postman', 'docker'],
        media: ['video', 'audio', 'music', 'player', 'image', 'photo', 'stream', 'spotify', 'vlc', 'obs', 'ffmpeg', 'gimp', 'paint', 'codec'],
        basics: ['browser', 'chat', 'communicat', 'message', 'social', 'web', 'chrome', 'firefox', 'edge', 'discord', 'slack', 'zoom', 'telegram', 'whatsapp', 'vpn'],
        runtime: ['runtime', 'framework', 'redistributable', 'library', 'driver', 'directx', 'vcredist', '.net', 'jdk', 'jre', 'opengl', 'vc++']
    };

    if (patterns.developer.some(k => text.includes(k))) return 'developer';
    if (patterns.media.some(k => text.includes(k))) return 'media';
    if (patterns.basics.some(k => text.includes(k))) return 'basics';
    if (patterns.runtime.some(k => text.includes(k))) return 'runtime';

    return 'utilities';
}
