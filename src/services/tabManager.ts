import { TabInfo, TabAnalytics, TabSuggestion} from '../types/tab';
import { StorageService } from './storage';

const DEFAULT_STALE_MINUTES = 2;
const DEFAULT_INACTIVE_MINUTES = 5;

export class TabManagerService {
  private static instance: TabManagerService;
  private storageService: StorageService;

  private constructor() {
    this.storageService = StorageService.getInstance();
    console.log('[TabManagerService] Initialized');
  }

  static getInstance(): TabManagerService {
    if (!TabManagerService.instance) {
      TabManagerService.instance = new TabManagerService();
    }
    return TabManagerService.instance;
  }

  async trackTab(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.id || !tab.url || !tab.title) {
      console.warn('[trackTab] Skipping tab with missing id/url/title', tab);
      return;
    }

    const tabInfo: TabInfo = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      windowId: tab.windowId,
      lastAccessed: Date.now(),
      accessCount: 1,
      faviconUrl: tab.favIconUrl
    };

    const existingTab = await this.storageService.getTabInfo();
    if (existingTab[tab.id]) {
      tabInfo.accessCount = existingTab[tab.id].accessCount + 1;
      console.log(`[trackTab] Updating accessCount for tab ${tab.id} to ${tabInfo.accessCount}`);
    } else {
      console.log(`[trackTab] Tracking new tab ${tab.id}`);
    }

    await this.storageService.saveTabInfo(tabInfo);
    const afterSave = await this.storageService.getTabInfo();
    console.log('[trackTab] Tab info after save:', afterSave[tab.id]);
    await this.updateTabAnalytics(tab.id);
  }

  private async updateTabAnalytics(tabId: number): Promise<void> {
    const tabInfo = await this.storageService.getTabInfo();
    const tab = tabInfo[tabId];
    if (!tab) {
      console.warn(`[updateTabAnalytics] No tab info found for tabId ${tabId}`);
      return;
    }

    const analytics: TabAnalytics = {
      tabId,
      accessCount: tab.accessCount,
      lastAccessed: tab.lastAccessed,
      totalActiveTime: 0, // TODO: Implement active time tracking
      isStale: await this.isTabStale(tab.lastAccessed)
    };

    await this.storageService.saveTabAnalytics(analytics);
    const afterSave = await this.storageService.getTabAnalytics();
    console.log('[updateTabAnalytics] Analytics after save:', afterSave[tabId]);
  }

  private async getThresholds(): Promise<{inactiveMs: number}> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['inactiveMinutes'], (result) => {
        const inactive = typeof result.inactiveMinutes === 'number' ? result.inactiveMinutes : DEFAULT_INACTIVE_MINUTES;
        resolve({
          inactiveMs: inactive * 60 * 1000
        });
      });
    });
  }

  private async isTabStale(lastAccessed: number): Promise<boolean> {
    const { inactiveMs } = await this.getThresholds();
    const timeSinceLastAccess = Date.now() - lastAccessed;
    return timeSinceLastAccess >= inactiveMs;
  }

  async getTabSuggestions(windowId?: number): Promise<TabSuggestion[]> {
    const suggestions: TabSuggestion[] = [];
    const now = Date.now();
    console.log('[getTabSuggestions] Called with windowId:', windowId);

    // Get all tabs, optionally filtered by window
    const queryOptions: chrome.tabs.QueryInfo = windowId ? { windowId } : {};
    const tabs = await chrome.tabs.query(queryOptions);
    console.log('[getTabSuggestions] Found tabs:', tabs.map(t => t.id));

    // Fetch all tab info from storage
    const allTabInfo = await this.storageService.getTabInfo();
    console.log('[getTabSuggestions] All tab info:', allTabInfo);

    // Get threshold from settings
    const { inactiveMs } = await this.getThresholds();

    for (const tab of tabs) {
      if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) continue;

      const tabData = allTabInfo[tab.id];
      if (!tabData) {
        console.log(`[getTabSuggestions] No tabData for tab ${tab.id}`);
        continue;
      }

      const timeSinceLastAccess = now - tabData.lastAccessed;
      const minutesSinceLastAccess = timeSinceLastAccess / (60 * 1000);

      if (timeSinceLastAccess >= inactiveMs) {
        suggestions.push({
          tabId: tab.id,
          title: tab.title || 'Untitled',
          url: tab.url,
          lastAccessed: tabData.lastAccessed,
          daysSinceLastAccess: minutesSinceLastAccess,
          reason: 'inactive'
        });
      }
    }

    // Sort by most time inactive (descending)
    return suggestions.sort((a, b) => b.daysSinceLastAccess - a.daysSinceLastAccess);
  }

  async closeTab(tabId: number): Promise<void> {
    try {
      console.log(`[closeTab] Attempting to close tab ${tabId}`);
      await chrome.tabs.remove(tabId);
      await this.storageService.removeTabData(tabId);
      const afterRemove = await this.storageService.getTabInfo();
      console.log(`[closeTab] Tab info after removal:`, afterRemove[tabId]);
    } catch (error) {
      console.error(`Failed to close tab ${tabId}:`, error);
    }
  }
}