import os
import re
import glob
from html.parser import HTMLParser

# Files to skip (already themed or special pages)
SKIP_FILES = {
    'design-flow-setup.html',
    'design-flow-roles.html',
    'design-flow-control.html',
    'start.html',
    'quemello.html',
    'index.html',
    'index-1960s.html',
    'index2-1960s.html',
    'index3.html',
    'index4.html',
    'mission-control-1960s.html',
    'mission-control-crt.html',
    'mission-control-cyber.html',
    'mission-control-minimal.html',
    'mission-control-modern-crt.html',
    'mission-control-soft.html',
    'action-center-1960s.html',
    'action-center-radar.html',
    'R&D-INDEX.html',
}

# Core theme elements
THEME_CSS_LINK = '  <link rel="stylesheet" href="./design-flow.css" />'

BG_ELEMENTS = '''  <div class="cursor-spotlight"></div>
  <canvas id="patternCanvas" aria-hidden="true"></canvas>
  <div class="flow-noise" aria-hidden="true"></div>'''

THEME_SCRIPTS = '''  <script src="design-system.js"></script>
  <script src="./design-flow.js?v=3"></script>
  <script>
    new SignalLostDesign({ spotlight: true, magneticButtons: true, scrollReveal: true, reducedMotion: true });
  </script>'''

PAGE_MENU_ITEMS = [
    ("Auth & Flow", [
        ("login.html", "Login"),
        ("server-browser.html", "Server Browser"),
        ("map-selection.html", "Map Selection"),
        ("role-selection.html", "Role Selection"),
        ("matchmaking.html", "Matchmaking"),
    ]),
    ("Game Screens", [
        ("player-profile.html", "Player Profile"),
        ("career-stats.html", "Career Stats"),
        ("match-result.html", "Match Result"),
        ("post-match-report.html", "Post-Match Report"),
        ("kill-cam.html", "Kill Cam"),
        ("death-recap.html", "Death Recap"),
        ("spectator-mode.html", "Spectator Mode"),
        ("replay-viewer.html", "Replay Viewer"),
        ("tournament-bracket.html", "Tournament"),
        ("emote-wheel.html", "Emote Wheel"),
    ]),
    ("Live & Social", [
        ("store.html", "Store"),
        ("friends.html", "Friends"),
        ("squad.html", "Squad"),
        ("clan-wars.html", "Clan Wars"),
        ("patch-notes.html", "Patch Notes"),
    ]),
    ("Management", [
        ("token-dashboard.html", "Token Dashboard"),
        ("daily-challenges.html", "Daily Challenges"),
        ("inventory.html", "Inventory"),
        ("loadout-builder.html", "Loadout Builder"),
        ("battle-pass.html", "Battle Pass"),
        ("loot-crate.html", "Loot Crate"),
    ]),
    ("Tools & Systems", [
        ("R&D-INDEX.html", "R&D Index"),
        ("ai-battle-arena.html", "AI Battle Arena"),
        ("admin-dashboard.html", "Admin Dashboard"),
        ("leaderboard.html", "Leaderboard"),
        ("settings.html", "Settings"),
        ("design-system.html", "Design System"),
        ("design-flow-setup.html", "Setup Page"),
        ("design-flow-roles.html", "Roles Page"),
        ("design-flow-control.html", "Control Page"),
        ("action-center.html", "Action Center"),
    ]),
    ("Mobile", [
        ("mobile-ui-kit.html", "Mobile UI Kit"),
        ("mobile-radar.html", "Mobile Radar"),
        ("gps-tracker.html", "GPS Tracker"),
    ]),
]

