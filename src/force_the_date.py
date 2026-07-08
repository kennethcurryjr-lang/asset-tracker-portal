with open('src/App.js', 'r') as f:
    content = f.read()

# Exact string replacement targeting the specific lastSeen variable formatting
old_time_format = ".toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })"
new_time_format = ".toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', '')"

content = content.replace(old_time_format, new_time_format)

with open('src/App.js', 'w') as f:
    f.write(content)

print("✅ src/App.js patched! The exact timestamp formatting has been upgraded.")
