// Touch Controls Component for mobile game
// Provides virtual joystick and button controls for player movement and actions

import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, Animated, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TouchControlsProps {
  onMove: (direction: { x: number; y: number }) => void;
  onShoot: () => void;
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
  // Joystick state
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickBasePosition = useRef({ x: 80, y: SCREEN_HEIGHT - 120 });
  const joystickRadius = 60;
  const joystickKnobRadius = 30;

  // Shoot button state
  const shootButtonPosition = { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 100 };
  const shootButtonRadius = 40;

  // Bomb button state (if available)
  const bombButtonPosition = { x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 180 };
  const bombButtonRadius = 35;

  // Pause button state
  const pauseButtonPosition = { x: SCREEN_WIDTH - 60, y: 60 };
  const pauseButtonRadius = 25;

  // Animation values
  const shootButtonScale = useRef(new Animated.Value(1)).current;
  const bombButtonScale = useRef(new Animated.Value(1)).current;
  const pauseButtonScale = useRef(new Animated.Value(1)).current;

  // Joystick pan responder
  const joystickPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsJoystickActive(true);
        const { locationX, locationY } = evt.nativeEvent;

        // Calculate initial joystick position relative to base
        const relativeX = locationX - joystickBasePosition.current.x;
        const relativeY = locationY - joystickBasePosition.current.y;

        // Limit to joystick radius
        const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
        const limitedDistance = Math.min(distance, joystickRadius - joystickKnobRadius);

        if (distance > 0) {
          const scale = limitedDistance / distance;
          setJoystickPosition({
            x: relativeX * scale,
            y: relativeY * scale,
          });

          // Send initial movement direction
          const direction = {
            x: relativeX / distance,
            y: relativeY / distance,
          };
          onMove(direction);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;

        // Calculate new position
        let newX = joystickPosition.x + dx;
        let newY = joystickPosition.y + dy;

        // Limit to joystick radius
        const distance = Math.sqrt(newX * newX + newY * newY);
        const maxDistance = joystickRadius - joystickKnobRadius;

        if (distance > maxDistance) {
          const scale = maxDistance / distance;
          newX *= scale;
          newY *= scale;
        }

        setJoystickPosition({ x: newX, y: newY });

        // Calculate normalized direction
        const currentDistance = Math.sqrt(newX * newX + newY * newY);
        if (currentDistance > 0) {
          const direction = {
            x: newX / currentDistance,
            y: newY / currentDistance,
          };
          onMove(direction);
        }
      },
      onPanResponderRelease: () => {
        setIsJoystickActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 }); // Stop movement
      },
      onPanResponderTerminate: () => {
        setIsJoystickActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 }); // Stop movement
      },
    })
  ).current;

  // Shoot button press handler
  const handleShootPress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(shootButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shootButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onShoot();
  };

  // Bomb button press handler
  const handleBombPress = () => {
    if (!onBomb) return;

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

  // Shoot button pan responder
  const shootPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handleShootPress,
    })
  ).current;

  // Bomb button pan responder
  const bombPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handleBombPress,
    })
  ).current;

  // Pause button pan responder
  const pausePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: handlePausePress,
    })
  ).current;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Joystick for movement */}
      <View
        style={[
          styles.joystickBase,
          {
            left: joystickBasePosition.current.x - joystickRadius,
            top: joystickBasePosition.current.y - joystickRadius,
            width: joystickRadius * 2,
            height: joystickRadius * 2,
          },
        ]}
        {...joystickPanResponder.panHandlers}
      >
        {/* Joystick base circle */}
        <View style={styles.joystickBaseCircle} />

        {/* Joystick knob */}
        <View
          style={[
            styles.joystickKnob,
            {
              transform: [
                { translateX: joystickPosition.x },
                { translateY: joystickPosition.y },
              ],
              opacity: isJoystickActive ? 1 : 0.7,
            },
          ]}
        />
      </View>

      {/* Shoot button */}
      <Animated.View
        style={[
          styles.shootButton,
          {
            left: shootButtonPosition.x - shootButtonRadius,
            top: shootButtonPosition.y - shootButtonRadius,
            width: shootButtonRadius * 2,
            height: shootButtonRadius * 2,
            transform: [{ scale: shootButtonScale }],
          },
        ]}
        {...shootPanResponder.panHandlers}
      >
        <View style={styles.shootButtonInner}>
          <View style={styles.shootIcon} />
        </View>
      </Animated.View>

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

      {/* Movement area hint (visible in development) */}
      {__DEV__ && (
        <View style={styles.movementHint}>
          <View style={styles.hintTextContainer}>
            <Text style={styles.hintText}>Move</Text>
          </View>
        </View>
      )}

      {/* Shoot area hint (visible in development) */}
      {__DEV__ && (
        <View style={styles.shootHint}>
          <View style={styles.hintTextContainer}>
            <Text style={styles.hintText}>Shoot</Text>
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

  // Joystick styles
  joystickBase: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickBaseCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  joystickKnob: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(79, 195, 247, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },

  // Shoot button styles
  shootButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shootButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: 'rgba(239, 83, 80, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(239, 83, 80, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shootIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#EF5350',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFF',
  },

  // Bomb button styles
  bombButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
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
    left: 20,
    bottom: 20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  shootHint: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
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