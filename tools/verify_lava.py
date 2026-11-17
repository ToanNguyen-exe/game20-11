"""Verify lava damage + mentor names, in a real browser.

Lava test is the important one: before the fix, lava was excluded from
isSolid() so the player fell through it and could stand inside the pool
without losing health. Now checkLavaContact() must fire.
"""
import time, os
from playwright.sync_api import sync_playwright

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://127.0.0.1:8003/"

ok = True

def check(label, cond, detail=""):
    global ok
    print(f"  [{'PASS' if cond else 'FAIL'}] {label} {detail}")
    if not cond:
        ok = False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EDGE, headless=True)
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle")
    time.sleep(1.0)
    pg.click("#btn-start-game")
    time.sleep(0.4)

    print("\n=== 1. LAVA DAMAGE (stage 3) ===")
    pg.evaluate("window.gameTest.buildStage(3)")
    pg.evaluate("window.gameTest.setGameState('playing')")
    time.sleep(0.5)

    # lava rows are tile row 10 (y=400..440). Drop the player straight into one.
    r = pg.evaluate("""() => {
        const t = window.gameTest;
        t.player.x = 18 * 40;      // stage 3: x=16..21 is a lava gap
        t.player.y = 9.2 * 40;     // just above the lava surface
        t.player.vy = 1;
        t.gameStats.hearts = 3;
        t.player.isSuper = false;
        return {hearts: t.gameStats.hearts, y: t.player.y};
    }""")
    print(f"  before: hearts={r['hearts']} y={r['y']:.0f}")
    time.sleep(1.1)
    after = pg.evaluate("""() => {
        const t = window.gameTest;
        return {hearts: t.gameStats.hearts, y: t.player.y, vy: t.player.vy,
                state: t.getGameState()};
    }""")
    print(f"  after : hearts={after['hearts']} y={after['y']:.0f} vy={after['vy']:.2f} state={after['state']}")
    check("lava took a heart", after["hearts"] < r["hearts"],
          f"({r['hearts']} -> {after['hearts']})")
    check("player was knocked upward", after["vy"] <= 0 or after["y"] < 10 * 40 + 40,
          f"vy={after['vy']:.2f}")

    # star power should protect
    print("\n=== 2. STAR POWER IMMUNITY ===")
    r2 = pg.evaluate("""() => {
        const t = window.gameTest;
        t.buildStage(3); t.setGameState('playing');
        t.player.x = 18*40; t.player.y = 9.2*40; t.player.vy = 1;
        t.gameStats.hearts = 3;
        t.player.hasStarPower = true; t.player.starPowerTimer = 600;
        return {hearts: t.gameStats.hearts};
    }""")
    time.sleep(1.0)
    a2 = pg.evaluate("""() => ({hearts: window.gameTest.gameStats.hearts,
                               y: window.gameTest.player.y})""")
    print(f"  with star: hearts {r2['hearts']} -> {a2['hearts']}, y={a2['y']:.0f}")
    check("star power survives lava", a2["hearts"] == r2["hearts"],
          f"({r2['hearts']} -> {a2['hearts']})")

    # repeated exposure must eventually kill — must respect the 90-frame i-frames
    print("\n=== 3. REPEATED LAVA CONTACT DRAINS ALL HEARTS ===")
    a3 = pg.evaluate("""() => {
        const t = window.gameTest;
        t.buildStage(3); t.setGameState('playing');
        t.player.isSuper = false;
        t.player.hasStarPower = false;
        t.gameStats.hearts = 3;
        const log = [];
        // 4 separate contacts, each with i-frames expired in between
        for (let i = 0; i < 4; i++) {
            t.player.x = 18*40; t.player.y = 9.2*40; t.player.vy = 2;
            t.player.invulnerableTimer = 0;   // let the next hit land
            const before = t.gameStats.hearts;
            t.player.checkLavaContact();
            log.push({before, after: t.gameStats.hearts,
                      state: t.getGameState()});
            if (t.getGameState() === 'gameover') break;
        }
        return {log, hearts: t.gameStats.hearts, state: t.getGameState()};
    }""")
    for i, e in enumerate(a3["log"], 1):
        print(f"  contact {i}: hearts {e['before']} -> {e['after']}  state={e['state']}")
    check("each lava hit costs exactly 1 heart",
          all(e["before"] - e["after"] == 1 for e in a3["log"]),
          f"{len(a3['log'])} hits")
    check("3 hits from 3 hearts ends the game", a3["state"] == "gameover",
          f"hearts={a3['hearts']} state={a3['state']}")

    print("\n=== 4. MENTOR NAMES ===")
    quotes = pg.evaluate("""() => {
        // STAGE_QUOTES is module scope, so read it through a fresh block hit:
        // instead assert on the DOM after triggering a toast via a coin scroll.
        return null;
    }""")
    # read the source directly - it is served over http
    src = pg.evaluate("""async () => {
        const r = await fetch('game.js');
        return await r.text();
    }""")
    for name in ("Thầy Tùng", "Thầy Cấn", "Thầy Luân"):
        check(f"'{name}' present", name in src, f"x{src.count(name)}")
    for gone in ("Cô Mai", "Thầy Huy", "Thầy Minh", "Mentor Hiếu"):
        check(f"old name '{gone}' removed", gone not in src)

    print("\n=== 5. RUNTIME ERRORS ===")
    print(f"  pageerror count: {len(errs)}")
    for e in errs[:5]:
        print("   ", e)
    check("no page errors", len(errs) == 0)

    b.close()

print("\n" + ("=" * 50))
print("RESULT:", "ALL PASS" if ok else "FAILURES PRESENT")
print("=" * 50)
raise SystemExit(0 if ok else 1)
