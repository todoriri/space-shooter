# Space Shooter Mobile Game - Handoff Protocol

## Purpose
This document outlines the handoff protocol for the Space Shooter mobile game project. It provides guidelines for team collaboration, code quality, deployment processes, and knowledge transfer to ensure smooth transitions between team members or phases.

## Project Overview
- **Project**: Space Shooter Mobile Game
- **Technology**: React Native Expo with TypeScript
- **Architecture**: Entity-Component-System using `react-native-game-engine`
- **Status**: Phase 1, 2 & 3 Complete, Phase 4 Ready to Start
- **Target Platforms**: Android (primary), iOS, Web
- **Current Version**: Complete game with all core systems, audio, visual effects, and wave progression

## Team Roles & Responsibilities

### Core Team Structure
1. **Game Developer** - Core gameplay, systems, entities
2. **UI/UX Developer** - Screens, components, animations
3. **Audio/Asset Developer** - Sounds, graphics, fonts
4. **QA/Testing** - Testing, performance, bug fixes
5. **DevOps** - Build, deployment, CI/CD

### Handoff Checklist
- [ ] Code review completed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Assets versioned
- [ ] Dependencies documented
- [ ] Known issues logged
- [ ] Performance benchmarks recorded

## Development Workflow

### Branching Strategy
```
main (protected)
├── develop (integration branch)
│   ├── feature/gameplay-*
│   ├── feature/ui-*
│   ├── feature/audio-*
│   └── bugfix/*
└── release/*
```

### Git Commit Convention
```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, etc.)
refactor: Code refactoring
test:     Adding or updating tests
chore:    Maintenance tasks
perf:     Performance improvements
```

### Pull Request Process
1. **Create Feature Branch** from `develop`
2. **Implement Changes** with tests
3. **Update Documentation** (PROJECT.md, code comments)
4. **Run Tests** locally
5. **Create PR** with template
6. **Code Review** by at least one team member
7. **Address Feedback** and update PR
8. **Merge to Develop** after approval
9. **Delete Feature Branch** after merge

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots/Videos
[If applicable]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console errors/warnings
- [ ] Performance impact considered

## Related Issues
Closes #<issue-number>
```

## Code Quality Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all props and state
- Avoid `any` type - use `unknown` or specific types
- Use union types for game entities
- Export types from `src/types/index.ts`

### Component Structure
```typescript
// Good example
interface PlayerShipProps {
  position: Position;
  health: number;
  shieldActive: boolean;
}

export const PlayerShip: React.FC<PlayerShipProps> = ({
  position,
  health,
  shieldActive,
}) => {
  // Component logic
};
```

### Game Systems Architecture
- Keep systems pure and testable
- Use Entity-Component-System pattern consistently
- Separate game logic from rendering
- Implement proper error boundaries

### Performance Considerations
- Use `React.memo` for expensive components
- Implement object pooling for bullets/particles
- Use spatial partitioning for collision detection
- Optimize re-renders with proper state management
- Target 60fps on mid-range Android devices

## Testing Protocol

### Test Coverage Requirements
- **Unit Tests**: 80% coverage for game logic and utilities
- **Integration Tests**: All screen flows and user interactions
- **Performance Tests**: Frame rate, memory usage, load times

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/utils/collision.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run performance tests
# (Manual testing required for frame rate monitoring)
```

### Test File Structure
```
__tests__/
├── unit/
│   ├── game/
│   │   ├── collision.test.ts
│   │   ├── spawning.test.ts
│   │   └── scoring.test.ts
│   └── utils/
│       ├── math.test.ts
│       └── storage.test.ts
├── integration/
│   ├── screens/
│   │   ├── MenuScreen.test.tsx
│   │   ├── GameScreen.test.tsx
│   │   └── GameOverScreen.test.tsx
│   └── components/
│       └── TouchControls.test.tsx
└── e2e/
    └── gameFlow.test.ts
```

## Build & Deployment

### Development Builds
```bash
# Start development server
npm start

# Android development
npm run android

# iOS development
npm run ios

# Web development
npm run web
```

### Production Builds
```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build for Web
expo export --platform web
```

### Environment Configuration
```
.env.development    # Development environment
.env.staging        # Staging environment
.env.production     # Production environment
```

### CI/CD Pipeline
1. **On PR**: Run tests, linting, type checking
2. **On Merge to Develop**: Build and deploy to staging
3. **On Release Tag**: Build and deploy to production
4. **Automated Testing**: Unit, integration, performance tests

## Asset Management

### Graphics Assets
- **Format**: SVG for vectors, PNG for raster
- **Size**: Multiple resolutions for different screen densities
- **Naming**: `player_ship.svg`, `enemy_basic.png`, `bullet_blue.png`
- **Organization**: Group by entity type in `assets/images/`

### Audio Assets
- **Format**: MP3 for music, WAV for sound effects
- **Bitrate**: 128kbps for music, 44.1kHz for SFX
- **Naming**: `shoot.mp3`, `explosion.wav`, `background_music.mp3`
- **Organization**: Group by type in `assets/sounds/`

