import os

base_dir = r"c:\Users\DELL\Downloads\agros26 (2)\agros26"

html_files = []
for root, dirs, files in os.walk(base_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.css'):
            html_files.append(os.path.join(root, file))

results = []
for file_path in html_files:
    rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
    if "node_modules" in rel_path:
        continue
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Let's search for theme references
    theme_refs = []
    if "theme" in content:
        theme_refs.append("theme")
    if "agro_theme" in content:
        theme_refs.append("agro_theme")
    if "dark-mode" in content:
        theme_refs.append("dark-mode")
    if "data-theme" in content:
        theme_refs.append("data-theme")
    
    if theme_refs:
        results.append(f"{rel_path}: {', '.join(theme_refs)}")

print("\n".join(results))
