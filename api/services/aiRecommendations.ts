export interface App {
    id: string;
    name: string;
    wingetId: string;
    category: 'basics' | 'utilities' | 'developer' | 'media' | 'runtime';
    description: string;
    icon: string;
    popular: boolean;
    tags: string[];
}

// Internal knowledge base of popular apps for recommendations
const knownApps: Record<string, App> = {
    'vscode': { id: 'vscode', name: 'Visual Studio Code', wingetId: 'Microsoft.VisualStudioCode', category: 'developer', description: 'Powerful code editor by Microsoft', icon: 'Code', popular: true, tags: ['editor', 'ide'] },
    'git': { id: 'git', name: 'Git', wingetId: 'Git.Git', category: 'developer', description: 'Distributed version control system', icon: 'GitBranch', popular: true, tags: ['git'] },
    'nodejs': { id: 'nodejs', name: 'Node.js', wingetId: 'OpenJS.NodeJS', category: 'developer', description: 'JavaScript runtime', icon: 'Terminal', popular: true, tags: ['javascript'] },
    'postman': { id: 'postman', name: 'Postman', wingetId: 'Postman.Postman', category: 'developer', description: 'API development tool', icon: 'Send', popular: true, tags: ['api'] },
    'chrome': { id: 'chrome', name: 'Google Chrome', wingetId: 'Google.Chrome', category: 'basics', description: 'Web browser', icon: 'Chrome', popular: true, tags: ['browser'] },
    'notepadplusplus': { id: 'notepadplusplus', name: 'Notepad++', wingetId: 'Notepad++.Notepad++', category: 'utilities', description: 'Code editor', icon: 'FileText', popular: true, tags: ['editor'] },
    'firefox': { id: 'firefox', name: 'Mozilla Firefox', wingetId: 'Mozilla.Firefox', category: 'basics', description: 'Web browser', icon: 'Globe', popular: true, tags: ['browser'] },
    'python': { id: 'python', name: 'Python', wingetId: 'Python.Python.3.12', category: 'developer', description: 'Programming language', icon: 'Code2', popular: true, tags: ['python'] },
    'steam': { id: 'steam', name: 'Steam', wingetId: 'Valve.Steam', category: 'media', description: 'Game platform', icon: 'Gamepad2', popular: true, tags: ['gaming'] },
    'discord': { id: 'discord', name: 'Discord', wingetId: 'Discord.Discord', category: 'basics', description: 'Communication platform', icon: 'MessageCircle', popular: true, tags: ['chat'] },
    'obs': { id: 'obs', name: 'OBS Studio', wingetId: 'OBSProject.OBSStudio', category: 'media', description: 'Streaming software', icon: 'Video', popular: true, tags: ['streaming'] },
    'directx': { id: 'directx', name: 'DirectX Runtime', wingetId: 'Microsoft.DirectX', category: 'runtime', description: 'Gaming runtime', icon: 'Gamepad2', popular: false, tags: ['runtime'] },
    'vcredist': { id: 'vcredist', name: 'Visual C++ Redistributable', wingetId: 'Microsoft.VCRedist.2015+.x64', category: 'runtime', description: 'C++ Runtime', icon: 'Box', popular: false, tags: ['runtime'] },
    'gimp': { id: 'gimp', name: 'GIMP', wingetId: 'GIMP.GIMP', category: 'media', description: 'Image editor', icon: 'Image', popular: false, tags: ['editor'] },
    'audacity': { id: 'audacity', name: 'Audacity', wingetId: 'Audacity.Audacity', category: 'media', description: 'Audio editor', icon: 'Mic', popular: false, tags: ['audio'] },
    'vlc': { id: 'vlc', name: 'VLC Media Player', wingetId: 'VideoLAN.VLC', category: 'media', description: 'Media player', icon: 'PlayCircle', popular: true, tags: ['video'] },
    'zoom': { id: 'zoom', name: 'Zoom', wingetId: 'Zoom.Zoom', category: 'basics', description: 'Video conferencing', icon: 'Video', popular: true, tags: ['meeting'] },
    'slack': { id: 'slack', name: 'Slack', wingetId: 'SlackTechnologies.Slack', category: 'basics', description: 'Team collaboration', icon: 'Hash', popular: false, tags: ['chat'] },
    'powertoys': { id: 'powertoys', name: 'PowerToys', wingetId: 'Microsoft.PowerToys', category: 'utilities', description: 'System utilities', icon: 'Zap', popular: true, tags: ['utility'] },
    '7zip': { id: '7zip', name: '7-Zip', wingetId: '7zip.7zip', category: 'utilities', description: 'File archiver', icon: 'FileArchive', popular: true, tags: ['zip', 'compress', 'archive'] },
    'winrar': { id: 'winrar', name: 'WinRAR', wingetId: 'RARLab.WinRAR', category: 'utilities', description: 'Archive manager', icon: 'FileArchive', popular: true, tags: ['rar', 'zip', 'compress', 'archive'] },
    'peazip': { id: 'peazip', name: 'PeaZip', wingetId: 'Giorgiotani.Peazip', category: 'utilities', description: 'Free archive manager', icon: 'FileArchive', popular: false, tags: ['zip', 'compress', 'archive'] },
    'everything': { id: 'everything', name: 'Everything', wingetId: 'voidtools.Everything', category: 'utilities', description: 'File search', icon: 'Search', popular: true, tags: ['search'] },
    'dotnet': { id: 'dotnet', name: '.NET Desktop Runtime', wingetId: 'Microsoft.DotNet.DesktopRuntime.8', category: 'runtime', description: '.NET Runtime', icon: 'Package', popular: false, tags: ['runtime'] },
    'spotify': { id: 'spotify', name: 'Spotify', wingetId: 'Spotify.Spotify', category: 'media', description: 'Music streaming', icon: 'Music', popular: true, tags: ['music'] }
};

