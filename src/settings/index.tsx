import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const DEFAULT_STALE = 2;
const DEFAULT_INACTIVE = 5;

const Settings: React.FC = () => {
  const [stale, setStale] = useState(DEFAULT_STALE);
  const [inactive, setInactive] = useState(DEFAULT_INACTIVE);
  const [status, setStatus] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['staleMinutes', 'inactiveMinutes'], (result) => {
      if (result.staleMinutes) setStale(result.staleMinutes);
      if (result.inactiveMinutes) setInactive(result.inactiveMinutes);
    });
  }, []);

  const save = () => {
    chrome.storage.sync.set({ staleMinutes: stale, inactiveMinutes: inactive }, () => {
      setStatus('Settings saved!');
      setTimeout(() => setStatus(''), 1500);
    });
  };

  const cancel = () => {
    window.close();
  };

  return (
    <div style={{ padding: 24, minWidth: 300 }}>
      <h2>Tab Manager Settings</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Stale tab interval (minutes):
          <input
            type="number"
            min={1}
            value={stale}
            onChange={e => setStale(Number(e.target.value))}
            style={{ marginLeft: 8, width: 60 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
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
      <div style={{ marginBottom: 16 }}>
        <button onClick={save} style={{ marginRight: 8 }}>Save</button>
        <button onClick={cancel}>Cancel</button>
      </div>
      {status && <div style={{ color: 'green' }}>{status}</div>}
    </div>
  );
};

const container = document.getElementById('settings-root');
if (container) {
  const root = createRoot(container);
  root.render(<Settings />);
} 