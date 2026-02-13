import os
import base64
import urllib.request

# Directories
dirs = [
    "assets/images/ui",
    "assets/images/game",
    "assets/sounds",
    "assets/fonts"
]

for d in dirs:
    os.makedirs(d, exist_ok=True)

# 1x1 Transparent PNG
png_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")

# Images to create
images = [
    "assets/images/ui/button_normal.png",
    "assets/images/ui/button_pressed.png",
    "assets/images/ui/icon_pause.png",
    "assets/images/ui/icon_sound_on.png",
    "assets/images/ui/icon_sound_off.png",
    "assets/images/game/player_ship.png",
    "assets/images/game/enemy_basic.png",
    "assets/images/game/enemy_diving.png",
    "assets/images/game/enemy_shooting.png",
    "assets/images/game/enemy_boss.png",
    "assets/images/game/bullet_player.png",
    "assets/images/game/bullet_enemy.png",
    "assets/images/game/powerup_shield.png",
    "assets/images/game/powerup_rapid.png",
    "assets/images/game/powerup_multi.png",
    "assets/images/game/powerup_bomb.png",
    "assets/images/game/background.png",
    "assets/images/game/explosion.png"
]

for img in images:
    with open(img, "wb") as f:
        f.write(png_data)
    print(f"Created {img}")

# Sounds (empty files for now, or minimal valid mp3 if possible, but empty should pass bundler)
sounds = [
    "assets/sounds/shoot_player.mp3",
    "assets/sounds/shoot_enemy.mp3",
    "assets/sounds/explosion_small.mp3",
    "assets/sounds/explosion_large.mp3",
    "assets/sounds/powerup_collect.mp3",
    "assets/sounds/player_hit.mp3",
    "assets/sounds/game_over.mp3",
    "assets/sounds/bgm_menu.mp3",
    "assets/sounds/bgm_game.mp3"
]

for sound in sounds:
    with open(sound, "wb") as f:
        f.write(b"") # Empty file
    print(f"Created {sound}")

# Fonts - Download Roboto
font_url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Regular.ttf"
fonts = [
    "assets/fonts/game_font.ttf",
    "assets/fonts/ui_font.ttf"
]

try:
    print(f"Downloading font from {font_url}...")
    urllib.request.urlretrieve(font_url, "assets/fonts/temp_font.ttf")
    with open("assets/fonts/temp_font.ttf", "rb") as f:
        font_data = f.read()
    
    for font in fonts:
        with open(font, "wb") as f:
            f.write(font_data)
        print(f"Created {font}")
    
    os.remove("assets/fonts/temp_font.ttf")
except Exception as e:
    print(f"Failed to download font: {e}")
    # Create empty file as fallback
    for font in fonts:
        with open(font, "wb") as f:
            f.write(b"")
        print(f"Created empty {font}")

print("Asset generation complete.")
