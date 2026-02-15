# Space Shooter Mobile Game Architecture

## Core Architecture
- **React Native Expo**: Cross-platform mobile development framework with TypeScript
- **Entity-Component-System (ECS)**: Game architecture using `react-native-game-engine`
- **React Navigation**: Screen management and navigation stack
- **TypeScript**: Static typing with comprehensive type definitions

## Game Architecture Overview

### Entity-Component-System (ECS) Pattern
The game follows the ECS pattern for efficient game logic and rendering:

```
Entities (Game Objects) → Components (Data) → Systems (Logic)
```

**Entities**: Game objects (Player, Enemy, Bullet, PowerUp)
**Components**: Data attached to entities (Position, Velocity, Health, Renderable)
**Systems**: Logic that processes entities with specific components (Movement, Collision, Rendering)

### Core Game Systems Implemented

#### 1. Movement System (`src/game/systems/MovementSystem.ts`)
- Real-time entity movement with delta time handling
- Touch input processing for player control
- Enemy AI movement patterns (basic, diving, shooting, boss)
- Bullet trajectory calculations
- Power-up floating animations

#### 2. Collision System (`src/game/systems/CollisionSystem.ts`)
- Efficient AABB (Axis-Aligned Bounding Box) collision detection
- Spatial grid partitioning for performance optimization
- Collision response handling (damage, power-up collection, scoring)
- Particle effect triggering on collisions

#### 3. Rendering System (`src/game/systems/RenderingSystem.ts`) - IMPLEMENTED
- Complete ECS-to-React Native component mapping
- Visual rendering for all entity types (Player, Enemy, Bullet, PowerUp)
- Visual effects (glow, pulse, trail, shield, engine effects)
- Development mode placeholder indicators
- Style-based entity differentiation by type
- Health bar rendering for boss enemies
- Animation state management with real-time updates

### Entity Systems (Phase 2 Implementation)

#### 1. Player Entity System (`src/game/entities/Player.ts`) - IMPLEMENTED
- Complete player entity with health management (current/max, invulnerability)
- Shooting mechanics with cooldown system
- Power-up tracking and management
- Score and lives tracking
- Touch position handling for movement system
- Damage and healing functions
- Entity creation with default components

#### 2. Enemy Entity System (`src/game/entities/Enemy.ts`) - IMPLEMENTED
- Four enemy types: BASIC, DIVING, SHOOTING, BOSS
- Unique AI behaviors for each type
- Movement patterns (diving, zigzag, floating)
- Shooting capabilities for shooting enemies
- Health and scoring systems
- Wave-based enemy generation
- Damage handling and destruction

#### 3. Bullet Entity System (`src/game/entities/Bullet.ts`) - IMPLEMENTED
- Three bullet types: PLAYER, ENEMY, POWER_UP
- Advanced features: homing, ricochet, pierce
- Lifetime management and age tracking
- Owner tracking for collision resolution
- Damage and special effect systems
- Spread pattern generation for multi-shot
- Velocity and trajectory management

#### 4. Power-up Entity System (`src/game/entities/PowerUp.ts`) - IMPLEMENTED
- Six power-up types: SHIELD, RAPID_FIRE, MULTI_SHOT, BOMB, HEALTH, SCORE
- Floating animation with timer-based movement
- Collection state tracking
- Duration and value management
- Random power-up drop generation
- Visual differentiation by type
- Entity creation with type-specific properties

### Mobile-Specific Systems

#### 1. Asset Manager (`src/utils/AssetManager.ts`)
- Progressive asset loading with priority levels
- Memory-aware caching with LRU eviction
- Platform-specific asset optimization
- Background preloading for smooth gameplay

#### 2. Performance Monitor (`src/utils/PerformanceMonitor.ts`)
- Real-time FPS monitoring and logging
- Adaptive quality system based on device capabilities
- Memory usage tracking and warnings
- Performance bottleneck identification

#### 3. Mobile Lifecycle Manager (`src/utils/MobileLifecycleManager.ts`)
- App state management (foreground/background)

### Phase 3: Polish Systems

#### 1. Power-up System (`src/game/systems/PowerUpSystem.ts`)
- Power-up effect management and duration tracking
- Six power-up types: Shield, RapidFire, MultiShot, Bomb, Health, Score
- Automatic effect expiration and cleanup
- Integration with collision and audio systems

#### 2. Audio System (`src/game/systems/AudioSystem.ts`)
- Game event-driven audio playback
- Integration with `react-native-sound` library
- Volume controls and mute functionality
- Sound preloading and caching

