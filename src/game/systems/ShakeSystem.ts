import { GameEntity, EntityType } from '../../types';

export const ShakeSystem = (
    entities: Record<string, GameEntity>,
    { time }: { time: { current: number; delta?: number } }
) => {
    const deltaTime = Math.min(time.delta || 16, 100) / 1000;

    // Find system entity with ScreenShake component
    const systemId = Object.keys(entities).find(id => entities[id].components.screenShake);
    let systemEntity = systemId ? entities[systemId] : null;

    // Ensure system entity exists
    if (!systemEntity) {
        systemEntity = {
            id: 'system_shake',
            type: EntityType.SYSTEM,
            active: true,
            tags: ['system'],
            components: {
                screenShake: {
                    trauma: 0,
                    maxOffset: 20,
                    currentOffset: { x: 0, y: 0 }
                }
            }
        };
        entities['system_shake'] = systemEntity;
    }

    const shakeComp = systemEntity.components.screenShake;
    if (!shakeComp) return entities;

    // Linear decay of trauma
    if (shakeComp.trauma > 0) {
        shakeComp.trauma = Math.max(0, shakeComp.trauma - (0.8 * deltaTime)); // Decay factor
    }

    // Calculate shake offset based on trauma^2 (screen shake "juice" principle)
    const shake = shakeComp.trauma * shakeComp.trauma;
    if (shake > 0) {
        const angle = Math.random() * Math.PI * 2;
        const offset = shake * shakeComp.maxOffset;
        shakeComp.currentOffset = {
            x: Math.cos(angle) * offset,
            y: Math.sin(angle) * offset
        };
    } else {
        shakeComp.currentOffset = { x: 0, y: 0 };
    }

    return entities;
};
