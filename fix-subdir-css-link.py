import re, os, glob

dir_path = "/root/.openclaw/workspace/signal-lost-tasks"
css_link = '  <link rel="stylesheet" href="design-system-subdir.css" />\n'

# Find all HTML files missing design-system-subdir.css
files = glob.glob(os.path.join(dir_path, "*.html"))
files = [f for f in files if "design-system-subdir" not in open(f).read()]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Add design-system-subdir.css after the first </style> tag (or before </head>)
    # Prefer after </style> if there's an inline style block, else before </head>
    if '</style>' in content:
        # Add after the first </style> to override inline styles
        content = content.replace('</style>', '</style>\n' + css_link, 1)
    else:
        # Add before </head>
        content = content.replace('</head>', css_link + '</head>', 1)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Added design-system-subdir.css to {os.path.basename(filepath)}")

print(f"\nDone: {len(files)} files updated")