#### 3. Audio Manager (`src/utils/AudioManager.ts`)
- Mobile-optimized audio playback
- Platform-specific audio configuration
- Sound instance caching and management
- Volume mixing and audio prioritization

#### 4. Wave System (`src/game/systems/WaveSystem.ts`)
- Progressive enemy wave generation
- Difficulty scaling with wave progression
- Boss encounters every 5 waves
- Dynamic enemy spawning and timing

#### 5. Particle System (`src/game/systems/ParticleSystem.ts`)
- Visual effects for explosions, hits, and trails
- Six particle types with unique behaviors
- Particle physics with gravity and fade-out
- Automatic particle cleanup and memory management

#### 6. Updated Movement System (`src/game/systems/MovementSystemV2.ts`)
- Enhanced ECS component structure compatibility
- Improved touch control responsiveness
- Screen boundary handling for all entity types
- Velocity and acceleration physics

#### 7. Updated Collision System (`src/game/systems/CollisionSystemV2.ts`)
- Complete collision response with damage calculation
- Scoring system integration
- Power-up collection handling
- Event dispatch for audio and particle systems
- Game pause/resume handling
- Low memory warning responses
- Auto-save functionality for game state

#### 8. Visual Effects System (`src/game/systems/VisualEffectsSystem.ts`)
- Handles visual-only timers (hit flash, invulnerability blink)
- Runs before RenderingSystem to ensure visual state is current
- Separates visual logic from render phase for cleaner architecture
- Frame-based timer decrementation for consistent visual effects

### Game State Management

#### Game State Structure (`src/game/GameState.ts`)
```typescript
interface GameState {
  score: number;
  lives: number;
  wave: number;
  difficulty: 'easy' | 'medium' | 'hard';
  powerUps: PowerUpType[];
  gameScreen: 'menu' | 'game' | 'gameOver';
  highScore: number;
  // ... additional state properties
}
```

#### State Management Approach
- **React Context + useReducer**: Centralized game state management
- **Immutable Updates**: Pure functions for state transformations
- **Persistence**: AsyncStorage for high scores and settings
- **Event System**: Dispatch-based communication between systems

### Screen Architecture

#### Navigation Stack
```
App (NavigationContainer)
├── MenuScreen (initial route)
├── GameScreen (main gameplay)
└── GameOverScreen (score display)
```

#### Screen Components
1. **MenuScreen** (`src/screens/MenuScreen.tsx`)
   - Game title and branding
   - Start game button
   - High score display
   - Settings access

2. **GameScreen** (`src/screens/GameScreen.tsx`)
   - Game engine integration
   - Touch controls overlay
   - UI overlays (score, lives, power-ups)
   - Pause menu

3. **GameOverScreen** (`src/screens/GameOverScreen.tsx`)
   - Final score display
   - New high score celebration
   - Restart and menu options
   - Game statistics

4. **LoadingScreen** (`src/screens/LoadingScreen.tsx`)
   - Asset loading progress
   - Game initialization status
   - Error handling display

### Component Structure

#### Game Components
- **PlayerShip**: Player-controlled spaceship with animations
- **EnemyShip**: Various enemy types with different behaviors
- **Bullet**: Projectile rendering with trail effects
- **PowerUp**: Collectible item rendering and animations
- **Explosion**: Particle-based explosion effects
- **TouchControls**: Virtual joystick/button overlay

#### UI Components
- **Button**: Reusable button with states (normal, pressed, disabled)
- **ScoreDisplay**: Animated score counter
- **LivesDisplay**: Heart/life indicator
- **PowerUpIndicator**: Active power-up status display
- **WaveDisplay**: Current wave and progress

### Utility Modules

#### Core Utilities
- **Math Utilities** (`src/utils/math.ts`): Vector operations, random numbers, interpolation
- **Collision Utilities** (`src/utils/collision.ts`): Geometry calculations, spatial grid
- **Storage Utilities** (`src/utils/storage.ts`): AsyncStorage wrapper for persistence

#### Game Logic
- **Game Logic** (`src/game/GameLogic.ts`): Pure functions for game mechanics
- **Wave Generation**: Progressive difficulty and enemy spawning
- **AI Patterns**: Enemy behavior algorithms
- **Score Calculation**: Multiplier and combo systems

### Asset Pipeline

#### Asset Types
1. **Images**: PNG sprites with transparency, multiple density versions
2. **Sounds**: MP3 background music, WAV sound effects
3. **Fonts**: TTF/OTF fonts for UI text

#### Asset Loading Process
```
1. Essential Assets (loading screen) → Load immediately
2. Game Assets (sprites, sounds) → Preload in background
3. Optional Assets (high-res textures) → Load on-demand
```

### Performance Optimization Strategies

