import re

file_path = r'c:\Users\Suraj\OneDrive\Desktop\MindScape\src\lib\mindscape-data.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: match tags array followed by newline and closing brace (without isExpanded already present)
# We need to add isExpanded: false before the closing brace
pattern = r'(tags:\s*\[[^\]]+\])(\s*\r?\n\s*)(})'

def replacement(match):
    tags_part = match.group(1)
    whitespace = match.group(2)
    closing_brace = match.group(3)
    # Add comma after tags, newline with proper indentation, isExpanded, then newline and closing brace
    return f'{tags_part},{whitespace}                            isExpanded: false{whitespace}{closing_brace}'

# Replace all occurrences
new_content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Successfully added isExpanded property')
