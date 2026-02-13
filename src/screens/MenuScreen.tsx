// Menu screen component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameState } from '../types';

interface MenuScreenProps {
  highScore: number;
  onStartGame: () => void;
  onSettings?: () => void;
  onAbout?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  highScore,
  onStartGame,
  onSettings,
  onAbout,
}) => {
  return (
    <ImageBackground
      source={require('../../assets/images/game/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.7)', 'rgba(10, 10, 42, 0.9)']}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Game Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>SPACE</Text>
            <Text style={styles.title}>SHOOTER</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* High Score Display */}
          <View style={styles.highScoreContainer}>
            <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
            <Text style={styles.highScoreValue}>{highScore.toLocaleString()}</Text>
          </View>

          {/* Menu Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={onStartGame}>
              <LinearGradient
                colors={['#00aaff', '#0088cc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>START GAME</Text>
              </LinearGradient>
            </TouchableOpacity>

            {onSettings && (
              <TouchableOpacity style={styles.button} onPress={onSettings}>
                <LinearGradient
                  colors={['#666666', '#444444']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>SETTINGS</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {onAbout && (
              <TouchableOpacity style={styles.button} onPress={onAbout}>
                <LinearGradient
                  colors={['#666666', '#444444']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.buttonText}>ABOUT</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Game Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>HOW TO PLAY</Text>
            <Text style={styles.instruction}>• Drag to move your spaceship</Text>
            <Text style={styles.instruction}>• Avoid enemy ships and bullets</Text>
            <Text style={styles.instruction}>• Shoot enemies to earn points</Text>
            <Text style={styles.instruction}>• Collect power-ups for special abilities</Text>
            <Text style={styles.instruction}>• Survive as long as possible!</Text>
          </View>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Space Shooter v1.0.0</Text>
            <Text style={styles.versionText}>Built with React Native & Expo</Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  titleUnderline: {
    width: 200,
    height: 4,
    backgroundColor: '#00ffff',
    marginTop: 10,
    borderRadius: 2,
  },
  highScoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00ffff',
    marginVertical: 20,
  },
  highScoreLabel: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 5,
    fontWeight: '600',
  },
  highScoreValue: {
    fontSize: 36,
    color: '#00ffff',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    marginVertical: 20,
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
  instructionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    width: '100%',
    maxWidth: 300,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
    lineHeight: 20,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 3,
  },
});

export default MenuScreen;