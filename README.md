# CODE QUEST: 3 MÀN CHƠI TRI ÂN THẦY CÔ 20/11
### Cuộc Thi CodeGym: "Chạm Phím Tri Ân - Khi Lòng Biết Ơn Được Viết Bằng Những Dòng Code"

Tựa game 2D Platformer phong cách Super Mario kinh điển xây dựng bằng HTML5 Canvas và Web Audio Chiptune 8-bit, khai thác trọn vẹn bộ Texture Atlas gồm **89 Asset Slices** được phân loại bài bản.

---

## 🗂️ Cấu Trúc Dự Án

```
code-quest-mario/
├── index.html          # Giao diện Tailwind + Lucide + confetti
├── game.js             # Toàn bộ engine: config, atlas, audio, 3 stage builder, render, loop
├── README.md           # Tài liệu này
├── README_pixel_art.md # Pipeline pixel hoá sprite
├── assets/             # 89 sprite PNG + atlas_v2.json
├── tests/              # 11 script kiểm thử (Playwright + phân tích ảnh)
├── tools/              # verify_visual, verify_lava, pixelize, playthrough_bot
├── dev/
│   ├── asset-pipeline/ # Script sinh atlas, clamp viền tile, map asset
│   ├── inspect/        # Script soi slice/block/edge
│   └── backup/         # game.js.stagebuilders.bak
└── screenshots/        # Ảnh nghiệm thu (gitignored)
```

Chạy game: `python -m http.server 8003` rồi mở http://127.0.0.1:8003/

---

## 📁 Cấu Trúc Thư Mục Texture Atlas

