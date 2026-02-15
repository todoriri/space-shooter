# Space Shooter Mobile Game

<div align="center">

![Space Shooter Game](https://img.shields.io/badge/Game-Space%20Shooter-blue)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-green)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB)
![Expo](https://img.shields.io/badge/Expo-54.0.33-000020)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6)

**A modern Space Shooter arcade game for mobile devices**

</div>

## 🎮 Game Overview

Space Shooter is a fast-paced arcade shooting game inspired by classic space shooters. Pilot your spaceship through waves of enemy fighters, collect power-ups, defeat boss enemies, and achieve the highest score!

### Key Features
- 🚀 **Touch Controls**: Intuitive drag-to-move controls optimized for mobile
- 👾 **Enemy Variety**: Multiple enemy types with unique AI behaviors
- ⚡ **Power-up System**: Collect shields, rapid fire, multi-shot, and bombs
- 🏆 **Progressive Difficulty**: Wave-based system with increasing challenge
- 🎵 **Immersive Audio**: Background music and sound effects
- 📊 **Score Tracking**: Local high score persistence with AsyncStorage
- 📱 **Cross-Platform**: Runs on Android, iOS, and Web

## 🏗️ Architecture

The game uses a modern **Entity-Component-System (ECS)** architecture with `react-native-game-engine`:

- **Entities**: Game objects (Player, Enemy, Bullet, PowerUp)
- **Components**: Data containers (Position, Velocity, Health, Renderable)
- **Systems**: Logic processors (Movement, Collision, Rendering, Audio)

### Mobile-Specific Systems
- **Asset Manager**: Optimized loading and caching for mobile constraints
- **Performance Monitor**: Adaptive quality system for 60fps target
- **Lifecycle Manager**: Handles app background/foreground transitions
- **Touch Input System**: Responsive controls with latency optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18.19.1 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd mobile_game

# Install dependencies
npm install

# Install AsyncStorage for data persistence
npm install @react-native-async-storage/async-storage

# Start development server
npm start
```

### Running the Game
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

## 📁 Project Structure

```
mobile_game/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── game/           # Game-specific components
│   │   ├── ui/             # General UI components
│   │   └── layout/         # Layout components
│   ├── screens/            # Screen components
│   │   ├── MenuScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── GameOverScreen.tsx
│   │   └── LoadingScreen.tsx
│   ├── game/               # Core game logic
│   │   ├── entities/       # Game entity definitions
│   │   ├── systems/        # Game systems (ECS)
│   │   │   ├── MovementSystem.ts
│   │   │   ├── CollisionSystem.ts
│   │   │   └── [Other Systems]
│   │   ├── GameEngine.tsx  # Main game engine wrapper
│   │   ├── GameState.ts    # Game state management
│   │   └── GameLogic.ts    # Pure game logic functions
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── constants/          # Game constants
│   └── utils/              # Utility functions
│       ├── AssetManager.ts
│       ├── PerformanceMonitor.ts
│       ├── MobileLifecycleManager.ts
│       ├── math.ts
│       ├── collision.ts
│       └── storage.ts
├── assets/                 # Game assets
│   ├── images/             # Sprites, backgrounds
│   ├── sounds/             # Audio files
│   └── fonts/              # Font files
├── __tests__/              # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup.js            # Test setup configuration
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # Detailed architecture
│   └── SETUP.md            # Comprehensive setup guide
├── PROJECT.md              # Project overview and status
├── HANDOFF.md              # Team collaboration protocol
└── [Configuration files]   # package.json, tsconfig.json, etc.
```

## 🎯 Development Status

### ✅ Phase 1: Foundation - COMPLETE
- Project structure and architecture
- TypeScript type definitions for all game entities
- Game engine wrapper with ECS systems
- Core utility functions (math, collision, storage)
- Testing infrastructure with Jest
- Mobile-specific systems (AssetManager, PerformanceMonitor, LifecycleManager)
- Complete navigation with React Navigation
- All screen components (Menu, Game, GameOver, Loading)
- Comprehensive documentation

### ✅ Phase 2: Core Gameplay - COMPLETE
- **Player Entity System**: Complete player entity with health, shooting, power-ups, and damage system
- **Enemy Entity System**: Four enemy types (Basic, Diving, Shooting, Boss) with unique AI behaviors
- **Bullet System**: Three bullet types (Player, Enemy, PowerUp) with advanced features (homing, ricochet, spread)
- **Power-up System**: Six power-up types (Shield, RapidFire, MultiShot, Bomb, Health, Score) with floating animations
- **Rendering System**: Complete ECS-to-React Native rendering with visual effects and styles
- **Touch Controls**: Virtual joystick and button controls with PanResponder and animations
- **Placeholder Assets**: Development-friendly fallback system for missing images and sounds
- **Game Engine Integration**: Updated GameEngine.tsx with all systems and entity initialization

### ✅ Phase 3: Polish and Features - COMPLETE
- **Power-up functionality**: Implemented actual power-up effects and duration tracking with `PowerUpSystem.ts`
- **Enemy wave system**: Implemented progressive difficulty with boss encounters using `WaveSystem.ts`
- **Audio integration**: Implemented sound effects and background music system with `AudioSystem.ts`
- **UI polish**: Added enhanced visual effects and particle system with `ParticleSystem.ts`
- **Collision resolution**: Completed collision response and event handling with `CollisionSystemV2.ts`
- **System integration**: Updated all systems to work with proper ECS component structure

### 🔄 Upcoming Phases
- **Phase 4**: Performance optimization, high score persistence, settings screen, state management consolidation
- **Phase 5**: Comprehensive testing (target 60%+ coverage), typed events, final polish

### Code Quality Status (2026-02-14)
A comprehensive code review has been completed with Sprint 1 & 2 fixes applied:

| Category | Issues Found | Status |
|----------|--------------|--------|
| Bugs | 3 (duplicate case, power-up collision, dead code) | ✅ Fixed |
| Performance | 3 (console logs, double ID gen) | ✅ Fixed |
| Code Quality | 5 (magic numbers, tests) | ✅ 13 tests passing |
| Architecture | 4 (state fragmentation, typed events) | 🔜 Planned |

**Recent Improvements:**
- ✅ Created `src/utils/Debug.ts` - Conditional logging utility
- ✅ Created `src/constants/GameConfig.ts` - Centralized configuration
- ✅ Fixed entity pool double ID generation
- ✅ Fixed power-up collision detection bug
- ✅ Removed dead code from GameEngine
- ✅ Unit tests now passing (13 tests)

See [docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) for detailed fixes and roadmap.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Game logic functions, utility modules
- **Integration Tests**: Screen navigation, user interactions
- **Performance Tests**: Frame rate monitoring, memory usage
- **E2E Tests**: Complete game flow, touch controls

## 📚 Documentation

### Core Documentation
- **[PROJECT.md](PROJECT.md)**: Complete project overview, status, and roadmap
- **[HANDOFF.md](HANDOFF.md)**: Team collaboration and handoff protocol
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Contribution guidelines and development workflow
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Detailed technical architecture
- **[docs/SETUP.md](docs/SETUP.md)**: Comprehensive setup and development guide
- **[docs/TESTING.md](docs/TESTING.md)**: Testing strategy and guidelines
- **[docs/PERFORMANCE.md](docs/PERFORMANCE.md)**: Performance optimization guide
- **[docs/IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md)**: Prioritized code improvements (NEW)

### Asset Guidelines
- **[assets/images/README.md](assets/images/README.md)**: Asset requirements and specifications
- All assets should follow mobile optimization best practices

## 🛠️ Technology Stack

### Core Framework
- **React Native Expo 54.0.33**: Cross-platform mobile development
- **TypeScript 5.9.2**: Static typing for better code quality
- **React 19.1.0**: UI library with hooks

### Game Engine
- **react-native-game-engine 1.2.0**: Entity-Component-System architecture
- **Custom ECS Systems**: Movement, Collision, Rendering, Audio

### Mobile Optimization
- **Asset Manager**: Progressive loading and memory-aware caching
- **Performance Monitor**: Adaptive quality for 60fps target
- **Lifecycle Manager**: App state and interruption handling

### UI & Navigation
- **React Navigation 7**: Screen management and transitions
- **react-native-vector-icons**: UI icons
- **react-native-safe-area-context**: Safe area handling

### Audio & Persistence
- **react-native-sound 0.13.0**: Audio playback
- **AsyncStorage**: Local data persistence

### Testing
- **Jest 30.2.0**: Test runner
- **React Native Testing Library**: Component testing
- **@testing-library/jest-native**: Native-specific assertions

## 🎨 Asset Requirements

### Game Sprites
- **Player Ship**: 40x40px, modern vector-style spaceship
- **Enemy Ships**: Basic, Diving, Shooting, Boss variants
- **Bullets**: Player (blue/white) and Enemy (red/orange)
- **Power-ups**: Shield, RapidFire, MultiShot, Bomb
- **Background**: Starfield with nebula effects

### Audio
- **Background Music**: Space-themed ambient track
- **Sound Effects**: Shoot, explode, collect, UI interactions

### UI Assets
- **Buttons**: Normal and pressed states
- **Icons**: Pause, sound, menu icons
- **Fonts**: Game UI font for score and menus

## 🤝 Contributing

Please read our [HANDOFF.md](HANDOFF.md) for detailed collaboration guidelines:

### Development Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests before pushing
4. Create pull request for review
5. Address review feedback
6. Merge after approval

### Code Standards
- TypeScript with strict mode enabled
- Functional components with hooks
- Comprehensive type definitions
- JSDoc comments for public APIs
- Test coverage for new functionality

## 📱 Platform Support

### Primary Platform: Android
- Touch input latency optimization
- Battery usage monitoring
- Memory pressure handling
- Background audio management

### Cross-Platform Compatibility
- **iOS**: Full support with Apple App Store guidelines
- **Web**: Browser-based gameplay with touch/desktop controls
- **Performance**: 60fps target across all platforms

## 🚨 Troubleshooting

### Common Issues
1. **Android Emulator not starting**: Verify Android Studio installation and AVD configuration
2. **iOS Simulator issues**: Check Xcode installation and simulator device selection
3. **Asset loading errors**: Verify asset paths and require statements
4. **Performance issues**: Use PerformanceMonitor to identify bottlenecks

### Development Tips
- Use `npm run test:watch` during development
- Enable FPS monitoring in development mode
- Test on physical devices for accurate performance metrics
- Use the AssetManager for optimized asset loading

## 📄 License

This project is for educational and demonstration purposes. All assets should be properly licensed for commercial use.

## 📞 Support

- **Repository**: [GitHub URL]
- **Documentation**: See `docs/` directory for detailed guides
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

<div align="center">

**Built with ❤️ using React Native, Expo, and TypeScript**

*Last Updated: 2026-02-14*
*Project Status: Phase 1, 2 & 3 Complete, Sprint 1 & 2 Fixes Complete*
*Next: Architecture consolidation, then performance optimization*

</div>