import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabSuggestion } from '../types/tab';

const DEFAULT_INACTIVE = 5;
const BUG_FORM_URL = 'https://forms.gle/KPDzt3nD2N4M9N3W9';

export const formatTimeSinceLastAccess = (minutes: number) => {
  if (minutes < 60) {
    const rounded = Math.round(minutes);
    return `${rounded} minute${rounded !== 1 ? 's' : ''} ago`;
  } else if (minutes < 60 * 24) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.round(minutes / (60 * 24));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

export const Popup: React.FC = () => {
  const [suggestions, setSuggestions] = useState<TabSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favicons, setFavicons] = useState<Record<number, string>>({});
  const [currentWindowId, setCurrentWindowId] = useState<number | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [inactive, setInactive] = useState(DEFAULT_INACTIVE);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id !== undefined && isMounted) {
          setCurrentWindowId(currentWindow.id);
          await loadSuggestions(currentWindow.id);
        }
      } catch (err) {
        setError('Failed to get current window');
        setLoading(false);
      }
    };
    initialize();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (showSettings) {
      chrome.storage.sync.get(['inactiveMinutes'], (result) => {
        setInactive(result.inactiveMinutes ?? DEFAULT_INACTIVE);
      });
    }
  }, [showSettings]);

  const loadFavicons = async (tabs: TabSuggestion[]) => {
    if (currentWindowId === undefined) return;
    try {
      const chromeTabs = await chrome.tabs.query({ windowId: currentWindowId });
      const newFavicons: Record<number, string> = {};
      
      for (const tab of tabs) {
        const chromeTab = chromeTabs.find(t => t.id === tab.tabId);
        
        if (chromeTab?.favIconUrl) {
          newFavicons[tab.tabId] = chromeTab.favIconUrl;
        } else if (chromeTab?.url) {
          try {
            const url = new URL(chromeTab.url);
            const possibleFaviconUrls = [
              `${url.origin}/favicon.ico`,
              `${url.origin}/favicon.png`,
              `${url.protocol}//${url.hostname}/favicon.ico`,
              `${url.protocol}//${url.hostname}/favicon.png`
            ];
            
            for (const faviconUrl of possibleFaviconUrls) {
              try {
                const response = await fetch(faviconUrl, { method: 'HEAD' });
                if (response.ok) {
                  newFavicons[tab.tabId] = faviconUrl;
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          } catch (e) {
            console.warn('Could not parse URL for favicon:', chromeTab.url);
          }
        }
      }
      
      setFavicons(prev => ({ ...prev, ...newFavicons }));
    } catch (err) {
      console.warn('Could not load favicons:', err);
    }
  };

  const loadSuggestions = async (windowId: number) => {
    try {
      setLoading(true);
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_TAB_SUGGESTIONS',
        windowId
      });
      if (response.error) {
        setError(response.error);
      } else {
        setSuggestions(response.suggestions);
        loadFavicons(response.suggestions);
      }
    } catch (err) {
      setError('Failed to load tab suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTab = async (tabId: number) => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CLOSE_TAB', tabId });
      if (response.error) {
        setError(response.error);
      }
      setSuggestions(prev => prev.filter(s => s.tabId !== tabId));
    } catch (err) {
      setError('Failed to close tab');
      setSuggestions(prev => prev.filter(s => s.tabId !== tabId));
    }
  };

  // Settings form
  const renderSettings = () => (
    <div style={{ padding: 8, minWidth: 260 }}>
      <h3 style={{ marginTop: 0 }}>Settings</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          Inactive tab interval (minutes):
          <input
            type="number"
            min={1}
            value={inactive}
            onChange={e => setInactive(Number(e.target.value))}
            style={{ marginLeft: 8, width: 60 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => {
          chrome.storage.sync.set({ inactiveMinutes: inactive }, () => {
            setStatus('Settings saved!');
            setTimeout(() => setStatus(''), 1500);
            setShowSettings(false);
            if (currentWindowId !== undefined) {
              loadSuggestions(currentWindowId);
            }
          });
        }} style={{ marginRight: 8 }}>Save</button>
        <button onClick={() => {
          setShowSettings(false);
        }}>Cancel</button>
      </div>
      {status && <div style={{ color: 'green' }}>{status}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Inactive</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            title="File Bugs"
            onClick={() => window.open(BUG_FORM_URL, '_blank')}
          >
            🐞
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>
        </div>
      </div>
      {showSettings ? (
        renderSettings()
      ) : loading ? (
        <div className="loading">Loading tab suggestions...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : suggestions.length === 0 ? (
        <div className="empty-state">
          No inactive tab suggestions at the moment. Your tabs are well-managed!
        </div>
      ) : (
        <div className="tab-list">
          {suggestions.map((suggestion) => (
            <div key={suggestion.tabId} className="tab-item">
              <img
                src={favicons[suggestion.tabId] || 'assets/default-favicon.png'}
                alt=""
                className="tab-favicon"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (currentWindowId !== undefined) {
                    chrome.tabs.get(suggestion.tabId, (tab) => {
                      if (tab?.favIconUrl) {
                        const newFaviconUrl = tab.favIconUrl;
                        if (newFaviconUrl) {
                          setFavicons(prev => ({
                            ...prev,
                            [suggestion.tabId]: newFaviconUrl
                          }));
                        } else {
                          img.src = 'assets/default-favicon.png';
                        }
                      } else {
                        img.src = 'assets/default-favicon.png';
                      }
                    });
                  } else {
                    img.src = 'assets/default-favicon.png';
                  }
                }}
                style={{ width: 16, height: 16, marginRight: 8 }}
              />
              <div className="tab-content">
                <h3 className="tab-title">{suggestion.title}</h3>
                <p className="tab-url">{suggestion.url}</p>
                <div className="tab-meta">
                  <span>
                    Last accessed {formatTimeSinceLastAccess(suggestion.daysSinceLastAccess)}
                  </span>
                  <span>•</span>
                  <span>
                    Inactive tab ({inactive}+ minutes)
                  </span>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => handleCloseTab(suggestion.tabId)}
              >
                Close
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 