```
assets/
├── atlas.json                     # Texture Atlas JSON tiêu chuẩn HTML5 Canvas
└── sprites/
    ├── atlas.json
    ├── player/                    # Nhân vật Lập trình viên Mario
    │   ├── player_idle.png        # Đứng chờ (Idle)
    │   ├── player_run.png         # Chạy tiến (Run Frame 1)
    │   ├── player_jump.png        # Nhảy lên (Jump Ascend)
    │   ├── player_fall.png        # Rơi xuống (Fall Descend)
    │   ├── player_hurt.png        # Bị trúng đòn (Hurt)
    │   ├── player_die.png         # Thất bại (Die)
    │   ├── player_attack.png      # Tấn công (Attack)
    │   ├── player_shoot.png       # Bắn code đạn (Shoot)
    │   └── player_slide.png       # Trượt / Cúi người (Slide)
    ├── enemies/                   # 15 chủng loại quái vật/bug
    │   ├── enemy_goomba.png       # Bug nấm nâu
    │   ├── enemy_red_bug.png      # Bọ đỏ giận dữ
    │   ├── enemy_turtle.png       # Rùa mai xanh Koopa
    │   ├── enemy_spiny.png        # Bọ gai tím
    │   ├── enemy_ghost.png        # Ma Boo bay lượn
    │   ├── enemy_bat.png          # Dơi tím bay lượn
    │   ├── enemy_crab.png         # Cua đỏ bò ngang
    │   ├── enemy_piranha.png      # Hoa ăn thịt trong ống
    │   ├── enemy_mage.png         # Pháp sư hắc ám
    │   ├── enemy_spike_ball.png   # Cầu sắt gai
    │   ├── enemy_slime_green.png  # Slime xanh lá
    │   ├── enemy_slime_purple.png # Slime tím
    │   ├── enemy_skeleton.png     # Bộ xương khô
    │   ├── enemy_fish.png         # Cá đỏ nhảy vực
    │   └── enemy_thwomp.png       # Khối đá Thwomp đè bẹp
    ├── buffs/                     # Hiệu ứng & kỹ năng nâng cấp
    │   ├── buff_shield.png        # Khiên bảo vệ vô địch
    │   ├── buff_boots.png         # Giày tăng tốc chạy nhanh
    │   ├── buff_star.png          # Sao vàng bất tử
    │   ├── buff_star_2x.png       # Sao nhân đôi 2X điểm
    │   ├── buff_heart.png         # Trái tim hồi máu (+1 HP)
    │   ├── buff_heart_container.png # Mở rộng cột máu tối đa
    │   ├── buff_mushroom.png      # Nấm siêu cấp lớn nhanh
    │   ├── buff_flower.png        # Hoa lửa bắn đạn
    │   ├── buff_potion.png        # Bình mana phép thuật
    │   ├── buff_magnet.png        # Nam châm hút coin
    │   └── buff_clock.png         # Đồng hồ ngưng đọng thời gian
    ├── items/                     # Vật phẩm thu thập
    │   ├── item_coin.png          # Đồng xu vàng (+100 điểm)
    │   ├── item_diamond.png       # Kim cương xanh (+300 điểm)
    │   ├── item_key.png           # Chìa khóa vàng mở cổng lâu đài
    │   ├── item_code_scroll.png   # Cuộn bí kíp Clean Code (+400 điểm)
    │   ├── item_code_book.png     # Sách lập trình đại cương (+600 điểm)
    │   ├── item_checkpoint.png    # Cột cờ điểm lưu
    │   └── item_orb.png           # Ngọc năng lượng kỹ năng (+500 điểm)
    ├── tiles/                     # Khối gạch, đất, ống nước (chuẩn hóa viền 100% khớp)
    │   ├── grass.png              # Khối cỏ mặt đất
    │   ├── dirt.png               # Khối đất ngầm
    │   ├── dirt_grass.png         # Khối cỏ vát cạnh
    │   ├── stone.png              # Khối đá lâu đài xám
    │   ├── ice.png                # Khối băng trơn trượt
    │   ├── brick.png              # Khối gạch phá vỡ
    │   ├── question_block.png     # Khối hỏi chấm quà tặng (?)
    │   ├── exclamation_block.png  # Khối chấm than kích hoạt (!)
    │   ├── coin_box.png           # Khối kho vàng
    │   ├── wood_crate.png         # Khối thùng gỗ
    │   ├── wood_plank.png         # Khối ván cầu gỗ
    │   ├── metal_block.png        # Khối kim loại tán đinh
    │   ├── pipe_green.png         # Ống nước xanh Mario
    │   ├── pipe_red.png           # Ống nước đỏ áp suất cao
    │   ├── ladder.png             # Thang gỗ leo trèo
    │   ├── lava.png               # Bề mặt dung nham sôi sục
    │   └── fire.png               # Khối đá lửa magma
    ├── objects/                   # Đạo cụ cảnh quan & cửa qua màn
    │   ├── prop_flag.png          # Cột cờ kết thúc màn chơi
    │   ├── prop_door_wood.png     # Cửa gỗ hầm ngục
    │   ├── prop_door_locked.png   # Cửa sắt khóa chặt
    │   ├── prop_portal.png        # Cổng xoáy dịch chuyển
    │   ├── prop_chest.png         # Rương kho báu tốt nghiệp
    │   ├── prop_tree.png          # Cây sồi xanh
    │   ├── prop_bush.png          # Bụi cỏ trang trí
    │   ├── prop_flower.png        # Bông hoa dại
    │   ├── prop_cactus.png        # Cây xương rồng sa mạc
    │   ├── prop_fence.png         # Hàng rào gỗ
    │   ├── prop_sign.png          # Biển chỉ đường
    │   ├── prop_crate.png         # Thùng gỗ phụ kiện
    │   ├── prop_barrel.png        # Thùng rượu tròn
    │   └── prop_tnt.png           # Thùng thuốc nổ TNT
    ├── triggers/                  # Cơ chế tương tác & bẫy
    │   ├── trigger_platform.png   # Cầu đá di động qua vực
    │   ├── trigger_spring.png     # Bàn nhún lò xo bật cao
    │   ├── trigger_btn_red.png    # Nút bấm sàn
    │   ├── trigger_platform_gold.png # Cầu vàng lơ lửng trên dung nham
    │   ├── trigger_saw.png        # Lưỡi cưa máy xoay
    │   └── trigger_spikes.png     # Chông sắt nhọn nguy hiểm
    ├── effects/                   # Hiệu ứng đạn và phép
    │   ├── effect_bullet.png      # Viên đạn code xanh neon
    │   ├── effect_portal.png      # Vòng xoáy năng lượng xanh
    │   ├── effect_blast.png       # Tia nổ va chạm vàng
    │   └── effect_sparkle.png     # Ánh sao lấp lánh
    └── ui/                        # Giao diện & Biểu tượng tri ân
        ├── trophy.png             # Cúp Vàng Vinh Danh CodeGym
        ├── medal.png              # Huy chương Vàng Tri Ân Thầy Cô
        ├── crown.png              # Vương miện Thủ khoa tốt nghiệp
        ├── flag_vn.png            # Cờ Đỏ Sao Vàng Việt Nam
        ├── ui_avatar.png          # Ảnh đại diện học viên lập trình
        └── ui_bubble.png          # Khung đối thoại lời dạy Mentor
```

