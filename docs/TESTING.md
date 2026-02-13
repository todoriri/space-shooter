# Space Shooter Mobile Game - Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the Space Shooter mobile game. Testing is critical for ensuring game stability, performance, and quality across all target platforms.

## Testing Levels

### 1. Unit Testing
**Purpose**: Test individual functions and components in isolation

#### Test Scope:
- Game logic functions (`src/game/GameLogic.ts`)
- Utility functions (`src/utils/*.ts`)
- Math and collision calculations
- State management functions
- Pure functions without side effects

#### Example Unit Tests:
```typescript
// Testing math utilities
describe('Math Utilities', () => {
  test('clamp function works correctly', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  test('distance calculates Euclidean distance', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});

// Testing collision detection
describe('Collision Detection', () => {
  test('AABB collision detection works', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 5, y: 5, width: 10, height: 10 };
    expect(checkAABBCollision(rect1, rect2)).toBe(true);
  });
});
```

### 2. Integration Testing
**Purpose**: Test interactions between components and systems

#### Test Scope:
- Screen navigation flows
- Game state updates
- System interactions (Movement + Collision)
- Touch input handling
- Asset loading sequences

#### Example Integration Tests:
```typescript
// Testing screen navigation
describe('Screen Navigation', () => {
  test('Menu → Game navigation works', async () => {
    const { getByText } = render(<App />);
    const startButton = getByText('Start Game');
    fireEvent.press(startButton);

    // Verify game screen is displayed
    expect(getByText('Score:')).toBeTruthy();
  });
});

// Testing game state flow
describe('Game State Flow', () => {
  test('Game over triggers correctly', () => {
    const gameState = { lives: 0, score: 1000 };
    const result = checkGameOver(gameState);
    expect(result.isGameOver).toBe(true);
    expect(result.reason).toBe('no_lives');
  });
});
```

### 3. Component Testing
**Purpose**: Test React Native components in isolation

#### Test Scope:
- UI components (`src/components/`)
- Screen components (`src/screens/`)
- Game components (PlayerShip, EnemyShip, etc.)
- Touch control components

#### Example Component Tests:
```typescript
// Testing UI Button component
describe('Button Component', () => {
  test('renders with correct text', () => {
    const { getByText } = render(<Button title="Start Game" />);
    expect(getByText('Start Game')).toBeTruthy();
  });

  test('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPress} />
    );

    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### 4. System Testing (ECS)
**Purpose**: Test Entity-Component-System behavior

#### Test Scope:
- Movement system calculations
- Collision system detection and response
- Spawning system wave generation
- Rendering system entity updates

#### Example System Tests:
```typescript
// Testing movement system
describe('Movement System', () => {
  test('updates entity positions correctly', () => {
    const entities = {
      player: {
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        renderer: <PlayerShip />
      }
    };

    const time = { delta: 1000 }; // 1 second
    const updatedEntities = MovementSystem(entities, { time });

    expect(updatedEntities.player.position.x).toBe(150); // 100 + 50*1
    expect(updatedEntities.player.position.y).toBe(100);
  });
});
```

### 5. Performance Testing
**Purpose**: Ensure game meets performance targets

#### Test Scope:
- Frame rate (60fps target)
- Memory usage
- Load times
- Input latency
- Battery impact

#### Performance Metrics:
```typescript
// Performance test example
describe('Performance Tests', () => {
  test('maintains 60fps with 50 entities', async () => {
    const fpsMetrics = await measureFPS(() => {
      // Simulate game with 50 entities
      simulateGameWithEntities(50);
    });

    expect(fpsMetrics.average).toBeGreaterThan(55);
    expect(fpsMetrics.min).toBeGreaterThan(45);
  });

  test('memory usage stays under threshold', () => {
    const memoryUsage = measureMemory(() => {
      // Load all game assets
      loadAllAssets();
    });

    expect(memoryUsage.peak).toBeLessThan(200 * 1024 * 1024); // 200MB
  });
});
```

### 6. End-to-End Testing
**Purpose**: Test complete game flows

#### Test Scope:
- Complete game session (start → play → game over)
- Touch control responsiveness
- Audio playback
- Persistence (high scores)
- Cross-platform behavior

#### E2E Test Scenarios:
```typescript
// Complete game flow test
describe('End-to-End Game Flow', () => {
  test('complete game session works', async () => {
    // Start from menu
    await navigateToGame();

    // Play game (simulate touch inputs)
    await simulateGameplay(60); // 60 seconds

    // Trigger game over
    await triggerGameOver();

    // Verify game over screen
    await verifyGameOverScreen();

    // Return to menu
    await returnToMenu();
  });
});
```

## Test Environment

### Development Environment
- **Test Runner**: Jest 30.2.0
- **Assertion Library**: @testing-library/jest-native
- **Component Testing**: React Native Testing Library
- **Mocking**: Jest mocks for React Native modules

### Test Configuration (`package.json`)
```json
{
  "jest": {
    "preset": "react-native",
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|expo|@expo|react-native-game-engine)/)"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>/__tests__/setup.js"
    ],
    "testMatch": [
      "**/__tests__/**/*.test.ts",
      "**/__tests__/**/*.test.tsx"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/index.ts"
    ]
  }
}
```

### Test Setup (`__tests__/setup.js`)
```javascript
// Mock React Native modules
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');

  return {
    ...ReactNative,
    // Add specific mocks as needed
    Animated: {
      ...ReactNative.Animated,
      timing: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
  },
}));

