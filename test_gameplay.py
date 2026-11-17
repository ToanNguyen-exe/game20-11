from playwright.sync_api import sync_playwright
import time

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
    
    # Press right arrow to move player
    print("Moving player right...")
    page.keyboard.down('ArrowRight')
    time.sleep(1.5)
    page.keyboard.up('ArrowRight')
    
    # Jump
    print("Jumping...")
    page.keyboard.down('Space')
    time.sleep(0.2)
    page.keyboard.up('Space')
    time.sleep(1)
    
    # Take screenshot of Stage 1 gameplay
    page.screenshot(path=r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\gameplay_stage1.png')
    print("Saved gameplay_stage1.png")
    
    # Test Stage 2
    print("Switching to Stage 2...")
    page.click('.stage-select-btn[data-stage="2"]')
    time.sleep(1)
    page.screenshot(path=r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\gameplay_stage2.png')
    print("Saved gameplay_stage2.png")
    
    # Test Stage 3
    print("Switching to Stage 3...")
    page.click('.stage-select-btn[data-stage="3"]')
    time.sleep(1)
    page.screenshot(path=r'C:\Users\mcmap\.gemini\antigravity\scratch\code-quest-mario\gameplay_stage3.png')
    print("Saved gameplay_stage3.png")
    
    browser.close()
    print("All gameplay checks and screenshots completed successfully!")
