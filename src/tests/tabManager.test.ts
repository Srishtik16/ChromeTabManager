import { TabManagerService } from '../services/tabManager';

// Mock chrome APIs
beforeAll(() => {
  global.chrome = {
    tabs: {
      query: jest.fn().mockResolvedValue([]),
    },
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
      },
      sync: {
        get: jest.fn((keys, cb) => cb({ inactiveMinutes: 5 })),
      },
    },
  } as any;
});

describe('TabManagerService', () => {
  let tabManager: TabManagerService;

  beforeEach(() => {
    tabManager = TabManagerService.getInstance();
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const another = TabManagerService.getInstance();
    expect(tabManager).toBe(another);
  });

  it('returns no suggestions if no tabs', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([]);
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      tabInfo: {}
    });
    const suggestions = await tabManager.getTabSuggestions(1);
    expect(suggestions).toEqual([]);
  });

  it('uses the correct interval from storage', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://a.com', title: 'A', windowId: 1 },
    ]);
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      tabInfo: { 1: { id: 1, url: 'https://a.com', title: 'A', windowId: 1, lastAccessed: Date.now() - 10 * 60 * 1000, accessCount: 1 } }
    });
    (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, cb) => cb({ inactiveMinutes: 5 }));
    const suggestions = await tabManager.getTabSuggestions(1);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].tabId).toBe(1);
  });
}); 