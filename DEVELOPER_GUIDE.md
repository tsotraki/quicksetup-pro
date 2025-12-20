# QuickSetup Pro - Developer Guide

## Project Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # React components
│   ├── AppCard.tsx     # Individual app card with selection
│   ├── CategoryFilter.tsx  # Category filtering UI
│   └── AIRecommender.tsx   # AI recommendation interface
├── services/
│   └── api.ts          # API client for backend communication
├── types/
│   └── index.ts        # TypeScript type definitions
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.css           # Global styles and design system
└── main.tsx            # React entry point
```

### Backend (Node.js + Express)
```
server/
├── data/
│   └── apps.ts         # Curated app database
├── routes/
│   ├── apps.ts         # App listing and filtering endpoints
│   ├── script.ts       # Script generation endpoint
│   └── ai.ts           # AI recommendation endpoint
├── services/
│   ├── winget.ts       # Winget repository integration
│   ├── scriptGenerator.ts  # PowerShell script generator
│   └── aiRecommendations.ts  # AI recommendation engine
└── index.ts            # Express server entry point
```

## API Endpoints

### GET /api/apps
Get all available apps with optional filters.

**Query Parameters:**
- `category` (string): Filter by category (basics, utilities, developer, media, runtime)
- `search` (string): Search by name, description, or tags
- `popular` (boolean): Filter popular apps only

**Response:**
```json
[
  {
    "id": "chrome",
    "name": "Google Chrome",
    "wingetId": "Google.Chrome",
    "category": "basics",
    "description": "Fast, secure web browser by Google",
    "icon": "Chrome",
    "popular": true,
    "tags": ["browser", "web", "google"]
  }
]
```

### GET /api/apps/:id
Get detailed information about a specific app.

**Response:**
```json
{
  "id": "vscode",
  "name": "Visual Studio Code",
  "wingetId": "Microsoft.VisualStudioCode",
  "category": "developer",
  "description": "Powerful code editor by Microsoft",
  "icon": "Code",
  "popular": true,
  "tags": ["editor", "ide", "development"],
  "wingetInfo": {
    "version": "1.85.0",
    "publisher": "Microsoft Corporation",
    "homepage": "https://code.visualstudio.com",
    "license": "MIT"
  }
}
```

### GET /api/apps/meta/categories
Get all available categories with app counts.

**Response:**
```json
[
  {
    "id": "basics",
    "name": "Basics",
    "icon": "Globe",
    "count": 8
  }
]
```

### POST /api/script/generate
Generate a PowerShell installation script.

**Request Body:**
```json
{
  "appIds": ["chrome", "vscode", "git"]
}
```

**Response:**
```json
{
  "script": "# PowerShell script content...",
  "appCount": 3,
  "apps": [
    {
      "id": "chrome",
      "name": "Google Chrome",
      "wingetId": "Google.Chrome"
    }
  ]
}
```

### POST /api/ai/recommend
Get AI-powered app recommendations based on a prompt.

**Request Body:**
```json
{
  "prompt": "Setup for web development"
}
```

**Response:**
```json
{
  "prompt": "Setup for web development",
  "recommendations": [
    {
      "id": "vscode",
      "name": "Visual Studio Code",
      ...
    }
  ],
  "count": 5
}
```

## Adding New Apps

To add new apps to the database, edit `server/data/apps.ts`:

```typescript
{
  id: 'unique-id',              // Unique identifier
  name: 'App Name',             // Display name
  wingetId: 'Publisher.AppName', // Winget package ID
  category: 'developer',        // Category
  description: 'App description',
  icon: 'IconName',             // Lucide icon name
  popular: true,                // Is it popular?
  tags: ['tag1', 'tag2']        // Search tags
}
```

**Finding Winget Package IDs:**
```powershell
# Search for a package
winget search "app name"

# Get package details
winget show "Publisher.AppName"
```

## Customizing AI Recommendations

Edit `server/services/aiRecommendations.ts` to add new recommendation patterns:

```typescript
// Add new keyword pattern
if (promptLower.match(/your|keywords|here/)) {
  recommendations.add(apps.find(a => a.id === 'app-id')!);
}
```

## Design System

The application uses a comprehensive design system defined in `src/index.css`:

### Colors
- Primary: `hsl(220, 90%, 56%)` - Blue
- Secondary: `hsl(280, 70%, 60%)` - Purple
- Accent: `hsl(340, 80%, 60%)` - Pink

### Typography
- Font: Inter (Google Fonts)
- Headings: 700 weight
- Body: 400-500 weight

### Components
- Cards: Glassmorphism effect with backdrop blur
- Buttons: Gradient backgrounds with hover effects
- Inputs: Dark theme with focus states

## Development Workflow

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   This runs both frontend (port 5173) and backend (port 3001) concurrently.

2. **Frontend Only:**
   ```bash
   npm run dev:client
   ```

3. **Backend Only:**
   ```bash
   npm run dev:server
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Testing the Generated Scripts

1. Generate a script from the web app
2. Download the `.ps1` file
3. Right-click → "Run with PowerShell" (as Administrator)
4. Or run from PowerShell:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\QuickSetup-2024-12-05.ps1
   ```

## Security Considerations

- All apps are sourced from the official Microsoft Winget repository
- SHA256 hash verification is handled by Winget
- No third-party or modified installers
- Scripts require Administrator privileges
- Silent installation flags prevent unwanted toolbars/ads

## Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder

### Backend (Heroku/Railway/Render)
1. Add a `Procfile`:
   ```
   web: node dist/server/index.js
   ```
2. Build the server: `npm run build:server`
3. Deploy

### Environment Variables
```env
PORT=3001
NODE_ENV=production
```

## Future Enhancements

- [ ] Real AI/LLM integration (OpenAI, Anthropic)
- [ ] User accounts and saved configurations
- [ ] Scheduled updates for installed apps
- [ ] Offline installer bundle generation
- [ ] Windows debloat scripts integration
- [ ] Custom app repository support
- [ ] Installation progress tracking
- [ ] Post-installation configuration scripts

## Troubleshooting

### Backend not starting
- Ensure port 3001 is not in use
- Check Node.js version (18+ required)
- Run `npm install` to ensure all dependencies are installed

### Winget API errors
- The app uses winget.run API as a proxy
- If the API is down, app info fetching will fail gracefully
- Core functionality (script generation) still works

### Script execution errors
- Ensure Winget is installed: `winget --version`
- Run PowerShell as Administrator
- Check execution policy: `Get-ExecutionPolicy`
- Set if needed: `Set-ExecutionPolicy RemoteSigned`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details
