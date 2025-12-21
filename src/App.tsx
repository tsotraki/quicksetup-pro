import { useState, useEffect, useRef, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Search, Download, Package, Zap, Github, ExternalLink, Loader2, List, HelpCircle, X, Sun, Moon } from 'lucide-react';
import { AppCard } from './components/AppCard';
import { CategoryFilter } from './components/CategoryFilter';
import { AIRecommender } from './components/AIRecommender';
import { SelectedAppsModal } from './components/SelectedAppsModal';
import { api } from './services/api';
import type { App, Category } from './types';
import './App.css';

function AppComponent() {
  const [apps, setApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Use Map to store full App objects, keyed by ID
  const [selectedApps, setSelectedApps] = useState<Map<string, App>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // State for pagination
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkip(0); // Reset pagination on new search
      loadApps(true); // Force reload
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const loadApps = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setApps([]);
      }

      const currentSkip = reset ? 0 : skip;
      const take = 12;

      const newApps = await api.getApps({
        search: searchQuery,
        category: selectedCategory || undefined,
        take,
        skip: currentSkip
      });

      if (reset) {
        setApps(newApps);
      } else {
        setApps(prev => [...prev, ...newApps]);
      }

      setHasMore(newApps.length === take);
      if (!reset) setSkip(prev => prev + take);
      else setSkip(take);

    } catch (err) {
      console.error('Failed to load apps:', err);
      // Only set error on initial load failure
      if (reset) setError('Failed to load apps. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load for categories
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadApps(false);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, skip]);


  // Updated toggle logic to handle full App objects
  const toggleApp = (app: App) => {
    setSelectedApps(prev => {
      const newMap = new Map(prev);
      if (newMap.has(app.id)) {
        newMap.delete(app.id);
      } else {
        newMap.set(app.id, app);
      }
      return newMap;
    });
  };

  const removeApp = (app: App) => {
    setSelectedApps(prev => {
      const newMap = new Map(prev);
      newMap.delete(app.id);
      return newMap;
    });
  };

  const handleAIRecommend = async (prompt: string) => {
    try {
      setIsAILoading(true);
      const response = await api.getAIRecommendations(prompt);

      // Select all recommended apps
      const newSelections = new Map(selectedApps);
      response.recommendations.forEach(app => {
        newSelections.set(app.id, app);
      });
      setSelectedApps(newSelections);

      // Show notification
      toast.success(`✨ Selected ${response.count} recommended apps for: "${prompt}"`, {
        duration: 4000,
        position: 'top-center',
      });
    } catch (err) {
      toast.error('Failed to get AI recommendations');
      console.error(err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateScript = async (format: 'ps1' | 'bat' = 'ps1') => {
    if (selectedApps.size === 0) {
      toast.error('Please select at least one app');
      return;
    }

    try {
      setIsGenerating(true);
      // Convert Map values to array for API
      const chosenApps = Array.from(selectedApps.values()).map(app => ({
        id: app.id,
        name: app.name,
        wingetId: app.wingetId
      }));

      const response = await api.generateScript(chosenApps, format);

      // Add UTF-8 BOM only for PowerShell scripts to ensure correct character processing.
      // Batch files (.bat) do not support BOM and will fail to execute correctly.
      const content = format === 'ps1' ? '\uFEFF' + response.script : response.script;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QuickSetup-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Close modal if open
      setIsModalOpen(false);

      const runInstructions = format === 'ps1'
        ? 'Run the downloaded PowerShell script as Administrator.'
        : 'Run the downloaded Batch script as Administrator.';

      toast.success(() => (
        <span>
          ✅ Script generated for <b>{response.appCount} apps</b>!
          <br /><br />
          {runInstructions}
        </span>
      ), { duration: 6000 });

    } catch (err) {
      toast.error('Failed to generate script');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPopular = async () => {
    setIsLoading(true); // Show loading feedback
    try {
      // Fetch all popular apps from the dedicated category
      const popularApps = await api.getApps({
        category: 'popular',
        take: 50 // Fetch enough to cover the list
      });

      setSelectedApps(prev => {
        const newMap = new Map(prev);
        popularApps.forEach(app => {
          newMap.set(app.id, app);
        });
        return newMap;
      });

      toast.success(`Added ${popularApps.length} popular applications to your selection!`);
    } catch (err) {
      console.error('Failed to select popular apps', err);
      toast.error('Failed to load popular apps.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedApps(new Map());
  };

  // No early return for error - handled inside the main content area

  // Calculate counts of selected apps per category
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedApps.forEach(app => {
      // Count for primary category
      counts[app.category] = (counts[app.category] || 0) + 1;

      // Count for popular category
      if (app.popular) {
        counts['popular'] = (counts['popular'] || 0) + 1;
      }
    });

    return categories.map(cat => ({
      ...cat,
      count: counts[cat.id] || 0
    }));
  }, [categories, selectedApps]);

  return (
    <div className="app">
      <Toaster position="top-center" />
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Zap size={32} className="logo-icon" />
              <div>
                <h1>QuickSetup Pro</h1>
                <p className="tagline">Powered by Windows Package Manager</p>
              </div>
            </div>

            <div className="header-actions">
              <a
                href="https://github.com/microsoft/winget-pkgs"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <Github size={18} />
                <span>Winget Repo</span>
                <ExternalLink size={14} />
              </a>

              <button
                onClick={toggleTheme}
                className="btn btn-icon btn-secondary"
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {/* Hero Section */}
          <section className="hero">
            <h2 className="hero-title">
              Select Your Apps, Get One Installer
            </h2>
            <p className="hero-description">
              Browse thousands of Windows applications and generate a single PowerShell script
              that installs everything silently using official Winget packages.
            </p>
            <button
              className="btn btn-help"
              onClick={() => setIsHelpOpen(true)}
            >
              <HelpCircle size={18} />
              <span>How It Works</span>
            </button>
          </section>

          {/* AI Recommender */}
          <AIRecommender
            onRecommend={handleAIRecommend}
            isLoading={isAILoading}
          />

          {/* Search and Filters */}
          <div className="controls">
            <div className="search-bar">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="quick-actions">
              <button onClick={selectPopular} className="btn btn-secondary">
                <Zap size={18} />
                <span>Select Popular</span>
              </button>
              <button onClick={clearSelection} className="btn btn-secondary">
                Clear All
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categoriesWithCounts}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Apps Grid */}
          {error ? (
            <div className="error-container">
              <Package size={64} />
              <h2 className="text-2xl font-bold mt-4">Connection Error</h2>
              <p className="text-gray-400 mt-2">{error}</p>
              <button
                className="btn btn-primary mt-6"
                onClick={() => { setError(null); loadApps(true); }}
              >
                <Zap size={18} />
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading apps...</p>
            </div>
          ) : (
            <>
              <div className="apps-header">
                <h3>
                  {apps.length} {apps.length === 1 ? 'App' : 'Apps'}
                  {selectedCategory && ` in ${categories.find(c => c.id === selectedCategory)?.name || 'Unknown Category'}`}
                </h3>
                <div className="selection-count">
                  <Package size={18} />
                  <span>{selectedApps.size} selected</span>
                </div>
              </div>

              <div className="apps-grid">
                {apps.map((app, index) => ( // Use index as key fallback if duplicate IDs from API
                  <AppCard
                    key={`${app.id}-${index}`}
                    app={app}
                    selected={selectedApps.has(app.id)}
                    onToggle={() => toggleApp(app)}
                  />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={observerTarget} className="flex justify-center p-4">
                  {isLoading && <div className="spinner"></div>}
                </div>
              )}

              {apps.length === 0 && !isLoading && (
                <div className="empty-state">
                  <Search size={48} />
                  <h3>No apps found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Bar */}
      {selectedApps.size > 0 && (
        <div className="fab-container fade-in">
          <div className="fab-group">
            <button
              className="fab fab-secondary"
              onClick={() => setIsModalOpen(true)}
            >
              <List size={24} />
              <span>View List ({selectedApps.size})</span>
            </button>

            <button
              className="fab fab-primary"
              onClick={() => handleGenerateScript()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={24} className="spinner-icon" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={24} />
                  <span>Generate Script</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Selected Apps Modal */}
      <SelectedAppsModal
        apps={Array.from(selectedApps.values())}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRemove={removeApp}
        onGenerate={handleGenerateScript}
      />

      {/* Help / Instructions Modal */}
      {isHelpOpen && (
        <div className="modal-overlay" onClick={() => setIsHelpOpen(false)}>
          <div className="modal help-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><HelpCircle size={24} /> How It Works</h2>
              <button className="modal-close" onClick={() => setIsHelpOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body help-content">
              <div className="help-section">
                <h3>📦 Step 1: Select Apps</h3>
                <p>Browse or search for the applications you want to install. Click on any app card to add it to your selection. Use the <strong>Popular</strong> category to see curated recommendations.</p>
              </div>

              <div className="help-section">
                <h3>🤖 Step 2: Use AI Recommendations (Optional)</h3>
                <p>Describe your use case (e.g., "web developer setup" or "gaming PC") and our AI will suggest relevant apps for you.</p>
              </div>

              <div className="help-section">
                <h3>📜 Step 3: Generate Script</h3>
                <p>Click the <strong>Generate Script</strong> button to download a script in your preferred format (PowerShell <code>.ps1</code> or Batch <code>.bat</code>) containing all your selected applications.</p>
              </div>

              <div className="help-section">
                <h3>⚡ Step 4: Run the Script</h3>
                <ol>
                  <li>Right-click on the downloaded <code>.ps1</code> or <code>.bat</code> file</li>
                  <li>For PowerShell: Select <strong>"Run with PowerShell"</strong></li>
                  <li>For Batch: Select <strong>"Run as administrator"</strong></li>
                  <li>If prompted, click <strong>"Yes"</strong> to allow Administrator access</li>
                  <li>Wait for all apps to install automatically!</li>
                </ol>
              </div>

              <div className="help-section help-note">
                <h3>ℹ️ Good to Know</h3>
                <ul>
                  <li>All apps are installed using <strong>Windows Package Manager (Winget)</strong></li>
                  <li>Installations are <strong>silent</strong> - no popups or manual clicking needed</li>
                  <li>Apps are sourced from <strong>official Microsoft repositories</strong></li>
                  <li>You can copy any app's Winget ID to install it manually via command line</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            Built with ❤️ using React, TypeScript, and Windows Package Manager (Winget)
          </p>
          <p className="footer-note">
            All apps are sourced from the official Microsoft Winget repository.
            No modifications, no ads, just clean installations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppComponent;
