import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface HealthBarProps {
    current: number;
    max: number;
    width?: number | string;
    height?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
}

const HealthBarComponent: React.FC<HealthBarProps> = ({
    current,
    max,
    width = '100%',
    height = 6,
    color = '#4CAF50',
    backgroundColor = '#333',
    borderRadius = 3,
}) => {
    const percent = Math.max(0, Math.min(100, (current / max) * 100));

    return (
        <View
            style={[
                styles.container,
                {
                    width: width as any, // Cast to avoid DimensionValue issue
                    height,
                    backgroundColor,
                    borderRadius,
                },
            ]}
        >
            <View
                style={[
                    styles.fill,
                    {
                        width: `${percent}%`,
                        backgroundColor: color,
                        borderRadius: borderRadius, // Match container radius
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
});

export const HealthBar = memo(HealthBarComponent, (prev, next) => {
    return (
        prev.current === next.current &&
        prev.max === next.max &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.color === next.color
    );
});
