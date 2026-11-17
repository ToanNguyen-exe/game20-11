/**
 * CODE QUEST: 3 MÀN CHƠI TRI ÂN 20/11
 * Phiên bản hoàn thiện theo chuẩn Triết lý Thiết kế Super Mario Bros:
 * - Hệ thống di chuyển: Gia tốc, quán tính, phanh trượt (Skid), lực cản không khí
 * - Nhảy biến thiên (Variable Jump Height): Giữ lâu nhảy cao, nhả sớm nhảy thấp
 * - Trọng lực 2 pha: Rơi nặng hơn bay lên (Rise Gravity vs Fall Gravity)
 * - Kỹ thuật ẩn (Game Feel): Coyote Time (0.08s) + Jump Buffering (0.1s) + Corner Correction
 * - Cơ chế Mai Rùa (Koopa Shell): Giẫm rùa hóa mai, đá mai trượt càn quét quái
 * - Game Juice: Bụi trượt chân (Skid dust), rung màn hình (Screen Shake), mảnh vỡ gạch
 * - Hệ thống Power-up 3 tầng (Small -> Super Coder -> Special)
 */

// 1. MARIO PHYSICS CONFIGURATION (CHUẨN NES BẢN GỐC & SCALE 2.5X CHO TILE 40PX)
const TILE_SIZE = 40;
const SCALE_RATIO = TILE_SIZE / 16; // 2.5x

const NES_CONFIG = {
  tile: 16,
  walk_max: 90,
  run_max: 150,
  accel_walk: 134,
  accel_run: 200,
  friction: 183,
  skid_decel: 366,
  jump_speed_slow: 240,
  jump_speed_fast: 300,
  gravity_hold_slow: 450,
  gravity_hold_fast: 563,
  gravity_fall_slow: 1575,
  gravity_fall_fast: 2025,
  max_fall_speed: 240,
  coyote_time: 0.08,
  jump_buffer: 0.1,
  invulnerable_after_hit: 2.0,
  starman_duration: 10.0,
  level_time: 600,
  time_tick_seconds: 0.4
};

const PHYSICS = {
  ACCEL: 0.12,             // Gia tốc đi bộ đầm chắc, kiểm soát dễ
  RUN_ACCEL: 0.20,         // Gia tốc chạy nhanh
  AIR_ACCEL: 0.09,         // Điều khiển trên không (Air control)
  DECEL: 0.84,             // Ma sát giảm tốc
  AIR_DECEL: 0.95,         // Lực cản không khí
  SKID_DECEL: 0.72,        // Phanh trượt đổi hướng
  MAX_WALK_SPEED: 1.85,    // Đi bộ chậm rãi, căn ô gạch chuẩn xác
  MAX_RUN_SPEED: 2.75,     // Chạy nước rút êm ái
  JUMP_SPEED_SLOW: -6.4,   // Vận tốc phóng lên êm ái (đạt đỉnh sau ~32 frames)
  JUMP_SPEED_FAST: -7.6,   // Nhảy cao khi chạy đà (vượt chướng ngại vật cao)
  RISE_GRAVITY: 0.20,      // Trọng lực bay lên nhẹ nhàng, êm dịu
  FALL_GRAVITY: 0.28,      // Trọng lực rơi êm ái, lơ lửng dễ kiểm soát
  MAX_FALL_SPEED: 4.8,     // Tốc độ rơi tối đa chậm rãi, chống rơi tụt cắm đầu
  COYOTE_TIME: Math.round(NES_CONFIG.coyote_time * 60), // 5 frames
  JUMP_BUFFER: Math.round(NES_CONFIG.jump_buffer * 60)  // 6 frames
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

// 2. SPRITE ATLAS LOADER
const SPRITE_PATHS = {
  // Player
  'player_idle': 'assets/sprites/player/player_idle.png',
  'player_run': 'assets/sprites/player/player_run.png',
  'player_jump': 'assets/sprites/player/player_jump.png',
  'player_fall': 'assets/sprites/player/player_fall.png',
  'player_hurt': 'assets/sprites/player/player_hurt.png',
  'player_die': 'assets/sprites/player/player_die.png',
  'player_attack': 'assets/sprites/player/player_attack.png',
  'player_shoot': 'assets/sprites/player/player_shoot.png',
  'player_slide': 'assets/sprites/player/player_slide.png',

  // Tiles
  'grass': 'assets/sprites/tiles/grass.png',
  'dirt': 'assets/sprites/tiles/dirt.png',
  'dirt_grass': 'assets/sprites/tiles/dirt_grass.png',
  'stone': 'assets/sprites/tiles/stone.png',
  'ice': 'assets/sprites/tiles/ice.png',
  'brick': 'assets/sprites/tiles/brick.png',
  'question_block': 'assets/sprites/tiles/question_block.png',
  'exclamation_block': 'assets/sprites/tiles/exclamation_block.png',
  'coin_box': 'assets/sprites/tiles/coin_box.png',
  'wood_crate': 'assets/sprites/tiles/wood_crate.png',
  'wood_plank': 'assets/sprites/tiles/wood_plank.png',
  'metal_block': 'assets/sprites/tiles/metal_block.png',
  'pipe_green': 'assets/sprites/tiles/pipe_green.png',
  'pipe_red': 'assets/sprites/tiles/pipe_red.png',
  'ladder': 'assets/sprites/tiles/ladder.png',
  'lava': 'assets/sprites/tiles/lava.png',
  'fire': 'assets/sprites/tiles/fire.png',

  // Enemies
  'enemy_goomba': 'assets/sprites/enemies/enemy_goomba.png',
  'enemy_red_bug': 'assets/sprites/enemies/enemy_red_bug.png',
  'enemy_turtle': 'assets/sprites/enemies/enemy_turtle.png',
  'enemy_spiny': 'assets/sprites/enemies/enemy_spiny.png',
  'enemy_ghost': 'assets/sprites/enemies/enemy_ghost.png',
  'enemy_bat': 'assets/sprites/enemies/enemy_bat.png',
  'enemy_crab': 'assets/sprites/enemies/enemy_crab.png',
  'enemy_piranha': 'assets/sprites/enemies/enemy_piranha.png',
  'enemy_mage': 'assets/sprites/enemies/enemy_mage.png',
  'enemy_spike_ball': 'assets/sprites/enemies/enemy_spike_ball.png',
  'enemy_slime_green': 'assets/sprites/enemies/enemy_slime_green.png',
  'enemy_slime_purple': 'assets/sprites/enemies/enemy_slime_purple.png',
  'enemy_skeleton': 'assets/sprites/enemies/enemy_skeleton.png',
  'enemy_fish': 'assets/sprites/enemies/enemy_fish.png',
  'enemy_thwomp': 'assets/sprites/enemies/enemy_thwomp.png',

  // Buffs
  'buff_shield': 'assets/sprites/buffs/buff_shield.png',
  'buff_boots': 'assets/sprites/buffs/buff_boots.png',
  'buff_star': 'assets/sprites/buffs/buff_star.png',
  'buff_star_2x': 'assets/sprites/buffs/buff_star_2x.png',
  'buff_heart': 'assets/sprites/buffs/buff_heart.png',
  'buff_heart_container': 'assets/sprites/buffs/buff_heart_container.png',
  'buff_mushroom': 'assets/sprites/buffs/buff_mushroom.png',
  'buff_flower': 'assets/sprites/buffs/buff_flower.png',
  'buff_potion': 'assets/sprites/buffs/buff_potion.png',
  'buff_magnet': 'assets/sprites/buffs/buff_magnet.png',
  'buff_clock': 'assets/sprites/buffs/buff_clock.png',

  // Items
  'item_coin': 'assets/sprites/items/item_coin.png',
  'item_diamond': 'assets/sprites/items/item_diamond.png',
  'item_key': 'assets/sprites/items/item_key.png',
  'item_code_scroll': 'assets/sprites/items/item_code_scroll.png',
  'item_code_book': 'assets/sprites/items/item_code_book.png',
  'item_checkpoint': 'assets/sprites/items/item_checkpoint.png',
  'item_orb': 'assets/sprites/items/item_orb.png',

  // Objects & Props
  'prop_flag': 'assets/sprites/objects/prop_flag.png',
  'prop_door_wood': 'assets/sprites/objects/prop_door_wood.png',
  'prop_door_locked': 'assets/sprites/objects/prop_door_locked.png',
  'prop_portal': 'assets/sprites/objects/prop_portal.png',
  'prop_chest': 'assets/sprites/objects/prop_chest.png',
  'prop_tree': 'assets/sprites/objects/prop_tree.png',
  'prop_bush': 'assets/sprites/objects/prop_bush.png',
  'prop_flower': 'assets/sprites/objects/prop_flower.png',
  'prop_cactus': 'assets/sprites/objects/prop_cactus.png',
  'prop_fence': 'assets/sprites/objects/prop_fence.png',
  'prop_sign': 'assets/sprites/objects/prop_sign.png',
  'prop_crate': 'assets/sprites/objects/prop_crate.png',
  'prop_barrel': 'assets/sprites/objects/prop_barrel.png',
  'prop_tnt': 'assets/sprites/objects/prop_tnt.png',

  // Triggers & Hazards
  'trigger_platform': 'assets/sprites/triggers/trigger_platform.png',
  'trigger_spring': 'assets/sprites/triggers/trigger_spring.png',
  'trigger_btn_red': 'assets/sprites/triggers/trigger_btn_red.png',
  'trigger_platform_gold': 'assets/sprites/triggers/trigger_platform_gold.png',
  'trigger_saw': 'assets/sprites/triggers/trigger_saw.png',
  'trigger_spikes': 'assets/sprites/triggers/trigger_spikes.png',

  // Effects
  'effect_bullet': 'assets/sprites/effects/effect_bullet.png',
  'effect_portal': 'assets/sprites/effects/effect_portal.png',
  'effect_blast': 'assets/sprites/effects/effect_blast.png',
  'effect_sparkle': 'assets/sprites/effects/effect_sparkle.png',

  // UI
  'trophy': 'assets/sprites/ui/trophy.png',
  'medal': 'assets/sprites/ui/medal.png',
  'crown': 'assets/sprites/ui/crown.png',
  'flag_vn': 'assets/sprites/ui/flag_vn.png',
  'ui_avatar': 'assets/sprites/ui/ui_avatar.png',
  'ui_bubble': 'assets/sprites/ui/ui_bubble.png'
};

const sprites = {};
let loadedCount = 0;
const totalToLoad = Object.keys(SPRITE_PATHS).length;

function registerAliases(name, img) {
  sprites[name] = img;
  if (name.startsWith('buff_')) {
    sprites[name.replace('buff_', 'item_')] = img;
    sprites[name.replace('buff_', '')] = img;
  }
  if (name.startsWith('item_')) {
    sprites[name.replace('item_', '')] = img;
  }
  sprites[`block_${name}`] = img;
  if (name === 'question_block') sprites['block_question'] = img;
  if (name === 'exclamation_block') sprites['block_exclamation'] = img;
  if (name === 'wood_crate') sprites['block_wood_crate'] = img;
  if (name === 'wood_plank') sprites['block_wood_plank'] = img;
  if (name === 'code_scroll') sprites['scroll'] = img;
  if (name === 'code_book') sprites['book'] = img;
}

function loadAllSprites(onComplete) {
  const keys = Object.keys(SPRITE_PATHS);
  keys.forEach(key => {
    const img = new Image();
    img.src = SPRITE_PATHS[key];
    img.onload = () => {
      registerAliases(key, img);
      loadedCount++;
      if (loadedCount >= totalToLoad) onComplete();
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.src = `assets/sprites/${key}.png`;
      fallbackImg.onload = () => {
        registerAliases(key, fallbackImg);
        loadedCount++;
        if (loadedCount >= totalToLoad) onComplete();
      };
      fallbackImg.onerror = () => {
        loadedCount++;
        if (loadedCount >= totalToLoad) onComplete();
      };
    };
  });
}

// 3. 8-BIT CHIPTUNE SYNTHESIZER
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playCoin() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playBump() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playStomp() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playShoot() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  playKick() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playSkid() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playSpring() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    const notes = [330, 392, 659, 523, 587, 784, 1046];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = this.ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  playPipe() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  startBGM() {
    if (!this.enabled || !this.ctx || this.bgmInterval) return;
    const melody = [
      659.25, 659.25, 0, 659.25, 0, 523.25, 659.25, 0, 783.99, 0, 0, 0, 392.00, 0, 0, 0,
      523.25, 0, 0, 392.00, 0, 0, 329.63, 0, 0, 440.00, 0, 493.88, 0, 466.16, 440.00, 0,
      392.00, 659.25, 783.99, 880.00, 0, 698.46, 783.99, 0, 659.25, 0, 523.25, 587.33, 493.88, 0, 0, 0
    ];
    let noteIdx = 0;
    const playNote = () => {
      if (!this.enabled || gameState !== 'playing') {
        this.stopBGM();
        return;
      }
      const freq = melody[noteIdx];
      noteIdx = (noteIdx + 1) % melody.length;
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        const duration = gameStats.time < 60 ? 0.08 : 0.11;
        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      }
    };
    const stepMs = gameStats.time < 60 ? 120 : 160;
    this.bgmInterval = setInterval(playNote, stepMs);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playVictory() {
    if (!this.enabled || !this.ctx) return;
    const melody = [
      { f: 523, d: 0.14 }, { f: 659, d: 0.14 }, { f: 784, d: 0.14 }, { f: 1046, d: 0.35 },
      { f: 880, d: 0.18 }, { f: 1046, d: 0.55 }
    ];
    let curTime = this.ctx.currentTime;
    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, curTime);
      gain.gain.setValueAtTime(0.22, curTime);
      gain.gain.linearRampToValueAtTime(0.01, curTime + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(curTime);
      osc.stop(curTime + n.d);
      curTime += n.d + 0.03;
    });
  }

  playFirework() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.38);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.38);
  }

  playTick() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }
}

const audio = new RetroAudio();

// 4. MENTOR QUOTES PER STAGE
const STAGE_QUOTES = {
  1: [
    "Thầy Tùng: 'Format code đi em ơi! Code sạch thì đời mới thanh thản.' (+200 EXP)",
    "Thầy Cấn: 'Nhớ commit code thường xuyên, không là mất bài đấy!' (+250 EXP)",
    "Thầy Luân: 'Phân biệt margin với padding cẩn thận nhé!' (+300 EXP)"
  ],
  2: [
    "Thầy Cấn: 'Đọc kỹ log lỗi NullPointerException, dòng số mấy?' (+300 EXP)",
    "Thầy Luân: 'Đừng sợ bug! Bug là bậc thang đưa em lên Senior.' (+500 EXP)",
    "Thầy Tùng: 'Tư duy Hướng Đối Tượng là biến thế giới thật vào code.' (+400 EXP)"
  ],
  3: [
    "Thầy Luân: 'Rebase từng commit một, sóng gió nào rồi cũng qua!' (+600 EXP)",
    "Thầy Tùng: 'Chúc mừng các em đã xuất sắc hoàn thành Demo Day!' (+1000 EXP)",
    "Thầy Cấn: 'Cảm ơn sự kiên trì và trưởng thành của các em!' (+9999 EXP)"
  ]
};

function showMentorToast(text) {
  const toast = document.getElementById('mentor-toast');
  const msg = document.getElementById('toast-msg');
  msg.textContent = text;
  toast.classList.remove('opacity-0', '-translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-2');
  }, 3200);
}

// 5. STAGE DESCRIPTIONS & LEVEL MAP GENERATOR
let currentStage = 1;
const LEVEL_WIDTH_TILES = 200;
const LEVEL_HEIGHT_TILES = 12;

let levelMap = [];
let interactiveBlocks = [];
let collectibles = [];
let enemies = [];
let props = [];
let festiveDecor = [];
let triggers = [];
let projectiles = [];
let floatingTexts = [];
let activeMushrooms = [];
let piranhaPlants = [];
let brickDebris = [];
let dustParticles = [];
let screenShake = 0;
let fireworksParticles = [];
let isClearCutscene = false;
let clearCutsceneTimer = 0;
let clearFireworksLaunched = 0;

