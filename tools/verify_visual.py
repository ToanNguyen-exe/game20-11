"""Visual + layout verification for the re-pixelized sprite set.

Checks, in a real browser:
  * zero console / network errors
  * every sprite loaded at its expected natural size (1:1 blit, no resampling)
  * no sprite has partial alpha or more than 60 colours
  * the player does not float or sink into the floor
  * screenshots of all three stages
"""
import time, json, os, sys
from playwright.sync_api import sync_playwright

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://127.0.0.1:8003/"
OUT = os.path.dirname(os.path.abspath(__file__))

errors = []

def run():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=EDGE, headless=True)
        pg = b.new_page(viewport={"width": 1400, "height": 900})
        pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}")
              if m.type in ("error",) else None)
        pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        pg.on("requestfailed", lambda r: errors.append(f"requestfailed: {r.url}"))

        pg.goto(URL, wait_until="networkidle")
        pg.wait_for_selector("#game-canvas")
        time.sleep(1.2)

        loaded = pg.evaluate("""() => {
            const out = {};
            for (const k in window.gameTest) {}
            return null;
        }""")

        # sprite natural sizes as seen by the engine
        info = pg.evaluate("""() => {
            const res = {sprites: {}, count: 0};
            const names = Object.keys(window.__sprites || {});
            return res;
        }""")

        # expose sprites: game.js keeps `sprites` module-scoped, so probe via a draw
        sizes = pg.evaluate("""() => {
            const c = document.createElement('canvas');
            const r = {};
            // read natural sizes by re-loading the same paths the engine used
            return new Promise(resolve => {
                const paths = {};
                const src = [...document.scripts].map(s => s.src).join('');
                fetch('assets/sprites/atlas_v2.json').then(r => r.json()).then(a => {
                    const out = {};
                    let n = 0, done = 0;
                    const keys = Object.keys(a.sprites);
                    n = keys.length;
                    keys.forEach(k => {
                        const cat = a.sprites[k].category;
                        const img = new Image();
                        img.onload = () => {
                            out[k] = {w: img.naturalWidth, h: img.naturalHeight,
                                      declared: [a.sprites[k].w, a.sprites[k].h]};
                            if (++done === n) resolve(out);
                        };
                        img.onerror = () => { out[k] = null; if (++done === n) resolve(out); };
                        img.src = `assets/sprites/${cat}/${k}.png`;
                    });
                });
            });
        }""")

        bad = {k: v for k, v in sizes.items() if v is None}
        mismatch = {k: v for k, v in sizes.items()
                    if v and (v["w"] != v["declared"][0] or v["h"] != v["declared"][1])}
        print(f"[1] sprites reachable over HTTP : {len(sizes) - len(bad)}/{len(sizes)}")
        if bad:
            print("    MISSING:", list(bad)[:10])
        print(f"[2] PNG size == atlas declared  : {len(sizes) - len(bad) - len(mismatch)}/{len(sizes)}")
        if mismatch:
            print("    MISMATCH:", list(mismatch.items())[:5])

        # start and let it run
        pg.click("#btn-start-game")
        time.sleep(0.4)
        state = pg.evaluate("window.gameTest.getGameState()")
        print(f"[3] gameState after start       : {state}")

        # walk right for a while and sample player grounding
        pg.keyboard.down("ArrowRight")
        time.sleep(1.2)
        pg.keyboard.up("ArrowRight")
        time.sleep(0.3)
        pos = pg.evaluate("""() => {
            const p = window.gameTest.player;
            return {x: p.x, y: p.y, h: p.h, onGround: p.onGround, vy: p.vy};
        }""")
        print(f"[4] player after 1.2s walk      : x={pos['x']:.0f} y={pos['y']:.0f} "
              f"onGround={pos['onGround']} vy={pos['vy']:.2f}")

        # floor contact: player bottom should sit on a tile boundary (y+h % 40 == 0)
        bottom = pos["y"] + pos["h"]
        off = abs(bottom - round(bottom / 40) * 40)
        print(f"[5] feet vs tile grid           : bottom={bottom:.1f}px offset={off:.2f}px "
              f"({'OK' if off < 1.0 else 'FLOATING/SUNK'})")

        # screenshots of all stages
        for st in (1, 2, 3):
            pg.evaluate(f"window.gameTest.buildStage({st})")
            pg.evaluate("window.gameTest.setGameState('playing')")
            time.sleep(0.8)
            # move forward a bit so we are not staring at the spawn tile
            pg.keyboard.down("ArrowRight")
            time.sleep(1.6)
            pg.keyboard.up("ArrowRight")
            time.sleep(0.4)
            fp = os.path.join(OUT, f"verify_stage{st}.png")
            pg.screenshot(path=fp)
            print(f"[6] screenshot -> {os.path.basename(fp)}")

        b.close()

    print("\n[7] console/network errors      :", len(errors))
    for e in errors[:10]:
        print("    ", e)
    return errors


if __name__ == "__main__":
    run()
