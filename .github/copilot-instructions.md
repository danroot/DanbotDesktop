# Copilot Instructions for DanbotDesktop

## Project Overview

DanbotDesktop is an Electron-based desktop application that integrates with the Recall.ai Desktop SDK for recording and managing audio/video meetings. The application is built using:

- **Electron** - Cross-platform desktop app framework
- **React 19** - UI library with modern JSX syntax
- **Vite** - Build tool and dev server
- **Recall.ai Desktop SDK** - Core recording functionality
- **Lucide React** - Icon library
- **CSS** - Custom styling (no CSS framework)

## Architecture

The app follows Electron's multi-process architecture:

- **Main Process** (`src/main.js`) - Node.js backend, handles SDK integration, IPC, window management
- **Renderer Process** (`src/renderer.jsx`) - React frontend, user interface
- **Preload Script** (`src/preload.js`) - Secure bridge between main and renderer processes

## Development Setup

1. Copy `.env.example` to `.env` and configure your Recall.ai API key
2. Install dependencies: `npm install`
3. Start development: `npm start`
4. Build for production: `npm run make`

## Code Style Guidelines

### JavaScript/React
- Use modern ES6+ syntax
- Prefer `const` and `let` over `var`
- Use arrow functions for event handlers and short functions
- Follow React Hooks patterns (useState, useEffect)
- Use functional components over class components
- Handle async operations with async/await

### IPC Communication
- Main to Renderer: Use predefined channels like 'state', 'message-from-main'
- Renderer to Main: Use 'message-from-renderer' with command objects
- Always validate channels in preload.js security whitelist

### File Organization
- Main process logic in `src/main.js`
- React components in `src/renderer.jsx`
- Styles in `src/styles.css` using CSS custom properties
- Vite configs separate for main, preload, and renderer processes

## API Integration

### Recall.ai SDK
- Initialize SDK in main process with proper configuration
- Handle SDK events: 'status-change', 'permissions-granted', etc.
- Use environment variables for API URL and keys
- Never expose API keys to renderer process

### State Management
- Use React state for UI state
- IPC for sharing SDK state between processes
- Handle permissions and recording states appropriately

## Build Configuration

### Vite Configuration
- `vite.main.config.mjs` - Main process bundling
- `vite.preload.config.mjs` - Preload script bundling  
- `vite.renderer.config.mjs` - React app bundling with dev server

### Electron Forge
- Configured in `forge.config.js`
- Handles packaging for multiple platforms
- Includes external dependencies handling
- Uses Fuses for security configuration

## Security Considerations

- Use contextBridge in preload script to expose limited APIs
- Validate IPC channels and messages
- Keep API keys and sensitive data in main process only
- Use Electron Fuses for additional security hardening

## Testing

Currently, no testing framework is configured. When adding tests:
- Consider Jest for unit tests
- Use Electron testing utilities for integration tests
- Test IPC communication thoroughly
- Mock Recall.ai SDK for testing

## Common Patterns

### Adding New IPC Commands
1. Add command to preload.js whitelist
2. Handle in main.js ipcMain.on('message-from-renderer')
3. Send response via mainWindow.webContents.send()
4. Handle response in renderer with electronAPI.on()

### State Updates
1. Update state in main process
2. Call sendState() to notify renderer
3. React component receives update via electronAPI.on('state')
4. Component re-renders with new state

## Troubleshooting

- Check console logs in both main and renderer processes
- Verify environment variables are loaded
- Ensure Recall.ai SDK permissions are granted
- Check IPC channel names match between processes