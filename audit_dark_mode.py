import os
import re

base_dir = r"c:\Users\DELL\Downloads\agros26 (2)\agros26"

html_files = []
for root, dirs, files in os.walk(base_dir):
    # Exclude node_modules and agr
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if 'agr' in dirs:
        dirs.remove('agr')
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

results = []
for file_path in html_files:
    rel_path = os.path.relpath(file_path, base_dir)
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    has_navbar_js = "navbar.js" in content
    has_theme_manager = "theme-manager.js" in content
    has_theme_localstorage = "localStorage.getItem('theme')" in content or "localStorage.setItem('theme')" in content or "localStorage.getItem(\"theme\")" in content
    has_theme_toggle_btn = "themeToggle" in content or "darkModeToggle" in content
    has_dark_mode_class_or_style = "dark-mode" in content or "body.dark-mode" in content
    
    results.append({
        'rel_path': rel_path.replace("\\", "/"),
        'has_navbar_js': has_navbar_js,
        'has_theme_manager': has_theme_manager,
        'has_theme_localstorage': has_theme_localstorage,
        'has_theme_toggle_btn': has_theme_toggle_btn,
        'has_dark_mode_class_or_style': has_dark_mode_class_or_style
    })

print("RelPath | HasNavbarJS | HasThemeManager | HasThemeLocalStorage | HasThemeToggleBtn | HasDarkModeCSS")
print("-" * 100)
for r in results:
    print(f"{r['rel_path']} | {r['has_navbar_js']} | {r['has_theme_manager']} | {r['has_theme_localstorage']} | {r['has_theme_toggle_btn']} | {r['has_dark_mode_class_or_style']}")
