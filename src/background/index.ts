import { TabManagerService } from '../services/tabManager';

const tabManager = TabManagerService.getInstance();

// Track tab creation
chrome.tabs.onCreated.addListener(async (tab) => {
  await tabManager.trackTab(tab);
});

// Track tab updates (including URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await tabManager.trackTab(tab);
  }
});

// Track tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await tabManager.closeTab(tabId);
});

// Initialize tracking for all existing tabs
chrome.tabs.query({}, async (tabs) => {
  for (const tab of tabs) {
    await tabManager.trackTab(tab);
  }
});

// Track tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab) {
      await tabManager.trackTab(tab);
    }
  } catch (err) {
    console.warn('[background] Failed to track activated tab', err);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TAB_SUGGESTIONS') {
    tabManager.getTabSuggestions(message.windowId)
      .then(suggestions => sendResponse({ suggestions }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'CLOSE_TAB') {
    chrome.tabs
      .remove(message.tabId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }
}); 