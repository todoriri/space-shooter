// Touch Controls Component for mobile game
// Provides virtual joystick and button controls for player movement and actions

import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, Animated, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TouchControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onShoot: (isShooting: boolean) => void;
  onBomb?: () => void;
  onPause?: () => void;
  isPaused?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onShoot,
  onBomb,
  onPause,
  isPaused = false,
}) => {
  // Bomb button state (if available)
  const bombButtonPosition = { x: SCREEN_WIDTH - 80, y: SCREEN_HEIGHT - 100 };
  const bombButtonRadius = 35;

  // Pause button state
  const pauseButtonPosition = { x: SCREEN_WIDTH - 60, y: 60 };
  const pauseButtonRadius = 25;

  // Animation values
  const bombButtonScale = useRef(new Animated.Value(1)).current;
  const pauseButtonScale = useRef(new Animated.Value(1)).current;

  // Touch tracking for 1:1 movement
  const lastTouchRef = useRef({ x: 0, y: 0 });

  // Full screen pan responder for movement and auto-fire
  const screenPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        lastTouchRef.current = { x: locationX, y: locationY };

        // Start shooting immediately on touch
        if (onShoot) onShoot(true);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;

        // Calculate delta for 1:1 movement
        const dx = locationX - lastTouchRef.current.x;
        const dy = locationY - lastTouchRef.current.y;

        lastTouchRef.current = { x: locationX, y: locationY };

        // Send delta movement
        onMove({ x: dx, y: dy });
      },
      onPanResponderRelease: () => {
        // Stop shooting on release
        if (onShoot) onShoot(false);
      },
      onPanResponderTerminate: () => {
        // Stop shooting on interruption
        if (onShoot) onShoot(false);
      },
    })
  ).current;

  // Bomb button press handler
  const handleBombPress = () => {
    console.log('[TouchControls] Bomb button pressed');
    if (!onBomb) {
      console.warn('[TouchControls] onBomb prop is missing!');
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(bombButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bombButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onBomb();
  };

  // Pause button press handler
  const handlePausePress = () => {
    if (!onPause) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(pauseButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pauseButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPause();
  };

  // Bomb button pan responder
  const bombPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, // Capture touch before background
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: handleBombPress,
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: () => {
        // Optional: cancel animation if needed
      },
    })
  ).current;

  // Pause button pan responder
  const pausePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, // Capture touch before background
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: handlePausePress,
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Full screen touch area for movement */}
      <View
        style={styles.touchArea}
        {...screenPanResponder.panHandlers}
      />

      {/* Bomb button (if bomb power-up is available) */}
      {onBomb && (
        <Animated.View
          style={[
            styles.bombButton,
            {
              left: bombButtonPosition.x - bombButtonRadius,
              top: bombButtonPosition.y - bombButtonRadius,
              width: bombButtonRadius * 2,
              height: bombButtonRadius * 2,
              transform: [{ scale: bombButtonScale }],
            },
          ]}
          {...bombPanResponder.panHandlers}
        >
          <View style={styles.bombButtonInner}>
            <View style={styles.bombIcon} />
          </View>
        </Animated.View>
      )}

      {/* Pause button */}
      <Animated.View
        style={[
          styles.pauseButton,
          {
            left: pauseButtonPosition.x - pauseButtonRadius,
            top: pauseButtonPosition.y - pauseButtonRadius,
            width: pauseButtonRadius * 2,
            height: pauseButtonRadius * 2,
            transform: [{ scale: pauseButtonScale }],
          },
        ]}
        {...pausePanResponder.panHandlers}
      >
        {isPaused ? (
          <View style={styles.playIcon} />
        ) : (
          <View style={styles.pauseIcon}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        )}
      </Animated.View>

      {/* Development hints */}
      {__DEV__ && (
        <View style={styles.movementHint}>
          <View style={styles.hintTextContainer}>
            <Text style={styles.hintText}>Touch & Drag to Move/Shoot</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },

  // Touch area style
  touchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1, // Ensure it's reachable but buttons are on top
  },

  // Bomb button styles
  bombButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10, // For Android touch handling
  },
  bombButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 167, 38, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 167, 38, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bombIcon: {
    width: 25,
    height: 25,
    backgroundColor: '#FFA726',
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: '#FFF',
  },

  // Pause button styles
  pauseButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  pauseIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 20,
    height: 20,
  },
  pauseBar: {
    width: 6,
    height: 20,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: '#FFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },

  // Development hints
  movementHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  hintTextContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  hintText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
});

// Export a hook for using touch controls
export const useTouchControls = () => {
  const [movementDirection, setMovementDirection] = useState({ x: 0, y: 0 });
  const [isShooting, setIsShooting] = useState(false);
  const [isBombing, setIsBombing] = useState(false);

  const handleMove = (direction: { x: number; y: number }) => {
    setMovementDirection(direction);
  };

  const handleShoot = () => {
    setIsShooting(true);
    // Reset shooting state after a short delay
    setTimeout(() => setIsShooting(false), 100);
  };

  const handleBomb = () => {
    setIsBombing(true);
    // Reset bombing state after a short delay
    setTimeout(() => setIsBombing(false), 100);
  };

  return {
    movementDirection,
    isShooting,
    isBombing,
    handleMove,
    handleShoot,
    handleBomb,
  };
};