### Font Assets
- **Format**: TTF or OTF
- **Licensing**: Ensure proper licensing for commercial use
- **Naming**: `game_font.ttf`, `ui_font.otf`
- **Organization**: Store in `assets/fonts/`

## Documentation Requirements

### Code Documentation
- JSDoc comments for all public functions
- Interface documentation for game entities
- Component prop documentation
- Game system architecture diagrams

### Project Documentation
- **PROJECT.md** - Overall project status and architecture
- **HANDOFF.md** - This handoff protocol
- **CONTRIBUTING.md** - Contribution guidelines and workflow
- **SETUP.md** - Development environment setup
- **ARCHITECTURE.md** - Detailed technical architecture
- **TESTING.md** - Testing strategy and guidelines
- **PERFORMANCE.md** - Performance optimization guide
- **DEPLOYMENT.md** - Build and deployment processes

### Knowledge Transfer
1. **Code Walkthrough** - Architecture and key systems
2. **Demo Session** - Current functionality and features
3. **Q&A Session** - Address specific questions
4. **Documentation Review** - Ensure completeness
5. **Contact Information** - Key team members and roles

## Troubleshooting Guide

### Common Issues

#### Game Performance Issues
1. **Low Frame Rate**
   - Check object pooling implementation
   - Verify spatial partitioning is working
   - Profile with React DevTools
   - Reduce particle count if necessary

2. **Memory Leaks**
   - Check entity cleanup in systems
   - Verify sound resource management
   - Monitor with Chrome DevTools

#### Build Issues
1. **Android Build Fails**
   - Check Android SDK versions
   - Verify Gradle configuration
   - Check asset file permissions

2. **iOS Build Fails**
   - Check Xcode version compatibility
   - Verify provisioning profiles
   - Check CocoaPods installation

#### Testing Issues
1. **Tests Failing After Changes**
   - Update test mocks if dependencies changed
   - Check TypeScript type compatibility
   - Verify test environment setup

### Debugging Tools
- **React Native Debugger** - For React component debugging
- **Chrome DevTools** - For JavaScript debugging
- **Android Studio Profiler** - For Android performance
- **Xcode Instruments** - For iOS performance
- **React DevTools** - For component hierarchy

## Emergency Procedures

### Critical Bug in Production
1. **Immediate Action**: Create hotfix branch from main
2. **Fix Implementation**: Minimal changes to resolve issue
3. **Testing**: Extensive testing of fix
4. **Deployment**: Emergency deployment process
5. **Communication**: Notify stakeholders

### Data Loss or Corruption
1. **Assessment**: Determine scope of data loss
2. **Recovery**: Restore from backups if available
3. **Mitigation**: Implement preventive measures
4. **Communication**: Transparent communication with users

### Security Incident
1. **Containment**: Isolate affected systems
2. **Assessment**: Determine impact and cause
3. **Remediation**: Fix security vulnerability
4. **Notification**: Follow legal and regulatory requirements

## Success Metrics

### Development Metrics
- **Code Coverage**: >80% test coverage
- **Build Success Rate**: >95% successful builds
- **Deployment Frequency**: Weekly releases
- **Bug Resolution Time**: <48 hours for critical bugs

### Performance Metrics
- **Frame Rate**: 60fps on target devices
- **Load Time**: <3 seconds initial load
- **Memory Usage**: <200MB peak usage
- **Battery Impact**: <5% per hour of gameplay

### Quality Metrics
- **Crash Rate**: <0.1% of sessions
- **User Rating**: >4.0 stars on app stores
- **Retention Rate**: >30% day 7 retention
- **Bug Reports**: <5 per 1000 users

## Contact Information

### Key Team Members
- **Project Lead**: [Name] - [Email] - [Slack/Teams]
- **Technical Lead**: [Name] - [Email] - [Slack/Teams]
- **QA Lead**: [Name] - [Email] - [Slack/Teams]

### Escalation Path
1. **Team Member** → **Technical Lead**
2. **Technical Lead** → **Project Lead**
3. **Project Lead** → **Stakeholders**

### Communication Channels
- **Daily Standups**: [Time] via [Platform]
- **Code Reviews**: GitHub PRs
- **Issue Tracking**: GitHub Issues
- **Documentation**: GitHub Wiki
- **Emergency**: [Emergency Contact Method]

## Appendix

### Glossary
- **ECS**: Entity-Component-System architecture
- **AABB**: Axis-Aligned Bounding Box (collision detection)
- **FPS**: Frames Per Second
- **SFX**: Sound Effects
- **UI**: User Interface
- **UX**: User Experience

### References
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Game Engine Documentation](https://github.com/bberak/react-native-game-engine)
- [Project Architecture Diagram](docs/architecture-diagram.png)

### Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-13 | 1.0.0 | Initial handoff protocol | Claude Code |
| 2026-02-13 | 2.0.0 | Updated with Phase 2 completion status | Claude Code |
| 2026-02-13 | 3.0.0 | Updated with Phase 3 completion status | Claude Code |
| 2026-02-15 | 4.0.0 | Code review fixes: VisualEffectsSystem, type safety, __DEV__ logs | Claude Code |

---

*This handoff protocol should be reviewed and updated regularly as the project evolves. All team members are responsible for maintaining and following these guidelines.*