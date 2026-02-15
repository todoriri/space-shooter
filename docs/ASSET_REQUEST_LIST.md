# Asset Request List - Space Shooter Mobile Game

**Generated:** 2026-02-15
**Priority:** Phase 5 - Visual & Audio Polish

---

## Overview

This document lists all assets needed to complete the visual and audio improvements for the Space Shooter game. Assets are organized by type and priority.

---

## 1. Image Assets Needed from User

### 1.1 Player Ship (High Priority)

| Asset Name | Size | Format | Description |
|------------|------|--------|-------------|
| `player_ship.png` | 128x128px | PNG-24 | Main player ship (top-down view) |
| `player_ship_damaged_50.png` | 128x128px | PNG-24 | Player at 50% health |
| `player_ship_damaged_25.png` | 128x128px | PNG-24 | Player at 25% health |
| `player_engine_1.png` | 32x32px | PNG-24 | Engine flame frame 1 |
| `player_engine_2.png` | 32x32px | PNG-24 | Engine flame frame 2 |
| `player_engine_3.png` | 32x32px | PNG-24 | Engine flame frame 3 |
| `player_shield.png` | 64x64px | PNG-24 | Shield bubble effect |

**Style Notes:**
- Teal (#00BCD4) base color with cyan highlights
- Futuristic, sleek design
- Visible cockpit window
- Animated engine exhaust at rear

### 1.2 Enemy Ships (High Priority)

| Asset Name | Size | Format | Color Theme |
|------------|------|--------|-------------|
| `enemy_basic.png` | 64x64px | PNG-24 | Crimson Red (#E53935) |
| `enemy_diving.png` | 72x72px | PNG-24 | Purple (#9C27B0) |
| `enemy_shooting.png` | 64x64px | PNG-24 | Green (#4CAF50) |
| `enemy_hover.png` | 72x72px | PNG-24 | Orange (#FF9800) |
| `enemy_boss.png` | 200x200px | PNG-24 | Dark Red/Gold multi-color |
| `enemy_boss_phase2.png` | 200x200px | PNG-24 | Boss damaged state |
| `enemy_boss_phase3.png` | 200x200px | PNG-24 | Boss critical state |

**Enemy Descriptions:**
- **Basic:** Small triangle, cannon fodder, simple design
- **Diving:** Swept-back wings, fast interceptor look
- **Shooting:** Wide body with visible gun ports
- **Hover:** Circular saucer with rotating elements
- **Boss:** Large, multi-part, intimidating presence

### 1.3 Bullets/Projectiles (Medium Priority)

| Asset Name | Size | Format | Color |
|------------|------|--------|-------|
| `bullet_player_l1.png` | 16x32px | PNG-24 | Cyan (#00E5FF) |
| `bullet_player_l2.png` | 16x32px | PNG-24 | Cyan with white core |
| `bullet_player_l3.png` | 16x32px | PNG-24 | Cyan spread shot |
| `bullet_enemy.png` | 16x32px | PNG-24 | Red (#FF1744) |
| `bullet_trail.png` | 8x16px | PNG-24 | Semi-transparent |

### 1.4 Power-Ups (Medium Priority)

| Asset Name | Size | Format | Color | Icon |
|------------|------|--------|-------|------|
| `powerup_shield.png` | 64x64px | PNG-24 | Blue | Hexagon |
| `powerup_rapid.png` | 64x64px | PNG-24 | Yellow | Lightning bolt |
| `powerup_multi.png` | 64x64px | PNG-24 | Green | Three arrows |
| `powerup_bomb.png` | 64x64px | PNG-24 | Red | Explosion icon |
| `powerup_health.png` | 64x64px | PNG-24 | Pink | Heart/plus sign |
| `powerup_score.png` | 64x64px | PNG-24 | Gold | Star |

**Style:** Glowing orbs with embedded icons, pulsing animation

### 1.5 Effects (Medium Priority)

| Asset Name | Size | Format | Frames | Description |
|------------|------|--------|--------|-------------|
| `explosion_small.png` | 320x64px | PNG-24 | 5x1 | Small explosion strip |
| `explosion_medium.png` | 384x128px | PNG-24 | 6x2 | Medium explosion strip |
| `explosion_large.png` | 512x256px | PNG-24 | 8x4 | Large explosion strip |
| `explosion_boss.png` | 640x320px | PNG-24 | 10x5 | Boss death explosion |
| `hit_effect.png` | 64x64px | PNG-24 | 4 frames | Hit spark |
| `engine_trail.png` | 16x64px | PNG-24 | - | Engine trail particle |

### 1.6 UI Elements (Low Priority)

| Asset Name | Size | Format | Description |
|------------|------|--------|-------------|
| `wave_banner.png` | 400x80px | PNG-24 | Wave transition banner |
| `boss_warning.png` | 400x100px | PNG-24 | Boss warning overlay |
| `game_over_overlay.png` | 400x200px | PNG-24 | Game over graphic |
| `health_icon.png` | 32x32px | PNG-24 | Health heart icon |
| `bomb_icon.png` | 32x32px | PNG-24 | Bomb counter icon |
| `pause_overlay.png` | 400x600px | PNG-24 | Pause menu background |

### 1.7 Background (Low Priority)

| Asset Name | Size | Format | Description |
|------------|------|--------|-------------|
| `stars_far.png` | 400x800px | PNG-8 | Distant stars (30% opacity) |
| `stars_mid.png` | 400x800px | PNG-8 | Medium stars (60% opacity) |
| `stars_near.png` | 400x800px | PNG-8 | Close stars (100% opacity) |
| `nebula_purple.png` | 400x400px | PNG-24 | Purple nebula cloud |
| `nebula_blue.png` | 300x300px | PNG-24 | Blue nebula cloud |

---

## 2. Sound Assets - Star Trek Sounds Mapping

The following sounds from `/mnt/data1/Projects/scrape_star_trek_sounds/` can be used:

### 2.1 Weapon Sounds (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Player Shoot (L1) | `tng_phaser2_clean.mp3` | ~0.5s | Clean phaser burst |
| Player Shoot (L2) | `tng_phaser3_clean.mp3` | ~0.5s | Slightly different |
| Player Shoot (L3) | `tng_phaser5_clean.mp3` | ~0.5s | Stronger sound |
| Enemy Shoot | `klingon_weapon_clean.mp3` | ~0.5s | Distinct from player |
| Bomb Activation | `quantumtorpedoes.mp3` | ~1.0s | Powerful explosion |
| Boss Weapon | `tng_torpedo_clean.mp3` | ~1.0s | Heavy weapon |

### 2.2 Explosion Sounds (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Small Explosion | `smallexplosion1.mp3` | ~0.5s | Enemy destroyed |
| Medium Explosion | `largeexplosion2.mp3` | ~1.0s | Larger enemy |
| Large Explosion | `largeexplosion1.mp3` | ~1.5s | Boss phase |
| Boss Death | `largeexplosion3.mp3` | ~2.0s | Epic destruction |
| Player Death | `selfdestructsequenceinitiatedwarpcorebreach_ep.mp3` | ~2.0s | Dramatic |

### 2.3 Hit/Damage Sounds (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Player Hit | `tos_hullhit_1.mp3` | ~0.3s | Hull impact |
| Enemy Hit | `shield_sizzle.mp3` | ~0.3s | Shield hit |
| Shield Hit | `force_field_hit.mp3` | ~0.3s | Shield impact |
| Critical Hit | `tos_hullhit_3.mp3` | ~0.4s | Heavy damage |

### 2.4 Alert/UI Sounds (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Alert/Warning | `alert01.mp3` | ~0.5s | General alert |
| Boss Warning | `alertklaxon_clean.mp3` | ~1.0s | Boss incoming |
| Power-Up Collect | `computerbeep_1.mp3` | ~0.2s | Quick beep |
| Wave Complete | `computer_activate.mp3` | ~0.5s | Success sound |
| Game Over | `tos_red_alert_engineering.mp3` | ~1.0s | Red alert |
| Button Press | `computerbeep_10.mp3` | ~0.1s | UI click |

### 2.5 Ambient/Background (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Menu Background | `tng_engineering_hum.mp3` | Loop | Engine hum |
| Game Ambient | `tng_engine_1.mp3` | Loop | Subtle engine |
| Warp Effect | `tng_warp_flash.mp3` | ~0.5s | Speed boost |

### 2.6 Power-Up Sounds (Recommended)

| Game Event | Star Trek Sound | Duration | Notes |
|------------|-----------------|----------|-------|
| Shield Power-Up | `power_up1_clean.mp3` | ~0.5s | Power up |
| Rapid Fire | `power_up2_clean.mp3` | ~0.5s | Energy burst |
| Multi-Shot | `tng_phaser_adjust.mp3` | ~0.3s | Weapon config |
| Health | `power_up3.mp3` | ~0.5s | Healing sound |
| Score Bonus | `computerbeep_21.mp3` | ~0.2s | Positive beep |

---

## 3. Testing Needs

### 3.1 Visual Testing Checklist

- [ ] All sprites render correctly at 1x, 2x, 3x densities
- [ ] Animations play smoothly at 60 FPS
- [ ] Transparency/alpha blending works correctly
- [ ] Color consistency across all assets
- [ ] No visual artifacts or edge bleeding
- [ ] Proper centering in entity bounds

### 3.2 Audio Testing Checklist

- [ ] All sounds play without distortion
- [ ] Volume levels are balanced
- [ ] No audio clipping
- [ ] Sounds don't overlap unpleasantly
- [ ] Background music loops seamlessly
- [ ] Audio works on both iOS and Android

### 3.3 Performance Testing

- [ ] Asset loading time < 3 seconds
- [ ] Memory usage with all assets < 200MB
- [ ] No frame drops during animation playback
- [ ] Sprite sheets reduce draw calls
- [ ] Audio doesn't cause frame stutters

---

## 4. File Structure for New Assets

```
assets/
├── images/
│   ├── game/
│   │   ├── player/
│   │   │   ├── player_ship.png
│   │   │   ├── player_ship_damaged_50.png
│   │   │   ├── player_ship_damaged_25.png
│   │   │   ├── player_engine_1.png
│   │   │   ├── player_engine_2.png
│   │   │   ├── player_engine_3.png
│   │   │   └── player_shield.png
│   │   ├── enemies/
│   │   │   ├── enemy_basic.png
│   │   │   ├── enemy_diving.png
│   │   │   ├── enemy_shooting.png
│   │   │   ├── enemy_hover.png
│   │   │   ├── enemy_boss.png
│   │   │   ├── enemy_boss_phase2.png
│   │   │   └── enemy_boss_phase3.png
│   │   ├── bullets/
│   │   │   ├── bullet_player_l1.png
│   │   │   ├── bullet_player_l2.png
│   │   │   ├── bullet_player_l3.png
│   │   │   ├── bullet_enemy.png
│   │   │   └── bullet_trail.png
│   │   ├── powerups/
│   │   │   ├── powerup_shield.png
│   │   │   ├── powerup_rapid.png
│   │   │   ├── powerup_multi.png
│   │   │   ├── powerup_bomb.png
│   │   │   ├── powerup_health.png
│   │   │   └── powerup_score.png
│   │   ├── effects/
│   │   │   ├── explosion_small.png
│   │   │   ├── explosion_medium.png
│   │   │   ├── explosion_large.png
│   │   │   ├── explosion_boss.png
│   │   │   ├── hit_effect.png
│   │   │   └── engine_trail.png
│   │   └── background/
│   │       ├── stars_far.png
│   │       ├── stars_mid.png
│   │       ├── stars_near.png
│   │       ├── nebula_purple.png
│   │       └── nebula_blue.png
│   └── ui/
│       ├── wave_banner.png
│       ├── boss_warning.png
│       ├── game_over_overlay.png
│       ├── health_icon.png
│       ├── bomb_icon.png
│       └── pause_overlay.png
├── sounds/
│   ├── sfx/
│   │   ├── shoot_player.mp3
│   │   ├── shoot_enemy.mp3
│   │   ├── explosion_small.mp3
│   │   ├── explosion_medium.mp3
│   │   ├── explosion_large.mp3
│   │   ├── hit_player.mp3
│   │   ├── hit_enemy.mp3
│   │   ├── powerup_collect.mp3
│   │   ├── alert.mp3
│   │   └── boss_warning.mp3
│   └── music/
│       ├── bgm_menu.mp3
│       └── bgm_game.mp3
└── spritesheets/
    ├── player_spritesheet.png
    ├── enemies_spritesheet.png
    ├── bullets_spritesheet.png
    ├── powerups_spritesheet.png
    ├── effects_spritesheet.png
    └── ui_spritesheet.png
```

---

## 5. Implementation Commands

### Copy Star Trek Sounds to Project

```bash
# Weapon sounds
cp /mnt/data1/Projects/scrape_star_trek_sounds/tng_phaser2_clean.mp3 assets/sounds/sfx/shoot_player.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/klingon_weapon_clean.mp3 assets/sounds/sfx/shoot_enemy.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/quantumtorpedoes.mp3 assets/sounds/sfx/bomb_activate.mp3

# Explosion sounds
cp /mnt/data1/Projects/scrape_star_trek_sounds/smallexplosion1.mp3 assets/sounds/sfx/explosion_small.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/largeexplosion2.mp3 assets/sounds/sfx/explosion_medium.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/largeexplosion1.mp3 assets/sounds/sfx/explosion_large.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/largeexplosion3.mp3 assets/sounds/sfx/explosion_boss.mp3

# Hit sounds
cp /mnt/data1/Projects/scrape_star_trek_sounds/tos_hullhit_1.mp3 assets/sounds/sfx/hit_player.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/shield_sizzle.mp3 assets/sounds/sfx/hit_enemy.mp3

# UI sounds
cp /mnt/data1/Projects/scrape_star_trek_sounds/alert01.mp3 assets/sounds/sfx/alert.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/alertklaxon_clean.mp3 assets/sounds/sfx/boss_warning.mp3
cp /mnt/data1/Projects/scrape_star_trek_sounds/computerbeep_1.mp3 assets/sounds/sfx/powerup_collect.mp3
```

---

## 6. Priority Summary

| Priority | Category | Assets Needed | Estimated Size |
|----------|----------|---------------|----------------|
| **P1** | Player + Enemies | 12 images | ~500KB |
| **P2** | Bullets + Power-Ups | 11 images | ~300KB |
| **P2** | Sound Effects | 15 sounds | ~2MB (from ST) |
| **P3** | Effects | 6 sprite sheets | ~400KB |
| **P3** | UI Elements | 6 images | ~200KB |
| **P3** | Background | 5 images | ~300KB |

**Total Estimated Asset Size:** ~3.7MB

---

*Document Version: 1.0*
*Last Updated: 2026-02-15*
