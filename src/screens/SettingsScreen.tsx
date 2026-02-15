import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, BackHandler, ScrollView } from 'react-native';
import { useGameState } from '../game/GameState';

import { loadGameSettings, saveGameSettings, GameSettings, DEFAULT_SETTINGS } from '../utils/storage';
import { assetManager } from '../utils/AssetManager';
import { GameAudio } from '../utils/AudioManager';

interface SettingsScreenProps {
    navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const { setDifficulty } = useGameState();

    useEffect(() => {
        loadSettings();

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
        return () => backHandler.remove();
    }, []);

    const loadSettings = async () => {
        const loadedSettings = await loadGameSettings();
        setSettings(loadedSettings);
    };

    const handleBack = () => {
        navigation.goBack();
        return true;
    };

    const updateSetting = async (key: keyof GameSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await saveGameSettings(newSettings);

        // Apply settings immediately where possible
        if (key === 'difficulty') {
            setDifficulty(value);
        }

        // Apply audio settings
        const currentSettings = { ...newSettings }; // Use the new state
        if (key === 'soundEnabled' || key === 'musicEnabled') {
            GameAudio.setGameVolumes(
                currentSettings.musicEnabled ? 1.0 : 0.0,
                currentSettings.soundEnabled ? 1.0 : 0.0,
                currentSettings.soundEnabled ? 1.0 : 0.0
            );
        }

        // Play interaction sound
        if (newSettings.soundEnabled) {
            assetManager.playSound('button_click');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SETTINGS</Text>

            <ScrollView style={styles.content}>
                {/* Audio Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AUDIO</Text>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Sound Effects</Text>
                        <Switch
                            value={settings.soundEnabled}
                            onValueChange={(val) => updateSetting('soundEnabled', val)}
                            trackColor={{ false: '#333', true: '#00aaff' }}
                            thumbColor={settings.soundEnabled ? '#fff' : '#888'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Music</Text>
                        <Switch
                            value={settings.musicEnabled}
                            onValueChange={(val) => updateSetting('musicEnabled', val)}
                            trackColor={{ false: '#333', true: '#00aaff' }}
                            thumbColor={settings.musicEnabled ? '#fff' : '#888'}
                        />
                    </View>
                </View>

                {/* Gameplay Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GAMEPLAY</Text>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Vibration</Text>
                        <Switch
                            value={settings.vibrationEnabled}
                            onValueChange={(val) => updateSetting('vibrationEnabled', val)}
                            trackColor={{ false: '#333', true: '#00aaff' }}
                            thumbColor={settings.vibrationEnabled ? '#fff' : '#888'}
                        />
                    </View>

                    <View style={styles.settingColumn}>
                        <Text style={styles.settingLabel}>Difficulty</Text>
                        <View style={styles.difficultyContainer}>
                            {(['easy', 'medium', 'hard'] as const).map((diff) => (
                                <TouchableOpacity
                                    key={diff}
                                    style={[
                                        styles.difficultyButton,
                                        settings.difficulty === diff && styles.difficultyButtonActive
                                    ]}
                                    onPress={() => updateSetting('difficulty', diff)}
                                >
                                    <Text style={[
                                        styles.difficultyText,
                                        settings.difficulty === diff && styles.difficultyTextActive
                                    ]}>
                                        {diff.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>BACK</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#00ffff',
        marginVertical: 40,
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    content: {
        width: '100%',
        maxWidth: 500,
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'rgba(20, 20, 40, 0.5)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        color: '#00aaff',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    settingColumn: {
        marginBottom: 15,
    },
    settingLabel: {
        fontSize: 16,
        color: '#fff',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#222',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    difficultyButtonActive: {
        backgroundColor: '#00aaff',
        borderColor: '#00aaff',
    },
    difficultyText: {
        color: '#888',
        fontWeight: 'bold',
        fontSize: 12,
    },
    difficultyTextActive: {
        color: '#fff',
    },
    backButton: {
        marginBottom: 30,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 30,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
