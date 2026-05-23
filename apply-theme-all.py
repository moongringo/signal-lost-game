import os
import re

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

# Page menu items
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

def get_relative_path(from_dir, to_file):
    """Calculate relative path from file's directory to workspace root file"""
    if from_dir == '/root/.openclaw/workspace':
        return './' + to_file
    rel = os.path.relpath('/root/.openclaw/workspace', from_dir)
    return rel + '/' + to_file

def process_file(filepath):
    """Process a single HTML file to apply the theme."""
    filename = os.path.basename(filepath)
    file_dir = os.path.dirname(filepath)
    
    if filename in SKIP_FILES:
        print(f"  SKIP (excluded): {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has design-flow.css and flow-shell
    if 'design-flow.css' in content and 'flow-shell' in content:
        print(f"  SKIP (already themed): {filepath}")
        return False
    
    # Skip if it's the reference implementation itself
    if filename == 'design-flow-setup.html' and 'flow-shell' in content:
        print(f"  SKIP (reference page): {filepath}")
        return False
    
    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else 'Signal Lost'
    
    # Calculate relative paths
    css_path = get_relative_path(file_dir, 'design-flow.css')
    js_path = get_relative_path(file_dir, 'design-flow.js?v=3')
    ds_js_path = get_relative_path(file_dir, 'design-system.js')
    
    # Theme CSS link
    theme_css = f'  <link rel="stylesheet" href="{css_path}" />'
    
    # Background elements
    bg_elements = f'''  <div class="cursor-spotlight"></div>
  <canvas id="patternCanvas" aria-hidden="true"></canvas>
  <div class="flow-noise" aria-hidden="true"></div>'''
    
    # Theme scripts
    theme_scripts = f'''  <script src="{ds_js_path}"></script>
  <script src="{js_path}"></script>
  <script>
    new SignalLostDesign({{ spotlight: true, magneticButtons: true, scrollReveal: true, reducedMotion: true }});
  </script>'''
    
    # Extract head content
    head_match = re.search(r'(<head[^>]*>)(.*?)(</head>)', content, re.IGNORECASE | re.DOTALL)
    if not head_match:
        print(f"  SKIP (no head): {filepath}")
        return False
    
    head_open = head_match.group(1)
    head_content = head_match.group(2)
    head_close = head_match.group(3)
    
    # Add design-flow.css link if not present
    if 'design-flow.css' not in head_content:
        head_content = head_content.rstrip() + '\n' + theme_css + '\n'
    
    post_head = content[head_match.end():]
    
    # Extract body content
    body_match = re.search(r'(<body[^>]*>)(.*?)(</body>)', post_head, re.IGNORECASE | re.DOTALL)
    if not body_match:
        print(f"  SKIP (no body): {filepath}")
        return False
    
    body_content = body_match.group(2)
    
    # Remove existing background/particle/noise elements
    body_content = re.sub(r'<div class="particles"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="alive-bg"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="paisley-overlay"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="scanlines"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="noise"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="cursor-spotlight"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<canvas id="patternCanvas"[^>]*>.*?</canvas>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<div class="flow-noise"[^>]*>.*?</div>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r'<header class="flow-header"[^>]*>.*?</header>\s*', '', body_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Build header
    page_name = title.replace('Signal Lost — ', '').replace('Signal Lost Flow Design - ', '').replace('Signal Lost ', '')
    
    core_pages = [
        ("design-flow-setup.html", "Setup"),
        ("design-flow-roles.html", "Roles"),
        ("design-flow-control.html", "Control"),
    ]
    
    nav_links = ''
    for href, label in core_pages:
        href_path = get_relative_path(file_dir, href)
        nav_links += f'        <a href="{href_path}">{label}</a>\n'
    
    # Page menu
    menu_html = '        <div class="page-menu-wrap">\n'
    menu_html += '          <button class="btn btn-glass page-menu-btn" type="button" id="pageMenuBtn">📑 All Pages ▾</button>\n'
    menu_html += '          <div class="page-menu" id="pageMenu">\n'
    for group_title, items in PAGE_MENU_ITEMS:
        menu_html += f'            <div class="page-menu-group">\n'
        menu_html += f'              <div class="page-menu-title">{group_title}</div>\n'
        for href, label in items:
            href_path = get_relative_path(file_dir, href)
            menu_html += f'              <a href="{href_path}">{label}</a>\n'
        menu_html += '            </div>\n'
    menu_html += '          </div>\n'
    menu_html += '        </div>\n'
    
    header = f'''    <header class="flow-header">
      <div>
        <p class="eyebrow">Signal Lost / Flow Prototype</p>
        <h1>{page_name}</h1>
      </div>
      <nav class="flow-nav" aria-label="Flow design pages">
{nav_links}
        <a href="{get_relative_path(file_dir, 'design-lab.html')}">Option 3</a>
{menu_html}
        <a href="{get_relative_path(file_dir, 'design-test.html')}" class="btn btn-gold">🎨 Test Design</a>
      </nav>
    </header>'''
    
    # Menu scripts
    menu_scripts = '''  <script>
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
  </script>'''
    
    # Build new body
    new_body = f'''<body data-flow-page="{os.path.splitext(filename)[0]}" data-background="psychedelic-waves">
{bg_elements}
  <main class="flow-shell">
{header}

    <!-- Original page content -->
    <div class="flow-content" style="padding-top: 20px;">
{body_content}
    </div>
  </main>
{theme_scripts}
{menu_scripts}
</body>'''
    
    # Build new HTML
    new_html = content[:head_match.start()] + head_open + head_content + head_close + new_body + post_head[body_match.end():]
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)
    
    print(f"  OK: {filepath}")
    return True

def main():
    workspace = '/root/.openclaw/workspace'
    # Find all HTML files recursively
    html_files = []
    for root, dirs, files in os.walk(workspace):
        # Skip node_modules and .git
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__']]
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    html_files = sorted(html_files)
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
