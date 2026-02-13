# Contributing to Space Shooter Mobile Game

## Welcome!
Thank you for your interest in contributing to the Space Shooter mobile game! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

### Our Pledge
We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites
- Node.js 18.19.1 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Git

### First-time Setup
1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mobile_game.git
   cd mobile_game
   ```

3. **Set up upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/mobile_game.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Install AsyncStorage** (required for data persistence):
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

6. **Verify setup**:
   ```bash
   npm test
   ```

### Development Environment
- **VS Code** (recommended) with React Native extension pack
- **Android Studio** for Android development
- **Xcode** for iOS development (macOS only)
- **Chrome** for web development and debugging

## Development Workflow

### Branching Strategy
We follow a simplified Git Flow approach:

```
main (protected)
├── develop (integration branch)
│   ├── feature/*      # New features
│   ├── bugfix/*       # Bug fixes
│   ├── hotfix/*       # Critical fixes
│   └── chore/*        # Maintenance tasks
└── release/*          # Release preparation
```

### Branch Naming Convention
- `feature/gameplay-player-controls`
- `bugfix/collision-detection-issue`
- `hotfix/crash-on-startup`
- `chore/update-dependencies`
- `docs/update-readme`

### Creating a New Feature
1. **Sync with upstream**:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add player touch controls"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request** on GitHub

### Keeping Your Branch Updated
```bash
# While on your feature branch
git fetch upstream
git merge upstream/develop
# Resolve any conflicts
```

## Code Standards

### TypeScript Guidelines
- **Strict mode**: Always enabled
- **Explicit types**: Avoid `any` type
- **Interfaces over types**: Use interfaces for object shapes
- **Readonly**: Use `readonly` for immutable data
- **Enums**: Use string enums for better debugging

```typescript
// Good
interface PlayerEntity {
  readonly id: string;
  position: Position;
  velocity: Velocity;
  health: number;
}

// Bad
type PlayerEntity = {
  id: string;
  position: any;
  velocity: any;
  health: number;
};
```

### React Native Components
- **Functional components**: Use hooks instead of classes
- **Memoization**: Use `React.memo` for pure components
- **Custom hooks**: Extract reusable logic
- **Prop types**: Define with TypeScript interfaces

```typescript
// Good
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = React.memo(({ title, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

// Bad
class Button extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.onPress}>
        <Text>{this.props.title}</Text>
      </TouchableOpacity>
    );
  }
}
```

### Game Development Patterns

#### Entity-Component-System (ECS)
```typescript
// Entity definition
interface GameEntity {
  id: string;
  components: Record<string, Component>;
}

// System implementation
const MovementSystem = (entities: Record<string, GameEntity>, { time }: { time: number }) => {
  const deltaTime = Math.min(time.delta, 100) / 1000;

  Object.values(entities).forEach(entity => {
    if (entity.components.position && entity.components.velocity) {
      entity.components.position.x += entity.components.velocity.x * deltaTime;
      entity.components.position.y += entity.components.velocity.y * deltaTime;
    }
  });

  return entities;
};
```

#### State Management
```typescript
// Use React Context + useReducer for game state
interface GameState {
  score: number;
  lives: number;
  wave: number;
  // ... other state
}

type GameAction =
  | { type: 'INCREMENT_SCORE'; payload: number }
  | { type: 'DECREMENT_LIVES' }
  | { type: 'NEXT_WAVE' };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INCREMENT_SCORE':
      return { ...state, score: state.score + action.payload };
    case 'DECREMENT_LIVES':
      return { ...state, lives: Math.max(0, state.lives - 1) };
    case 'NEXT_WAVE':
      return { ...state, wave: state.wave + 1 };
    default:
      return state;
  }
};
```

### File Organization
```
src/
├── components/          # Reusable components
│   ├── game/           # Game-specific components
│   ├── ui/             # UI components
│   └── layout/         # Layout components
├── screens/            # Screen components
├── game/               # Game logic
│   ├── entities/       # Entity definitions
│   ├── systems/        # ECS systems
│   └── [engine files]
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Game constants
└── types/              # TypeScript types
```

### Naming Conventions
- **Files**: `PascalCase` for components, `camelCase` for utilities
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase` with `Type` suffix if needed
- **Enums**: `PascalCase`

### Code Style Rules
- **Indentation**: 2 spaces
- **Semicolons**: Always
- **Quotes**: Single quotes for strings, double quotes for JSX
- **Line length**: 100 characters maximum
- **Trailing commas**: In multiline objects and arrays

## Testing Guidelines

### Test Structure
```
__tests__/
├── unit/               # Unit tests
│   ├── utils/         # Utility tests
│   ├── game/          # Game logic tests
│   └── components/    # Component tests
├── integration/       # Integration tests
│   ├── screens/       # Screen tests
│   └── systems/       # System integration tests
└── e2e/              # End-to-end tests
```

### Writing Tests
```typescript
// Unit test example
describe('Math Utilities', () => {
  describe('clamp function', () => {
    test('returns value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    test('clamps to minimum', () => {
      expect(clamp(-1, 0, 10)).toBe(0);
    });

    test('clamps to maximum', () => {
      expect(clamp(11, 0, 10)).toBe(10);
    });
  });
});

// Component test example
describe('Button Component', () => {
  test('renders correctly', () => {
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

### Test Coverage Requirements
- **Minimum coverage**: 80% overall
- **Critical systems**: 90%+ (collision, game state, movement)
- **New features**: Must include tests
- **Bug fixes**: Include regression tests

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/unit/math.test.ts
```

## Pull Request Process

### Before Submitting a PR
1. **Ensure tests pass**:
   ```bash
   npm test
   ```

2. **Check code style**:
   ```bash
   npx eslint src/
   npx tsc --noEmit
   ```

3. **Update documentation** if needed
4. **Add/update tests** for new functionality
5. **Squash commits** into logical units

### PR Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass
- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Tested on Web

## Checklist
- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] No new warnings/errors
- [ ] Performance impact considered
- [ ] Backward compatible

## Screenshots/Videos
If applicable, add screenshots or screen recordings

## Related Issues
Fixes #123, Related to #456
```

### PR Review Process
1. **Automated checks** must pass
2. **Code review** by at least one maintainer
3. **Address feedback** and update PR
4. **Squash and merge** after approval

### PR Size Guidelines
- **Small PRs**: < 300 lines changed (preferred)
- **Medium PRs**: 300-1000 lines changed
- **Large PRs**: > 1000 lines (requires discussion)

## Documentation

### Updating Documentation
- **README.md**: Project overview and quick start
- **PROJECT.md**: Detailed project status and roadmap
- **docs/**: Technical documentation
- **JSDoc comments**: For public APIs

### Documentation Standards
```typescript
/**
 * Calculates the Euclidean distance between two points.
 *
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns The distance between the points
 *
 * @example
 * ```typescript
 * const dist = distance(0, 0, 3, 4); // 5
 * ```
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
```

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
1. **Update version** in `package.json`
2. **Update CHANGELOG.md** (if maintained)
3. **Run full test suite**
4. **Build for all platforms**
5. **Test release builds**
6. **Create git tag**
7. **Merge to main**
8. **Deploy to stores** (if applicable)

### Hotfix Process
1. **Create hotfix branch** from `main`
2. **Fix the critical issue**
3. **Test thoroughly**
4. **Merge to main** and `develop`
5. **Create patch release**

## Performance Considerations

### Mobile Optimization
- **60fps target**: All gameplay must target 60fps
- **Memory limits**: < 200MB peak usage
- **Battery impact**: Minimize CPU/GPU usage
- **Load times**: < 3 seconds to gameplay

### Performance Testing
```bash
# Profile performance
npm run android -- --profile

# Monitor memory usage
adb shell dumpsys meminfo com.space.shooter

# Check frame rate
adb shell dumpsys gfxinfo com.space.shooter
```

## Asset Guidelines

### Image Assets
- **Format**: PNG with transparency
- **Resolution**: Multiple densities (1x, 2x, 3x)
- **Optimization**: Compress with tools like ImageOptim
- **Sprite sheets**: Combine related sprites

### Audio Assets
- **Music**: MP3, 128kbps
- **Sound effects**: WAV, 44.1kHz
- **Optimization**: Trim silence, normalize volume

### Font Assets
- **Format**: TTF or OTF
- **Licensing**: Ensure commercial use rights
- **Optimization**: Subset fonts if possible

## Troubleshooting

### Common Issues
1. **Build failures**: Clear cache and reinstall dependencies
2. **Test failures**: Check mock implementations
3. **Performance issues**: Use PerformanceMonitor utility
4. **Platform-specific bugs**: Test on target platform

### Getting Help
- **Check existing documentation**
- **Search closed issues**
- **Ask in PR comments**
- **Create a new issue** with detailed information

## Recognition
Contributors will be recognized in:
- **README.md** contributors section
- **Release notes**
- **Project documentation**

## License
By contributing, you agree that your contributions will be licensed under the project's license.

---

*Last Updated: 2026-02-13*
*Contributing Guidelines Version: 1.0*

Thank you for contributing to Space Shooter Mobile Game! 🚀