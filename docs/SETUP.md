# Space Shooter Mobile Game - Setup Guide

## Prerequisites

### Development Environment
1. **Node.js**: Version 18.19.1 or higher
   ```bash
   node --version
   ```

2. **npm or yarn**: Package manager
   ```bash
   npm --version
   ```

3. **Expo CLI**: Global installation recommended
   ```bash
   npm install -g expo-cli
   ```

4. **Git**: Version control system

### Platform-Specific Setup

#### Android Development
1. **Android Studio**: Install from [developer.android.com](https://developer.android.com/studio)
2. **Android SDK**: Install through Android Studio SDK Manager
3. **Android Emulator**: Set up virtual device through AVD Manager
4. **Environment Variables**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### iOS Development (macOS only)
1. **Xcode**: Install from Mac App Store (requires macOS)
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **iOS Simulator**: Available through Xcode

#### Web Development
1. **Modern Browser**: Chrome, Firefox, or Edge
2. **Web Development Tools**: Browser developer tools

### IDE Setup (Recommended: VS Code)
1. **VS Code Extensions**:
   - React Native Tools
   - TypeScript and JavaScript Language Features
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Jest Runner

2. **VS Code Settings** (`.vscode/settings.json`):
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "jest.runMode": "on-demand"
   }
   ```

## Project Setup

### First-time Setup
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mobile_game
   ```

2. **Install dependencies** (using legacy peer deps for compatibility):
   ```bash
   npm install --legacy-peer-deps
   # or
   yarn install
   ```

3. **Install web dependencies** (required for Expo web development):
   ```bash
   npx expo install react-dom react-native-web
   ```

4. **Verify installation**:
   ```bash
   npm run test
   ```

5. **Start development server**:
   ```bash
   npm start
   ```

### Development Server
1. **Start development server**:
   ```bash
   npm start
   # or
   expo start
   ```

2. **Platform-specific commands**:
   ```bash
   # Android
   npm run android
   # or press 'a' in Expo CLI

   # iOS (macOS only)
   npm run ios
   # or press 'i' in Expo CLI

   # Web
   npm run web
   # or press 'w' in Expo CLI
   ```

3. **Expo Go App** (for physical devices):
   - Install Expo Go from App Store (iOS) or Play Store (Android)
   - Scan QR code from development server
   - Ensure device and computer are on same network

## Asset Management

### Asset Directory Structure
```
assets/
├── images/
│   ├── game/          # Game sprites (ships, bullets, power-ups)
│   ├── ui/            # UI elements (buttons, icons, backgrounds)
│   └── effects/       # Visual effects (explosions, particles)
├── sounds/
│   ├── music/         # Background music
│   ├── sfx/           # Sound effects
│   └── ui/            # UI sounds
└── fonts/             # Font files
```

### Adding Assets

#### Images
1. **Format**: PNG with transparency (recommended)
2. **Resolution**: Multiple densities for different screen sizes:
   - `image.png` (1x)
   - `image@2x.png` (2x)
   - `image@3x.png` (3x)

3. **Usage in code**:
   ```typescript
   import playerShip from '../assets/images/game/player_ship.png';
   // or
   const playerShip = require('../assets/images/game/player_ship.png');
   ```

#### Sounds
1. **Format**:
   - Background music: MP3 (128kbps)
   - Sound effects: WAV (44.1kHz, 16-bit)

2. **Usage in code**:
   ```typescript
   import { AudioManager } from '../src/utils/AudioManager';

   // Load sound
   await AudioManager.loadSound('shoot', require('../assets/sounds/sfx/shoot.wav'));

   // Play sound
   AudioManager.playSound('shoot');
   ```

#### Fonts
1. **Format**: TTF or OTF
2. **Usage in code**:
   ```typescript
   import * as Font from 'expo-font';

   // Load font
   await Font.loadAsync({
     'GameFont': require('../assets/fonts/GameFont.ttf'),
   });
   ```

### Asset Optimization Tips
1. **Sprite Sheets**: Combine related sprites into single images
2. **Compression**: Use tools like ImageOptim or TinyPNG
3. **Memory Management**: Unload unused assets during gameplay
4. **Progressive Loading**: Load essential assets first, others in background

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- Strict mode enabled for type safety
- Path aliases for cleaner imports
- React Native specific compiler options

### Jest Configuration (`package.json`)
- React Native preset
- Transform patterns for node_modules
- Test setup file for mocking
- Coverage reporting configuration

### Expo Configuration (`app.json`)
- App name, version, and orientation
- Platform-specific configurations
- Asset bundling settings
- Splash screen and icon configuration

