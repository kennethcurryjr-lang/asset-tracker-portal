import re

with open('src/App.js', 'r') as f:
    content = f.read()

# Attempt to upgrade the existing time formatter if it exists
old_time_format = r'\.toLocaleTimeString\(\s*\[\]\s*,\s*\{\s*hour:\s*[\'"]2-digit[\'"]\s*,\s*minute:\s*[\'"]2-digit[\'"]\s*\}\)'
new_time_format = '.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })'

if re.search(old_time_format, content):
    content = re.sub(old_time_format, new_time_format, content)
else:
    # Fallback: target the JSX render line directly and force the format
    content = re.sub(
        r'(>Last seen:\s*\{)(item\.lastSeen)(\})',
        r'\1\2 && \2 !== "Never" ? new Date(\2).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", "") : "Never"\3',
        content
    )

with open('src/App.js', 'w') as f:
    f.write(content)

print("✅ src/App.js patched! The date is now exposed directly next to the time.")