#### Rendering Optimization
- Entity pooling for frequent object creation/destruction
- Spatial partitioning for collision detection
- Batch rendering where possible
- Texture atlasing for sprite sheets

#### Memory Management
- LRU cache for assets
- Progressive texture loading
- Entity lifecycle management
- Background asset cleanup

#### Game Loop Optimization
- Fixed time step for physics
- Variable rendering for smooth animation
- Priority-based system execution
- Adaptive quality based on FPS

### Testing Architecture

#### Test Levels
1. **Unit Tests**: Game logic functions, utility modules
2. **Integration Tests**: Screen navigation, user interactions
3. **Performance Tests**: Frame rate monitoring, memory usage
4. **E2E Tests**: Complete game flow, touch controls

#### Test Infrastructure
- **Jest**: Test runner with React Native preset
- **React Native Testing Library**: Component testing
- **Test Coverage**: Comprehensive coverage reporting
- **Mocking**: React Native module mocks for isolation

### Development Workflow

#### Code Organization
- **Feature-based structure**: Game systems grouped by functionality
- **Type-safe interfaces**: Comprehensive TypeScript definitions
- **Documentation**: JSDoc comments for public APIs
- **Testing**: Test files colocated with source files

#### Build Process
- **Development**: Expo development server with hot reload
- **Testing**: Jest test runner with watch mode
- **Production**: Expo build for platform-specific bundles
- **Distribution**: App stores via Expo Application Services

### Platform Considerations

#### Android Optimization
- Touch input latency optimization
- Battery usage monitoring
- Memory pressure handling
- Background audio management

#### Cross-Platform Compatibility
- Screen size adaptation
- Input method abstraction
- Performance baseline targeting
- Asset resolution scaling

### Security Considerations
- No sensitive data storage
- Local-only persistence
- Input validation for user settings
- Asset integrity verification

### Monitoring and Analytics
- Performance metrics collection
- Gameplay statistics tracking
- Error reporting and logging
- User behavior analytics (opt-in)

---

## Known Issues & Technical Debt

### Architectural Decisions Under Review

#### 1. Direct Entity Mutation Pattern
**Status:** Under Review
**Impact:** Performance vs. React reconciliation safety

The current implementation directly mutates entity components in game systems for performance:
```typescript
// MovementSystemV2.ts, CollisionSystemV2.ts
position.x += velocity.x * deltaTime;  // Direct mutation
```

**Alternatives Considered:**
- Immutable updates (safer but creates GC pressure)
- Immer library (adds dependency)
- Keep current approach with documentation

**Recommendation:** Keep current approach with clear documentation of the pattern.

#### 2. State Management Fragmentation
**Status:** Needs Consolidation
**Impact:** Debugging difficulty

Game state is currently split across:
- `useState` for entities
- `useRef` for input state and game over flag
- Props from parent for score/lives/wave

**Recommendation:** Create unified `GameProvider` context.

### Code Quality Issues

| Issue | Location | Priority | Status |
|-------|----------|----------|--------|
| Duplicate switch case | GameEngine.tsx:309 | Critical | ✅ Fixed |
| Power-up collision bug | CollisionSystemV2.ts:109 | Critical | ✅ Fixed |
| **Bomb lifetime bug** | **PlayerSystem.ts:216** | **Critical** | **✅ Fixed** |
| Console.log in production | MovementSystemV2.ts:11 | High | ✅ Fixed |
| Unused functions | GameEngine.tsx:353-431 | Medium | ✅ Removed |
| Magic numbers | Multiple files | Medium | ✅ Extracted to constants |
| Entity pool ID generation | Enemy.ts:43-45 | Medium | ✅ Fixed |
| No unit tests | Game logic | Medium | ✅ 13 tests passing |
| Duplicate break statement | ParticleSystem.ts:228 | Low | ✅ Fixed |
| Render phase mutation | RenderingSystem.tsx:218 | Medium | ✅ Fixed |
| Type safety (EntityType.PARTICLE) | ParticleSystem.ts | Low | ✅ Fixed |
| Hardcoded delta time | PlayerSystem.ts:23 | Low | ✅ Fixed |

### Files Addressed (Sprint 1-6 Complete)