/**
 * AI-powered app recommendations based on user prompt
 * This is a rule-based system that can be enhanced with actual AI/LLM integration
 */
export async function getAIRecommendations(prompt: string): Promise<App[]> {
    const promptLower = prompt.toLowerCase();
    const recommendations = new Set<App>();

    // Helper to add app if exists in knowledge base
    const addApp = (id: string) => {
        if (knownApps[id]) {
            recommendations.add(knownApps[id]);
        }
    };

    // Development keywords
    if (promptLower.match(/dev|develop|program|code|software engineer/)) {
        addApp('vscode');
        addApp('git');
        addApp('nodejs');
        addApp('postman');
        addApp('chrome');
        addApp('notepadplusplus');
    }

    // Web development
    if (promptLower.match(/web dev|frontend|backend|fullstack/)) {
        addApp('vscode');
        addApp('git');
        addApp('nodejs');
        addApp('chrome');
        addApp('postman');
        addApp('firefox');
    }

    // Python development
    if (promptLower.match(/python|data science|machine learning|ml|ai/)) {
        addApp('python');
        addApp('vscode');
        addApp('git');
    }

    // Gaming
    if (promptLower.match(/gam(e|ing)|stream|twitch|youtube gaming/)) {
        addApp('steam');
        addApp('discord');
        addApp('obs');
        addApp('directx');
        addApp('vcredist');
    }

    // Media/Content creation
    if (promptLower.match(/media|content creat|video edit|photo edit|graphic design/)) {
        addApp('obs');
        addApp('gimp');
        addApp('audacity');
        addApp('vlc');
    }

    // Office/Productivity
    if (promptLower.match(/office|productivity|work|business/)) {
        addApp('chrome');
        addApp('zoom');
        addApp('slack');
        addApp('notepadplusplus');
        addApp('powertoys');
        addApp('7zip');
    }

    // Basic setup
    if (promptLower.match(/basic|essential|new pc|fresh install/)) {
        addApp('chrome');
        addApp('7zip');
        addApp('vlc');
        addApp('notepadplusplus');
        addApp('powertoys');
        addApp('everything');
        addApp('dotnet');
        addApp('vcredist');
    }

    // Communication
    if (promptLower.match(/communication|chat|video call|meeting/)) {
        addApp('discord');
        addApp('zoom');
        addApp('slack');
    }

    // Music/Audio
    if (promptLower.match(/music|audio|sound|spotify/)) {
        addApp('spotify');
        addApp('vlc');
        addApp('audacity');
    }

    // Compression/Archive tools
    if (promptLower.match(/compress|zip|archive|extract|rar|unzip|7z/)) {
        addApp('7zip');
        addApp('winrar');
        addApp('peazip');
    }

    // Always include essential runtimes if any apps are recommended
    if (recommendations.size > 0) {
        addApp('dotnet');
        addApp('vcredist');
    }

    // Filter out undefined values and return
    return Array.from(recommendations);
}
