with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Swap the button labels while keeping the high-contrast UI iconography intact
content = content.replace(
    "{showFilters ? '✕ Clear Filters' : '🎛️ Filter Drawer'}",
    "{showFilters ? '✕ Close Filter' : '🎛️ Select Groups'}"
)

with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated button text labels in src/App.js!")
