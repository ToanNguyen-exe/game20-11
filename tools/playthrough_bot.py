"""Prove each stage is traversable end-to-end using the game's own physics.

A naive "hold Right + jump when blocked" bot CANNOT clear tall pipes: pressed
against a wall its vx is 0, so the jump takes the SLOW branch
(speedRatio = |vx| / MAX_WALK_SPEED = 0) and only reaches ~102px, while a
3-tile pipe needs ~120px. A human backs off to build runway - so does this bot.

Modes per tick:
  RUN     - hold Right, jump on wall/gap ahead
  BACKUP  - release Right, hold Left to make runway, then return to RUN
"""
import time, sys
from playwright.sync_api import sync_playwright

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://127.0.0.1:8003/"

BOT = r"""
() => {
  const t = window.gameTest;
  if (window.__bot) return "already";
  const keys = t.keys;
  const P = t.player;
  const T = 40;

  let mode = 'RUN', modeTicks = 0, stuckTicks = 0;
  let lastX = P.x, jumpHold = 0, sinceJump = 0, pendingPress = false;

  const solid = (tx, ty) => P.isSolid(tx, ty);
  const bodySolidAt = (tx) => {
    const feet = Math.floor((P.y + P.h - 2) / T);
    for (let ty = feet - 1; ty <= feet; ty++) if (solid(tx, ty)) return true;
    return false;
  };
  // Footing near the player's own feet level. A platform 3 rows overhead is
  // NOT footing - counting it made the bot walk straight into pits that had a
  // decorative ledge above them.
  const footing = (col) => {
    const feetRow = Math.floor((P.y + P.h) / T);
    for (let r = feetRow - 1; r <= feetRow + 1; r++) if (solid(col, r)) return true;
    return false;
  };

  window.__bot = setInterval(() => {
    modeTicks++; sinceJump++;
    if (t.getGameState() !== 'playing') return;

    if (P.x > lastX + 0.6) stuckTicks = 0; else stuckTicks++;
    lastX = P.x;

    // the column the right foot is supported by (matches the game's own
    // collision span: floor((x + w - 4) / T))
    const supportCol = Math.floor((P.x + P.w - 4) / T);
    const nextCol = Math.floor((P.x + P.w + 4) / T);
    const wallAhead = bodySolidAt(nextCol);
    // jump when the ground under the leading foot is gone, or about to be
    const gapAhead = !footing(supportCol) || !footing(supportCol + 1) || !footing(supportCol + 2);

    // variable jump: release after a short hold
    if (jumpHold > 0) { jumpHold--; if (jumpHold === 0) keys['Space'] = false; }
    // rising edge for the jump detector
    if (pendingPress) { keys['Space'] = true; jumpHold = 42; pendingPress = false; }

    if (mode === 'BACKUP') {
      keys['ArrowRight'] = false;
      keys['ArrowLeft'] = true;
      if (modeTicks > 24 || P.x < 70) {
        mode = 'RUN'; modeTicks = 0; keys['ArrowLeft'] = false;
      }
      return;
    }

    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = true;
    keys['ShiftLeft'] = true;      // run: 2.75 px/frame instead of 1.85

    if (P.onGround && (wallAhead || gapAhead) && jumpHold === 0 && !pendingPress && sinceJump > 8) {
      keys['Space'] = false;       // guarantee an edge
      pendingPress = true;
      sinceJump = 0;
    }

    // wedged against a tall obstacle with no speed -> back off for a run-up
    if (stuckTicks > 26) {
      mode = 'BACKUP'; modeTicks = 0; stuckTicks = 0;
      keys['Space'] = false; jumpHold = 0; pendingPress = false;
    }
  }, 16);
  return "started";
}
"""

def run_stage(pg, stage, seconds=170):
    pg.evaluate("window.gameTest.buildStage(%d)" % stage)
    pg.evaluate("window.gameTest.setGameState('playing')")
    time.sleep(0.35)
    pg.evaluate("""() => {
        const t = window.gameTest;
        t.NES_CONFIG.level_time = 9999;
        t.gameStats.time = 9999;
        t.gameStats.hearts = 99;
    }""")
    pg.evaluate(BOT)
    t0 = time.time()
    best, cleared, goal, state = 0, False, 0, "?"
    while time.time() - t0 < seconds:
        time.sleep(0.4)
        st = pg.evaluate("""() => {
            const t = window.gameTest;
            const g = t.props.find(p => p.isGoal);
            return {x: t.player.x, state: t.getGameState(), goal: g ? g.x : 0};
        }""")
        best = max(best, st["x"]); goal = st["goal"]; state = st["state"]
        if st["state"] in ("stage_clear", "victory") or st["x"] >= st["goal"] - 20:
            cleared = True
            break
        if st["state"] == "gameover":
            break
        pg.evaluate("window.gameTest.gameStats.hearts = 99; window.gameTest.gameStats.time = 9999;")
    pg.evaluate("clearInterval(window.__bot); window.__bot = null;")
    pg.evaluate("() => { const k = window.gameTest.keys; for (const n in k) k[n] = false; }")
    return best, cleared, goal, state

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EDGE, headless=True)
    pg = b.new_page(viewport={"width": 1400, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="domcontentloaded", timeout=60000)
    pg.wait_for_function("() => !!window.gameTest", timeout=30000)
    pg.click("#btn-start-game")
    time.sleep(0.4)

    allok = True
    for stage in (1, 2, 3):
        best, cleared, goal, state = run_stage(pg, stage)
        pct = best / goal * 100 if goal else 0
        print(f"STAGE {stage}: reached tile {best/40:6.1f} / {goal/40:6.1f} "
              f"({pct:3.0f}%)  cleared={cleared}  state={state}")
        if not cleared:
            allok = False

    print(f"\npageerrors: {len(errs)}")
    for e in errs[:6]:
        print("  ", e)
    b.close()

print("\n" + "=" * 50)
print("ALL STAGES TRAVERSABLE" if allok and not errs else "NOT FULLY TRAVERSABLE")
print("=" * 50)
sys.exit(0 if allok and not errs else 1)