// Mock third-party libraries
jest.mock('react-native-sound', () => ({
  setIsEnabled: jest.fn(),
  play: jest.fn(),
}));
```

## Test Execution

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/unit/game/collision.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="collision"
```

### Test Scripts (`package.json`)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e"
  }
}
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Statement Coverage**: 80%
- **Branch Coverage**: 75%
- **Function Coverage**: 85%
- **Line Coverage**: 80%

### Critical Areas Requiring High Coverage
1. **Collision Detection**: 95%+ coverage (critical for gameplay)
2. **Game State Management**: 90%+ coverage
3. **Movement Calculations**: 85%+ coverage
4. **Touch Input Handling**: 80%+ coverage

### Coverage Reporting
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Platform-Specific Testing

### Android Testing
```bash
# Run tests on Android
npm run android:test

# Test on physical device
adb shell am instrument -w com.space.shooter.test/androidx.test.runner.AndroidJUnitRunner
```

### iOS Testing
```bash
# Run tests on iOS simulator
npm run ios:test

# Build for testing
xcodebuild test -workspace ios/SpaceShooter.xcworkspace -scheme SpaceShooter -destination 'platform=iOS Simulator,name=iPhone 14'
```

### Web Testing
```bash
# Run tests in browser environment
npm run web:test

# Use Jest with jsdom environment
```

## Continuous Integration

### CI Pipeline Stages
1. **Code Quality**: ESLint, TypeScript compilation
2. **Unit Tests**: Fast-running unit tests
3. **Integration Tests**: Component and system tests
4. **Performance Tests**: FPS and memory checks
5. **Build Verification**: Platform-specific builds

### Sample CI Configuration (GitHub Actions)
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Data Management

### Mock Data
```typescript
// Test data factories
const createPlayerEntity = (overrides = {}) => ({
  id: 'player',
  position: { x: 100, y: 100 },
  velocity: { x: 0, y: 0 },
  health: 100,
  renderer: <PlayerShip />,
  ...overrides,
});

const createEnemyEntity = (type: EnemyType, overrides = {}) => ({
  id: `enemy_${Date.now()}`,
  type,
  position: { x: Math.random() * 400, y: -50 },
  velocity: { x: 0, y: 50 },
  health: getEnemyHealth(type),
  ...overrides,
});
```

### Test Scenarios
```typescript
// Common test scenarios
const testScenarios = {
  basicCollision: {
    entities: [
      createPlayerEntity(),
      createEnemyEntity('basic', { position: { x: 105, y: 105 } }),
    ],
    expected: {
      collision: true,
      playerDamage: 10,
    },
  },

  powerUpCollection: {
    entities: [
      createPlayerEntity(),
      createPowerUpEntity('shield', { position: { x: 110, y: 110 } }),
    ],
    expected: {
      collected: true,
      powerUpActive: 'shield',
    },
  },
};
```

## Debugging Tests

### Common Test Issues
1. **Async timing issues**: Use `waitFor` and `act` properly
2. **Mock setup problems**: Verify mock implementations
3. **Platform differences**: Test on target platforms
4. **State management**: Ensure proper cleanup between tests

### Debugging Commands
```bash
# Run tests with debug output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="collision" --verbose

# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Maintenance

### Best Practices
1. **Keep tests fast**: Unit tests should run in milliseconds
2. **Isolate tests**: Tests should not depend on each other
3. **Use descriptive names**: Test names should describe behavior
4. **Test edge cases**: Include boundary conditions
5. **Update with code**: Tests should evolve with the codebase

### Test Review Checklist
- [ ] Tests are independent and isolated
- [ ] Test names clearly describe behavior
- [ ] Edge cases are covered
- [ ] Mocking is appropriate and minimal
- [ ] Async code is handled correctly
- [ ] Test data is realistic but minimal
- [ ] Performance considerations are addressed

## Performance Testing Guidelines

### Frame Rate Testing
```typescript
// Measure FPS during gameplay
const measureFPS = async (gameplayFunction: () => void) => {
  const startTime = Date.now();
  let frameCount = 0;

  const gameLoop = () => {
    frameCount++;
    gameplayFunction();

    if (Date.now() - startTime < 1000) {
      requestAnimationFrame(gameLoop);
    }
  };

  gameLoop();
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    average: frameCount,
    min: frameCount * 0.9, // Allow 10% variance
  };
};
```

### Memory Testing
```typescript
// Monitor memory usage
const measureMemory = (testFunction: () => void) => {
  const startMemory = process.memoryUsage();
  testFunction();
  const endMemory = process.memoryUsage();

  return {
    heapUsed: endMemory.heapUsed - startMemory.heapUsed,
    heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    external: endMemory.external - startMemory.external,
  };
};
```

## Test Reporting

### Test Results
- **Console output**: Detailed test results
- **JUnit XML**: For CI integration
- **HTML reports**: Coverage and test results
- **Slack/Teams notifications**: For failed tests

### Metrics Tracking
- **Test execution time**: Monitor for performance regression
- **Coverage trends**: Track coverage over time
- **Flaky tests**: Identify and fix unstable tests
- **Failure rates**: Monitor test stability

---

*Last Updated: 2026-02-13*
*Testing Strategy Version: 1.0*
*Coverage Target: 80%+ across all test types*