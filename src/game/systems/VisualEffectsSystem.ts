// Visual Effects System for Entity-Component-System architecture
// Handles visual-only timers like hit flash that need to update each frame
// This system runs BEFORE the RenderingSystem to ensure visual state is up-to-date

import { GameEntity, EntityType } from '../../types';

export const VisualEffectsSystem = (
  entities: Record<string, GameEntity>,
  { time }: { time: { delta?: number; current: number } }
) => {
  const deltaTime = Math.min(time.delta || 16, 100) / 1000;

  Object.keys(entities).forEach(id => {
    const entity = entities[id];
    if (!entity.active) return;

    // Handle enemy hit flash timer
    if (entity.type === EntityType.ENEMY) {
      const enemyComp = entity.components.enemy;
      if (enemyComp?.hitFlashTimer && enemyComp.hitFlashTimer > 0) {
        // Decrement by approximate frame count (using time-based would be better but this is frame-based)
        enemyComp.hitFlashTimer -= 1;

        // Reset to 0 if it goes below 0
        if (enemyComp.hitFlashTimer < 0) {
          enemyComp.hitFlashTimer = 0;
        }
      }
    }
  });

  return entities;
};
