from playwright.sync_api import sync_playwright
import time

from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=edge_path, headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    
    print("Navigating to http://127.0.0.1:8003/ ...")
    page.goto('http://127.0.0.1:8003/')
    time.sleep(1)
    
    # Click start game
    print("Clicking Start Game...")
    page.click('#btn-start-game')
    time.sleep(1)
    
    # Take screenshot of Stage 1 start showing the MUSHROOM right in front!
    page.screenshot(path=str(ROOT / 'screenshots' / 'mushroom_visible.png'))
    print("Saved mushroom_visible.png")

    # Walk right towards the mushroom
    print("Moving player right to collect mushroom...")
    page.keyboard.down('ArrowRight')
    time.sleep(1.8)
    page.keyboard.up('ArrowRight')
    time.sleep(0.5)

    # Take screenshot of Mario as SUPER CODER after collecting mushroom!
    page.screenshot(path=str(ROOT / 'screenshots' / 'super_coder_active.png'))
    print("Saved super_coder_active.png")

    browser.close()
    print("Playwright test completed successfully!")
