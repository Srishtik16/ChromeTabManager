import { StorageService } from '../services/storage';

// Mock chrome APIs
beforeAll(() => {
  global.chrome = {
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
      },
      sync: {
        get: jest.fn((keys, cb) => cb({ inactiveMinutes: 5 })),
      },
    },
    tabs: {
      query: jest.fn().mockResolvedValue([]),
    },
  } as any;
});

describe('StorageService', () => {
  it('should return a singleton instance', () => {
    const instance1 = StorageService.getInstance();
    const instance2 = StorageService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should save and retrieve tab info', async () => {
    const storage = StorageService.getInstance();
    (chrome.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ tabInfo: { 1: { id: 1, url: 'https://a.com', title: 'A', windowId: 1, lastAccessed: Date.now(), accessCount: 1 } } });
    await storage.saveTabInfo({ id: 1, url: 'https://a.com', title: 'A', windowId: 1, lastAccessed: Date.now(), accessCount: 1 });
    const info = await storage.getTabInfo();
    expect(info[1].url).toBe('https://a.com');
  });
}); 