#!/usr/bin/env python3
"""
Apply 1960s Cold War Terminal theme to all HTML files.
Adds CRT overlay, film grain, 1960s CSS/JS, and grid background.
"""

import os
import re
import glob

def apply_1960s_theme(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Skip if already has 1960s theme
    if '1960s-theme.css' in content:
        print(f"SKIP: {filepath} (already themed)")
        return

    # Add CRT overlay and film grain before </body>
    crt_overlay = '\n  <!-- 1960s CRT Effects -->\n  <div class="crt-overlay"></div>\n  <div class="film-grain"></div>\n'
    
    if '</body>' in content and 'crt-overlay' not in content:
        content = content.replace('</body>', crt_overlay + '</body>')

    # Add 1960s CSS link (before other stylesheets or in head)
    css_link = '  <link rel="stylesheet" href="1960s-theme.css">\n'
    
    if '<link rel="stylesheet"' in content:
        # Insert before first stylesheet
        content = content.replace('<link rel="stylesheet"', css_link + '  <link rel="stylesheet"', 1)
    elif '</head>' in content:
        content = content.replace('</head>', css_link + '</head>')

    # Add 1960s effects JS
    js_link = '  <script src="1960s-effects.js"></script>\n'
    
    if '<script src="1960s-effects.js"' not in content:
        if '</body>' in content:
            content = content.replace('</body>', js_link + '</body>')
        elif '</html>' in content:
            content = content.replace('</html>', js_link + '</html>')

    # Add grid-bg class to body if present
    if '<body' in content and 'grid-bg' not in content:
        content = re.sub(r'(<body[^>]*)>', r'\1 class="grid-bg">', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"OK: {filepath}")

# Process all HTML files
html_files = glob.glob('*.html')
for filepath in html_files:
    apply_1960s_theme(filepath)

print(f"\nDone! Processed {len(html_files)} files.")
