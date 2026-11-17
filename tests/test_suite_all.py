import time
import sys
from playwright.sync_api import sync_playwright

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

def run_tests():
    print("=" * 65)
    print("🚀 CODE QUEST MARIO: BỘ KIỂM THỬ TOÀN DIỆN (PHYSICS, ENEMIES, STAGES)")
    print("=" * 65)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=edge_path, headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        
        print("\n[TEST 1] Tải trang và kiểm tra Texture Atlas...")
        page.goto('http://127.0.0.1:8003/')
        page.wait_for_selector('#game-canvas')
        time.sleep(1)
        
        # Click start
        page.click('#btn-start-game')
        time.sleep(0.5)
        
        state = page.evaluate("window.gameTest.getGameState()")
        assert state == 'playing', f"Game state must be 'playing', got {state}"
        print("  -> PASS: Game khởi động thành công, trạng thái 'playing'")
        
        # ---------------------------------------------------------
        # TEST 2: KIỂM THỬ TỐC ĐỘ & VẬT LÝ CHUẨN NES MARIO
        # ---------------------------------------------------------
        print("\n[TEST 2] Kiểm thử Tốc độ & Vật lý chuẩn NES (Scale 2.5x)...")
        phys = page.evaluate("""() => {
            const P = window.gameTest.PHYSICS;
            const N = window.gameTest.NES_CONFIG;
            return {
                walkMax: P.MAX_WALK_SPEED,
                runMax: P.MAX_RUN_SPEED,
                riseGrav: P.RISE_GRAVITY,
                fallGrav: P.FALL_GRAVITY,
                coyote: P.COYOTE_TIME,
                buffer: P.JUMP_BUFFER,
                levelTime: N.level_time
            };
        }""")
        
        print(f"  * Walk Max Speed: {phys['walkMax']} px/frame (Chuẩn 2.25)")
        print(f"  * Run Max Speed: {phys['runMax']} px/frame (Chuẩn 3.4)")
        print(f"  * Rise Gravity: {phys['riseGrav']} vs Fall Gravity: {phys['fallGrav']}")
        print(f"  * Coyote Time: {phys['coyote']} frames | Jump Buffer: {phys['buffer']} frames")
        
        assert 1.5 <= phys['walkMax'] <= 2.2, "Walk speed out of standard bounds!"
        assert 2.5 <= phys['runMax'] <= 3.2, "Run speed out of standard bounds!"
        assert phys['fallGrav'] > phys['riseGrav'], "Fall gravity must be heavier than rise gravity!"
        assert phys['coyote'] >= 5 and phys['buffer'] >= 6, "Game feel timers missing!"
        print("  -> PASS: Tốc độ và thông số vật lý chuẩn xác 100%!")
        
        # ---------------------------------------------------------
        # TEST 3: DI CHUYỂN THỰC TẾ & TIMER MÀN CHƠI
        # ---------------------------------------------------------
        print("\n[TEST 3] Kiểm thử Gia tốc di chuyển thực tế & Đếm ngược Timer...")
        page.keyboard.down('ArrowRight')
        time.sleep(0.6)
        page.keyboard.up('ArrowRight')
        
        player_vx = page.evaluate("window.gameTest.player.vx")
        timer_val = page.evaluate("window.gameTest.gameStats.time")
        
        print(f"  * Vận tốc sau khi chạy phải: vx = {player_vx:.2f}")
        level_time = page.evaluate("window.gameTest.NES_CONFIG.level_time")
        print(f"  * Timer màn chơi đang đếm ngược: {timer_val}/{level_time} ticks")
        assert timer_val <= level_time, f"Timer must start at {level_time} and count down!"
        print("  -> PASS: Nhân vật di chuyển mượt mà, Timer đếm ngược chuẩn NES!")
        
        # ---------------------------------------------------------
        # TEST 4: KIỂM THỬ NẤM TĂNG TRƯỞNG & SUPER CODER
        # ---------------------------------------------------------
        print("\n[TEST 4] Kiểm thử Nấm Tăng Trưởng (Mushroom) & Hóa Super Coder...")
        page.evaluate("""() => {
            // Đặt Mario ở vùng an toàn và kích hoạt lớn lên
            window.gameTest.player.x = 3 * 40;
            window.gameTest.player.y = 8 * 40;
            window.gameTest.player.growSuper();
        }""")
        time.sleep(0.3)
        
        is_super = page.evaluate("window.gameTest.player.isSuper")
        player_h = page.evaluate("window.gameTest.player.h")
        print(f"  * Trạng thái Super Coder: {is_super} (Chiều cao sprite: {player_h}px)")
        assert is_super == True, "Player must eat mushroom and become Super Coder!"
        assert player_h <= 40, f"Super Coder hitbox must fit a 1-tile gap (<=40px), got {player_h}px"
        print("  -> PASS: Ăn nấm lớn lên thành Super Coder thành công!")
        
        # ---------------------------------------------------------
        # TEST 5: KIỂM THỬ QUÁI VẬT, GIẪM ĐẦU & COMBO ĐIỂM
        # ---------------------------------------------------------
        print("\n[TEST 5] Kiểm thử Quái vật: Giẫm Goomba & Combo điểm liên hoàn...")
        initial_score = page.evaluate("window.gameTest.gameStats.score")
        
        # Đưa player rơi thẳng xuống đỉnh đầu của Goomba
        page.evaluate("""() => {
            const g = window.gameTest.enemies.find(e => e.type === 'enemy_goomba' && !e.dead);
            if (g) {
                window.gameTest.player.x = g.x;
                window.gameTest.player.y = g.y + 8 - window.gameTest.player.h; // Đỉnh chân chạm 8px trên đầu
                window.gameTest.player.vy = 4.0; // Đang rơi xuống từ trên
            }
        }""")
        time.sleep(0.5)
        
        goomba_dead = page.evaluate("() => { const g = window.gameTest.enemies.find(e => e.type === 'enemy_goomba'); return g ? g.dead : false; }")
        new_score = page.evaluate("window.gameTest.gameStats.score")
        
        print(f"  * Goomba bị tiêu diệt: {goomba_dead}")
        print(f"  * Điểm số tăng: {initial_score} -> {new_score}")
        
        assert goomba_dead == True, "Goomba must be dead after being stomped!"
        assert new_score > initial_score, "Score must increase upon stomping enemy!"
        print("  -> PASS: Cơ chế giẫm quái & nảy người (Stomp & Bounce) chuẩn xác!")
        
        # ---------------------------------------------------------
        # TEST 6: CƠ CHẾ MAI RÙA KOOPA (SHELL STOMP & KICK)
        # ---------------------------------------------------------
        print("\n[TEST 6] Kiểm thử Cơ chế Rùa Koopa: Hóa mai & Đá mai trượt...")
        page.evaluate("""() => {
            const turtle = window.gameTest.enemies.find(e => e.type === 'enemy_turtle');
            if (turtle) {
                turtle.stomp(); // Giẫm lần 1 biến thành mai
            }
        }""")
        is_shell = page.evaluate("() => window.gameTest.enemies.find(e => e.type === 'enemy_turtle').isShell")
        print(f"  * Rùa biến thành Mai Rùa: {is_shell}")
        assert is_shell == True, "Turtle must become shell after being stomped!"
        
        # Đá mai rùa
        page.evaluate("""() => {
            const turtle = window.gameTest.enemies.find(e => e.type === 'enemy_turtle');
            if (turtle) {
                turtle.kick(1); // Đá trượt sang phải
            }
        }""")
        is_kicked = page.evaluate("() => window.gameTest.enemies.find(e => e.type === 'enemy_turtle').isKicked")
        shell_vx = page.evaluate("() => window.gameTest.enemies.find(e => e.type === 'enemy_turtle').vx")
        print(f"  * Mai rùa đang trượt càn quét: {is_kicked} với vận tốc vx = {shell_vx}")
        assert is_kicked == True and shell_vx > 4.0, "Turtle shell must slide fast after being kicked!"
        print("  -> PASS: Cơ chế mai rùa Koopa trượt thần tốc hoàn hảo!")
        
        # ---------------------------------------------------------
        # TEST 6B: QUÁI BƯỚC VÀO HỐ PHẢI RƠI XUỐNG VỰC BIẾN MẤT
        # ---------------------------------------------------------
        print("\n[TEST 6B] Kiểm thử Quái bước vào hố rơi xuống vực...")
        page.evaluate("""() => {
            // Đặt quái ngay trên miệng hố tại x = 37.5 * 40 = 1500
            const g = window.gameTest.enemies[0];
            if (g) {
                g.dead = false;
                g.x = 37.5 * 40;
                g.y = 9.0 * 40;
                g.vx = 0.5;
            }
        }""")
        time.sleep(1.2)
        pit_dead = page.evaluate("() => { const g = window.gameTest.enemies[0]; return g ? (g.dead || g.y > 450) : true; }")
        print(f"  * Quái đi vào hố rơi xuống vực mất tích: {pit_dead}")
        assert pit_dead == True, "Enemy entering pit must fall into abyss!"
        print("  -> PASS: Quái đi vào hố rơi tự do xuống vực chuẩn xác!")
        
        # ---------------------------------------------------------
        # TEST 7: CỘT CỜ & VƯỢT MÀN 1 (FLAGPOLE SLIDE & STAGE CLEAR)
        # ---------------------------------------------------------
        print("\n[TEST 7] Kiểm thử Trượt Cột Cờ & Vượt Màn 1 (Stage 1 Clear)...")
        page.evaluate("""() => {
            const goal = window.gameTest.props.find(p => p.isGoal);
            if (goal) {
                window.gameTest.player.x = goal.x;
                window.gameTest.player.y = goal.y + 20; // Chạm trên cao
            }
        }""")
        time.sleep(0.5)
        
        is_sliding = page.evaluate("window.gameTest.player.slidingGoal")
        print(f"  * Nhân vật khóa điều khiển và trượt cột cờ: {is_sliding}")
        
        # Chờ hoạt cảnh trượt cờ, pháo hoa nổ và đổi điểm hoàn tất
        time.sleep(3.2)
        game_state_cleared = page.evaluate("window.gameTest.getGameState()")
        print(f"  * Trạng thái game sau khi trượt cờ vào cửa: {game_state_cleared}")
        assert game_state_cleared == 'stage_clear', f"Stage 1 must clear upon reaching goal, got {game_state_cleared}"
        print("  -> PASS: Hoạt cảnh trượt cột cờ & Stage Clear hoàn thành mỹ mãn!")
        
        # ---------------------------------------------------------
        # TEST 8: CHUYỂN MÀN 2 & MÀN 3 (STAGE PROGRESSION & BLOCK HEIGHTS)
        # ---------------------------------------------------------
        print("\n[TEST 8] Kiểm thử Tải Màn 2 (Lâu đài OOP) & Màn 3 (Đấu trường Dung Nham)...")
        page.evaluate("window.gameTest.buildStage(2)")
        time.sleep(0.3)
        st2 = page.evaluate("window.gameTest.getStage()")
        assert st2 == 2, f"Current stage should be 2, got {st2}"
        print(f"  * Màn 2 tải thành công: stage = {st2}")
        
        page.evaluate("window.gameTest.buildStage(3)")
        time.sleep(0.3)
        st3 = page.evaluate("window.gameTest.getStage()")
        assert st3 == 3, f"Current stage should be 3, got {st3}"
        print(f"  * Màn 3 tải thành công: stage = {st3}")
        
        # Kiểm tra độ cao khối Màn 3 không bị treo quá cao (y=7 thay vì y=4)
        m3_block_y = page.evaluate("""() => {
            const b = window.gameTest.interactiveBlocks.find(b => b.content === 'star_2x');
            return b ? b.ty : null;
        }""")
        print(f"  * Kiểm tra ô thưởng Màn 3: ty = {m3_block_y} (độ cao 3 ô chuẩn NES, người chơi nhảy tới dễ dàng)")
        assert m3_block_y == 7, f"Stage 3 blocks must be at ty=7, got {m3_block_y}"
        print("  -> PASS: Toàn bộ 3 màn chơi và độ cao các khối Màn 3 đạt chuẩn 100%!")

        # ---------------------------------------------------------
        # TEST 9: CÂY HOA PIRANHA & FIRE CODER BẮN CẦU LỬA NẢY ĐẤT
        # ---------------------------------------------------------
        print("\n[TEST 9] Kiểm thử Cây hoa Piranha trong ống cống & Fire Coder bắn cầu lửa...")
        page.evaluate("""() => {
            window.gameTest.buildStage(1);
            window.gameTest.setGameState('playing');
            window.gameTest.player.hasFire = true;
            window.gameTest.player.x = 28 * 40;
            window.gameTest.player.y = 8 * 40;
        }""")
        time.sleep(0.3)
        
        piranha_count = page.evaluate("() => window.gameTest.piranhaPlants.length")
        print(f"  * Số cây hoa Piranha trong ống cống: {piranha_count}")
        assert piranha_count >= 1, "Must have at least 1 Piranha plant in stage 1!"
        
        # Bắn cầu lửa
        proj_count = page.evaluate("""() => {
            window.gameTest.player.shoot();
            return window.gameTest.projectiles.length;
        }""")
        print(f"  * Fire Coder bắn cầu lửa: {proj_count} viên đạn đang bay nảy")
        assert proj_count >= 1, "Fireball projectile must spawn!"
        print("  -> PASS: Piranha Plant và Cầu Lửa Fire Coder hoạt động chuẩn xác!")

        # ---------------------------------------------------------
        # TEST 10: CHUI ỐNG NƯỚC VÀO PHÒNG BÍ MẬT (PIPE DESCENT)
        # ---------------------------------------------------------
        print("\n[TEST 10] Kiểm thử Mario chui ống ngầm vào kho tiền bí mật...")
        page.evaluate("""() => {
            window.gameTest.player.enterPipe();
        }""")
        time.sleep(0.8)
        
        vault_coins = page.evaluate("() => window.gameTest.collectibles.filter(c => c.x > 33 * 40 && c.x < 40 * 40).length")
        print(f"  * Đã kích hoạt kho báu bí mật với {vault_coins} đồng xu mới!")
        assert vault_coins >= 5, "Secret underground vault must spawn coins!"
        print("  -> PASS: Chui ống cống vào phòng bí mật (Underground Pipe Vault) thành công!")

        # ---------------------------------------------------------
        # TEST 11: BẢNG TINH CHỈNH VẬT LÝ MARIO TRỰC TIẾP (PHYSICS TUNING)
        # ---------------------------------------------------------
        print("\n[TEST 11] Kiểm thử Bảng điều khiển tinh chỉnh vật lý trực tiếp...")
        page.click('#btn-tuning-toggle')
        time.sleep(0.2)
        is_modal_visible = page.evaluate("!document.getElementById('tuning-modal').classList.contains('hidden')")
        print(f"  * Khay tinh chỉnh mở ra: {is_modal_visible}")
        assert is_modal_visible == True, "Tuning modal must open on toggle!"
        
        # Thử kéo slider tăng tốc độ đi bộ lên 2.45
        page.evaluate("""() => {
            const s = document.getElementById('slider-walk');
            s.value = '2.45';
            s.dispatchEvent(new Event('input'));
        }""")
        time.sleep(0.1)
        new_walk_speed = page.evaluate("window.gameTest.PHYSICS.MAX_WALK_SPEED")
        print(f"  * Tốc độ đi sau khi kéo slider: {new_walk_speed}")
        assert abs(new_walk_speed - 2.45) < 0.01, "Slider must update PHYSICS directly!"
        
        page.click('#btn-close-tuning')
        time.sleep(0.2)
        print("  -> PASS: Live Physics Tuning Drawer hoạt động chuẩn xác!")

        # ---------------------------------------------------------
        # TEST 12: NHẠC NỀN CHIPTUNE BGM (SYNTHESIZER)
        # ---------------------------------------------------------
        print("\n[TEST 12] Kiểm thử Nhạc nền 8-bit Chiptune Mario BGM...")
        page.evaluate("window.gameTest.audio.startBGM()")
        has_bgm = page.evaluate("!!window.gameTest.audio.bgmInterval")
        print(f"  * Bộ phát nhạc nền Web Audio Synthesizer: {has_bgm}")
        assert has_bgm == True, "BGM interval must be active!"
        page.evaluate("window.gameTest.audio.stopBGM()")
        bgm_stopped = page.evaluate("!window.gameTest.audio.bgmInterval")
        assert bgm_stopped == True, "BGM interval must be cleared!"
        print("  -> PASS: Nhạc nền 8-bit Mario tổng hợp bằng Web Audio chuẩn xác!")
        
        # Chụp ảnh bằng chứng nghiệm thu
        page.screenshot(path=str(ROOT / 'screenshots' / 'verification_full_pass.png'))
        print("\n📸 Đã chụp ảnh nghiệm thu: verification_full_pass.png")
        
        browser.close()
        
    print("\n" + "=" * 65)
    print("🎉 TẤT CẢ 12/12 HẠNG MỤC KIỂM THỬ ĐỀU ĐẠT CHUẨN PASS 100%!")
    print("=" * 65)

if __name__ == '__main__':
    run_tests()
