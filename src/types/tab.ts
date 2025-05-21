export interface TabInfo {
  id: number;
  url: string;
  title: string;
  windowId: number;
  lastAccessed: number;
  accessCount: number;
  faviconUrl?: string;
}

export interface TabAnalytics {
  tabId: number;
  accessCount: number;
  lastAccessed: number;
  totalActiveTime: number;
  isStale: boolean;
}

export interface TabSuggestion {
  tabId: number;
  title: string;
  url: string;
  lastAccessed: number;
  daysSinceLastAccess: number;
  reason: 'stale' | 'inactive';
}

export interface TabData {
  lastAccessed: number;
  accessCount: number;
  isStale: boolean;
} 