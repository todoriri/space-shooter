// Jest setup file for React Native testing
// Note: @testing-library/react-native v12+ has built-in matchers, no separate import needed

// Mock React Native Animated helper (may not exist in all RN versions)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Mock react-native-sound
jest.mock('react-native-sound', () => {
  return {
    setCategory: jest.fn(),
    enableSilentMode: jest.fn(),
    enableInSilenceMode: jest.fn(),
    setIsLooping: jest.fn(),
    setVolume: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
    getDuration: jest.fn(() => 1),
    getNumberOfChannels: jest.fn(() => 1),
    getCurrentTime: jest.fn(() => 0),
  };
});

// Mock react-native-game-engine
jest.mock('react-native-game-engine', () => ({
  GameEngine: 'GameEngine',
  DefaultRenderer: 'DefaultRenderer',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-asset', () => ({}));
jest.mock('expo-font', () => ({}));
jest.mock('expo-status-bar', () => ({}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};