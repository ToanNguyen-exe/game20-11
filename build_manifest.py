import json
import os

manifest = {
    # Player
    "player_idle": "21466470-ba04-4a9a-8dcf-f968ff7f561d_062.png",
    "player_run": "21466470-ba04-4a9a-8dcf-f968ff7f561d_063.png",
    "player_jump": "21466470-ba04-4a9a-8dcf-f968ff7f561d_064.png",
    "player_fall": "21466470-ba04-4a9a-8dcf-f968ff7f561d_065.png",
    "player_hurt": "21466470-ba04-4a9a-8dcf-f968ff7f561d_066.png",
    "player_die": "21466470-ba04-4a9a-8dcf-f968ff7f561d_078.png",
    "player_attack": "21466470-ba04-4a9a-8dcf-f968ff7f561d_097.png",
    "player_shoot": "21466470-ba04-4a9a-8dcf-f968ff7f561d_098.png",
    "player_slide": "21466470-ba04-4a9a-8dcf-f968ff7f561d_100.png",

    # Blocks
    "block_grass": "21466470-ba04-4a9a-8dcf-f968ff7f561d_168.png",
    "block_dirt_grass": "21466470-ba04-4a9a-8dcf-f968ff7f561d_169.png",
    "block_dirt": "21466470-ba04-4a9a-8dcf-f968ff7f561d_170.png",
    "block_stone": "21466470-ba04-4a9a-8dcf-f968ff7f561d_171.png",
    "block_ice": "21466470-ba04-4a9a-8dcf-f968ff7f561d_172.png",
    "block_brick": "21466470-ba04-4a9a-8dcf-f968ff7f561d_173.png",
    "block_question": "21466470-ba04-4a9a-8dcf-f968ff7f561d_002.png",
    "block_exclamation": "21466470-ba04-4a9a-8dcf-f968ff7f561d_005.png",
    "block_coin_box": "21466470-ba04-4a9a-8dcf-f968ff7f561d_007.png",
    "pipe_green": "21466470-ba04-4a9a-8dcf-f968ff7f561d_175.png",
    "block_wood_crate": "21466470-ba04-4a9a-8dcf-f968ff7f561d_180.png",
    "block_wood_plank": "21466470-ba04-4a9a-8dcf-f968ff7f561d_181.png",
    "block_lava": "21466470-ba04-4a9a-8dcf-f968ff7f561d_046.png",
    "block_fire": "21466470-ba04-4a9a-8dcf-f968ff7f561d_047.png",
    "ladder": "21466470-ba04-4a9a-8dcf-f968ff7f561d_072.png",

    # Items & Buffs
    "item_coin": "21466470-ba04-4a9a-8dcf-f968ff7f561d_011.png",
    "item_star": "21466470-ba04-4a9a-8dcf-f968ff7f561d_012.png",
    "item_diamond": "21466470-ba04-4a9a-8dcf-f968ff7f561d_014.png",
    "item_heart": "21466470-ba04-4a9a-8dcf-f968ff7f561d_016.png",
    "item_heart_container": "21466470-ba04-4a9a-8dcf-f968ff7f561d_018.png",
    "item_mushroom": "21466470-ba04-4a9a-8dcf-f968ff7f561d_020.png",
    "item_flower": "21466470-ba04-4a9a-8dcf-f968ff7f561d_022.png",
    "item_code_scroll": "21466470-ba04-4a9a-8dcf-f968ff7f561d_009.png",
    "item_code_book": "21466470-ba04-4a9a-8dcf-f968ff7f561d_013.png",
    "item_potion": "21466470-ba04-4a9a-8dcf-f968ff7f561d_015.png",
    "item_key": "21466470-ba04-4a9a-8dcf-f968ff7f561d_017.png",
    "item_checkpoint": "21466470-ba04-4a9a-8dcf-f968ff7f561d_019.png",
    "item_shield": "21466470-ba04-4a9a-8dcf-f968ff7f561d_041.png",
    "item_boots": "21466470-ba04-4a9a-8dcf-f968ff7f561d_042.png",
    "item_magnet": "21466470-ba04-4a9a-8dcf-f968ff7f561d_043.png",
    "item_clock": "21466470-ba04-4a9a-8dcf-f968ff7f561d_044.png",
    "item_star_2x": "21466470-ba04-4a9a-8dcf-f968ff7f561d_039.png",
    "item_orb": "21466470-ba04-4a9a-8dcf-f968ff7f561d_052.png",

    # Enemies
    "enemy_goomba": "21466470-ba04-4a9a-8dcf-f968ff7f561d_025.png",
    "enemy_red_bug": "21466470-ba04-4a9a-8dcf-f968ff7f561d_027.png",
    "enemy_turtle": "21466470-ba04-4a9a-8dcf-f968ff7f561d_028.png",
    "enemy_spiny": "21466470-ba04-4a9a-8dcf-f968ff7f561d_030.png",
    "enemy_ghost": "21466470-ba04-4a9a-8dcf-f968ff7f561d_032.png",
    "enemy_bat": "21466470-ba04-4a9a-8dcf-f968ff7f561d_024.png",
    "enemy_crab": "21466470-ba04-4a9a-8dcf-f968ff7f561d_026.png",
    "enemy_piranha": "21466470-ba04-4a9a-8dcf-f968ff7f561d_029.png",
    "enemy_mage": "21466470-ba04-4a9a-8dcf-f968ff7f561d_031.png",
    "enemy_spike_ball": "21466470-ba04-4a9a-8dcf-f968ff7f561d_033.png",
    "enemy_slime_green": "21466470-ba04-4a9a-8dcf-f968ff7f561d_054.png",
    "enemy_slime_purple": "21466470-ba04-4a9a-8dcf-f968ff7f561d_055.png",
    "enemy_skeleton": "21466470-ba04-4a9a-8dcf-f968ff7f561d_056.png",
    "enemy_fish": "21466470-ba04-4a9a-8dcf-f968ff7f561d_057.png",
    "enemy_thwomp": "21466470-ba04-4a9a-8dcf-f968ff7f561d_058.png",

    # Props & Goals
    "prop_flag": "21466470-ba04-4a9a-8dcf-f968ff7f561d_085.png",
    "prop_door_wood": "21466470-ba04-4a9a-8dcf-f968ff7f561d_086.png",
    "prop_door_locked": "21466470-ba04-4a9a-8dcf-f968ff7f561d_087.png",
    "prop_portal": "21466470-ba04-4a9a-8dcf-f968ff7f561d_088.png",
    "prop_chest": "21466470-ba04-4a9a-8dcf-f968ff7f561d_089.png",
    "prop_tree": "21466470-ba04-4a9a-8dcf-f968ff7f561d_102.png",
    "prop_bush": "21466470-ba04-4a9a-8dcf-f968ff7f561d_106.png",
    "prop_flower": "21466470-ba04-4a9a-8dcf-f968ff7f561d_107.png",
    "prop_cactus": "21466470-ba04-4a9a-8dcf-f968ff7f561d_108.png",
    "prop_fence": "21466470-ba04-4a9a-8dcf-f968ff7f561d_109.png",
    "prop_sign": "21466470-ba04-4a9a-8dcf-f968ff7f561d_071.png",
    "prop_crate": "21466470-ba04-4a9a-8dcf-f968ff7f561d_068.png",
    "prop_barrel": "21466470-ba04-4a9a-8dcf-f968ff7f561d_069.png",
    "prop_tnt": "21466470-ba04-4a9a-8dcf-f968ff7f561d_070.png",

    # Triggers & Platforms
    "trigger_platform": "21466470-ba04-4a9a-8dcf-f968ff7f561d_075.png",
    "trigger_spring": "21466470-ba04-4a9a-8dcf-f968ff7f561d_076.png",
    "trigger_btn_red": "21466470-ba04-4a9a-8dcf-f968ff7f561d_077.png",
    "trigger_platform_gold": "21466470-ba04-4a9a-8dcf-f968ff7f561d_104.png",
    "trigger_saw": "21466470-ba04-4a9a-8dcf-f968ff7f561d_105.png",
    "trigger_spikes": "21466470-ba04-4a9a-8dcf-f968ff7f561d_106.png",

    # Effects & Projectiles
    "effect_bullet": "21466470-ba04-4a9a-8dcf-f968ff7f561d_161.png",
    "effect_portal": "21466470-ba04-4a9a-8dcf-f968ff7f561d_187.png",
    "effect_blast": "21466470-ba04-4a9a-8dcf-f968ff7f561d_186.png",
    "effect_sparkle": "21466470-ba04-4a9a-8dcf-f968ff7f561d_111.png",

    # UI & Misc
    "trophy": "21466470-ba04-4a9a-8dcf-f968ff7f561d_130.png",
    "medal": "21466470-ba04-4a9a-8dcf-f968ff7f561d_131.png",
    "crown": "21466470-ba04-4a9a-8dcf-f968ff7f561d_190.png",
    "flag_vn": "21466470-ba04-4a9a-8dcf-f968ff7f561d_149.png",
    "ui_avatar": "21466470-ba04-4a9a-8dcf-f968ff7f561d_101.png",
    "ui_bubble": "21466470-ba04-4a9a-8dcf-f968ff7f561d_166.png"
}

out_path = r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\assets\manifest.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

print(f"Created manifest.json with {len(manifest)} mapped sprites!")