```
src/game/GameEngine.tsx
├── ✅ Fixed: Duplicate 'gameOver' case removed
├── ✅ Removed: handleSpawning() dead code
└── ✅ Removed: updatePowerUpDurations() placeholder

src/game/systems/MovementSystemV2.ts
├── ✅ Fixed: Console.log now uses Debug utility
└── 📝 Documented: Direct entity mutation pattern (acceptable for performance)

src/game/systems/CollisionSystemV2.ts
└── ✅ Fixed: Power-up collision detection (sorted string case)

src/game/entities/Enemy.ts
└── ✅ Fixed: Single ID generation with typed pool params

src/game/systems/ParticleSystem.ts
├── ✅ Fixed: Duplicate break statement removed
└── ✅ Fixed: EntityType.PARTICLE type safety

src/game/systems/RenderingSystem.tsx
├── ✅ Fixed: Hit flash moved to VisualEffectsSystem
└── ✅ Fixed: EntityType.PARTICLE in switch case

src/game/systems/PlayerSystem.ts
├── ✅ Fixed: Removed unused hardcoded deltaTime
├── ✅ Fixed: Console.log wrapped in __DEV__
├── ✅ Cleaned: Removed commented-out code
└── ✅ Fixed: Bomb lifetime unit mismatch (3000ms → 3.0s)

src/game/systems/PowerUpSystem.ts
└── ✅ Fixed: Console.log wrapped in __DEV__

src/components/game/TouchControls.tsx
└── ✅ Fixed: Console.log wrapped in __DEV__

__tests__/unit/game/foundation.test.ts
└── ✅ Updated: Tests now pass with V2 systems
```

### New Files Created

```
src/constants/GameConfig.ts       - Centralized game configuration
src/constants/index.ts            - Module exports
src/utils/Debug.ts                - Conditional logging utility
src/game/systems/VisualEffectsSystem.ts - Visual timer system
docs/IMPROVEMENT_PLAN.md          - Detailed improvement tracking
```

### Performance Optimizations (Sprint 7)

The following performance optimizations were implemented:

1. **Particle Cap** - Limited active particles to 30 concurrent for stable 60 FPS
2. **Reduced Particle Counts** - Explosions: 20→10, Bomb debris: 16→8
3. **Collision Optimization** - Particles skipped in collision detection

Files modified for performance:
- `src/game/systems/ParticleSystem.ts` - Added particle cap, reduced counts
- `src/game/systems/CollisionSystemV2.ts` - Skip particles in collision checks

### Bomb Mechanics Fix (Sprint 8)

Fixed bomb damage propagation to work in all directions (radius-based):

**Previous Behavior:** Bomb relied on continuous AABB collision detection, causing damage to appear to "propagate forward" as enemies moved into the collision area.

**New Behavior:** Bomb now applies instant radius-based damage to all enemies within its radius when activated, using `checkCircleAABBCollision` for accurate circle-to-rectangle collision detection.

```typescript
// Instant radius damage on bomb activation
const isInRange = checkCircleAABBCollision(
    bombCenterX, bombCenterY, bombRadius,
    enemyX, enemyY, enemyWidth, enemyHeight
);
```

Files modified:
- `src/game/systems/PlayerSystem.ts` - Added instant radius damage logic
- `src/game/systems/CollisionSystemV2.ts` - Skip `visual_only` tagged entities

### Initial Load Optimization (Sprint 9)

Implemented warm-up delay and frame time optimization:

1. **Initial Warm-up Delay** - 1.5 second delay before first wave spawns
2. **WaveSystem Debug Logging** - Wrapped console.log in `__DEV__` checks
3. **Particle Type Safety** - Added `EntityType.PARTICLE` to bomb particles

```typescript
// WaveSystem.ts - Warm-up delay for game stabilization
const INITIAL_WARMUP_DELAY = 1500; // 1.5 seconds
if (waveState.currentWave === 1) {
  waveState.lastSpawnTime = currentTime + INITIAL_WARMUP_DELAY;
}
```

Files modified:
- `src/game/systems/WaveSystem.ts` - Added warm-up delay, wrapped debug logs
- `src/game/GameEngine.tsx` - Added `intermissionTimer` to waveManager
- `src/game/systems/ParticleSystem.ts` - Added type to bomb particles

### Improvement Roadmap

See [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) for detailed implementation steps.

- **Sprint 1:** ✅ Critical bug fixes - Complete
- **Sprint 2:** ✅ Code quality & tests - Complete
- **Sprint 3:** ✅ Architecture consolidation - Complete
- **Sprint 4:** ✅ Polish & documentation - Complete
- **Sprint 5:** ✅ Code review fixes - Complete
- **Sprint 6:** ✅ Bomb lifetime bug fix - Complete
- **Sprint 7:** ✅ Performance improvements (P1) - Complete
- **Sprint 8:** ✅ Bomb radius damage fix - Complete
- **Sprint 9:** ✅ Initial load optimization - Complete

---

*Last Updated: 2026-02-15*
*Architecture Version: 4.8*
*Status: Sprint 1-9 Complete*