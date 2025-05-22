import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabSuggestion } from '../types/tab';

const DEFAULT_INACTIVE = 5;
const BUG_FORM_URL = 'https://forms.gle/KPDzt3nD2N4M9N3W9';

const Popup: React.FC = () => {
  const [suggestions, setSuggestions] = useState<TabSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favicons, setFavicons] = useState<Record<number, string>>({});
  const [currentWindowId, setCurrentWindowId] = useState<number | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [inactive, setInactive] = useState(DEFAULT_INACTIVE);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!showSettings) {
      chrome.storage.sync.get(['inactiveMinutes'], (result) => {
        setInactive(result.inactiveMinutes ?? DEFAULT_INACTIVE);
      });

      const initialize = async () => {
        try {
          const currentWindow = await chrome.windows.getCurrent();
          if (currentWindow.id !== undefined) {
            setCurrentWindowId(currentWindow.id);
            await loadSuggestions(currentWindow.id);
          } else {
            setError('Could not get window ID');
            setLoading(false);
          }
        } catch (err) {
          setError('Failed to get current window');
          setLoading(false);
        }
      };
      initialize();
      const interval = setInterval(() => {
        if (currentWindowId !== undefined) {
          loadSuggestions(currentWindowId);
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentWindowId, showSettings]);

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
        setSuggestions(suggestions.filter(s => s.tabId !== tabId));
      } else {
        setSuggestions(suggestions.filter(s => s.tabId !== tabId));
      }
    } catch (err) {
      setError('Failed to close tab');
      setSuggestions(suggestions.filter(s => s.tabId !== tabId));
    }
  };

  const formatTimeSinceLastAccess = (minutes: number) => {
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
          if (currentWindowId !== undefined) {
            loadSuggestions(currentWindowId);
          }
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
                  (e.target as HTMLImageElement).src = 'assets/default-favicon.png';
                }}
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