function spawnFirework(x, y, color = null) {
  const colors = ['#F59E0B', '#EF4444', '#10B981', '#38BDF8', '#A855F7', '#EC4899', '#FDE047'];
  const baseColor = color || colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
    const speed = Math.random() * 4.2 + 2.0;
    fireworksParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1.0,
      color: baseColor,
      size: Math.random() * 3.5 + 2.5,
      life: 50
    });
  }
  audio.playFirework();
  screenShake = 5;
}

function buildStage(stageNum) {
  currentStage = stageNum;
  levelMap = Array.from({ length: LEVEL_HEIGHT_TILES }, () => Array(LEVEL_WIDTH_TILES).fill(0));
  interactiveBlocks = [];
  collectibles = [];
  enemies = [];
  props = [];
  triggers = [];
  projectiles = [];
  floatingTexts = [];
  activeMushrooms = [];
  piranhaPlants = [];
  brickDebris = [];
  dustParticles = [];
  fireworksParticles = [];
  isClearCutscene = false;
  clearCutsceneTimer = 0;
  clearFireworksLaunched = 0;
  screenShake = 0;
  cameraX = 0;
  gameStats.time = NES_CONFIG.level_time;
  gameStats.timeTick = 0;
  lastSecondRealTime = performance.now();
  lastFrameTime = performance.now();
  physicsAccumulator = 0;

  const stageClear = document.getElementById('stage-clear-overlay');
  if (stageClear) { stageClear.classList.remove('flex'); stageClear.classList.add('hidden'); }
  const victoryOverlay = document.getElementById('victory-overlay');
  if (victoryOverlay) { victoryOverlay.classList.remove('flex'); victoryOverlay.classList.add('hidden'); }
  const gameoverOverlay = document.getElementById('gameover-overlay');
  if (gameoverOverlay) { gameoverOverlay.classList.remove('flex'); gameoverOverlay.classList.add('hidden'); }

  const stageBadge = document.getElementById('stage-badge-header');
  if (stageNum === 1) {
    stageBadge.textContent = "MÀN 1: THẢO NGUYÊN CODE";
    buildStage1();
  } else if (stageNum === 2) {
    stageBadge.textContent = "MÀN 2: MÊ CUNG OOP & LÂU ĐÀI ĐÁ";
    buildStage2();
  } else {
    stageBadge.textContent = "MÀN 3: ĐẤU TRƯỜNG DUNG NHAM & TRI ÂN 20/11";
    buildStage3();
  }

  // Địa hình đã dựng xong: hạ quái đi bộ xuống đúng mặt đất của cột chúng đứng
  settleEnemies();
  // Neo prop xuống mặt đất để không lơ lửng / lọt vào đá
  settleProps();
  // Trang trí 20/11 (dây cờ, băng rôn, bóng bay, hoa hồng)
  buildFestiveDecor(stageNum);

  // Lời chào 20/11 khi bắt đầu mỗi màn
  const FEST_GREET = {
    1: "🎉 20/11 — Chào mừng tới Thảo Nguyên Code! Cùng vượt 3 ải để tri ân Thầy Cô!",
    2: "🎉 20/11 — Lâu Đài Tri Ân đã mở! Thầy Tùng, Thầy Cấn, Thầy Luân đang chờ bạn.",
    3: "🎉 20/11 — Đấu Trường Vinh Danh! Chạm đích để gửi lời tri ân tới Thầy Tùng · Thầy Cấn · Thầy Luân!"
  };
  showMentorToast(FEST_GREET[stageNum]);
}


// ===================================================================
// LEVEL BUILDERS — 3 màn dài 200 ô (8000px ≈ 9,5 màn hình cuộn)
// Vùng 0–84 giữ nguyên bố cục cũ (test suite bám toạ độ),
// vùng 85–199 là chương mới nối tiếp.
// ===================================================================

// ---- HÀM DÙNG CHUNG ----

/** Cầu thang đá đi lên (hướng +1) hoặc đi xuống (-1) */
function stair(fromX, steps, dir, baseY) {
  for (let i = 0; i < steps; i++) {
    const col = fromX + i;
    const h = dir > 0 ? i + 1 : steps - i;
    for (let k = 0; k < h; k++) {
      levelMap[baseY - k][col] = 'stone';
    }
  }
}

/** Cụm khối thưởng: chuỗi type liên tiếp trên cùng 1 hàng */
function blockRun(tx, ty, types) {
  types.forEach((t, i) => {
    if (Array.isArray(t)) createBlock(tx + i, ty, t[0], t[1]);
    else createBlock(tx + i, ty, t, null);
  });
}

/** Hàng coin theo vòng cung (nhảy parabol) */
function coinArc(fromX, count, baseY, height = 2) {
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const lift = Math.sin(t * Math.PI) * height;
    collectibles.push({
      x: (fromX + i) * TILE_SIZE,
      y: (baseY - lift) * TILE_SIZE,
      type: 'coin', collected: false
    });
  }
}