# Numbered menu items
NUMBERED_ITEMS = [
    ("Auth & Flow (1-5)", [("login.html","1 — Login"),("server-browser.html","2 — Server Browser"),("map-selection.html","3 — Map Selection"),("role-selection.html","4 — Role Selection"),("matchmaking.html","5 — Matchmaking")]),
    ("Game Screens (6-15)", [("player-profile.html","6 — Player Profile"),("career-stats.html","7 — Career Stats"),("match-result.html","8 — Match Result"),("post-match-report.html","9 — Post-Match Report"),("kill-cam.html","10 — Kill Cam"),("death-recap.html","11 — Death Recap"),("spectator-mode.html","12 — Spectator Mode"),("replay-viewer.html","13 — Replay Viewer"),("tournament-bracket.html","14 — Tournament"),("emote-wheel.html","15 — Emote Wheel")]),
    ("Live & Social (16-20)", [("store.html","16 — Store"),("friends.html","17 — Friends"),("squad.html","18 — Squad"),("clan-wars.html","19 — Clan Wars"),("patch-notes.html","20 — Patch Notes")]),
    ("Management (21-26)", [("token-dashboard.html","21 — Token Dashboard"),("daily-challenges.html","22 — Daily Challenges"),("inventory.html","23 — Inventory"),("loadout-builder.html","24 — Loadout Builder"),("battle-pass.html","25 — Battle Pass"),("loot-crate.html","26 — Loot Crate")]),
    ("Tools & Systems (27-36)", [("R&D-INDEX.html","27 — R&D Index"),("ai-battle-arena.html","28 — AI Battle Arena"),("admin-dashboard.html","29 — Admin Dashboard"),("leaderboard.html","30 — Leaderboard"),("settings.html","31 — Settings"),("design-system.html","32 — Design System"),("design-flow-setup.html","33 — Setup Page"),("design-flow-roles.html","34 — Roles Page"),("design-flow-control.html","35 — Control Page"),("action-center.html","36 — Action Center")]),
    ("Mobile (37-39)", [("mobile-ui-kit.html","37 — Mobile UI Kit"),("mobile-radar.html","38 — Mobile Radar"),("gps-tracker.html","39 — GPS Tracker")]),
]


def build_page_menu(current_file):
    """Build the page menu dropdown HTML with current page highlighted."""
    menu_html = '        <div class="page-menu-wrap">\n'
    menu_html += '          <button class="btn btn-glass page-menu-btn" type="button" id="pageMenuBtn">📑 All Pages ▾</button>\n'
    menu_html += '          <div class="page-menu" id="pageMenu">\n'
    for title, items in PAGE_MENU_ITEMS:
        menu_html += f'            <div class="page-menu-group">\n'
        menu_html += f'              <div class="page-menu-title">{title}</div>\n'
        for href, label in items:
            is_current = href == current_file
            aria = ' aria-current="page"' if is_current else ''
            menu_html += f'              <a href="./{href}"{aria}>{label}</a>\n'
        menu_html += '            </div>\n'
    menu_html += '          </div>\n'
    menu_html += '        </div>\n'
    
    # Numbered pages menu
    menu_html += '        <div class="page-menu-wrap">\n'
    menu_html += '          <button class="btn btn-glass page-menu-btn" type="button" id="numberedPagesBtn">🔢 All Pages (1-50+) ▾</button>\n'
    menu_html += '          <div class="page-menu" id="numberedPagesMenu">\n'
    for title, items in NUMBERED_ITEMS:
        menu_html += f'            <div class="page-menu-group"><div class="page-menu-title">{title}</div>'
        for href, label in items:
            is_current = href == current_file
            aria = ' aria-current="page"' if is_current else ''
            menu_html += f'<a href="./{href}"{aria}>{label}</a>'
        menu_html += '</div>\n'
    menu_html += '          </div>\n'
    menu_html += '        </div>\n'
    
    return menu_html


def build_header(title_text, current_file):
    """Build the flow-header HTML."""
    # Extract a clean page name from the title
    page_name = title_text.replace('Signal Lost — ', '').replace('Signal Lost Flow Design - ', '').replace('Signal Lost ', '')
    
    # Build nav links
    core_pages = [
        ("design-flow-setup.html", "Setup"),
        ("design-flow-roles.html", "Roles"),
        ("design-flow-control.html", "Control"),
    ]
    
    nav_links = ''
    for href, label in core_pages:
        is_current = href == current_file
        aria = ' aria-current="page"' if is_current else ''
        nav_links += f'        <a href="./{href}"{aria}>{label}</a>\n'
    
    header = f'''    <header class="flow-header">
      <div>
        <p class="eyebrow">Signal Lost / Flow Prototype</p>
        <h1>{page_name}</h1>
      </div>
      <nav class="flow-nav" aria-label="Flow design pages">
{nav_links}
        <a href="./design-lab.html">Option 3</a>
{build_page_menu(current_file)}
        <a href="./design-test.html" class="btn btn-gold">🎨 Test Design</a>
      </nav>
    </header>'''
    return header


