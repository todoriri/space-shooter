import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { EntityType, EnemyType, BulletType, PowerUpType } from '../../../types';
import { assetManager } from '../../../utils/AssetManager';

interface EntitySpriteProps {
    type: EntityType;
    subType?: EnemyType | BulletType | PowerUpType | string;
    width: number;
    height: number;
    color: string;
    isPlaceholder?: boolean;
}

// Helper for PowerUp icons
const getPowerUpIconStyle = (type: PowerUpType) => {
    switch (type) {
        case PowerUpType.SHIELD: return styles.shieldIcon;
        case PowerUpType.RAPID_FIRE: return styles.rapidFireIcon;
        case PowerUpType.MULTI_SHOT: return styles.multiShotIcon;
        case PowerUpType.BOMB: return styles.bombIcon;
        case PowerUpType.HEALTH: return styles.healthIcon;
        case PowerUpType.SCORE: return styles.scoreIcon;
        default: return styles.powerUpIcon;
    }
};

const EntitySpriteComponent: React.FC<EntitySpriteProps> = ({
    type,
    subType,
    width,
    height,
    color,
    isPlaceholder = false,
}) => {
    // Styles for different entity types
    const getStyle = () => {
        switch (type) {
            case EntityType.PLAYER:
                return styles.playerShipContainer; // Container now
            case EntityType.ENEMY:
                if (subType === EnemyType.BOSS) return styles.bossBody;
                return styles.enemyBody;
            case EntityType.BULLET:
                return styles.bullet;
            case EntityType.POWER_UP:
                return styles.powerUp;
            default:
                return styles.generic;
        }
    };

    const baseStyle = {
        width,
        height,
        // backgroundColor: color, // Remove background color for sprites
    };

    // Apply color only if NOT using a sprite (or as tint?)
    // For now, only player has a sprite.
    const containerStyle = [
        baseStyle,
        getStyle(),
        type !== EntityType.PLAYER ? { backgroundColor: color } : {}, // Only apply color if not player
    ];

    // Render Player Ship Sprite
    if (type === EntityType.PLAYER) {
        const shipAsset = assetManager.getAsset('player_ship');
        const glowAsset = assetManager.getAsset('engine_glow');

        // Determine source. If asset loaded, use it. Else fallback?
        // AssetManager returns LoadedAsset which has data: Asset (expo-asset)
        // We use localUri for Image source
        const shipSource = shipAsset?.loaded && shipAsset.data ? { uri: shipAsset.data.localUri || shipAsset.data.uri } : null;
        const glowSource = glowAsset?.loaded && glowAsset.data ? { uri: glowAsset.data.localUri || glowAsset.data.uri } : null;

        return (
            <View style={containerStyle}>
                {/* Engine Glow (Behind Ship) */}
                {glowSource && (
                    <Image
                        source={glowSource}
                        style={styles.engineGlowSprite}
                        resizeMode="contain"
                    />
                )}

                {/* Ship Hull */}
                {shipSource ? (
                    <Image
                        source={shipSource}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                ) : (
                    // Fallback to CSS Triangle if asset missing
                    <View style={styles.playerShip} />
                )}
            </View>
        );
    }

    return (
        <View style={containerStyle}>
            {isPlaceholder && (
                <View style={styles.placeholderIndicator}>
                    <Text style={styles.placeholderText}>P</Text>
                </View>
            )}
            {/* Additional decorations based on type */}
            {/* Additional decorations based on type */}
            {type === EntityType.POWER_UP && (
                <>
                    {/* Special case for complex shapes like Cross */}
                    {(subType === PowerUpType.HEALTH) ? (
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ position: 'absolute', width: '20%', height: '60%', backgroundColor: '#00FF00' }} />
                            <View style={{ position: 'absolute', width: '60%', height: '20%', backgroundColor: '#00FF00' }} />
                        </View>
                    ) : (subType === PowerUpType.MULTI_SHOT) ? (
                        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ position: 'absolute', width: '15%', height: '15%', borderRadius: 99, backgroundColor: '#00FFFF', top: '25%' }} />
                            <View style={{ position: 'absolute', width: '15%', height: '15%', borderRadius: 99, backgroundColor: '#00FFFF', bottom: '25%', left: '25%' }} />
                            <View style={{ position: 'absolute', width: '15%', height: '15%', borderRadius: 99, backgroundColor: '#00FFFF', bottom: '25%', right: '25%' }} />
                        </View>
                    ) : (
                        <View style={getPowerUpIconStyle(subType as PowerUpType)} />
                    )}
                </>
            )}
        </View>
    );
};

// ... existing code ...

const styles = StyleSheet.create({
    // Player
    playerShipContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        // overflow: 'visible', // Allow glow to extend?
    },
    playerShip: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 20,
        borderRightWidth: 20,
        borderBottomWidth: 40,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFFFFF',
        transform: [{ translateY: -10 }],
    },
    engineGlowSprite: {
        position: 'absolute',
        bottom: -20, // Position below ship
        width: '60%',
        height: 40,
        opacity: 0.8,
    },
    engineGlow: {
        // ... kept for fallback or validation
        position: 'absolute',
        bottom: -5,
        width: '40%',
        height: 10,
        backgroundColor: '#4FC3F7',
        borderRadius: 5,
        opacity: 0.7,
        left: '30%',
    },
    // ... rest of styles
    // Enemy
    enemyBody: {
        borderRadius: 8,
    },
    bossBody: {
        borderRadius: 20,
    },
    // Bullet
    bullet: {
        borderRadius: 999,
    },
    // PowerUp
    powerUp: {
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    powerUpIcon: {
        width: '60%',
        height: '60%',
        backgroundColor: '#FFFFFF',
    },
    shieldIcon: {
        width: '60%',
        height: '60%',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderColor: '#29B6F6',
        borderRadius: 999, // Circle
    },
    rapidFireIcon: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 16,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFD700', // Triangle
        transform: [{ translateY: -2 }],
    },
    multiShotIcon: {
        // Handled by custom render
    },
    bombIcon: {
        width: '50%',
        height: '50%',
        backgroundColor: '#FF0000',
        borderRadius: 4, // Square
    },
    healthIcon: {
        // Handled by custom render
    },
    scoreIcon: {
        width: '40%',
        height: '40%',
        backgroundColor: '#FFFF00',
        borderRadius: 999, // Coin
        borderWidth: 1,
        borderColor: '#DAA520',
    },
    // Generic
    generic: {},
    // Placeholder
    placeholderIndicator: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    placeholderText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export const EntitySprite = memo(EntitySpriteComponent, (prev, next) => {
    return (
        prev.type === next.type &&
        prev.subType === next.subType &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.color === next.color &&
        prev.isPlaceholder === next.isPlaceholder
    );
});
