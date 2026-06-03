import os
import re

root_dir = r"c:\Users\DELL\Downloads\agros26 (2)\agros26"

# Regex to match src="/components/navbar.js" or variations with query parameters
pattern = re.compile(r'src=["\']/components/navbar\.js(?:\?[^"\']*)?["\']')

count = 0
for root, dirs, files in os.walk(root_dir):
    # Exclude nested backup directory to avoid confusion
    if "agr" in root.split(os.sep):
        continue
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "/components/navbar.js" in content:
                    # Replace with navbar.js?v=6
                    new_content, n = pattern.subn('src="/components/navbar.js?v=16"', content)
                    if n > 0:
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Updated {file_path} ({n} matches)")
                        count += 1
            except Exception as e:
                print(f"Error processing {file_path}: {e}")

print(f"Total files updated: {count}")