def build_menu_scripts():
    """JS for page menu toggles."""
    return '''  <script>
    // Page menu toggle
    const pageMenuBtn = document.getElementById('pageMenuBtn');
    const pageMenu = document.getElementById('pageMenu');
    if (pageMenuBtn && pageMenu) {
      pageMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pageMenu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!pageMenu.contains(e.target) && !pageMenuBtn.contains(e.target)) {
          pageMenu.classList.remove('open');
        }
      });
    }
    // Numbered pages menu toggle
    const numberedPagesBtn = document.getElementById('numberedPagesBtn');
    const numberedPagesMenu = document.getElementById('numberedPagesMenu');
    if (numberedPagesBtn && numberedPagesMenu) {
      numberedPagesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        numberedPagesMenu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!numberedPagesMenu.contains(e.target) && !numberedPagesBtn.contains(e.target)) {
          numberedPagesMenu.classList.remove('open');
        }
      });
    }
  </script>'''


def process_file(filepath):
    """Process a single HTML file to apply the theme."""
    filename = os.path.basename(filepath)
    
    if filename in SKIP_FILES:
        print(f"  SKIP (excluded): {filename}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has design-flow.css
    if 'design-flow.css' in content and 'flow-shell' in content:
        print(f"  SKIP (already themed): {filename}")
        return False
    
    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else 'Signal Lost'
    
    # Extract head content
    head_match = re.search(r'(<head[^>]*>)(.*?)(</head>)', content, re.IGNORECASE | re.DOTALL)
    if not head_match:
        print(f"  SKIP (no head): {filename}")
        return False
    
    head_open = head_match.group(1)
    head_content = head_match.group(2)
    head_close = head_match.group(3)
    
    # Add design-flow.css link if not present
    if 'design-flow.css' not in head_content:
        head_content = head_content.rstrip() + '\n' + THEME_CSS_LINK + '\n'
    
    # Extract everything after </head> up to </html>
    post_head = content[head_match.end():]
    
    # Extract body content
    body_match = re.search(r'(<body[^>]*>)(.*?)(</body>)', post_head, re.IGNORECASE | re.DOTALL)
    if not body_match:
        print(f"  SKIP (no body): {filename}")
        return False
    
    body_tag = body_match.group(1)
    body_content = body_match.group(2)
    body_close = body_match.group(3)
    
    # Remove existing background/particle/noise elements from body content
    # These will be replaced by the theme background
    body_content = re.sub(r'<div class="particles"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="alive-bg"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="paisley-overlay"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="scanlines"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="noise"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="cursor-spotlight"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<canvas id="patternCanvas"[^>]*>.*?</canvas>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="flow-noise"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove any existing flow-header (we'll add our own)
    body_content = re.sub(r'<header class="flow-header"[^>]*>.*?</header>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Check if body already has position fixed/absolute elements that might conflict
    # We don't wrap fixed elements, but we do wrap everything else
    
    # Build the new body
    new_body = f'''<body data-flow-page="{os.path.splitext(filename)[0]}" data-background="psychedelic-waves">
{BG_ELEMENTS}
  <main class="flow-shell">
{build_header(title, filename)}

    <!-- Original page content -->
    <div class="flow-content" style="padding-top: 20px;">
{body_content}
    </div>
  </main>
{THEME_SCRIPTS}
{build_menu_scripts()}
</body>'''
    
    # Build the new HTML
    new_html = content[:head_match.start()] + head_open + head_content + head_close + new_body + post_head[body_match.end():]
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    print(f"  OK: {filename}")
    return True


def main():
    workspace = '/root/.openclaw/workspace'
    html_files = sorted(glob.glob(os.path.join(workspace, '*.html')))
    
    processed = 0
    skipped = 0
    
    print(f"Found {len(html_files)} HTML files")
    print("Processing...\n")
    
    for filepath in html_files:
        result = process_file(filepath)
        if result is True:
            processed += 1
        elif result is False:
            skipped += 1
    
    print(f"\nDone: {processed} processed, {skipped} skipped")


if __name__ == '__main__':
    main()
