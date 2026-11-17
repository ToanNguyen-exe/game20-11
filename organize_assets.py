import os
import json
import shutil
from PIL import Image

# Source slices directory
SLICE_DIR = r'C:\Users\mcmap\Downloads\gameforde'
DEST_ROOT = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\sprites'

# Load original slices.json
with open(os.path.join(SLICE_DIR, 'slices.json'), encoding='utf-8') as f:
    slices_data = json.load(f)

slice_lookup = {s['name']: s for s in slices_data['slices']}

# Categorized Mapping Definition
CATEGORIES = {
    "player": {
        "player_idle": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_062.png", "Player standing/idle frame"),
        "player_run": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_063.png", "Player running frame 1"),
        "player_run_2": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_062.png", "Player running frame 2 (alternate)"),
        "player_jump": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_064.png", "Player jump ascending"),
        "player_fall": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_065.png", "Player falling descending"),
        "player_hurt": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_066.png", "Player hurt/taking damage"),
        "player_die": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_078.png", "Player defeated/die frame"),
        "player_attack": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_097.png", "Player melee/spell attack"),
        "player_shoot": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_098.png", "Player code projectile shoot"),
        "player_slide": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_100.png", "Player slide/crouch")
    },
    "enemies": {
        "enemy_goomba": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_025.png", "Brown mushroom walker (Goomba)"),
        "enemy_red_bug": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_027.png", "Red angry bug beetle"),
        "enemy_turtle": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_028.png", "Green shelled turtle (Koopa)"),
        "enemy_spiny": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_030.png", "Spiny purple beetle with spikes"),
        "enemy_ghost": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_032.png", "Floating white ghost (Boo)"),
        "enemy_bat": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_024.png", "Flying purple bat"),
        "enemy_crab": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_026.png", "Red crawling crab"),
        "enemy_piranha": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_029.png", "Piranha plant in pipe"),
        "enemy_mage": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_031.png", "Dark wizard mage with staff"),
        "enemy_spike_ball": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_033.png", "Floating spike iron ball"),
        "enemy_slime_green": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_054.png", "Bouncing green slime"),
        "enemy_slime_purple": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_055.png", "Bouncing purple slime"),
        "enemy_skeleton": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_056.png", "Walking bone skeleton"),
        "enemy_fish": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_057.png", "Leaping red cheep-cheep fish"),
        "enemy_thwomp": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_058.png", "Crushing stone thwomp block")
    },
    "buffs": {
        "buff_shield": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_041.png", "Invulnerability shield buff"),
        "buff_boots": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_042.png", "Speed boots buff"),
        "buff_star": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_012.png", "Super star invincibility buff"),
        "buff_star_2x": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_039.png", "2X multiplier star buff"),
        "buff_heart": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_016.png", "Health recovery heart"),
        "buff_heart_container": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_018.png", "Max health container upgrade"),
        "buff_mushroom": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_020.png", "Super growth red mushroom"),
        "buff_flower": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_022.png", "Fire flower shooting buff"),
        "buff_potion": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_015.png", "Magic energy mana potion"),
        "buff_magnet": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_043.png", "Coin magnet buff"),
        "buff_clock": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_044.png", "Time slow clock buff")
    },
    "items": {
        "item_coin": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_011.png", "Gold collectible coin"),
        "item_diamond": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_014.png", "Blue diamond gem"),
        "item_key": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_017.png", "Golden castle door key"),
        "item_code_scroll": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_009.png", "Ancient code scroll parchment"),
        "item_code_book": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_013.png", "Clean Code programming book"),
        "item_checkpoint": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_019.png", "Checkered checkpoint flag"),
        "item_orb": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_052.png", "Mystic glowing skill orb")
    },
    "tiles": {
        "grass": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_168.png", "Green surface grass tile"),
        "dirt": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_170.png", "Underground dirt block"),
        "dirt_grass": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_169.png", "Dirt with grass edge block"),
        "stone": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_171.png", "Dungeon castle grey stone block"),
        "ice": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_172.png", "Slippery blue ice block"),
        "brick": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_173.png", "Breakable brown brick block"),
        "question_block": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_002.png", "Yellow question prize block"),
        "exclamation_block": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_005.png", "Red exclamation trigger block"),
        "coin_box": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_007.png", "Gold coin vault block"),
        "wood_crate": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_006.png", "Wooden storage crate block"),
        "wood_plank": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_008.png", "Wooden bridge plank block"),
        "metal_block": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_004.png", "Solid metal riveted block"),
        "pipe_green": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_174.png", "Green warp pipe entrance"),
        "pipe_red": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_003.png", "Red high-pressure warp pipe"),
        "ladder": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_072.png", "Climbable wooden ladder"),
        "lava": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_046.png", "Dangerous glowing red lava surface"),
        "fire": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_047.png", "Underground magma fire block")
    },
    "objects": {
        "prop_flag": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_085.png", "Stage finish flagpole banner"),
        "prop_door_wood": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_086.png", "Dungeon wooden stage exit door"),
        "prop_door_locked": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_087.png", "Locked castle iron door"),
        "prop_portal": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_088.png", "Mystic teleportation vortex portal"),
        "prop_chest": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_089.png", "Gold graduation treasure chest"),
        "prop_tree": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_102.png", "Green pixel art oak tree"),
        "prop_bush": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_106.png", "Green decorative grass bush"),
        "prop_flower": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_107.png", "Red countryside wild flower"),
        "prop_cactus": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_108.png", "Desert green spiked cactus"),
        "prop_fence": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_109.png", "Wooden boundary fence"),
        "prop_sign": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_071.png", "Wooden direction road sign"),
        "prop_crate": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_068.png", "Wooden prop crate"),
        "prop_barrel": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_069.png", "Wooden wine barrel prop"),
        "prop_tnt": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_070.png", "Explosive red TNT barrel")
    },
    "triggers": {
        "trigger_platform": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_075.png", "Moving silver stone platform"),
        "trigger_spring": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_076.png", "High-jump bounce spring pad"),
        "trigger_btn_red": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_077.png", "Floor push button trigger"),
        "trigger_platform_gold": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_104.png", "Floating golden cloud platform"),
        "trigger_saw": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_105.png", "Spinning mechanical buzzsaw blade"),
        "trigger_spikes": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_106.png", "Dangerous ground iron spikes")
    },
    "effects": {
        "effect_bullet": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_161.png", "Energy code energy bullet"),
        "effect_portal": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_187.png", "Swirling blue energy ring effect"),
        "effect_blast": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_186.png", "Golden blast impact burst"),
        "effect_sparkle": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_111.png", "Glittering star sparkle shine")
    },
    "ui": {
        "trophy": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_130.png", "CodeGym Champion gold trophy"),
        "medal": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_131.png", "Honor gold medal with red ribbon"),
        "crown": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_190.png", "Royal graduation crown"),
        "flag_vn": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_149.png", "National flag of Vietnam"),
        "ui_avatar": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_101.png", "Student coder character profile avatar"),
        "ui_bubble": ("21466470-ba04-4a9a-8dcf-f968ff7f561d_166.png", "Mentor advice dialog speech bubble")
    }
}

print("Categories and mapped counts:")
for cat, items in CATEGORIES.items():
    print(f"  {cat:10}: {len(items)} sprites")