// === MÀN 1: THẢO NGUYÊN CODE (200 ô) ===
function buildStage1() {
  // ----- CHƯƠNG 1: ĐỒNG CỎ MỞ ĐẦU (x 0–84, bố cục gốc) -----
  for (let x = 0; x < 85; x++) {
    if ((x >= 37 && x <= 38) || (x >= 49 && x <= 51)) continue;
    levelMap[10][x] = 'grass';
    levelMap[11][x] = 'dirt';
  }

  props.push({ x: 3 * TILE_SIZE, y: 7.8 * TILE_SIZE, type: 'prop_tree', w: 60, h: 88 });
  props.push({ x: 8 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'prop_flower', w: 26, h: 28 });
  props.push({ x: 18 * TILE_SIZE, y: 9.1 * TILE_SIZE, type: 'prop_bush', w: 48, h: 36 });
  props.push({ x: 35 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_sign', w: 36, h: 40 });
  props.push({ x: 44 * TILE_SIZE, y: 9.1 * TILE_SIZE, type: 'prop_fence', w: 45, h: 36 });
  props.push({ x: 55 * TILE_SIZE, y: 7.8 * TILE_SIZE, type: 'prop_tree', w: 60, h: 88 });

  createBlock(5, 7, 'question_block', 'coin');
  blockRun(12, 7, ['brick', ['question_block','mushroom'], 'brick', ['question_block','coin'], 'brick']);

  createPipe(20, 9, 1);
  createPipe(26, 8, 2);
  createPipe(32, 7, 3);
  piranhaPlants.push(new PiranhaPlant(32, 7));

  createBlock(24, 6, 'question_block', 'flower');
  createBlock(44, 7, 'question_block', 'star');
  createBlock(45, 7, 'brick');
  createBlock(58, 6, 'coin_box', 'coin');

  stair(68, 4, +1, 9);

  activeMushrooms.push(new WalkingMushroom(7.5 * TILE_SIZE, 9.2 * TILE_SIZE));

  collectibles.push({ x: 6 * TILE_SIZE, y: 5 * TILE_SIZE, type: 'coin', collected: false });
  collectibles.push({ x: 21 * TILE_SIZE, y: 7 * TILE_SIZE, type: 'coin', collected: false });
  collectibles.push({ x: 27 * TILE_SIZE, y: 6 * TILE_SIZE, type: 'coin', collected: false });
  collectibles.push({ x: 45 * TILE_SIZE, y: 4.5 * TILE_SIZE, type: 'scroll', collected: false });

  enemies.push(new Enemy(9 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_goomba'));
  enemies.push(new Enemy(18 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_goomba'));
  enemies.push(new Enemy(42 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));
  enemies.push(new Enemy(54 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_green'));
  enemies.push(new Enemy(62 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_crab'));

  // ----- CHƯƠNG 2: ĐỒI NẤM & SUỐI ĐÁ (x 85–144) -----
  for (let x = 85; x <= 144; x++) {
    if ((x >= 96 && x <= 98) || (x >= 110 && x <= 112) ||
        (x >= 126 && x <= 128) || (x >= 138 && x <= 139)) continue;
    levelMap[10][x] = 'grass';
    levelMap[11][x] = 'dirt';
  }

  // Đồi bậc thang lên xuống
  stair(87, 4, +1, 9);
  stair(92, 3, -1, 8);

  // Bục đá lơ lửng bắc qua hố 96–98
  for (let x = 95; x <= 99; x++) levelMap[7][x] = 'stone';

  // Ống cống đôi + Piranha
  createPipe(101, 9, 1);
  createPipe(104, 8, 2);
  piranhaPlants.push(new PiranhaPlant(104, 8));

  // Cụm khối thưởng giữa trời
  blockRun(106, 6, [['question_block','coin'], 'brick', ['question_block','mushroom'], 'brick']);
  blockRun(114, 5, ['brick', ['coin_box','coin'], 'brick']);

  // Hố 110–112 vượt bằng 2 bệ nhảy
  levelMap[7][109] = 'wood_plank';
  levelMap[6][111] = 'wood_plank';
  levelMap[7][113] = 'wood_plank';

  // Thang leo lên mỏm đá cao
  for (let y = 6; y <= 9; y++) levelMap[y][118] = 'ladder';
  for (let x = 118; x <= 122; x++) levelMap[5][x] = 'stone';

  // Hố 126–128: cầu phẳng hẹp
  for (let x = 125; x <= 129; x++) levelMap[8][x] = 'wood_plank';

  // Bãi gai & quái dày
  triggers.push({ x: 131 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spikes', w: 38, h: 26, isHazard: true });
  triggers.push({ x: 135 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spikes', w: 38, h: 26, isHazard: true });

  stair(141, 5, +1, 9);

  // Hố 138–139 có đệm lò xo bật qua
  triggers.push({ x: 137 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });

  coinArc(86, 6, 6, 2);
  coinArc(107, 5, 4, 1.6);
  coinArc(132, 5, 5, 1.6);

  collectibles.push({ x: 119 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'diamond', collected: false });
  collectibles.push({ x: 143 * TILE_SIZE, y: 5.0 * TILE_SIZE, type: 'book', collected: false });

  enemies.push(new Enemy(90 * TILE_SIZE, 8.2 * TILE_SIZE, 'enemy_goomba'));
  enemies.push(new Enemy(100 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_green'));
  enemies.push(new Enemy(108 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));
  enemies.push(new Enemy(117 * TILE_SIZE, 4.2 * TILE_SIZE, 'enemy_bat', true));
  enemies.push(new Enemy(124 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_crab'));
  enemies.push(new Enemy(133 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_spiny'));
  enemies.push(new Enemy(143 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_red_bug'));

  // ----- CHƯƠNG 3: VÁCH NÚI & THÁP CỜ (x 145–199) -----
  for (let x = 145; x <= 199; x++) {
    if ((x >= 156 && x <= 159) || (x >= 172 && x <= 175) || (x >= 186 && x <= 188)) continue;
    levelMap[10][x] = 'grass';
    levelMap[11][x] = 'dirt';
  }

  // Vách núi bậc thang
  stair(146, 6, +1, 9);
  for (let x = 152; x <= 155; x++) levelMap[4][x] = 'stone';
  stair(160, 4, -1, 9);

  // Hố 156–159: 3 bệ đá nhảy liên hoàn trên không
  levelMap[7][156] = 'stone';
  levelMap[6][158] = 'stone';
  levelMap[7][159] = 'stone';

  // Ống cống cuối + Piranha canh gác
  createPipe(163, 8, 2);
  piranhaPlants.push(new PiranhaPlant(163, 8));

  // Cụm khối thưởng cao cấp
  blockRun(166, 5, [['question_block','flower'], 'brick', ['question_block','star'], 'brick']);
  blockRun(178, 6, [['coin_box','coin'], 'brick', 'brick']);

  // Hố 172–175: cầu treo nhiều nhịp
  for (let x = 171; x <= 176; x++) levelMap[7][x] = 'wood_plank';
  triggers.push({ x: 173 * TILE_SIZE, y: 5.5 * TILE_SIZE, type: 'trigger_saw', w: 36, h: 36, isHazard: true });

  // Hố 186–188 + lò xo bật lên mỏm cao
  triggers.push({ x: 185 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  levelMap[6][186] = 'stone';
  levelMap[5][188] = 'stone';

  // Sân thượng dẫn tới cột cờ (dừng ở cột 194 để không xây đá đè lên cửa gỗ ở cột 198–199)
  stair(190, 5, +1, 9);

  coinArc(146, 6, 3, 1.6);
  coinArc(177, 5, 4, 1.8);
  coinArc(190, 5, 4, 1.6);

  collectibles.push({ x: 153 * TILE_SIZE, y: 2.5 * TILE_SIZE, type: 'orb', collected: false });
  collectibles.push({ x: 168 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'heart_container', collected: false });
  collectibles.push({ x: 196 * TILE_SIZE, y: 2.5 * TILE_SIZE, type: 'scroll', collected: false });

  enemies.push(new Enemy(150 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_skeleton'));
  enemies.push(new Enemy(162 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_mage'));
  enemies.push(new Enemy(169 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_thwomp'));
  enemies.push(new Enemy(180 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));
  enemies.push(new Enemy(184 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_bat', true));
  enemies.push(new Enemy(192 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_crab'));

  activeMushrooms.push(new WalkingMushroom(120 * TILE_SIZE, 4.2 * TILE_SIZE));

  // Đích: cột cờ đứng trên sân thượng cuối (neo đáy xuống mặt đất hàng 10)
  const flagX = 197 * TILE_SIZE;
  const flagGroundY = 10 * TILE_SIZE;
  props.push({ x: flagX, y: flagGroundY - 128, type: 'prop_flag', w: 42, h: 128, isGoal: true });
  props.push({ x: flagX + 55, y: flagGroundY - 80, type: 'prop_door_wood', w: 50, h: 80 });
  props.push({ x: 149 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_sign', w: 36, h: 40 });
  props.push({ x: 181 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_barrel', w: 36, h: 40 });
}

// === MÀN 2: MÊ CUNG LÂU ĐÀI OOP (200 ô, 3 tầng hầm) ===
function buildStage2() {
  // ----- CHƯƠNG 1: ĐẠI SẢNH ĐÁ (x 0–84, bố cục gốc) -----
  for (let x = 0; x < 85; x++) {
    if ((x >= 22 && x <= 25) || (x >= 45 && x <= 48)) continue;
    levelMap[10][x] = (x > 30 && x < 45) ? 'ice' : 'stone';
    levelMap[11][x] = 'stone';
  }

  props.push({ x: 5 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_barrel', w: 36, h: 40 });
  props.push({ x: 12 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_tnt', w: 38, h: 38 });
  props.push({ x: 30 * TILE_SIZE, y: 8.8 * TILE_SIZE, type: 'prop_cactus', w: 34, h: 48 });
  props.push({ x: 52 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_chest', w: 42, h: 40 });

  for (let x = 8; x <= 12; x++) levelMap[7][x] = 'wood_plank';
  for (let x = 27; x <= 32; x++) levelMap[6][x] = 'stone';
  for (let x = 40; x <= 44; x++) levelMap[7][x] = 'stone';

  for (let y = 7; y <= 9; y++) levelMap[y][12] = 'ladder';

  createBlock(9, 4, 'exclamation_block', 'mushroom');
  createBlock(11, 4, 'question_block', 'key');
  createBlock(28, 3, 'question_block', 'shield');
  createBlock(30, 3, 'exclamation_block', 'diamond');
  createBlock(42, 4, 'question_block', 'boots');

  activeMushrooms.push(new WalkingMushroom(10 * TILE_SIZE, 6.2 * TILE_SIZE));
  createPipe(46, 8, 2);
  piranhaPlants.push(new PiranhaPlant(46, 8));

  triggers.push({ x: 16 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  triggers.push({ x: 35 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_saw', w: 36, h: 36, isHazard: true });
  triggers.push({ x: 41 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spikes', w: 38, h: 26, isHazard: true });

  triggers.push({
    x: 22 * TILE_SIZE, y: 8 * TILE_SIZE, w: 70, h: 22, type: 'trigger_platform',
    minX: 21 * TILE_SIZE, maxX: 26 * TILE_SIZE, vx: 1.2, isPlatform: true
  });

  collectibles.push({ x: 11 * TILE_SIZE, y: 2.8 * TILE_SIZE, type: 'key', collected: false });
  collectibles.push({ x: 29 * TILE_SIZE, y: 1.8 * TILE_SIZE, type: 'diamond', collected: false });
  collectibles.push({ x: 42 * TILE_SIZE, y: 2.8 * TILE_SIZE, type: 'book', collected: false });

  enemies.push(new Enemy(14 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_skeleton'));
  enemies.push(new Enemy(20 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_spiny'));
  enemies.push(new Enemy(28 * TILE_SIZE, 4.5 * TILE_SIZE, 'enemy_bat', true));
  enemies.push(new Enemy(38 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));
  enemies.push(new Enemy(50 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_mage'));
  enemies.push(new Enemy(58 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_thwomp'));

  // ----- CHƯƠNG 2: HÀNH LANG BĂNG GIÁ (x 85–144) -----
  for (let x = 85; x < 200; x++) {
    const inPit = (x >= 95 && x <= 97) || (x >= 108 && x <= 110) ||
                  (x >= 122 && x <= 125) || (x >= 137 && x <= 139) ||
                  (x >= 155 && x <= 158) || (x >= 170 && x <= 173) ||
                  (x >= 184 && x <= 187);
    if (inPit) continue;
    levelMap[10][x] = (x >= 85 && x <= 116) ? 'ice' : 'stone';
    levelMap[11][x] = 'stone';
  }

  // Sàn băng trơn: thêm dải băng ở tầng trên tạo đường trượt
  for (let x = 88; x <= 94; x++) levelMap[9][x] = 'ice';

  // Bệ nâng di động bắc qua hố 95–97
  triggers.push({
    x: 94 * TILE_SIZE, y: 8 * TILE_SIZE, w: 70, h: 22, type: 'trigger_platform',
    minX: 93 * TILE_SIZE, maxX: 99 * TILE_SIZE, vx: 1.3, isPlatform: true
  });

  // Hành lang hẹp có trần thấp
  for (let x = 100; x <= 107; x++) {
    levelMap[6][x] = 'stone';
    levelMap[7][x] = 'stone';
  }

  createBlock(102, 8, 'question_block', 'shield');
  createBlock(105, 8, 'exclamation_block', 'mushroom');

  // Hố 108–110: bục gai nguy hiểm
  triggers.push({ x: 108 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spikes', w: 38, h: 26, isHazard: true });
  triggers.push({ x: 112 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_saw', w: 36, h: 36, isHazard: true });

  // Thang leo lên phòng chứa bí kíp
  for (let y = 5; y <= 9; y++) levelMap[y][116] = 'ladder';
  for (let x = 116; x <= 121; x++) levelMap[4][x] = 'stone';

  // Hố 122–125: cầu treo
  for (let x = 121; x <= 126; x++) levelMap[7][x] = 'wood_plank';

  // Cụm khối chứa vật phẩm
  blockRun(128, 5, [['question_block','star_2x'], 'brick', ['exclamation_block','boots'], 'brick']);
  blockRun(132, 7, ['brick', ['coin_box','coin'], 'brick']);

  // Hố 137–139 + lò xo
  triggers.push({ x: 136 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });

  stair(140, 4, +1, 9);

  coinArc(86, 6, 7, 1.8);
  coinArc(129, 5, 4.5, 1.6);
  coinArc(141, 5, 6, 1.6);

  collectibles.push({ x: 117 * TILE_SIZE, y: 2.5 * TILE_SIZE, type: 'book', collected: false });
  collectibles.push({ x: 120 * TILE_SIZE, y: 2.5 * TILE_SIZE, type: 'diamond', collected: false });
  collectibles.push({ x: 134 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'orb', collected: false });

  enemies.push(new Enemy(89 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_skeleton'));
  enemies.push(new Enemy(93 * TILE_SIZE, 8.2 * TILE_SIZE, 'enemy_slime_purple'));
  enemies.push(new Enemy(103 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_spiny'));
  enemies.push(new Enemy(114 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_mage'));
  enemies.push(new Enemy(119 * TILE_SIZE, 3.2 * TILE_SIZE, 'enemy_bat', true));
  enemies.push(new Enemy(130 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(135 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));
  enemies.push(new Enemy(142 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_skeleton'));

  // ----- CHƯƠNG 3: PHÒNG NGAI OOP & CỬA KHÓA (x 145–199) -----
  // Hành lang dày đặc bẫy
  for (let x = 145; x <= 154; x++) {
    levelMap[9][x] = 'ice';
  }
  triggers.push({ x: 146 * TILE_SIZE, y: 8.3 * TILE_SIZE, type: 'trigger_saw', w: 36, h: 36, isHazard: true });
  triggers.push({ x: 150 * TILE_SIZE, y: 8.3 * TILE_SIZE, type: 'trigger_spikes', w: 38, h: 26, isHazard: true });

  // Hố 155–158: hai bệ nâng ngược chiều
  triggers.push({
    x: 154 * TILE_SIZE, y: 8 * TILE_SIZE, w: 70, h: 22, type: 'trigger_platform',
    minX: 154 * TILE_SIZE, maxX: 159 * TILE_SIZE, vx: 1.6, isPlatform: true
  });

  // Trần thấp + khối thưởng cao cấp
  blockRun(161, 5, [['question_block','flower'], 'brick', ['exclamation_block','star'], 'brick']);
  blockRun(165, 8, [['coin_box','coin'], 'brick']);

  // Thang lên phòng ngai
  for (let y = 4; y <= 9; y++) levelMap[y][168] = 'ladder';
  for (let x = 168; x <= 176; x++) levelMap[3][x] = 'stone';

  // Hố 170–173: cầu hẹp trên cao
  for (let x = 177; x <= 181; x++) levelMap[8][x] = 'wood_plank';

  // Hố 184–187: hố dung nham (màn 2 vẫn có bẫy lửa nhẹ)
  for (let x = 184; x <= 187; x++) {
    levelMap[10][x] = 'lava';
    levelMap[11][x] = 'fire';
  }
  triggers.push({ x: 182 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });

  coinArc(147, 6, 7, 1.6);
  coinArc(178, 5, 5, 1.6);
  coinArc(189, 6, 6, 1.8);

  collectibles.push({ x: 171 * TILE_SIZE, y: 2.2 * TILE_SIZE, type: 'key', collected: false });
  collectibles.push({ x: 190 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'heart_container', collected: false });

  enemies.push(new Enemy(148 * TILE_SIZE, 8.2 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(152 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_spiny'));
  enemies.push(new Enemy(163 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_thwomp'));
  enemies.push(new Enemy(174 * TILE_SIZE, 2.2 * TILE_SIZE, 'enemy_bat', true));
  enemies.push(new Enemy(180 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_mage'));
  enemies.push(new Enemy(191 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_skeleton'));
  enemies.push(new Enemy(195 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_turtle'));

  // Đích: đại sảnh ngai vàng
  const goalX = (LEVEL_WIDTH_TILES - 8) * TILE_SIZE;
  const goalGroundY = 10 * TILE_SIZE;
  props.push({ x: goalX, y: goalGroundY - 128, type: 'prop_flag', w: 42, h: 128, isGoal: true });
  props.push({ x: goalX + 60, y: goalGroundY - 80, type: 'prop_door_locked', w: 50, h: 80 });
  props.push({ x: goalX + 130, y: 3.2 * TILE_SIZE, type: 'prop_chest', w: 42, h: 40 });
  props.push({ x: 156 * TILE_SIZE, y: 2.0 * TILE_SIZE, type: 'prop_barrel', w: 36, h: 40 });
  props.push({ x: 147 * TILE_SIZE, y: 8.2 * TILE_SIZE, type: 'prop_tnt', w: 38, h: 38 });
}

// === MÀN 3: ĐẤU TRƯỜNG DUNG NHAM (200 ô) ===
function buildStage3() {
  // ----- CHƯƠNG 1: ĐẤU TRƯỜNG MỞ MÀN (x 0–84, bố cục gốc) -----
  for (let x = 0; x < 85; x++) {
    if ((x >= 0 && x <= 15) || (x >= 22 && x <= 32) || (x >= 40 && x <= 50) || (x >= 60 && x <= 85)) {
      levelMap[10][x] = 'stone';
      levelMap[11][x] = 'stone';
    } else {
      levelMap[10][x] = 'lava';
      levelMap[11][x] = 'fire';
    }
  }

  triggers.push({
    x: 16 * TILE_SIZE, y: 8 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 16 * TILE_SIZE, maxX: 21 * TILE_SIZE, vx: 1.4, isPlatform: true
  });
  triggers.push({
    x: 33 * TILE_SIZE, y: 7.5 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 33 * TILE_SIZE, maxX: 39 * TILE_SIZE, vx: 1.5, isPlatform: true
  });
  triggers.push({
    x: 52 * TILE_SIZE, y: 7 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 52 * TILE_SIZE, maxX: 58 * TILE_SIZE, vx: 1.3, isPlatform: true
  });

  triggers.push({ x: 8 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  triggers.push({ x: 42 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });

  createBlock(10, 7, 'exclamation_block', 'mushroom');
  createBlock(12, 7, 'question_block', 'heart_container');

  levelMap[8][23] = 'stone';
  createBlock(25, 7, 'question_block', 'star_2x');
  createBlock(26, 7, 'brick');
  createBlock(27, 7, 'coin_box', 'coin');
  levelMap[8][29] = 'stone';

  createBlock(44, 7, 'brick');
  createBlock(45, 7, 'question_block', 'flower');
  createBlock(46, 7, 'brick');

  activeMushrooms.push(new WalkingMushroom(18 * TILE_SIZE, 7.3 * TILE_SIZE));

  stair(66, 7, +1, 9);

  collectibles.push({ x: 10 * TILE_SIZE, y: 5.5 * TILE_SIZE, type: 'orb', collected: false });
  collectibles.push({ x: 25 * TILE_SIZE, y: 5.5 * TILE_SIZE, type: 'star_2x', collected: false });
  collectibles.push({ x: 45 * TILE_SIZE, y: 5.5 * TILE_SIZE, type: 'heart_container', collected: false });

  enemies.push(new Enemy(14 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_purple'));
  enemies.push(new Enemy(26 * TILE_SIZE, 8.5 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(35 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_fish', true));
  enemies.push(new Enemy(44 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_piranha'));
  enemies.push(new Enemy(48 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_spike_ball'));
  enemies.push(new Enemy(62 * TILE_SIZE, 8.5 * TILE_SIZE, 'enemy_ghost', true));

  // ----- CHƯƠNG 2: HỒ DUNG NHAM LỚN (x 85–149) -----
  // Nền đá rải rác, phần lớn là dung nham
  const stonePatches = [
    [85, 91], [96, 100], [105, 108], [114, 119], [124, 127], [133, 138], [143, 148]
  ];
  for (let x = 85; x <= 149; x++) {
    const onStone = stonePatches.some(([a, b]) => x >= a && x <= b);
    if (onStone) {
      levelMap[10][x] = 'stone';
      levelMap[11][x] = 'stone';
    } else {
      levelMap[10][x] = 'lava';
      levelMap[11][x] = 'fire';
    }
  }

  // Bệ nâng vàng bắc qua các dải dung nham
  triggers.push({
    x: 91 * TILE_SIZE, y: 8 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 91 * TILE_SIZE, maxX: 96 * TILE_SIZE, vx: 1.5, isPlatform: true
  });
  triggers.push({
    x: 100 * TILE_SIZE, y: 7.5 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 100 * TILE_SIZE, maxX: 105 * TILE_SIZE, vx: 1.6, isPlatform: true
  });
  triggers.push({
    x: 119 * TILE_SIZE, y: 7 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 119 * TILE_SIZE, maxX: 124 * TILE_SIZE, vx: 1.4, isPlatform: true
  });
  triggers.push({
    x: 127 * TILE_SIZE, y: 8 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 127 * TILE_SIZE, maxX: 133 * TILE_SIZE, vx: 1.7, isPlatform: true
  });
  triggers.push({
    x: 138 * TILE_SIZE, y: 7.5 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 138 * TILE_SIZE, maxX: 143 * TILE_SIZE, vx: 1.5, isPlatform: true
  });

  // Đệm lò xo trên các mỏm đá
  triggers.push({ x: 97 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  triggers.push({ x: 115 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  triggers.push({ x: 135 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });

  // Khối thưởng trên cao
  blockRun(106, 6, [['question_block','flower'], 'brick', ['coin_box','coin']]);
  blockRun(125, 5, [['exclamation_block','mushroom'], 'brick']);
  blockRun(144, 6, [['question_block','star'], 'brick', ['coin_box','coin']]);

  // Bậc đá dẫn lên
  levelMap[9][93] = 'stone';
  levelMap[8][94] = 'stone';
  levelMap[9][103] = 'stone';
  levelMap[8][104] = 'stone';
  levelMap[9][116] = 'stone';
  levelMap[8][117] = 'stone';
  levelMap[9][131] = 'stone';
  levelMap[8][132] = 'stone';
  levelMap[9][141] = 'stone';
  levelMap[8][142] = 'stone';

  coinArc(92, 5, 5.5, 1.8);
  coinArc(120, 5, 4.5, 1.8);
  coinArc(139, 5, 5, 1.8);

  collectibles.push({ x: 107 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'heart_container', collected: false });
  collectibles.push({ x: 126 * TILE_SIZE, y: 2.5 * TILE_SIZE, type: 'orb', collected: false });
  collectibles.push({ x: 145 * TILE_SIZE, y: 3.5 * TILE_SIZE, type: 'scroll', collected: false });

  enemies.push(new Enemy(88 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_purple'));
  enemies.push(new Enemy(98 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_piranha'));
  enemies.push(new Enemy(102 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(112 * TILE_SIZE, 6.5 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(118 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_fish', true));
  enemies.push(new Enemy(129 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_purple'));
  enemies.push(new Enemy(141 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_piranha'));
  enemies.push(new Enemy(147 * TILE_SIZE, 8.5 * TILE_SIZE, 'enemy_ghost', true));

  // ----- CHƯƠNG 3: THÁP TRI ÂN (x 150–199) -----
  // Nền đá liên tục dẫn tới tháp
  for (let x = 150; x < 200; x++) {
    levelMap[10][x] = 'stone';
    levelMap[11][x] = 'stone';
  }

  // Vực dung nham nhỏ cắt ngang
  for (let x = 156; x <= 159; x++) {
    levelMap[10][x] = 'lava';
    levelMap[11][x] = 'fire';
  }
  triggers.push({
    x: 155 * TILE_SIZE, y: 8 * TILE_SIZE, w: 75, h: 22, type: 'trigger_platform_gold',
    minX: 155 * TILE_SIZE, maxX: 160 * TILE_SIZE, vx: 1.6, isPlatform: true
  });

  for (let x = 168; x <= 171; x++) {
    levelMap[10][x] = 'lava';
    levelMap[11][x] = 'fire';
  }
  triggers.push({ x: 167 * TILE_SIZE, y: 9.3 * TILE_SIZE, type: 'trigger_spring', w: 36, h: 28 });
  levelMap[7][168] = 'stone';
  levelMap[6][170] = 'stone';
  levelMap[7][171] = 'stone';

  // Bậc thang lên tháp (dừng ở 181 để không đè lên cụm khối thưởng c178..180)
  stair(174, 6, +1, 9);
  stair(182, 6, +1, 9);

  // Cụm khối thưởng cuối
  blockRun(163, 5, [['question_block','flower'], 'brick', ['exclamation_block','star_2x'], 'brick']);
  // Cụm khối thưởng đặt trên không trung, không chồng lên bậc thang (c178..180 r4 đã là đá)
  blockRun(163, 8, [['coin_box','coin'], 'brick', ['question_block','heart_container']]);

  coinArc(151, 5, 6, 1.8);
  coinArc(175, 6, 5, 2.0);
  coinArc(184, 5, 4, 1.6);

  collectibles.push({ x: 165 * TILE_SIZE, y: 3.0 * TILE_SIZE, type: 'heart_container', collected: false });
  collectibles.push({ x: 181 * TILE_SIZE, y: 2.0 * TILE_SIZE, type: 'orb', collected: false });

  enemies.push(new Enemy(153 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_purple'));
  enemies.push(new Enemy(162 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_fish', true));
  enemies.push(new Enemy(166 * TILE_SIZE, 8.5 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(176 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(180 * TILE_SIZE, 8.5 * TILE_SIZE, 'enemy_ghost', true));
  enemies.push(new Enemy(188 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_piranha'));
  enemies.push(new Enemy(192 * TILE_SIZE, 9.2 * TILE_SIZE, 'enemy_slime_purple'));

  // Đích: tháp cờ Việt Nam trên đỉnh bậc thang cuối
  const finaleX = (LEVEL_WIDTH_TILES - 9) * TILE_SIZE;
  // Đo thật: cột 188–199 đều là mặt đất hàng 10 (y=400) → neo đích xuống đó
  const towerTopY = 10 * TILE_SIZE;
  props.push({ x: finaleX, y: towerTopY - 180, type: 'flag_vn', w: 55, h: 180, isGoal: true });
  props.push({ x: finaleX + 75, y: towerTopY - 105, type: 'prop_portal', w: 60, h: 105 });
  props.push({ x: finaleX + 35, y: towerTopY - 54, type: 'trophy', w: 42, h: 54 });
  props.push({ x: finaleX + 75, y: towerTopY - 42, type: 'medal', w: 34, h: 42 });
  props.push({ x: finaleX + 110, y: towerTopY - 36, type: 'crown', w: 40, h: 36 });
  props.push({ x: 152 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_sign', w: 36, h: 40 });
  props.push({ x: 173 * TILE_SIZE, y: 9.0 * TILE_SIZE, type: 'prop_chest', w: 42, h: 40 });
}

function createBlock(tx, ty, type, content = null) {
  interactiveBlocks.push({
    tx, ty,
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE,
    type,
    content,
    bumpY: 0,
    used: false
  });
}

function createPipe(tx, ty, heightTiles) {
  for (let h = 0; h < heightTiles; h++) {
    levelMap[ty + h][tx] = 'pipe_green';
  }
}

/**
 * Hàng của mặt đất đi được tại một cột.
 * Ưu tiên mặt phẳng nằm ngang: một khối mà cả cột bên trái và bên phải cũng
 * có khối ở cùng hàng đó, hoặc cột này là mặt đất chính. Tránh đặt quái lên
 * đúng đỉnh bậc thang, nơi hộp va chạm 28px sẽ chạm vào bậc kế bên.
 */
const NON_GROUND_TILES = new Set(['ladder', 'lava', 'block_lava', 'fire']);

function surfaceRow(col) {
  if (col < 0 || col >= LEVEL_WIDTH_TILES) return null;
  const isSolid = (c, r) => {
    if (c < 0 || c >= LEVEL_WIDTH_TILES || r < 0 || r >= LEVEL_HEIGHT_TILES) return false;
    const t = levelMap[r][c];
    return !!t && !NON_GROUND_TILES.has(t);
  };
  const openAbove = (c, r) => !isSolid(c, r - 1);

  // 1) mặt phẳng: chính nó và ít nhất một bên cùng hàng đều rắn, phía trên trống
  for (let r = LEVEL_HEIGHT_TILES - 1; r >= 1; r--) {
    if (!isSolid(col, r) || !openAbove(col, r)) continue;
    const leftLevel  = isSolid(col - 1, r) && openAbove(col - 1, r);
    const rightLevel = isSolid(col + 1, r) && openAbove(col + 1, r);
    if (leftLevel || rightLevel) return r;
  }
  // 2) dự phòng: đỉnh khối đầu tiên tìm thấy
  for (let r = LEVEL_HEIGHT_TILES - 1; r >= 1; r--) {
    if (isSolid(col, r) && openAbove(col, r)) return r;
  }
  return null;
}

/** Cột này có phải hố/dung nham (không có mặt đất đi được) không? */
function isHazardColumn(col) {
  if (col < 0 || col >= LEVEL_WIDTH_TILES) return true;
  return surfaceRow(col) === null;
}

/** Hộp có chồng lên ô dung nham/lửa nào không (dùng để phát hiện quái bị nhét vào lửa). */
function boxTouchesLava(x, y, w, h) {
  const l = Math.floor((x + 2) / TILE_SIZE), r = Math.floor((x + w - 2) / TILE_SIZE);
  const t = Math.floor((y + 2) / TILE_SIZE), b = Math.floor((y + h - 2) / TILE_SIZE);
  for (let ty = t; ty <= b; ty++) {
    for (let tx = l; tx <= r; tx++) {
      if (ty < 0 || ty >= LEVEL_HEIGHT_TILES || tx < 0 || tx >= LEVEL_WIDTH_TILES) continue;
      const v = levelMap[ty][tx];
      if (v === 'lava' || v === 'block_lava' || v === 'fire') return true;
    }
  }
  return false;
}

/**
 * Thả mọi quái đi bộ xuống đúng mặt đất của cột chúng đứng.
 * Quái được khai báo ở độ cao cố định (hàng 10); ở những chỗ địa hình dâng
 * lên (bậc thang, mỏm đá, thềm băng) quái sẽ bị nhét lọt vào trong khối đá.
 */
function settleEnemies() {
  enemies.forEach(e => {
    if (e.isFlying) return;
    const col = Math.floor((e.x + e.w / 2) / TILE_SIZE);

    // Quái đi bộ không thể sống trong hố dung nham: dời sang cột đất liền gần nhất
    if (isHazardColumn(col)) {
      let target = null;
      for (let d = 1; d <= 6 && target === null; d++) {
        if (!isHazardColumn(col - d)) target = col - d;
        else if (!isHazardColumn(col + d)) target = col + d;
      }
      if (target === null) { e.dead = true; return; }   // bỏ hẳn nếu cả vùng là dung nham
      e.x = target * TILE_SIZE + (TILE_SIZE - e.w) / 2;
    }

    const finalCol = Math.floor((e.x + e.w / 2) / TILE_SIZE);
    const r = surfaceRow(finalCol);
    if (r === null) { e.dead = true; return; }
    e.y = r * TILE_SIZE - e.h;
    e.baseY = e.y;
    e.vy = 0;
    e.onGround = true;

    // Nếu vẫn còn chạm lửa (ví dụ cột hẹp kẹp giữa hai vực), bỏ con quái đó
    if (boxTouchesLava(e.x, e.y, e.w, e.h)) e.dead = true;
  });
}

/**
 * Neo prop (cây, cửa, rương, bảng...) xuống đúng mặt đất của cột nó đứng.
 * Prop được khai báo bằng toạ độ tuyệt đối; ở địa hình dâng cao prop sẽ lơ
 * lửng hoặc lọt vào trong đá nếu không neo lại.
 */
function settleProps() {
  const SKIP = new Set(['flag_vn', 'trophy', 'medal', 'crown', 'prop_portal', 'prop_flag']);
  props.forEach(pr => {
    if (SKIP.has(pr.type)) return;         // đích/bục vinh danh: giữ nguyên độ cao thiết kế
    if (pr.isGoal) return;
    const col = Math.floor((pr.x + pr.w / 2) / TILE_SIZE);
    const r = surfaceRow(col);
    if (r === null) return;                // đứng trên vực: để nguyên
    pr.y = r * TILE_SIZE - pr.h;
  });
}

// 6. WALKING MUSHROOM ENTITY (NẤM TĂNG TRƯỞNG MARIO)
class WalkingMushroom {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 28;
    this.vx = 0.9;
    this.vy = -3.2;
    this.onGround = false;
    this.collected = false;
  }

  update() {
    if (this.collected) return true;

    this.vy += PHYSICS.RISE_GRAVITY;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

    this.x += this.vx;

    const midY = Math.floor((this.y + this.h / 2) / TILE_SIZE);
    if (this.vx > 0) {
      const tileRight = Math.floor((this.x + this.w) / TILE_SIZE);
      if (player.isSolid(tileRight, midY)) {
        this.x = tileRight * TILE_SIZE - this.w - 0.01;
        this.vx *= -1;
      }
    } else if (this.vx < 0) {
      const tileLeft = Math.floor(this.x / TILE_SIZE);
      if (player.isSolid(tileLeft, midY)) {
        this.x = (tileLeft + 1) * TILE_SIZE + 0.01;
        this.vx *= -1;
      }
    }

    this.y += this.vy;
    this.onGround = false;
    const botTile = Math.floor((this.y + this.h) / TILE_SIZE);
    const midXTile = Math.floor((this.x + this.w / 2) / TILE_SIZE);

    if (player.isSolid(midXTile, botTile)) {
      this.y = botTile * TILE_SIZE - this.h;
      this.vy = 0;
      this.onGround = true;
    }

    // Nhặt nấm
    if (player.x + player.w > this.x && player.x < this.x + this.w &&
        player.y + player.h > this.y && player.y < this.y + this.h) {
      this.collected = true;
      player.growSuper();
      return true;
    }

    return this.y > VIEW_H + 90;
  }

  draw(cameraX) {
    if (this.collected) return;
    const rx = Math.round(this.x - cameraX);
    const ry = Math.round(this.y);
    if (rx < -40 || rx > VIEW_W + 40) return;

    const sprite = sprites['buff_mushroom'] || sprites['item_mushroom'];
    ctx.save();
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    if (sprite) {
      ctx.drawImage(sprite, rx + this.w / 2 - sprite.width / 2, ry + this.h - sprite.height,
                    sprite.width, sprite.height);
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(rx + 14, ry + 14, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function spawnWalkingMushroom(x, y) {
  activeMushrooms.push(new WalkingMushroom(x, y));
}

function spawnBrickDebris(bx, by) {
  const dirs = [
    { vx: -2.2, vy: -4.5 },
    { vx: 2.2, vy: -4.5 },
    { vx: -1.4, vy: -2.8 },
    { vx: 1.4, vy: -2.8 }
  ];
  dirs.forEach(d => {
    brickDebris.push({
      x: bx + 12,
      y: by + 12,
      vx: d.vx,
      vy: d.vy,
      rot: 0,
      life: 35
    });
  });
  screenShake = 6; // Rung màn hình nhẹ khi đập vỡ gạch
}

function spawnDust(x, y) {
  for (let i = 0; i < 3; i++) {
    dustParticles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y - 2,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 0.8,
      radius: Math.random() * 3 + 2,
      alpha: 0.7,
      life: 18
    });
  }
}

// 6B. PIRANHA PLANT ENTITY (CÂY HOA ĂN THỊT TRONG ỐNG CỐNG)
class PiranhaPlant {
  constructor(tx, ty) {
    this.tx = tx;
    this.ty = ty;
    this.x = tx * TILE_SIZE + 6;
    this.baseY = ty * TILE_SIZE;
    this.y = this.baseY;
    this.w = 28;
    this.h = 32;
    this.timer = Math.floor(Math.random() * 60);
    this.emergeHeight = 28;
    this.dead = false;
  }

  update() {
    if (this.dead) return;
    this.timer++;
    const cycle = this.timer % 180;
    if (cycle < 60) {
      this.y = this.baseY;
    } else if (cycle >= 60 && cycle < 80) {
      const p = (cycle - 60) / 20;
      this.y = this.baseY - p * this.emergeHeight;
    } else if (cycle >= 80 && cycle < 140) {
      this.y = this.baseY - this.emergeHeight;
    } else if (cycle >= 140 && cycle < 160) {
      const p = 1 - (cycle - 140) / 20;
      this.y = this.baseY - p * this.emergeHeight;
    } else {
      this.y = this.baseY;
    }

    // Nếu nhô lên và chạm Mario: gây sát thương
    if (this.y < this.baseY - 6) {
      if (player.x + player.w > this.x && player.x < this.x + this.w &&
          player.y + player.h > this.y && player.y < this.y + this.h) {
        if (player.hasStarPower) {
          this.dead = true;
          gameStats.score += 300;
          audio.playStomp();
          spawnFloatingText(this.x, this.y, '+300 🌟');
        } else {
          player.takeDamage();
        }
      }
    }
  }

  draw(cameraX) {
    if (this.dead) return;
    const rx = Math.round(this.x - cameraX);
    const ry = Math.round(this.y);
    if (rx < -40 || rx > VIEW_W + 40) return;
    const sprite = sprites['enemy_piranha'];
    if (sprite) {
      ctx.drawImage(sprite, rx + this.w / 2 - sprite.width / 2, ry + this.h - sprite.height,
                    sprite.width, sprite.height);
    }
  }
}

// 7. ENEMY CLASS (BỔ SUNG CƠ CHẾ MAI RÙA KOOPA SHELL 🐢)
class Enemy {
  constructor(x, y, type, isFlying = false) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = 28;
    this.h = 28;
    this.type = type;
    this.isFlying = isFlying;
    this.vx = (type === 'enemy_turtle' || type === 'enemy_bat') ? -0.85 : -0.65;
    this.vy = 0;
    this.dead = false;
    this.squashedTimer = 0;
    this.flyAngle = Math.random() * Math.PI;

    // CƠ CHẾ MAI RÙA (KOOPA SHELL)
    this.isShell = false;         // Đang ở dạng mai rùa
    this.isKicked = false;        // Mai rùa đang trượt nhanh càn quét
    this.kickCooldown = 0;
  }

  update() {
    if (this.dead) {
      this.squashedTimer--;
      return;
    }

    if (this.kickCooldown > 0) this.kickCooldown--;

    if (this.isFlying) {
      this.flyAngle += 0.04;
      this.y = this.baseY + Math.sin(this.flyAngle) * 28;
      this.x += this.vx * 0.7;
      return;
    }

    // Di chuyển ngang
    this.x += this.vx;

    // Va chạm ngang: quét TOÀN BỘ chiều cao hộp, không chỉ hàng giữa.
    // Trước đây chỉ xét midY nên quái lọt vào tường ở hàng thấp hơn.
    const topRow = Math.floor((this.y + 2) / TILE_SIZE);
    const botRow = Math.floor((this.y + this.h - 2) / TILE_SIZE);
    const dir = this.vx > 0 ? 1 : -1;
    const edgeCol = dir > 0 ? Math.floor((this.x + this.w) / TILE_SIZE)
                            : Math.floor(this.x / TILE_SIZE);
    let hitWall = false;
    for (let r = topRow; r <= botRow; r++) {
      if (player.isSolid(edgeCol, r)) { hitWall = true; break; }
    }
    if (hitWall) {
      // Đẩy ra khỏi tường rồi mới đảo hướng
      this.x = dir > 0 ? edgeCol * TILE_SIZE - this.w
                       : (edgeCol + 1) * TILE_SIZE;
      this.vx *= -1;
      if (this.isKicked) { audio.playBump(); screenShake = 3; }
    }

    // TRỌNG LỰC CHO QUÁI & CƠ CHẾ RƠI XUỐNG HỐ (PIT FALLING)
    this.vy = (this.vy || 0) + 0.35;
    if (this.vy > 7.0) this.vy = 7.0;
    this.y += this.vy;

    const botTile = Math.floor((this.y + this.h) / TILE_SIZE);
    const midXTile = Math.floor((this.x + this.w / 2) / TILE_SIZE);
    if (player.isSolid(midXTile, botTile)) {
      this.y = botTile * TILE_SIZE - this.h;
      this.vy = 0;
    }

    // BƯỚC LÊN BẬC: nếu hộp vẫn chồng lên ô rắn sát mặt đất (bậc thang, mỏm đá),
    // nâng quái lên đỉnh khối đó. Không có bước này quái bị lún hẳn vào trong đá
    // vì va chạm dọc chỉ snap theo ô ngay dưới chân.
    const feetY = this.y + this.h;
    const resTop = Math.floor((this.y + 2) / TILE_SIZE);
    const resBot = Math.floor((feetY - 2) / TILE_SIZE);
    const resL = Math.floor((this.x + 2) / TILE_SIZE);
    const resR = Math.floor((this.x + this.w - 2) / TILE_SIZE);
    for (let r = resTop; r <= resBot; r++) {
      let blocked = false;
      for (let c = resL; c <= resR; c++) {
        if (player.isSolid(c, r)) { blocked = true; break; }
      }
      if (!blocked) continue;
      const ledgeH = feetY - r * TILE_SIZE;      // bậc cao bao nhiêu so với chân
      if (ledgeH > 0 && ledgeH <= TILE_SIZE + 8) { // chỉ bước lên bậc thấp
        this.y = r * TILE_SIZE - this.h;
        this.vy = 0;
      }
      break;
    }

    // Quái đi lọt xuống hố vực sâu: Rơi mất tích & Tự chết vĩnh viễn!
    if (this.y > VIEW_H + 50) {
      this.dead = true;
    }

    // Nếu mai rùa đang trượt: CÀN QUÉT VÀ DIỆT TOÀN BỘ QUÁI KHÁC TRÊN ĐƯỜNG ĐI!
    if (this.isKicked) {
      enemies.forEach(other => {
        if (other !== this && !other.dead) {
          if (Math.hypot(this.x - other.x, this.y - other.y) < 26) {
            other.dead = true;
            gameStats.score += 300;
            audio.playStomp();
            spawnFloatingText(other.x, other.y, 'CÀN QUÉT! 💥');
            screenShake = 4;
          }
        }
      });
    }
  }

  stomp() {
    if (this.type === 'enemy_turtle') {
      if (!this.isShell) {
        // Biến thành mai rùa nằm yên!
        this.isShell = true;
        this.vx = 0;
        this.h = 20;
        this.y += 8;
        this.kickCooldown = 15;
        audio.playStomp();
        spawnFloatingText(this.x, this.y - 15, 'MAI RÙA! 🐢');
      } else if (!this.isKicked) {
        // Đá mai rùa trượt đi
        this.kick(player.facing);
      } else {
        // Dừng mai rùa đang chạy
        this.isKicked = false;
        this.vx = 0;
        audio.playStomp();
      }
    } else {
      // Quái vật thường bị bẹp
      this.dead = true;
      audio.playStomp();
    }
  }

  kick(dir) {
    this.isKicked = true;
    this.vx = dir * 4.6; // Mai rùa trượt thần tốc!
    this.kickCooldown = 20;
    audio.playKick();
    spawnFloatingText(this.x, this.y - 15, 'ĐÁ MAI! 🚀');
    screenShake = 4;
  }

  draw(cameraX) {
    const rx = Math.round(this.x - cameraX);
    const ry = Math.round(this.y);

    if (rx < -60 || rx > VIEW_W + 60) return;

    if (this.dead) {
      ctx.save();
      ctx.translate(rx, ry + 12);
      ctx.scale(1, 0.35);
      const sprite = sprites[this.type] || sprites['enemy_goomba'];
      if (sprite) ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height);
      ctx.restore();
      return;
    }

    const sprite = sprites[this.type] || sprites['enemy_goomba'];
    if (sprite) {
      // Blit 1:1 so the pre-pixelated art is never resampled by the canvas
      const dw = sprite.width;
      const dh = sprite.height;
      const footY = ry + this.h;
      ctx.save();
      // Nếu là Mai Rùa đang nằm hoặc trượt
      if (this.isShell) {
        ctx.translate(rx + this.w / 2, footY - dh / 2);
        if (this.isKicked) ctx.rotate(Date.now() * 0.02 * Math.sign(this.vx));
        ctx.drawImage(sprite, -dw / 2, -dh / 2, dw, dh * 0.62);
      } else {
        if (this.vx > 0) {
          ctx.scale(-1, 1);
          ctx.drawImage(sprite, -rx - this.w / 2 - dw / 2, footY - dh, dw, dh);
        } else {
          ctx.drawImage(sprite, rx + this.w / 2 - dw / 2, footY - dh, dw, dh);
        }
      }
      ctx.restore();
    }
  }
}

// 8. PLAYER CLASS - ĐẦY ĐỦ GIA TỐC, QUÁN TÍNH, NHẢY BIẾN THIÊN, COYOTE TIME & JUMP BUFFER
class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 2 * TILE_SIZE;
    this.y = 8 * TILE_SIZE;
    this.w = 22;
    this.h = 36;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.state = 'idle';
    this.invulnerableTimer = 0;
    this.shootTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.hasStarPower = false;
    this.starPowerTimer = 0;
    this.hasBoots = false;
    this.hasKey = false;
    
    // NẤM TĂNG TRƯỞNG & POWER-UP
    this.isSuper = false;
    this.growthAnimTimer = 0;

    // MARIO SECRET SAUCE: GAME FEEL TIMERS
    this.coyoteTimer = 0;       // Coyote Time: Cho phép nhảy sau khi rời mép vực
    this.jumpBufferTimer = 0;   // Jump Buffering: Ghi nhớ nút bấm nhảy trước khi chạm đất
    this.isSkidding = false;     // Trạng thái phanh trượt đổi hướng
    this.prevJumpKey = false;   // Theo dõi trạng thái nhả nút nhảy (Variable Jump)
    this.slidingGoal = false;   // Hoạt cảnh trượt cột cờ về đích
    this.goalTargetX = 0;
    this.stompCombo = 0;        // Combo giẫm quái liên tiếp không chạm đất
    this.hasFire = false;       // Trạng thái Fire Coder (bắn cầu lửa)
    this.isInPipe = false;      // Hoạt cảnh chui ống ngầm
  }

  growSuper() {
    if (!this.isSuper) {
      this.isSuper = true;
      this.growthAnimTimer = 35;
      // Hitbox cao 38px (< 40px = 1 ô đá) để Super vẫn lọt được khe hẹp 1 ô.
      // Trước đây 44px khiến nhân vật kẹt cứng ở mọi hành lang cao đúng 1 ô.
      this.w = 24;
      this.h = 38;
      this.y -= 2;
      if (gameStats.hearts < 4) gameStats.hearts = Math.min(gameStats.hearts + 1, 4);
      audio.playPowerup();
      showMentorToast("🍄 NẤM TĂNG TRƯỞNG: SUPER CODER! Bạn đã lớn lên và có thể đập vỡ khối gạch!");
      spawnFloatingText(this.x - 20, this.y - 28, 'SUPER CODER! 🍄');
      screenShake = 5;
    } else {
      gameStats.score += 500;
      audio.playCoin();
      spawnFloatingText(this.x, this.y - 25, '+500 EXP ⭐');
    }
  }

  shrinkSmall() {
    this.isSuper = false;
    this.hasFire = false;
    this.w = 22;
    this.h = 36;
    this.invulnerableTimer = 90;
    this.growthAnimTimer = 30;
    audio.playBump();
    spawnFloatingText(this.x, this.y - 20, 'THU NHỎ! ⬇️');
    screenShake = 6;
  }

  enterPipe() {
    this.isInPipe = true;
    this.vx = 0;
    this.vy = 1.0;
    audio.playPipe();
    showMentorToast("🕳️ BÍ MẬT 20/11: Khám phá kho báu dưới lòng đất!");
    setTimeout(() => {
      this.x = 34 * TILE_SIZE;
      this.y = 8 * TILE_SIZE;
      this.isInPipe = false;
      for (let i = 0; i < 6; i++) {
        collectibles.push({ x: (33.5 + i * 0.9) * TILE_SIZE, y: 7 * TILE_SIZE, type: 'coin', collected: false });
      }
      spawnFloatingText(this.x, this.y - 20, 'KHO BÁU BÍ MẬT! 🪙');
    }, 550);
  }

  update(keys) {
    if (gameState !== 'playing') return;

    if (this.isInPipe) {
      this.y += 1.0;
      return;
    }

    // Hoạt cảnh trượt cột cờ Mario
    if (this.slidingGoal) {
      if (!this.onGround) {
        this.vy = 2.4;
        this.vx = 0;
        this.state = 'slide';
        this.y += this.vy;
        this.checkVerticalCollisions();
      } else {
        this.vx = 1.6;
        this.facing = 1;
        this.state = 'run';
        this.x += this.vx;
        if (this.x >= this.goalTargetX) {
          this.slidingGoal = false;
          // BẮT ĐẦU HIỆU ỨNG QUA MÀN CẮT CẢNH (STAGE CLEAR CUTSCENE)
          isClearCutscene = true;
          clearCutsceneTimer = 0;
          clearFireworksLaunched = 0;
          this.vx = 0;
          this.state = 'idle';
          this.facing = 1;
          audio.stopBGM();
          audio.playVictory();
        }
      }
      return;
    }

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.growthAnimTimer > 0) this.growthAnimTimer--;
    if (this.shootTimer > 0) this.shootTimer--;
    if (this.starPowerTimer > 0) {
      this.starPowerTimer--;
      if (this.starPowerTimer === 0) this.hasStarPower = false;
    }

    // 1. DI CHUYỂN CÓ GIA TỐC & QUÁN TÍNH (ACCELERATION & INERTIA)
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'] || this.hasBoots;
    const maxSpeed = isRunning ? PHYSICS.MAX_RUN_SPEED : PHYSICS.MAX_WALK_SPEED;
    const accel = this.onGround ? (isRunning ? PHYSICS.RUN_ACCEL : PHYSICS.ACCEL) : PHYSICS.AIR_ACCEL;
    const decel = this.onGround ? PHYSICS.DECEL : PHYSICS.AIR_DECEL;

    const leftPressed = keys['ArrowLeft'] || keys['KeyA'] || virtualTouch.left;
    const rightPressed = keys['ArrowRight'] || keys['KeyD'] || virtualTouch.right;

    this.isSkidding = false;

    if (leftPressed && !rightPressed) {
      // Đổi hướng đột ngột: PHANH TRƯỢT (SKID)
      if (this.vx > 0.6 && this.onGround) {
        this.vx *= PHYSICS.SKID_DECEL;
        this.isSkidding = true;
        if (Math.random() < 0.4) {
          spawnDust(this.x + this.w, this.y + this.h);
          audio.playSkid();
        }
      } else {
        this.vx -= accel;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        this.facing = -1;
      }
      if (this.onGround && !this.isSkidding) this.state = 'run';
    } else if (rightPressed && !leftPressed) {
      if (this.vx < -0.6 && this.onGround) {
        this.vx *= PHYSICS.SKID_DECEL;
        this.isSkidding = true;
        if (Math.random() < 0.4) {
          spawnDust(this.x, this.y + this.h);
          audio.playSkid();
        }
      } else {
        this.vx += accel;
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        this.facing = 1;
      }
      if (this.onGround && !this.isSkidding) this.state = 'run';
    } else {
      // Nhả phím: Giảm tốc tự nhiên do ma sát
      this.vx *= decel;
      if (Math.abs(this.vx) < 0.08) this.vx = 0;
      if (this.onGround && this.shootTimer === 0) this.state = 'idle';
    }

    // Cơ chế chui ống ngầm vào phòng thưởng bí mật (Underground Pipe Vault)
    if (this.onGround && (keys['ArrowDown'] || keys['KeyS']) && !this.isInPipe) {
      const pTileX = Math.floor((this.x + this.w / 2) / TILE_SIZE);
      const pTileY = Math.floor((this.y + this.h + 2) / TILE_SIZE);
      if (levelMap[pTileY] && levelMap[pTileY][pTileX] === 'pipe_green' && (pTileX === 26 || pTileX === 27)) {
        this.enterPipe();
        return;
      }
    }

    // 2. COYOTE TIME & JUMP BUFFERING (MARIO SECRET SAUCE)
    const jumpPressed = keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || virtualTouch.jump;
    const jumpJustPressed = jumpPressed && !this.prevJumpKey;
    const jumpReleased = !jumpPressed && this.prevJumpKey;
    this.prevJumpKey = jumpPressed;

    if (this.onGround) {
      this.coyoteTimer = PHYSICS.COYOTE_TIME;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    if (jumpJustPressed) {
      this.jumpBufferTimer = PHYSICS.JUMP_BUFFER;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    // THỰC HIỆN CÚ NHẢY (3 MỨC VẬN TỐC THEO TỐC ĐỘ CHẠY BẢN GỐC NES)
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      const speedRatio = Math.min(1.0, Math.abs(this.vx) / PHYSICS.MAX_WALK_SPEED);
      this.vy = PHYSICS.JUMP_SPEED_SLOW + (PHYSICS.JUMP_SPEED_FAST - PHYSICS.JUMP_SPEED_SLOW) * speedRatio;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.state = 'jump';
      audio.playJump();
      spawnDust(this.x + this.w / 2, this.y + this.h);
    }

    // NHẢ NÚT SỚM: CẮT NGẮN CÚ NHẢY (VARIABLE JUMP HEIGHT!)
    if (jumpReleased && this.vy < -2.2) {
      this.vy *= 0.55; // Cắt giảm vận tốc đi lên vừa phải, êm ái
    }

    // 3. TRỌNG LỰC 2 PHA: RƠI NẶNG HƠN BAY LÊN
    const currentGravity = this.vy > 0 ? PHYSICS.FALL_GRAVITY : PHYSICS.RISE_GRAVITY;
    this.vy += currentGravity;
    if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

    if (!this.onGround) {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    }

    // Bắn đạn
    if ((keys['KeyJ'] || keys['KeyX'] || virtualTouch.shoot) && this.shootTimer === 0) {
      this.shoot();
      this.shootTimer = 18;
    }

    // 4. VA CHẠM NGANG (X-COLLISION)
    this.x += this.vx;
    this.checkHorizontalCollisions();

    // 5. VA CHẠM DỌC (Y-COLLISION CÓ CORNER CORRECTION)
    this.y += this.vy;
    this.onGround = false;
    this.checkVerticalCollisions();

    // 5b. CHẠM DUNG NHAM: quét overlap riêng vì lava không phải khối rắn
    this.checkLavaContact();

    // Rơi vực
    if (this.y > VIEW_H + 90) {
      this.takeDamage(true);
    }

    // Húc đầu khối gạch / khối ?
    this.checkBlockBump();

    // Hoạt ảnh
    this.animTimer++;
    if (this.animTimer > (isRunning ? 6 : 9)) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  shoot() {
    audio.playShoot();
    this.state = 'shoot';
    projectiles.push({
      x: this.facing === 1 ? this.x + this.w : this.x - 14,
      y: this.y + (this.isSuper ? 18 : 12),
      vx: this.facing * 4.6,
      vy: 1.0,
      bounces: 0,
      life: 90
    });
  }

  takeDamage(instantKill = false) {
    if (this.hasStarPower) return;
    if (this.invulnerableTimer > 0 && !instantKill) return;

    if (instantKill) {
      gameStats.hearts = 0;
      triggerGameOver();
      return;
    }

    if (this.isSuper) {
      this.shrinkSmall();
      this.vy = -5.5;
      return;
    }

    gameStats.hearts--;
    this.invulnerableTimer = 90;
    this.vy = -5.5;
    audio.playBump();
    screenShake = 6;

    if (gameStats.hearts <= 0) {
      triggerGameOver();
    }
  }

  checkHorizontalCollisions() {
    const topTile = Math.floor(this.y / TILE_SIZE);
    const bottomTile = Math.floor((this.y + this.h - 1) / TILE_SIZE);

    if (this.vx > 0) {
      const rightTile = Math.floor((this.x + this.w) / TILE_SIZE);
      for (let ty = topTile; ty <= bottomTile; ty++) {
        if (this.isSolid(rightTile, ty)) {
          this.x = rightTile * TILE_SIZE - this.w - 0.01;
          this.vx = 0;
          break;
        }
      }
    } else if (this.vx < 0) {
      const leftTile = Math.floor(this.x / TILE_SIZE);
      for (let ty = topTile; ty <= bottomTile; ty++) {
        if (this.isSolid(leftTile, ty)) {
          this.x = (leftTile + 1) * TILE_SIZE + 0.01;
          this.vx = 0;
          break;
        }
      }
    }
  }

  checkVerticalCollisions() {
    // CORNER CORRECTION: Dung sai 3px 2 bên mép
    const leftTile = Math.floor((this.x + 3) / TILE_SIZE);
    const rightTile = Math.floor((this.x + this.w - 4) / TILE_SIZE);

    if (this.vy >= 0) {
      const bottomTile = Math.floor((this.y + this.h) / TILE_SIZE);
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isSolid(tx, bottomTile)) {
          this.y = bottomTile * TILE_SIZE - this.h;
          this.vy = 0;
          this.onGround = true;
          this.stompCombo = 0; // Chạm đất reset combo giẫm liên hoàn
          break;
        }
      }
    } else if (this.vy < 0) {
      const topTile = Math.floor(this.y / TILE_SIZE);
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (this.isSolid(tx, topTile)) {
          this.y = (topTile + 1) * TILE_SIZE;
          this.vy = 0;
          audio.playBump();
          break;
        }
      }
    }
  }

  /**
   * Dung nham KHÔNG phải khối rắn (isSolid trả false) nên không thể dựa vào
   * va chạm vật lý để phát hiện. Quét overlap AABB với ô lava mỗi frame.
   */
  checkLavaContact() {
    if (this.isInPipe || this.slidingGoal) return false;

    const leftTile = Math.floor((this.x + 3) / TILE_SIZE);
    const rightTile = Math.floor((this.x + this.w - 4) / TILE_SIZE);
    const topTile = Math.floor(this.y / TILE_SIZE);
    const bottomTile = Math.floor((this.y + this.h - 1) / TILE_SIZE);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      const row = levelMap[ty];
      if (!row) continue;
      for (let tx = leftTile; tx <= rightTile; tx++) {
        const t = row[tx];
        if (t === 'lava' || t === 'block_lava') {
          if (this.hasStarPower) return false;       // Sao bất tử bỏ qua dung nham
          if (this.invulnerableTimer > 0) return true; // Đang bất tử tạm thời

          this.takeDamage();
          // Hất văng lên khỏi miệng dung nham để không chết kẹt liên tục
          this.vy = -8.0;
          this.onGround = false;
          audio.playBump();
          screenShake = 7;
          spawnFloatingText(this.x, this.y - 20, 'DUNG NHAM! 🔥');
          return true;
        }
      }
    }
    return false;
  }

  checkBlockBump() {
    if (this.vy >= 0) return;
    const headX = this.x + this.w / 2;
    const headY = this.y;

    for (let bi = interactiveBlocks.length - 1; bi >= 0; bi--) {
      const b = interactiveBlocks[bi];
      if (headX >= b.x - 2 && headX <= b.x + TILE_SIZE + 2 && headY <= b.y + TILE_SIZE + 4 && headY >= b.y + TILE_SIZE - 10) {
        if (!b.used) {
          if (this.isSuper && (b.type === 'brick' || b.type === 'block_brick') && !b.content) {
            b.used = true;
            interactiveBlocks.splice(bi, 1);
            audio.playStomp();
            gameStats.score += 100;
            spawnFloatingText(b.x + 4, b.y - 15, '+100 💥');
            spawnBrickDebris(b.x, b.y);
            this.vy = 1;
            return;
          }

          b.bumpY = -8;
          b.used = true;
          audio.playBump();
          this.vy = 2;

          if (b.content === 'mushroom') {
            spawnWalkingMushroom(b.x + 6, b.y - 32);
            audio.playPowerup();
            spawnFloatingText(b.x - 10, b.y - 20, 'NẤM XUẤT HIỆN! 🍄');
          } else if (b.content === 'coin') {
            addCoin(b.x + 8, b.y - 18);
          } else if (b.content === 'scroll') {
            gameStats.score += 400;
            audio.playPowerup();
            const quotes = STAGE_QUOTES[currentStage] || STAGE_QUOTES[1];
            showMentorToast(quotes[Math.floor(Math.random() * quotes.length)]);
            spawnFloatingText(b.x - 15, b.y - 18, 'BÍ KÍP! 📜');
          } else if (b.content === 'book') {
            gameStats.score += 600;
            audio.playPowerup();
            showMentorToast("Thầy Cấn: 'Viết code cho người đọc trước, cho máy sau!' (+600 EXP)");
            spawnFloatingText(b.x - 15, b.y - 18, 'CLEAN CODE 📖');
          } else if (b.content === 'key') {
            this.hasKey = true;
            audio.playPowerup();
            showMentorToast("Đã nhặt được Chìa Khóa Vàng để mở cửa ải tiếp theo! 🔑");
            spawnFloatingText(b.x + 5, b.y - 18, 'CHÌA KHÓA! 🔑');
          } else if (b.content === 'flower') {
            collectibles.push({ x: b.x + 6, y: b.y - 30, type: 'flower', collected: false });
            audio.playPowerup();
            spawnFloatingText(b.x - 10, b.y - 20, 'HOA LỬA! 🔥');
          } else if (b.content === 'shield') {
            this.hasStarPower = true;
            this.starPowerTimer = 350;
            audio.playPowerup();
            spawnFloatingText(b.x - 5, b.y - 18, 'KHIÊN BẢO VỆ! 🛡️');
          } else if (b.content === 'star' || b.content === 'star_2x') {
            this.hasStarPower = true;
            this.starPowerTimer = 400;
            audio.playPowerup();
            spawnFloatingText(b.x - 10, b.y - 18, 'BẤT TỬ 2X! 🌟');
          } else if (b.content === 'boots') {
            this.hasBoots = true;
            audio.playPowerup();
            spawnFloatingText(b.x - 5, b.y - 18, 'GIÀY TỐC ĐỘ! 👟');
          }
          break;
        }
      }
    }
  }

  isSolid(tx, ty) {
    if (ty < 0 || ty >= LEVEL_HEIGHT_TILES || tx < 0 || tx >= LEVEL_WIDTH_TILES) {
      return false;
    }
    const tile = levelMap[ty][tx];
    if (tile && tile !== 'ladder' && tile !== 'lava' && tile !== 'block_lava') return true;

    const block = interactiveBlocks.find(b => b.tx === tx && b.ty === ty);
    return !!block;
  }

  draw(cameraX) {
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    const rx = Math.round(this.x - cameraX);
    const ry = Math.round(this.y);

    let spriteKey = 'player_idle';
    if (this.isSkidding) {
      spriteKey = 'player_slide'; // Sprite trượt phanh khi quay đầu đột ngột!
    } else if (this.state === 'run') {
      spriteKey = this.animFrame === 0 ? 'player_run' : 'player_idle';
    } else if (this.state === 'jump') {
      spriteKey = 'player_jump';
    } else if (this.state === 'fall') {
      spriteKey = 'player_fall';
    } else if (this.state === 'shoot') {
      spriteKey = 'player_shoot';
    }

    const sprite = sprites[spriteKey] || sprites['player_idle'];

    ctx.save();
    
    if (this.hasStarPower) {
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 18;
    } else if (this.isSuper) {
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 10;
    }

    const drawW = sprite ? sprite.width : 32;
    const drawH = sprite ? sprite.height : 42;

    const drawOffsetX = Math.round((drawW - this.w) / 2);
    const drawOffsetY = (drawH - this.h);

    if (sprite) {
      if (this.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -rx - this.w - drawOffsetX, ry - drawOffsetY, drawW, drawH);
      } else {
        ctx.drawImage(sprite, rx - drawOffsetX, ry - drawOffsetY, drawW, drawH);
      }
    }
    ctx.restore();
  }
}

// 9. GAME STATS & CONTROLLER
const player = new Player();
const gameStats = {
  score: 0,
  coins: 0,
  hearts: 3,
  time: NES_CONFIG.level_time,
  timeTick: 0
};

function addCoin(x, y) {
  gameStats.coins++;
  gameStats.score += 200;
  audio.playCoin();
  spawnFloatingText(x, y, '+200 🪙');
  if (gameStats.coins >= 100) {
    gameStats.coins -= 100;
    gameStats.hearts = Math.min(gameStats.hearts + 1, 4);
    audio.playPowerup();
    spawnFloatingText(player.x, player.y - 20, '1-UP! ❤️');
  }
}

let gameState = 'start';
let cameraX = 0;
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

const virtualTouch = { left: false, right: false, jump: false, shoot: false };
function bindTouchBtn(id, keyProp) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('touchstart', (e) => { e.preventDefault(); virtualTouch[keyProp] = true; });
  el.addEventListener('touchend', (e) => { e.preventDefault(); virtualTouch[keyProp] = false; });
  el.addEventListener('mousedown', () => { virtualTouch[keyProp] = true; });
  el.addEventListener('mouseup', () => { virtualTouch[keyProp] = false; });
}
bindTouchBtn('touch-left', 'left');
bindTouchBtn('touch-right', 'right');
bindTouchBtn('touch-jump', 'jump');
bindTouchBtn('touch-shoot', 'shoot');

function spawnFloatingText(x, y, text) {
  floatingTexts.push({ x, y, text, life: 50, vy: -1.0 });
}

// Check player interactions with items, hazards & triggers
function checkInteractions() {
  // 1. Collectibles
  collectibles.forEach(item => {
    if (!item.collected) {
      if (Math.hypot(player.x + player.w/2 - (item.x + 14), player.y + player.h/2 - (item.y + 14)) < 26) {
        item.collected = true;
        if (item.type === 'mushroom') {
          player.growSuper();
        } else if (item.type === 'flower') {
          player.hasFire = true;
          player.growSuper();
          gameStats.score += 1000;
          audio.playPowerup();
          showMentorToast("🔥 HOA LỬA: Bạn đã hóa FIRE CODER! Bấm J/X để ném Cầu Lửa nảy đất!");
          spawnFloatingText(item.x, item.y, 'FIRE CODER! 🔥');
        } else if (item.type === 'star') {
          player.hasStarPower = true;
          player.starPowerTimer = 600;
          gameStats.score += 1000;
          audio.playPowerup();
          showMentorToast("⭐ SAO BẤT TỬ: Vô địch trong 10 giây!");
          spawnFloatingText(item.x, item.y, 'BẤT TỬ! ⭐');
        } else if (item.type === 'coin') {
          addCoin(item.x, item.y);
        } else if (item.type === 'diamond') {
          gameStats.score += 300;
          audio.playCoin();
          spawnFloatingText(item.x, item.y, '+300 💎');
        } else if (item.type === 'key') {
          player.hasKey = true;
          audio.playPowerup();
          showMentorToast("Đã thu thập Chìa Khóa Vàng để mở cửa ải! 🔑");
          spawnFloatingText(item.x, item.y, 'CHÌA KHÓA! 🔑');
        } else if (item.type === 'orb') {
          gameStats.score += 500;
          audio.playPowerup();
          spawnFloatingText(item.x, item.y, 'SKILL ORB! 🔮');
        } else if (item.type === 'scroll' || item.type === 'book') {
          gameStats.score += 400;
          audio.playPowerup();
          const quotes = STAGE_QUOTES[currentStage] || STAGE_QUOTES[1];
          showMentorToast(quotes[Math.floor(Math.random() * quotes.length)]);
          spawnFloatingText(item.x, item.y, 'BÍ KÍP! 📜');
        }
      }
    }
  });

  // 2. Triggers
  triggers.forEach(tr => {
    if (tr.isPlatform) {
      tr.x += tr.vx;
      if (tr.x <= tr.minX || tr.x >= tr.maxX) tr.vx *= -1;

      if (player.vy >= 0 &&
          player.x + player.w > tr.x && player.x < tr.x + tr.w &&
          player.y + player.h >= tr.y && player.y + player.h <= tr.y + 12) {
        player.y = tr.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.x += tr.vx;
      }
    }

    if (tr.type === 'trigger_spring') {
      if (player.vy >= 0 &&
          player.x + player.w > tr.x && player.x < tr.x + tr.w &&
          player.y + player.h >= tr.y && player.y + player.h <= tr.y + 14) {
        player.vy = -14.5;
        audio.playSpring();
        spawnFloatingText(tr.x, tr.y - 20, 'BẬT CAO! 🚀');
        spawnDust(tr.x + tr.w / 2, tr.y);
      }
    }

    if (tr.isHazard) {
      if (player.x + player.w > tr.x + 4 && player.x < tr.x + tr.w - 4 &&
          player.y + player.h > tr.y + 4 && player.y < tr.y + tr.h) {
        player.takeDamage();
      }
    }
  });

  // 3. Projectiles vs Enemies & Piranha Plants (Cơ chế Cầu Lửa nảy đất)
  for (let pi = projectiles.length - 1; pi >= 0; pi--) {
    const p = projectiles[pi];
    p.x += p.vx;
    p.vy = (p.vy || 0) + 0.32;
    p.y += p.vy;
    p.life--;

    // Đập đất nảy lên tưng tưng
    const pTileX = Math.floor(p.x / TILE_SIZE);
    const pTileY = Math.floor((p.y + 10) / TILE_SIZE);
    if (player.isSolid(pTileX, pTileY)) {
      p.y = pTileY * TILE_SIZE - 10;
      p.vy = -3.4;
      p.bounces = (p.bounces || 0) + 1;
      audio.playBump();
      spawnDust(p.x, p.y + 8);
      if (p.bounces > 4) p.life = 0;
    }

    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei];
      if (!e.dead && p.x >= e.x && p.x <= e.x + e.w && p.y >= e.y && p.y <= e.y + e.h) {
        e.dead = true;
        p.life = 0;
        gameStats.score += 200;
        audio.playStomp();
        spawnFloatingText(e.x, e.y, 'CẦU LỬA! 🔥');
        screenShake = 3;
        break;
      }
    }

    for (let pii = 0; pii < piranhaPlants.length; pii++) {
      const pl = piranhaPlants[pii];
      if (!pl.dead && pl.y < pl.baseY - 4) {
        if (p.x >= pl.x && p.x <= pl.x + pl.w && p.y >= pl.y && p.y <= pl.y + pl.h) {
          pl.dead = true;
          p.life = 0;
          gameStats.score += 300;
          audio.playStomp();
          spawnFloatingText(pl.x, pl.y, 'DIỆT HOA! 🔥');
          screenShake = 4;
          break;
        }
      }
    }

    if (p.life <= 0) projectiles.splice(pi, 1);
  }

  // 4. Player vs Enemies (CƠ CHẾ GIẪM ĐẦU & MAI RÙA KOOPA)
  enemies.forEach(e => {
    if (e.dead) return;

    if (player.x + player.w > e.x && player.x < e.x + e.w &&
        player.y + player.h > e.y && player.y < e.y + e.h) {
      
      // Giẫm đầu từ trên xuống (Combo liên tiếp không chạm đất chuẩn Mario)
      if (player.vy > 0 && player.y + player.h <= e.y + 14) {
        player.vy = -5.5; // Nảy lên êm ái sau cú giẫm
        e.stomp();
        const comboScores = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
        const comboIdx = player.stompCombo || 0;
        if (comboIdx < comboScores.length) {
          const pts = comboScores[comboIdx];
          gameStats.score += pts;
          spawnFloatingText(e.x, e.y, `+${pts} 🦶`);
        } else {
          gameStats.hearts = Math.min(gameStats.hearts + 1, 4);
          audio.playPowerup();
          spawnFloatingText(e.x, e.y, '1-UP! ❤️');
        }
        player.stompCombo = comboIdx + 1;
        spawnDust(e.x + e.w / 2, e.y + e.h);
        screenShake = 3;
      } 
      // Chạm từ 2 bên vào Mai Rùa đang nằm yên: ĐÁ MAI RÙA TRƯỢT ĐI!
      else if (e.isShell && !e.isKicked && e.kickCooldown === 0) {
        const kickDir = player.x + player.w / 2 < e.x + e.w / 2 ? 1 : -1;
        e.kick(kickDir);
      }
      // Bị quái cắn hoặc bị mai rùa đang trượt đâm vào
      else if (!e.isShell || e.isKicked) {
        player.takeDamage();
      }
    }
  });

  // 5. Goal Trigger Check (Flagpole slide & walk into castle)
  const goalProp = props.find(p => p.isGoal);
  if (goalProp && player.x >= goalProp.x - 10 && gameState === 'playing' && !player.slidingGoal) {
    player.slidingGoal = true;
    player.goalTargetX = goalProp.x + 60;
    const heightPercent = Math.max(0.1, Math.min(1.0, (goalProp.y + goalProp.h - player.y) / goalProp.h));
    const polePoints = Math.round(heightPercent * 50) * 100;
    gameStats.score += polePoints;
    audio.playVictory();
    spawnFloatingText(goalProp.x, player.y, `+${polePoints} 🚩`);
  }
}

function triggerStageClear() {
  gameState = 'stage_clear';
  audio.stopBGM();
  const modal = document.getElementById('stage-clear-overlay');
  const title = document.getElementById('stage-clear-title');
  const desc = document.getElementById('stage-clear-desc');
  const scoreEl = document.getElementById('stage-clear-score');

  title.textContent = `VƯỢT THÀNH CÔNG MÀN ${currentStage}!`;
  desc.textContent = currentStage === 1
    ? "Chúc mừng bạn đã vượt qua Thảo Nguyên! Tiếp tục tiến vào Lâu Đài OOP..."
    : "Xuất sắc! Cánh cửa lâu đài đã mở, chuẩn bị đối mặt với Đấu Trường Dung Nham & Đài Vinh Danh!";
  if (scoreEl) scoreEl.textContent = `⭐ TỔNG ĐIỂM: ${gameStats.score} | XU: ${gameStats.coins} 🪙`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
}

function triggerVictory() {
  gameState = 'victory';
  audio.stopBGM();
  const modal = document.getElementById('victory-overlay');
  const scoreEl = document.getElementById('victory-score-detail');
  if (scoreEl) {
    scoreEl.textContent = `🏆 TỔNG ĐIỂM HOÀN TẤT: ${gameStats.score} | XU THU THẬP: ${gameStats.coins} 🪙 | RANK: SENIOR ARCHITECT (S+)`;
  }
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  confetti({ particleCount: 220, spread: 140, origin: { y: 0.5 } });
  setTimeout(() => {
    confetti({ particleCount: 150, angle: 60, spread: 70, origin: { x: 0 } });
    confetti({ particleCount: 150, angle: 120, spread: 70, origin: { x: 1 } });
  }, 350);
}

function triggerGameOver() {
  gameState = 'gameover';
  audio.stopBGM();
  audio.playBump();
  document.getElementById('gameover-overlay').classList.remove('hidden');
  document.getElementById('gameover-overlay').classList.add('flex');
}

// 10. RENDER PIPELINE - SCREEN SHAKE & GAME JUICE
function render() {
  ctx.imageSmoothingEnabled = false;

  // Xử lý rung chấn màn hình (Screen Shake)
  let offsetX = 0;
  let offsetY = 0;
  if (screenShake > 0) {
    offsetX = (Math.random() - 0.5) * screenShake;
    offsetY = (Math.random() - 0.5) * screenShake;
    screenShake *= 0.85;
    if (screenShake < 0.5) screenShake = 0;
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Bầu trời
  const skyGrad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  if (currentStage === 1) {
    skyGrad.addColorStop(0, '#38BDF8');
    skyGrad.addColorStop(1, '#BAE6FD');
  } else if (currentStage === 2) {
    skyGrad.addColorStop(0, '#1E1B4B');
    skyGrad.addColorStop(1, '#312E81');
  } else {
    skyGrad.addColorStop(0, '#7F1D1D');
    skyGrad.addColorStop(1, '#B91C1C');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Camera NES: Cuộn ngang khi Mario vượt qua nửa màn hình, không cuộn lùi
  const midScreen = player.x - VIEW_W / 2;
  if (midScreen > cameraX) {
    cameraX = Math.min((LEVEL_WIDTH_TILES * TILE_SIZE) - VIEW_W, midScreen);
  }
  // Tường vô hình chặn Mario đi lùi ra khỏi mép trái màn hình
  if (player.x < cameraX) {
    player.x = cameraX;
    if (player.vx < 0) player.vx = 0;
  }
  const snapCamX = Math.round(cameraX);

  drawBackgroundAmbience(snapCamX);

  // Đạo cụ phông nền
  // Trang trí 20/11 (vẽ sau nền, trước prop để prop/đích luôn nổi lên trên)
  drawFestiveDecor(snapCamX);

  props.forEach(p => {
    const rx = Math.round(p.x - snapCamX);
    if (rx < -100 || rx > VIEW_W + 100) return;
    const sprite = sprites[p.type];
    if (sprite) {
      // Drawn at its natural size, bottom-anchored on the declared footprint
      const dy = Math.round(p.y + p.h - sprite.height);
      ctx.drawImage(sprite, rx, dy, sprite.width, sprite.height);

      // Cột cờ Việt Nam: sprite chỉ có 60px cột ở phần đầu, khung khai báo 180px
      // nên phần dưới bị trong suốt → nối cột xuống tới chân bục cho khỏi lơ lửng.
      if (p.type === 'flag_vn') {
        const poleX = rx + 5;
        const poleTop = dy + 2;
        const poleBot = Math.round(p.y + p.h);
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(poleX, poleTop, 4, poleBot - poleTop);
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(poleX + 3, poleTop, 1, poleBot - poleTop);
        // chân cột + bệ đá
        ctx.fillStyle = '#64748B';
        ctx.fillRect(poleX - 5, poleBot - 6, 14, 6);
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(poleX + 2, poleTop - 3, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // Cây hoa Piranha trong ống cống (vẽ trước ống để ống cống che phần thân dưới chuẩn NES)
  piranhaPlants.forEach(p => p.draw(snapCamX));

  // Khối bản đồ Seamless
  for (let ty = 0; ty < LEVEL_HEIGHT_TILES; ty++) {
    for (let tx = 0; tx < LEVEL_WIDTH_TILES; tx++) {
      const tile = levelMap[ty][tx];
      if (!tile) continue;

      const rx = tx * TILE_SIZE - snapCamX;
      const ry = ty * TILE_SIZE;

      if (rx < -TILE_SIZE || rx > VIEW_W) continue;

      const sprite = sprites[tile] || sprites[`block_${tile}`];
      if (sprite) {
        ctx.drawImage(sprite, rx, ry, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = tile.includes('lava') ? '#DC2626' : '#22C55E';
        ctx.fillRect(rx, ry, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Khối tương tác ? và gạch
  interactiveBlocks.forEach(b => {
    if (b.bumpY < 0) b.bumpY += 1;
    const rx = b.x - snapCamX;
    const ry = Math.round(b.y + b.bumpY);

    if (rx < -TILE_SIZE || rx > VIEW_W) return;

    if (b.used) {
      const img = sprites['stone'] || sprites['block_stone'];
      if (img) ctx.drawImage(img, rx, ry, TILE_SIZE, TILE_SIZE);
    } else {
      const img = sprites[b.type] || sprites['question_block'] || sprites['block_question'];
      if (img) ctx.drawImage(img, rx, ry, TILE_SIZE, TILE_SIZE);
    }
  });

  // Bàn nhún & cầu di động
  triggers.forEach(tr => {
    const rx = Math.round(tr.x - snapCamX);
    if (rx < -tr.w || rx > VIEW_W) return;

    const sprite = sprites[tr.type];
    if (sprite) {
      // Must use rx (screen space, camera already subtracted) — using tr.x here
      // drew the sprite offset by cameraX, so it drifted away as the camera scrolled.
      ctx.drawImage(sprite, Math.round(rx + tr.w / 2 - sprite.width / 2),
                    Math.round(tr.y + tr.h - sprite.height), sprite.width, sprite.height);
    }
  });

  // Nấm tăng trưởng
  for (let mi = activeMushrooms.length - 1; mi >= 0; mi--) {
    const m = activeMushrooms[mi];
    const shouldRemove = m.update();
    m.draw(snapCamX);
    if (shouldRemove) activeMushrooms.splice(mi, 1);
  }

  // Mảnh vỡ gạch khi Super Coder phá gạch
  for (let bi = brickDebris.length - 1; bi >= 0; bi--) {
    const d = brickDebris[bi];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += PHYSICS.RISE_GRAVITY;
    d.rot += 0.2;
    d.life--;
    const drx = Math.round(d.x - snapCamX);
    const dry = Math.round(d.y);

    ctx.save();
    ctx.translate(drx, dry);
    ctx.rotate(d.rot);
    const brickImg = sprites['brick'];
    if (brickImg) {
      ctx.drawImage(brickImg, -7, -7, 14, 14);
    } else {
      ctx.fillStyle = '#B45309';
      ctx.fillRect(-6, -6, 12, 12);
    }
    ctx.restore();

    if (d.life <= 0) brickDebris.splice(bi, 1);
  }

  // Bụi trượt chân & tiếp đất (Skid dust)
  for (let di = dustParticles.length - 1; di >= 0; di--) {
    const p = dustParticles[di];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.04;
    p.radius *= 0.94;
    p.life--;

    const prx = Math.round(p.x - snapCamX);
    ctx.beginPath();
    ctx.arc(prx, Math.round(p.y), Math.max(1, p.radius), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 240, 240, ${Math.max(0, p.alpha)})`;
    ctx.fill();

    if (p.life <= 0 || p.alpha <= 0) dustParticles.splice(di, 1);
  }

  // Vật phẩm thu thập
  collectibles.forEach(item => {
  if (item.collected) return;
  const rx = Math.round(item.x - snapCamX);
  const sprite = sprites[`item_${item.type}`] || sprites[`buff_${item.type}`] || sprites[item.type] || sprites['item_coin'];
  if (!sprite) return;
  const ry = Math.round(item.y + Math.sin(Date.now() * 0.005) * 3 + 26 - sprite.height);

  if (rx < -TILE_SIZE || rx > VIEW_W) return;

  ctx.drawImage(sprite, rx, ry, sprite.width, sprite.height);
  });

  if (currentStage === 3) {
    const goalX = Math.round((LEVEL_WIDTH_TILES - 9) * TILE_SIZE - snapCamX);
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#FDE047';
    ctx.fillText('MENTOR CODEGYM', goalX - 10, 2.0 * TILE_SIZE);
  }

  // Quái vật
  enemies.forEach(e => e.draw(snapCamX));

  // Nhân vật Mario
  player.draw(snapCamX);

  // Đạn code & Cầu Lửa Mario (Fireball)
  projectiles.forEach(p => {
    const rx = Math.round(p.x - snapCamX);
    const ry = Math.round(p.y);
    if (player.hasFire) {
      // Cầu lửa nảy đất chuẩn Mario NES
      ctx.save();
      ctx.beginPath();
      ctx.arc(rx + 6, ry + 6, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FB923C';
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rx + 6, ry + 6, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
      ctx.restore();
    } else {
      const bulletSprite = sprites['effect_bullet'];
      if (bulletSprite) {
        ctx.drawImage(bulletSprite, rx - 10, ry - 10, 22, 22);
      } else {
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00F0FF';
        ctx.fill();
      }
    }
  });

  // Chữ bay
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy;
    ft.life--;
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(ft.text, Math.round(ft.x - snapCamX), Math.round(ft.y));
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  // Pháo hoa ăn mừng qua màn (Celebration Fireworks)
  for (let fi = fireworksParticles.length - 1; fi >= 0; fi--) {
    const fp = fireworksParticles[fi];
    fp.x += fp.vx;
    fp.y += fp.vy;
    fp.vy += 0.06;
    fp.alpha -= 0.022;
    fp.life--;
    const rx = Math.round(fp.x - snapCamX);
    const ry = Math.round(fp.y);
    ctx.save();
    ctx.globalAlpha = Math.max(0, fp.alpha);
    ctx.fillStyle = fp.color;
    ctx.shadowColor = fp.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(rx, ry, Math.max(1, fp.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (fp.life <= 0 || fp.alpha <= 0) fireworksParticles.splice(fi, 1);
  }

  ctx.restore(); // Hoàn tất translate của screen shake

  // Banner hiệu ứng mừng vượt ải rực rỡ
  if (isClearCutscene) {
    ctx.save();
    const bannerY = 85;
    ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
    ctx.fillRect(20, bannerY, VIEW_W - 40, 72);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, bannerY, VIEW_W - 40, 72);

    ctx.font = 'bold 15px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FDE047';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 14;
    const bannerText = currentStage === 3 ? "🏆 TRI ÂN 20/11: CHIẾN THẮNG HUY HOÀNG! 🏆" : `⭐ VƯỢT THÀNH CÔNG MÀN ${currentStage}! ⭐`;
    ctx.fillText(bannerText, VIEW_W / 2, bannerY + 30);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#6EE7B7';
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 8;
    ctx.fillText(`TIME BONUS: ${gameStats.time}s -> TỔNG ĐIỂM: ${gameStats.score}`, VIEW_W / 2, bannerY + 54);
    ctx.restore();
  }

  // Retro HUD cố định trên cùng
  drawHUD();
}

// ============ TRANG TRÍ NGÀY NHÀ GIÁO VIỆT NAM 20/11 ============
// Bảng màu cờ/hoa dùng chung cho mọi hoạ tiết lễ hội
const FEST_COLORS = ['#DC2626', '#FBBF24', '#3B82F6', '#22C55E', '#EC4899'];

/** Dây cờ tam giác (bunting) võng nhẹ giữa hai mốc world-x. */
function drawBunting(x1, x2, y, camX) {
  const rx1 = Math.round(x1 - camX);
  const rx2 = Math.round(x2 - camX);
  if (rx2 < -80 || rx1 > VIEW_W + 80) return;
  const sag = 22;
  const midX = (rx1 + rx2) / 2;

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx1, y);
  ctx.quadraticCurveTo(midX, y + sag, rx2, y);
  ctx.stroke();

  const n = Math.max(3, Math.round((x2 - x1) / 40));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = Math.round(rx1 + (rx2 - rx1) * t);
    const py = Math.round(y + 2 * (1 - t) * t * sag);
    ctx.fillStyle = FEST_COLORS[i % FEST_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(px - 9, py);
    ctx.lineTo(px + 9, py);
    ctx.lineTo(px, py + 16);
    ctx.closePath();
    ctx.fill();
  }
}

/** Băng rôn treo: khung gỗ + tấm vải đỏ + dòng chữ vàng. */
function drawBanner(x, y, w, text, camX, sub) {
  const rx = Math.round(x - camX);
  if (rx + w < -40 || rx > VIEW_W + 40) return;
  const h = sub ? 46 : 32;

  // Tự giãn bề ngang để chữ không bao giờ bị cắt cụt ở mép vải
  ctx.font = 'bold 13px "Press Start 2P", monospace';
  const mainW = ctx.measureText(text).width;
  let subW = 0;
  if (sub) {
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    subW = ctx.measureText(sub).width;
  }
  w = Math.max(w, Math.ceil(Math.max(mainW, subW)) + 40);
  if (rx + w < -40 || rx > VIEW_W + 40) return;

  // dây treo
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rx + 12, y - 16); ctx.lineTo(rx + 12, y);
  ctx.moveTo(rx + w - 12, y - 16); ctx.lineTo(rx + w - 12, y);
  ctx.stroke();

  // tấm vải
  ctx.fillStyle = '#B91C1C';
  ctx.fillRect(rx, y, w, h);
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(rx, y, w, 3);
  ctx.fillRect(rx, y + h - 3, w, 3);
  // đuôi cờ xẻ hai bên
  ctx.fillStyle = '#B91C1C';
  ctx.beginPath();
  ctx.moveTo(rx, y); ctx.lineTo(rx - 14, y + h / 2); ctx.lineTo(rx, y + h);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(rx + w, y); ctx.lineTo(rx + w + 14, y + h / 2); ctx.lineTo(rx + w, y + h);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 13px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, rx + w / 2, y + (sub ? 20 : 22));
  if (sub) {
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText(sub, rx + w / 2, y + 36);
  }
  ctx.textAlign = 'left';
}

/** Chùm bóng bay nhiều màu, dây thả xuống. */
function drawBalloons(x, y, camX, n = 3) {
  const rx = Math.round(x - camX);
  if (rx < -60 || rx > VIEW_W + 60) return;
  const bob = Math.sin(Date.now() * 0.0016 + x) * 3;
  for (let i = 0; i < n; i++) {
    const bx = rx + i * 20 - (n - 1) * 10;
    const by = y + bob + (i % 2) * 12;
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 14);
    ctx.lineTo(bx, by + 30);
    ctx.stroke();
    ctx.fillStyle = FEST_COLORS[(i + 2) % FEST_COLORS.length];
    ctx.beginPath();
    ctx.ellipse(bx, by, 10, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(bx - 3, by - 4, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Bó hoa hồng đặt trên mặt đất: lá xanh + 3 bông đỏ. */
function drawRoseBouquet(x, groundY, camX) {
  const rx = Math.round(x - camX);
  if (rx < -40 || rx > VIEW_W + 40) return;
  // lá
  ctx.fillStyle = '#15803D';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(rx + i * 7, groundY - 12, 5, 11, i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // bông hoa
  for (let i = -1; i <= 1; i++) {
    const fx = rx + i * 9;
    const fy = groundY - 26 - (i === 0 ? 4 : 0);
    ctx.fillStyle = i === 0 ? '#DC2626' : '#E11D48';
    ctx.beginPath();
    ctx.arc(fx, fy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // giấy gói
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.moveTo(rx - 14, groundY - 6);
  ctx.lineTo(rx + 14, groundY - 6);
  ctx.lineTo(rx + 8, groundY);
  ctx.lineTo(rx - 8, groundY);
  ctx.closePath();
  ctx.fill();
}

/**
 * Bố cục trang trí 20/11 cho từng màn (toạ độ world).
 * Tách khỏi hàm build để có thể tái dùng và kiểm tra bằng số đo.
 */
function buildFestiveDecor(stage) {
  festiveDecor = [];
  if (stage === 1) {
    festiveDecor.push({ kind: 'bunting', x1: 6 * TILE_SIZE, x2: 20 * TILE_SIZE, y: 3.0 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 26 * TILE_SIZE, y: 2.2 * TILE_SIZE, w: 150,
                        text: '20/11', sub: 'NGÀY NHÀ GIÁO VN' });
    festiveDecor.push({ kind: 'balloons', x: 30 * TILE_SIZE, y: 3.4 * TILE_SIZE, n: 3 });
    festiveDecor.push({ kind: 'rose', x: 24 * TILE_SIZE });
    festiveDecor.push({ kind: 'bunting', x1: 60 * TILE_SIZE, x2: 74 * TILE_SIZE, y: 2.8 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 88 * TILE_SIZE, y: 3.0 * TILE_SIZE, w: 170,
                        text: 'TRI ÂN THẦY CÔ', sub: 'CODEGYM 20/11' });
    festiveDecor.push({ kind: 'balloons', x: 100 * TILE_SIZE, y: 4.0 * TILE_SIZE, n: 4 });
    festiveDecor.push({ kind: 'bunting', x1: 150 * TILE_SIZE, x2: 165 * TILE_SIZE, y: 2.6 * TILE_SIZE });
    festiveDecor.push({ kind: 'rose', x: 190 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 191 * TILE_SIZE, y: 1.8 * TILE_SIZE, w: 220,
                        text: 'CHÚC MỪNG 20/11', sub: 'NGÀY NHÀ GIÁO VIỆT NAM' });
    festiveDecor.push({ kind: 'balloons', x: 186 * TILE_SIZE, y: 3.2 * TILE_SIZE, n: 4 });
  } else if (stage === 2) {
    festiveDecor.push({ kind: 'bunting', x1: 4 * TILE_SIZE, x2: 18 * TILE_SIZE, y: 2.6 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 20 * TILE_SIZE, y: 2.0 * TILE_SIZE, w: 160,
                        text: '20/11', sub: 'LÂU ĐÀI TRI ÂN' });
    festiveDecor.push({ kind: 'rose', x: 46 * TILE_SIZE });
    festiveDecor.push({ kind: 'bunting', x1: 90 * TILE_SIZE, x2: 104 * TILE_SIZE, y: 2.4 * TILE_SIZE });
    festiveDecor.push({ kind: 'balloons', x: 95 * TILE_SIZE, y: 3.6 * TILE_SIZE, n: 3 });
    festiveDecor.push({ kind: 'banner', x: 140 * TILE_SIZE, y: 1.6 * TILE_SIZE, w: 200,
                        text: 'NGƯỜI LÁI ĐÒ', sub: 'THẦM LẶNG MỘT ĐỜI' });
    festiveDecor.push({ kind: 'rose', x: 168 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 178 * TILE_SIZE, y: 1.4 * TILE_SIZE, w: 230,
                        text: 'CHÚC MỪNG 20/11', sub: 'NGÀY NHÀ GIÁO VIỆT NAM' });
    festiveDecor.push({ kind: 'balloons', x: 184 * TILE_SIZE, y: 3.0 * TILE_SIZE, n: 4 });
  } else {
    festiveDecor.push({ kind: 'bunting', x1: 4 * TILE_SIZE, x2: 20 * TILE_SIZE, y: 2.6 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 23 * TILE_SIZE, y: 1.8 * TILE_SIZE, w: 180,
                        text: '20/11', sub: 'ĐẤU TRƯỜNG TRI ÂN' });
    festiveDecor.push({ kind: 'balloons', x: 34 * TILE_SIZE, y: 3.2 * TILE_SIZE, n: 4 });
    festiveDecor.push({ kind: 'rose', x: 62 * TILE_SIZE });
    festiveDecor.push({ kind: 'bunting', x1: 90 * TILE_SIZE, x2: 108 * TILE_SIZE, y: 2.2 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 118 * TILE_SIZE, y: 1.6 * TILE_SIZE, w: 200,
                        text: 'TRI ÂN THẦY CÔ', sub: 'NGHỀ GIÁO VIÊN CAO QUÝ' });
    festiveDecor.push({ kind: 'balloons', x: 150 * TILE_SIZE, y: 3.4 * TILE_SIZE, n: 5 });
    festiveDecor.push({ kind: 'bunting', x1: 168 * TILE_SIZE, x2: 186 * TILE_SIZE, y: 1.8 * TILE_SIZE });
    festiveDecor.push({ kind: 'rose', x: 176 * TILE_SIZE });
    festiveDecor.push({ kind: 'banner', x: 184 * TILE_SIZE, y: 1.2 * TILE_SIZE, w: 250,
                        text: 'CHÚC MỪNG NGÀY NHÀ GIÁO', sub: 'VIỆT NAM 20/11' });
    festiveDecor.push({ kind: 'balloons', x: 194 * TILE_SIZE, y: 2.8 * TILE_SIZE, n: 5 });
  }
}

/** Vẽ toàn bộ trang trí 20/11 của màn hiện tại. */
function drawFestiveDecor(camX) {
  festiveDecor.forEach(d => {
    if (d.kind === 'bunting') drawBunting(d.x1, d.x2, d.y, camX);
    else if (d.kind === 'banner') drawBanner(d.x, d.y, d.w, d.text, camX, d.sub);
    else if (d.kind === 'balloons') drawBalloons(d.x, d.y, camX, d.n);
    else if (d.kind === 'rose') {
      const col = Math.floor(d.x / TILE_SIZE);
      const r = surfaceRow(col);
      if (r !== null) drawRoseBouquet(d.x, r * TILE_SIZE, camX);
    }
  });
}

function drawBackgroundAmbience(camX) {
  if (currentStage === 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let i = 0; i < 8; i++) {
      const cx = (i * 260 - camX * 0.3) % (VIEW_W + 250);
      const cy = 40 + (i % 3) * 35;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 8, 32, 0, Math.PI * 2);
      ctx.arc(cx + 46, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (currentStage === 2) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    for (let i = 0; i < 10; i++) {
      const cx = (i * 200 - camX * 0.2) % (VIEW_W + 150);
      ctx.fillRect(cx, 40, 45, VIEW_H);
    }
  } else {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
    const time = Date.now() * 0.002;
    for (let i = 0; i < 20; i++) {
      const ex = (i * 90 + Math.sin(time + i) * 30 - camX * 0.5) % (VIEW_W + 100);
      const ey = ((i * 45) - time * 20) % VIEW_H;
      ctx.fillRect(ex, ey < 0 ? ey + VIEW_H : ey, 3, 3);
    }
  }
}

function drawHUD() {
  ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
  ctx.fillRect(8, 8, VIEW_W - 16, 36);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.strokeRect(8, 8, VIEW_W - 16, 36);

  ctx.font = '9px "Press Start 2P", monospace';

  // Tim máu
  let heartsStr = '';
  for (let i = 0; i < gameStats.hearts; i++) heartsStr += '❤️ ';
  ctx.fillStyle = '#F43F5E';
  ctx.fillText(heartsStr || '💀', 20, 30);

  // Xu
  ctx.fillStyle = '#FBBF24';
  ctx.fillText(`🪙 x ${gameStats.coins}`, 145, 30);

  // Điểm số
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`SCORE: ${gameStats.score}`, 270, 30);

  // Trạng thái SUPER CODER / FIRE CODER
  if (player.hasFire) {
    ctx.fillStyle = '#FB923C';
    ctx.fillText(`🔥 FIRE`, 420, 30);
  } else if (player.isSuper) {
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`🍄 SUPER`, 420, 30);
  } else if (player.hasKey) {
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`KEY: 🔑`, 420, 30);
  }

  // Đếm ngược Thời gian màn (Mario Timer chuẩn 1 giây thực tế)
  ctx.fillStyle = gameStats.time < 60 ? '#EF4444' : '#FBBF24';
  ctx.fillText(`TIME: ${gameStats.time}`, 555, 30);

  // Chỉ báo Màn
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(`STAGE: ${currentStage}/3`, VIEW_W - 145, 30);
}

// 11. GAME LOOP - FIXED 60FPS TIMESTEP & WALL-CLOCK REAL-TIME COUNTDOWN
let lastFrameTime = performance.now();
let lastSecondRealTime = performance.now();
const FIXED_STEP = 1000 / 60; // 16.666ms per update
let physicsAccumulator = 0;

function updatePhysics() {
  if (gameState !== 'playing') return;

  if (isClearCutscene) {
    clearCutsceneTimer++;

    // Bắn pháo hoa ăn mừng mỗi 18 tick
    const maxFireworks = currentStage === 3 ? 7 : 4;
    if (clearCutsceneTimer % 18 === 0 && clearFireworksLaunched < maxFireworks) {
      clearFireworksLaunched++;
      const goalProp = props.find(p => p.isGoal);
      const fx = (goalProp ? goalProp.x + 30 : player.x) + (Math.random() - 0.5) * 160;
      const fy = (goalProp ? goalProp.y - 40 : player.y - 90) - Math.random() * 60;
      spawnFirework(fx, fy);
      spawnFloatingText(fx, fy, '+500 🎆');
      gameStats.score += 500;
    }

    // Rút điểm thời gian nhanh chuẩn NES Mario (Time bonus tally)
    if (clearCutsceneTimer > 25 && gameStats.time > 0) {
      const chunk = Math.min(gameStats.time, 6);
      gameStats.time -= chunk;
      gameStats.score += chunk * 50;
      if (clearCutsceneTimer % 2 === 0) audio.playTick();
    }

    // Sau khi pháo hoa và đổi điểm hoàn tất -> Mở dialog
    if (clearCutsceneTimer >= (currentStage === 3 ? 150 : 105) && gameStats.time === 0) {
      isClearCutscene = false;
      if (currentStage < 3) triggerStageClear();
      else triggerVictory();
    }
  } else {
    player.update(keys);
    piranhaPlants.forEach(p => p.update());
    enemies.forEach(e => e.update());
    checkInteractions();
  }
}

function gameLoop(currentTime) {
  if (!currentTime) currentTime = performance.now();
  const elapsed = Math.min(currentTime - lastFrameTime, 100);
  lastFrameTime = currentTime;
  physicsAccumulator += elapsed;

  // Đếm ngược thời gian thực (Wall-clock 1.000ms = đúng 1 giây thực tế, miễn nhiễm với màn hình 144Hz/240Hz)
  if (gameState === 'playing' && !isClearCutscene) {
    if (currentTime - lastSecondRealTime >= 1000) {
      lastSecondRealTime = currentTime;
      if (gameStats.time > 0) {
        gameStats.time--;
        if (gameStats.time === 59) audio.playBump();
        if (gameStats.time === 0) {
          gameStats.hearts = 0;
          player.takeDamage(true);
        }
      }
    }
  } else {
    lastSecondRealTime = currentTime;
  }

  // Cố định bước vật lý ở chuẩn 60 FPS bất kể màn hình 60Hz, 120Hz, 144Hz hay 240Hz
  while (physicsAccumulator >= FIXED_STEP) {
    updatePhysics();
    physicsAccumulator -= FIXED_STEP;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// 12. BUTTON EVENT LISTENERS
document.getElementById('btn-start-game').addEventListener('click', () => {
  audio.init();
  gameState = 'playing';
  lastSecondRealTime = performance.now();
  lastFrameTime = performance.now();
  physicsAccumulator = 0;
  audio.startBGM();
  document.getElementById('start-overlay').classList.add('hidden');
});

document.getElementById('btn-next-stage').addEventListener('click', () => {
  document.getElementById('stage-clear-overlay').classList.remove('flex');
  document.getElementById('stage-clear-overlay').classList.add('hidden');
  player.reset();
  buildStage(currentStage + 1);
  gameState = 'playing';
  audio.startBGM();
});

document.getElementById('btn-retry-game').addEventListener('click', () => {
  restartCurrentStage();
});

document.getElementById('btn-play-again').addEventListener('click', () => {
  gameStats.score = 0;
  gameStats.coins = 0;
  gameStats.hearts = 3;
  player.reset();
  buildStage(1);
  gameState = 'playing';
  audio.startBGM();
  document.getElementById('victory-overlay').classList.remove('flex');
  document.getElementById('victory-overlay').classList.add('hidden');
});

document.getElementById('btn-restart').addEventListener('click', () => {
  restartCurrentStage();
});

function restartCurrentStage() {
  gameStats.hearts = 3;
  player.reset();
  buildStage(currentStage);
  gameState = 'playing';
  audio.startBGM();
  document.getElementById('gameover-overlay').classList.remove('flex');
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('stage-clear-overlay').classList.remove('flex');
  document.getElementById('stage-clear-overlay').classList.add('hidden');
  document.getElementById('victory-overlay').classList.remove('flex');
  document.getElementById('victory-overlay').classList.add('hidden');
}

// Quick Stage Select buttons in header
document.querySelectorAll('.stage-select-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    audio.init();
    const st = parseInt(btn.getAttribute('data-stage'));
    player.reset();
    buildStage(st);
    gameState = 'playing';
    audio.startBGM();
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('stage-clear-overlay').classList.remove('flex');
    document.getElementById('stage-clear-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.remove('flex');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.remove('flex');
    document.getElementById('victory-overlay').classList.add('hidden');
  });
});

// Sound Toggle
const soundBtn = document.getElementById('btn-sound-toggle');
const soundIcon = document.getElementById('icon-sound');
soundBtn.addEventListener('click', () => {
  audio.init();
  audio.enabled = !audio.enabled;
  soundIcon.setAttribute('data-lucide', audio.enabled ? 'volume-2' : 'volume-x');
  lucide.createIcons();
  if (audio.enabled && gameState === 'playing') {
    audio.startBGM();
  } else {
    audio.stopBGM();
  }
});

// LIVE PHYSICS TUNING DRAWER (TINH CHỈNH VẬT LÝ MARIO TRỰC TIẾP)
const tuningModal = document.getElementById('tuning-modal');
const btnTuning = document.getElementById('btn-tuning-toggle');
const btnCloseTuning = document.getElementById('btn-close-tuning');
const sliderWalk = document.getElementById('slider-walk');
const sliderJump = document.getElementById('slider-jump');
const sliderFall = document.getElementById('slider-fall');
const valWalk = document.getElementById('val-walk');
const valJump = document.getElementById('val-jump');
const valFall = document.getElementById('val-fall');

if (btnTuning && tuningModal) {
  btnTuning.addEventListener('click', () => {
    tuningModal.classList.toggle('hidden');
  });
}
if (btnCloseTuning && tuningModal) {
  btnCloseTuning.addEventListener('click', () => {
    tuningModal.classList.add('hidden');
  });
}
if (sliderWalk) {
  sliderWalk.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    PHYSICS.MAX_WALK_SPEED = v;
    if (valWalk) valWalk.textContent = v.toFixed(2);
  });
}
if (sliderJump) {
  sliderJump.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    PHYSICS.JUMP_SPEED_SLOW = v;
    PHYSICS.JUMP_SPEED_FAST = v * 1.15;
    if (valJump) valJump.textContent = v.toFixed(1);
  });
}
if (sliderFall) {
  sliderFall.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    PHYSICS.FALL_GRAVITY = v;
    if (valFall) valFall.textContent = v.toFixed(2);
  });
}

// START ENGINE
loadAllSprites(() => {
  console.log("All sprites loaded successfully from Texture Atlas!");
  buildStage(1);
  requestAnimationFrame(gameLoop);
});

// EXPORT FOR AUTOMATED RUNTIME TESTING & VERIFICATION
window.gameTest = {
  player,
  gameStats,
  audio,
  spawnFirework,
  get interactiveBlocks() { return interactiveBlocks; },
  get enemies() { return enemies; },
  get props() { return props; },
  get collectibles() { return collectibles; },
  get activeMushrooms() { return activeMushrooms; },
  get piranhaPlants() { return piranhaPlants; },
  get projectiles() { return projectiles; },
  get fireworksParticles() { return fireworksParticles; },
  PHYSICS,
  NES_CONFIG,
  buildStage,
  getStage: () => currentStage,
  getGameState: () => gameState,
  setGameState: (s) => { gameState = s; },
  getCameraX: () => cameraX,
  getTriggers: () => triggers,
  getLevelMap: () => levelMap,
  getFestiveDecor: () => festiveDecor,
  get keys() { return keys; }
};
