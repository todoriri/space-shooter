// Loading screen component for game initialization
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  progress: number; // 0 to 1
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = 0,
  message = 'Loading Space Shooter...',
}) => {
  const percentage = Math.floor(progress * 100);

  return (
    <LinearGradient
      colors={['#0a0a2a', '#1a1a3a', '#0a0a2a']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Game Title */}
        <Text style={styles.title}>SPACE SHOOTER</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ffff" />
          <Text style={styles.loadingText}>{message}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{percentage}%</Text>
          </View>
        </View>

        {/* Loading Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Loading Tips:</Text>
          <Text style={styles.tip}>• Keep your device charged for optimal performance</Text>
          <Text style={styles.tip}>• Ensure stable internet connection for asset loading</Text>
          <Text style={styles.tip}>• Game saves automatically when paused</Text>
        </View>

        {/* Copyright/Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Space Shooter v1.0.0</Text>
          <Text style={styles.footerText}>© 2026 Mobile Game Studio</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00ffff',
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 60,
    letterSpacing: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ffff',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginTop: 30,
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
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 5,
  },
});

export default LoadingScreen;