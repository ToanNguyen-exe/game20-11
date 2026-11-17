# 🎨 Pipeline Xử Lý Ảnh (Pixelization) — Quan Trọng Nhất

Bộ 89 sprite gốc **không phải pixel art** dù tên file là `pixel-art.webp`. Đây là ảnh AI vẽ mượt, và điều đó phá vỡ toàn bộ phần hiển thị của game. Đã đo và xử lý lại toàn bộ.

### Chẩn đoán ảnh gốc (số liệu thật, không phỏng đoán)

| Lỗi | Bằng chứng đo được | Hậu quả trên màn hình |
|---|---|---|
| Không phải pixel art | 2.043–9.674 màu/sprite (chuẩn pixel art: ≤ 60) | Trông mờ, không "retro" |
| Alpha bán trong suốt | **96%** pixel có alpha 1–254 (master sheet: 0% pixel đục hoàn toàn) | Quầng mờ (halo) quanh mọi sprite |
| RGB nhân với nền đen | Vùng alpha thấp tối hơn lõi ~45% | Viền đen bẩn trên nền sáng |
| Bị resample lúc chạy | Tile 64px → 40px, quái 70px → 32px với `imageSmoothingEnabled=false` | Pixel gãy, kích thước pixel không đều |
| Tile có bevel baked-in | Mép dưới tối hơn lõi 30–95 đơn vị luminance | Lưới ô vuông tối khi ghép sàn |
| Tỉ lệ bị bóp méo | `prop_flag` AR 0.64 vẽ ở AR 0.33 (**−48%**), `flag_vn` **−65%** | Cột cờ bị kéo dài như sợi chỉ |
| Khung hình nhân vật lệch | Cùng nhân vật, các frame cao 58→109px | Nhân vật phình/co khi đổi animation |

### Cách sửa (`tools/pixelize.py`)

1. **Un-premultiply** RGB theo alpha → lấy lại màu thật, xoá viền đen.
2. **Downsample có trọng số alpha** (`Image.Resampling.BOX`) xuống lưới logic 2px/pixel.
3. **Quantize vào MỘT palette 56 màu dùng chung** cho cả 89 sprite → tổng thể đồng bộ.
4. **Nhị phân hoá alpha** (0 hoặc 255) + xoá đốm rác + lấp lỗ 1px → silhouette sắc.
5. **Upscale NEAREST** về đúng kích thước canvas sẽ vẽ → `drawImage()` luôn 1:1, không resample.
6. **De-bevel + stitch cạnh** cho 10 tile lặp lại (đất, đá, băng, ống, dung nham, cỏ).
   Tile đơn lẻ (`brick`, `question_block`, `coin_box`...) **giữ bevel** vì chúng cần đọc như từng khối riêng.
7. **Một hệ số scale cho mỗi category** (không fit từng sprite) → tỉ lệ tương đối giữa các nhân vật được bảo toàn.
8. **Neo đúng vai trò:** prop neo **đáy** (đứng trên đất), trigger neo **đỉnh** (là bệ để đứng lên).

Chạy lại bất cứ lúc nào: `python tools/pixelize.py` (nguồn: `assets/_source_sprites/`, output: `assets/sprites/` + `atlas_v2.json`).

### Kết quả đo được (trước → sau)

| Chỉ số | Trước | Sau |
|---|---|---|
| Pixel alpha bán trong suốt (`enemy_goomba`) | 4.969 | **0** |
| Số màu (`enemy_goomba`) | 3.886 | **21** |
| Độ lặp block 2×2 (100% = pixel art thật) | 2,9% | **100%** |
| Màu trong 1 frame render | ~500.000 | **1.463** |
| Khe hở sàn (seam step) | 25–87 | **0,0** |
| Tổng dung lượng PNG | 2.325 KB | **364 KB** |

### Lỗi code đi kèm đã sửa trong `game.js`

- **Trigger vẽ sai toạ độ:** dùng `tr.x` (world) thay vì `rx` (đã trừ camera) → lò xo và cầu di động **trôi xa dần khi camera cuộn**. Đây là lỗi làm đệm lò xo/cầu màn 2 "chạy trốn" khỏi nhân vật.
- Sprite được vẽ ở kích thước tự nhiên (`sprite.width/height`) thay vì hằng số hardcode 32×32 / 26×26 → hết méo tỉ lệ.
- Regex đọc kích thước trong pipeline ban đầu bỏ sót trường hợp `w/h` đứng **trước** `type` → `trigger_platform` xuất ra 124×60 trong khi hộp va chạm chỉ 70×22.

### Kiểm thử

```bash
python -m http.server 8003          # phục vụ thư mục
python tools/verify_visual.py       # 89/89 sprite đúng size, 0 lỗi console, chân đặt đúng grid
python tests/test_suite_all.py       # 12/12 hạng mục gameplay PASS
```