## Testing Setup

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/simple.test.ts
```

### Test Structure
```
__tests__/
├── setup.js              # Test setup configuration
├── unit/                 # Unit tests
│   ├── utils/           # Utility function tests
│   ├── game/            # Game logic tests
│   └── components/      # Component tests
├── integration/         # Integration tests
│   ├── screens/         # Screen navigation tests
│   └── systems/         # System integration tests
└── e2e/                 # End-to-end tests
```

### Mocking React Native Modules
The `__tests__/setup.js` file contains mocks for:
- React Native modules
- Expo modules
- Third-party libraries
- Platform-specific APIs

## Development Workflow

### Daily Development
1. **Start development server**:
   ```bash
   npm start
   ```

2. **Run tests** (in separate terminal):
   ```bash
   npm run test:watch
   ```

3. **Code changes**:
   - Make changes in source files
   - Save to trigger hot reload
   - Verify changes in simulator/device

4. **Testing changes**:
   - Run unit tests for affected code
   - Test on target platform(s)
   - Verify performance metrics

### Debugging

#### Console Logging
```typescript
// Development-only logging
if (__DEV__) {
  console.log('Game state:', gameState);
}
```

#### React Native Debugger
1. Install React Native Debugger
2. Enable debug mode in app
3. Use Chrome DevTools interface

#### Performance Monitoring
```typescript
import { performanceMonitor } from '../src/utils/PerformanceMonitor';

// Monitor specific operations
performanceMonitor.startOperation('collision_detection');
// ... operation code ...
performanceMonitor.endOperation('collision_detection');
```

### Building for Production

#### Android APK
```bash
# Build APK
expo build:android

# Build app bundle (recommended for Play Store)
expo build:android --type app-bundle
```

#### iOS IPA
```bash
# Build IPA (requires macOS and Apple Developer account)
expo build:ios
```

#### Web Build
```bash
# Build web assets
expo build:web
```

## Common Issues and Solutions

### Android Emulator Issues
1. **Emulator not starting**:
   - Verify Android Studio installation
   - Check AVD configuration
   - Ensure hardware acceleration is enabled

2. **App not loading**:
   - Check network connectivity
   - Verify Expo Go version
   - Restart development server

### iOS Simulator Issues
1. **Simulator not appearing**:
   - Verify Xcode installation
   - Check simulator device selection
   - Restart Expo CLI

2. **Build errors**:
   - Clear derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
   - Update CocoaPods: `cd ios && pod install`

### Web Development Issues
1. **Browser compatibility**:
   - Use Chrome for best compatibility
   - Check console for errors
   - Clear browser cache

2. **Performance issues**:
   - Enable hardware acceleration
   - Reduce particle count
   - Optimize asset sizes

### Dependency Issues
1. **Package installation errors** (React version conflicts):
   ```bash
   # Clear npm cache
   npm cache clean --force

   # Delete node_modules and reinstall with legacy peer deps
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps

   # If issues persist, check React version compatibility
   # Current compatible versions: React 19.2.4, React Native 0.81.5
   ```

2. **AsyncStorage installation issues**:
   ```bash
   # Install with legacy peer deps flag
   npm install @react-native-async-storage/async-storage --legacy-peer-deps
   ```

3. **Native module errors**:
   ```bash
   # Rebuild native modules
   cd ios && pod install
   # or for Android
   cd android && ./gradlew clean
   ```

4. **Jest configuration errors** (React Native 0.81.5 compatibility):
   - Use `setupFiles` instead of `setupFilesAfterEnv` in Jest config
   - Ensure proper transformIgnorePatterns for react-native-game-engine
   - Check test setup file for proper React Native module mocking

## Environment Variables

### Development Environment
Create `.env.development`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_PERFORMANCE_LOGGING=true
```

### Production Environment
Create `.env.production`:
```env
EXPO_PUBLIC_API_URL=https://api.yourgame.com
EXPO_PUBLIC_DEBUG_MODE=false
EXPO_PUBLIC_PERFORMANCE_LOGGING=false
```

### Usage in Code
```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const isDebug = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';
```

## Performance Optimization

### Development Mode
1. **Enable FPS monitoring**:
   ```typescript
   performanceMonitor.setLoggingEnabled(true);
   ```

2. **Memory profiling**:
   - Use Chrome DevTools Memory tab
   - Monitor heap allocations
   - Check for memory leaks

3. **Asset loading optimization**:
   - Use AssetManager for progressive loading
   - Implement asset pooling
   - Monitor cache hit rates

### Production Mode
1. **Bundle optimization**:
   - Enable code splitting
   - Remove development code
   - Optimize asset bundling

2. **Performance targets**:
   - 60 FPS gameplay
   - < 100ms input latency
   - < 3 second initial load time

## Contributing Guidelines

### Code Style
- Follow TypeScript strict mode
- Use functional components with hooks
- Add JSDoc comments for public APIs
- Write comprehensive tests

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests before pushing
4. Create pull request for review

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] Tests pass and coverage is maintained
- [ ] Performance impact is considered
- [ ] Documentation is updated
- [ ] Mobile-specific considerations addressed

---

*Last Updated: 2026-02-13*
*Setup Guide Version: 4.0*
*Compatibility: React Native 0.81.5, Expo 54.0.33, React 19.2.4*
*Note: Use --legacy-peer-deps flag for dependency installation*
*Status: Complete game with all Phase 3 systems implemented*