// Game Over screen component
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { assetManager } from '../utils/AssetManager';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  reason?: string;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  reason = 'Game Over',
  onRestart,
  onMenu,
}) => {
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  // Check for new high score
  useEffect(() => {
    const newHighScore = score > highScore;
    setIsNewHighScore(newHighScore);

    // Play sound effect
    if (newHighScore) {
      assetManager.playSound('high_score');
    } else {
      assetManager.playSound('game_over');
    }

    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle button press with sound
  const handleButtonPress = (action: () => void, soundKey: string = 'button_click') => {
    assetManager.playSound(soundKey);
    action();
  };

  // Get reason message
  const getReasonMessage = () => {
    switch (reason) {
      case 'noLives':
        return 'You ran out of lives!';
      case 'timeUp':
        return 'Time\'s up!';
      case 'bossDefeated':
        return 'Boss defeated!';
      default:
        return 'Game Over!';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/game/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(20, 0, 40, 0.9)']}
        style={styles.overlay}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Game Over Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>GAME OVER</Text>
            <View style={styles.titleUnderline} />
            <Text style={styles.reasonText}>{getReasonMessage()}</Text>
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>YOUR SCORE</Text>
              <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
            </View>

            <View style={styles.scoreDivider} />

            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>
                {isNewHighScore ? 'NEW HIGH SCORE!' : 'HIGH SCORE'}
              </Text>
              <Text style={[
                styles.scoreValue,
                isNewHighScore && styles.newHighScoreValue
              ]}>
                {Math.max(score, highScore).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* New High Score Celebration */}
          {isNewHighScore && (
            <View style={styles.highScoreCelebration}>
              <Text style={styles.highScoreCelebrationText}>🎉 NEW RECORD! 🎉</Text>
              <Text style={styles.highScoreCelebrationSubtext}>
                You beat your previous high score by {(score - highScore).toLocaleString()} points!
              </Text>
            </View>
          )}

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>GAME STATS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Accuracy</Text>
                <Text style={styles.statValue}>85%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Enemies</Text>
                <Text style={styles.statValue}>42</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>3:45</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Power-ups</Text>
                <Text style={styles.statValue}>7</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleButtonPress(onRestart, 'game_start')}
            >
              <LinearGradient
                colors={['#00ff88', '#00cc66']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>PLAY AGAIN</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleButtonPress(onMenu)}
            >
              <LinearGradient
                colors={['#666666', '#444444']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>MAIN MENU</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Share Prompt */}
          <View style={styles.shareContainer}>
            <Text style={styles.shareText}>Share your score with friends!</Text>
            <View style={styles.shareButtons}>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>📱</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>🐦</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tips for Next Game */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>TIPS FOR NEXT TIME</Text>
            <Text style={styles.tip}>• Focus on dodging enemy bullets</Text>
            <Text style={styles.tip}>• Collect power-ups when available</Text>
            <Text style={styles.tip}>• Take out shooting enemies first</Text>
            <Text style={styles.tip}>• Save bombs for crowded situations</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff5555',
    textShadowColor: 'rgba(255, 85, 85, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  titleUnderline: {
    width: 200,
    height: 4,
    backgroundColor: '#ff5555',
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 2,
  },
  reasonText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ffff',
  },
  newHighScoreValue: {
    color: '#ffdd00',
    textShadowColor: 'rgba(255, 221, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  scoreDivider: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  highScoreCelebration: {
    backgroundColor: 'rgba(255, 221, 0, 0.2)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffdd00',
    marginBottom: 20,
    alignItems: 'center',
  },
  highScoreCelebrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffdd00',
    marginBottom: 5,
  },
  highScoreCelebrationSubtext: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  button: {
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  shareContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shareText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
  },
  shareButtons: {
    flexDirection: 'row',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 50,
    marginHorizontal: 5,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 20,
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    maxWidth: 300,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
  },
  tip: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default GameOverScreen;