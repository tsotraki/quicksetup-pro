# 🚀 QuickSetup Pro - Quick Start Guide

## Prerequisites
- ✅ Node.js 18+ installed
- ✅ npm installed
- ✅ Windows 10/11 (for running generated scripts)

## Installation & Running

### Step 1: Install Dependencies
Already done! ✅

### Step 2: Start the Application
```bash
npm run dev
```

This command starts:
- **Frontend** at http://localhost:5173
- **Backend** at http://localhost:3001

### Step 3: Open in Browser
Navigate to: **http://localhost:5173**

## Using the Application

### 1. Browse Apps
- View 30+ curated Windows applications
- Organized by categories: Basics, Utilities, Developer, Media, Runtime

### 2. Search & Filter
- Use the search bar to find specific apps
- Click category buttons to filter by type
- Click "Select Popular" to quickly select popular apps

### 3. AI Recommendations (Optional)
- Click "AI Recommendations" to expand
- Type what you need (e.g., "Setup for web development")
- Or click quick suggestions
- AI will auto-select recommended apps

### 4. Select Apps
- Click on app cards to select/deselect
- Selected apps show a checkmark and blue border
- Counter shows how many apps are selected

### 5. Generate Script
- Click the green "Generate Script" button (bottom right)
- PowerShell script downloads automatically
- File name: `QuickSetup-YYYY-MM-DD.ps1`

### 6. Run the Script
**Option A: Right-click**
1. Right-click the downloaded `.ps1` file
2. Select "Run with PowerShell"
3. Approve Administrator prompt

**Option B: PowerShell**
```powershell
# Allow script execution (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the script
.\QuickSetup-2024-12-05.ps1
```

## What the Script Does

1. ✅ Checks if Winget is installed
2. ✅ Verifies Administrator privileges
3. ✅ Installs each app silently using Winget
4. ✅ Skips already installed apps
5. ✅ Shows progress with colors
6. ✅ Displays summary at the end

## Example Workflows

### Web Developer Setup
1. Click "AI Recommendations"
2. Type: "Setup for web development"
3. AI selects: VS Code, Git, Node.js, Chrome, Postman
4. Click "Generate Script"
5. Run script as Administrator

### Gaming PC Setup
1. Search for "steam", "discord", "obs"
2. Select each app
3. Add DirectX and VC++ Redistributable from Runtime category
4. Generate and run script

### Basic New PC Setup
1. Click "Select Popular"
2. Review and adjust selection
3. Generate script
4. Run on new PC

## Troubleshooting

### Backend not starting
**Error:** `Cannot find module`
**Solution:** 
```bash
# Stop the server (Ctrl+C)
# Restart
npm run dev
```

### Port already in use
**Error:** `Port 3001 is already in use`
**Solution:**
```bash
# Find and kill the process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Winget not found
**Error:** Script says "Winget is not installed"
**Solution:**
1. Install from Microsoft Store: "App Installer"
2. Or download from: https://aka.ms/getwinget

### Script execution blocked
**Error:** "Running scripts is disabled"
**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Development Commands

```bash
# Start both frontend and backend
npm run dev

# Start frontend only
npm run dev:client

# Start backend only  
npm run dev:server

# Build for production
npm run build

# Lint code
npm run lint
```

## Adding Your Own Apps

Edit `server/data/apps.ts`:

```typescript
{
  id: 'myapp',                    // Unique ID
  name: 'My App',                 // Display name
  wingetId: 'Publisher.AppName',  // Winget package ID
  category: 'utilities',          // Category
  description: 'App description',
  icon: 'Package',                // Lucide icon name
  popular: false,
  tags: ['tag1', 'tag2']
}
```

Find Winget IDs:
```powershell
winget search "app name"
```

## Project Structure

```
quicksetup-pro/
├── src/              # Frontend (React)
├── server/           # Backend (Express)
├── README.md         # Project overview
├── PROJECT_SUMMARY.md # Complete feature list
├── DEVELOPER_GUIDE.md # API docs & customization
└── QUICK_START.md    # This file
```

## Support & Documentation

- **README.md** - Project overview
- **PROJECT_SUMMARY.md** - Complete feature list
- **DEVELOPER_GUIDE.md** - API documentation and customization guide
- **example.ps1** - Sample generated script

## Tips & Tricks

1. **Keyboard Shortcuts:**
   - `Ctrl+F` to focus search
   - Click app cards to toggle selection

2. **Batch Selection:**
   - Use "Select Popular" for common apps
   - Use AI mode for setup-specific selections

3. **Script Customization:**
   - Generated scripts are plain PowerShell
   - You can edit them before running
   - Add custom commands if needed

4. **Performance:**
   - Scripts run in parallel where possible
   - Silent installation = no user interaction needed
   - Typical install time: 2-5 minutes for 10 apps

## Next Steps

1. ✅ Run `npm run dev`
2. ✅ Open http://localhost:5173
3. ✅ Select your apps
4. ✅ Generate and run your first script!

---

**Need help?** Check the DEVELOPER_GUIDE.md for detailed documentation.

**Want to contribute?** The project is open-source and ready for enhancements!