---

## 🛠️ Các Cải Tiến Quan Trọng Vừa Thực Hiện

1. **Khớp nối viền khối gạch (Seamless Tile Matching):**
   - Đã cắt gọt triệt để viền trong suốt lỗi từ công cụ cắt tự động.
   - Chuẩn hóa toàn bộ 17 khối `tiles/` về tỉ lệ vuông 1:1 (64x64) với 100% opacity ở cả 4 cạnh ngoài.
   - Bật `ctx.imageSmoothingEnabled = false` và làm tròn tọa độ vẽ để loại bỏ hoàn toàn các khe nứt 1-pixel.
2. **Kích thước nhân vật & Khoảng hở đi qua (Character Resizing & Clearance):**
   - Giảm hitbox nhân vật từ `34x52` xuống tỉ lệ chuẩn Mario: `w: 22, h: 36` (thấp hơn chiều cao 1 khối 40px).
   - Sprite vẽ được căn chuẩn `32x42`, gót chân chạm đúng mặt sàn không bị lơ lửng hay lún.
   - Bổ sung cơ chế trượt góc (Corner Slip) với dung sai 2-pixel giúp nhân vật dễ dàng chui lọt qua các khe hẹp 1 ô và không bao giờ bị kẹt mép gạch.
   - Nâng độ cao trần ở cả Màn 1, Màn 2 và Màn 3 đảm bảo luôn có tối thiểu 2-3 ô thông thoáng để nhảy nhót mượt mà.
3. **Texture Atlas JSON:**
   - File [assets/sprites/atlas.json](file:///C:/Users/mcmap/.gemini/antigravity/scratch/code-quest-mario/assets/sprites/atlas.json) chứa toàn bộ tọa độ gốc `(source_x, source_y, source_w, source_h)`, pivot, frame animations và mô tả tiếng Anh chuẩn quốc tế.

---

## 📏 Độ Dài Màn Chơi (mở rộng 2026-11)

Mỗi màn: **200 ô × 40px = 8000px**, tương đương **~9,5 màn hình cuộn** (canvas 840px). Timer **600 giây**.

| Màn | Cấu trúc 3 chương | Cơ chế mới |
|---|---|---|
| 1 — Thảo Nguyên | 0–84 đồng cỏ mở đầu · 85–144 đồi nấm & suối đá · 145–199 vách núi & tháp cờ | thang leo, cầu treo, đệm lò xo qua hố, bãi gai |
| 2 — Lâu Đài OOP | 0–84 đại sảnh đá · 85–144 hành lang băng giá · 145–199 phòng ngai & cửa khóa | sàn băng trơn, trần thấp, hố dung nham nhẹ, 2 bệ nâng ngược chiều |
| 3 — Đấu Trường Dung Nham | 0–84 đấu trường mở màn · 85–149 hồ dung nham lớn · 150–199 tháp tri ân | 5 bệ nâng vàng, 3 đệm lò xo, vực lava cắt ngang |

Vùng 0–84 giữ **nguyên bố cục cũ** để test suite (bám toạ độ tuyệt đối) vẫn chạy đúng.

### Kiểm chứng khả năng đi hết màn

`tools/playthrough_bot.py` là bot tự chơi, nhưng nó **không** phải bằng chứng đáng tin: bot kẹt ở 50–52% vì không biết lùi lấy đà, nhả nút nhảy quá sớm (cú nhảy bị cắt còn 105px thay vì 202px), và tưởng bệ đá trên cao là đất dưới chân.

Bằng chứng thật là **phân tích hình học**: dựng đồ thị mọi ô đứng được, nối cạnh nếu khoảng cách nằm trong đường bao nhảy mô phỏng đúng hằng số `PHYSICS`, rồi BFS từ điểm xuất phát.

```
STAGE 1: standable=237 reachable=233 furthest_col=199/197 goal_reachable=True
STAGE 2: standable=241 reachable=206 furthest_col=199/192 goal_reachable=True
STAGE 3: standable=235 reachable=229 furthest_col=199/191 goal_reachable=True
```

Đường bao nhảy đo được: cao **202px (5,05 ô)**, xa **209px (5,22 ô)** khi cùng độ cao, tới **245px (6,12 ô)** khi nhảy lên cao 2 ô. Mọi hố trong màn đều ≤4 ô.
