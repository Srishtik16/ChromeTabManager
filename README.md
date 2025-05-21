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