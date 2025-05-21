import { TabInfo, TabAnalytics } from '../types/tab';

export class StorageService {
  private static instance: StorageService;
  private readonly TAB_INFO_KEY = 'tabInfo';
  private readonly TAB_ANALYTICS_KEY = 'tabAnalytics';

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async saveTabInfo(tabInfo: TabInfo): Promise<void> {
    const data = await this.getTabInfo();
    data[tabInfo.id] = tabInfo;
    await chrome.storage.local.set({ [this.TAB_INFO_KEY]: data });
  }

  async getTabInfo(): Promise<Record<number, TabInfo>> {
    const result = await chrome.storage.local.get(this.TAB_INFO_KEY);
    return result[this.TAB_INFO_KEY] || {};
  }

  async saveTabAnalytics(analytics: TabAnalytics): Promise<void> {
    const data = await this.getTabAnalytics();
    data[analytics.tabId] = analytics;
    await chrome.storage.local.set({ [this.TAB_ANALYTICS_KEY]: data });
  }

  async getTabAnalytics(): Promise<Record<number, TabAnalytics>> {
    const result = await chrome.storage.local.get(this.TAB_ANALYTICS_KEY);
    return result[this.TAB_ANALYTICS_KEY] || {};
  }

  async removeTabData(tabId: number): Promise<void> {
    const [tabInfo, analytics] = await Promise.all([
      this.getTabInfo(),
      this.getTabAnalytics()
    ]);

    delete tabInfo[tabId];
    delete analytics[tabId];

    await Promise.all([
      chrome.storage.local.set({ [this.TAB_INFO_KEY]: tabInfo }),
      chrome.storage.local.set({ [this.TAB_ANALYTICS_KEY]: analytics })
    ]);
  }
} 