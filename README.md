# Chrome Tab Manager

A Chrome Extension that helps you manage your tabs more effectively by tracking tab usage and suggesting tabs to close based on inactivity and staleness.

## Features

- Tracks all open tabs across all windows
- Monitors tab usage frequency and access patterns
- Suggests tabs to close based on:
  - Staleness (not accessed for 7+ days)
  - Inactivity (low usage over 3+ days)
- One-click tab closing from suggestions
- Clean, modern user interface
- Real-time tab tracking and analytics

## Test Plan

This test plan covers all major components and services of the Chrome Tab Manager extension. The goal is to achieve at least 95% code coverage and ensure all critical scenarios are tested.

### 1. Popup Component (`src/popup/index.tsx`)
- **UI Rendering**
  - Renders the "Inactive" heading
  - Renders the settings button
  - Renders the "File Bugs" button
  - Renders the empty state when there are no inactive tabs
  - Renders a list of inactive tabs with correct details
  - Renders the settings form and updates interval
  - Renders the bug report button and opens the Google Form
- **Tab Actions**
  - Clicking "Close" removes a tab from the list
  - Handles errors when closing a tab that no longer exists
- **Settings**
  - Opens the settings form
  - Updates the inactive interval and reflects changes in the UI
  - Cancels settings without saving
- **Bug Reporting**
  - Opens the Google Form in a new tab
- **Time Formatting**
  - Displays "Last accessed" in minutes, hours, or days as appropriate

### 2. TabManagerService (`src/services/tabManager.ts`)
- **Singleton**
  - Only one instance is created
- **Tab Tracking**
  - Tracks a new tab and increments access count on activation
  - Updates last accessed time correctly
- **Inactive Tab Suggestions**
  - Returns only tabs inactive for the configured interval
  - Sorts tabs by most time inactive (descending)
  - Handles edge cases (no tabs, all tabs active, etc.)
- **Settings Integration**
  - Uses the correct interval from storage
- **Tab Closing**
  - Removes tab data from storage when closed

### 3. StorageService (`src/services/storage.ts`)
- **Singleton**
  - Only one instance is created
- **Tab Info**
  - Saves and retrieves tab info correctly
  - Removes tab info correctly
- **Tab Analytics**
  - Saves and retrieves analytics correctly
  - Removes analytics correctly

### 4. Settings Component (`src/settings/index.tsx`)
- **UI Rendering**
  - Renders the settings form
  - Loads current interval from storage
- **Settings Actions**
  - Updates and saves the interval
  - Cancels without saving

### 5. Background Script (`src/background/index.ts`)
- **Tab Activation**
  - Increments access count on tab activation
- **Message Handling**
  - Responds to GET_TAB_SUGGESTIONS and CLOSE_TAB messages

### 6. Integration
- **End-to-End**
  - Changing the interval in settings updates the popup and service logic
  - Closing a tab updates the popup and storage

### 7. Edge Cases
- No tabs open
- All tabs are active
- Storage errors
- API errors (e.g., Chrome API unavailable)

### Code Coverage
- Aim for 95%+ coverage on all files, with a focus on:
  - All branches in logic (e.g., time formatting, error handling)
  - All user interactions (UI, settings, bug reporting)

## Project Structure

```
chrome-tab-manager/
├── src/
│   ├── background/     # Background service worker
│   ├── popup/         # Popup UI components
│   ├── services/      # Core services
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── assets/            # Icons and static assets
├── dist/             # Built extension files
├── manifest.json     # Extension manifest
├── package.json      # Project dependencies
└── webpack.config.js # Build configuration
```

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chrome-tab-manager.git
   cd chrome-tab-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development build:
   ```bash
   npm run dev
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Building for Production

To create a production build:

```bash
npm run prod
```

The built extension will be available in the `dist` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Uses Chrome Extension Manifest V3
- Styled with modern CSS
- Tab analytics powered by Chrome's Tab API 