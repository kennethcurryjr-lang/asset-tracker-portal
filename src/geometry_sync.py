import re

with open('src/Inventory.js', 'r') as f:
    content = f.read()

# 1. THE PHYSICS ENGINE
# Standardize the card flip animation to the exact cubic-bezier curve from Kinetic Assets
content = content.replace('cubic-bezier(0.4, 0.2, 0.2, 1)', 'cubic-bezier(0.4, 0, 0.2, 1)')

# 2. THE GLASS OVERLAYS
# Swap the heavy 90% opacity warehouse modals for the refined 60% frosted glass with 15px Webkit blurs
content = re.sub(r'rgba\(0,\s*0,\s*0,\s*0\.[89]5?\)', 'rgba(0, 0, 0, 0.6)', content)
content = re.sub(
    r'backdropFilter:\s*["\']blur\(\d+px\)["\'](?:,\s*WebkitBackdropFilter:\s*["\']blur\(\d+px\)["\'])?', 
    'backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)"', 
    content
)

# 3. THE GEOMETRY
# Unify all cards to 14px, all modals to 18px, and all standard buttons/inputs to 8px
content = re.sub(r'borderRadius:\s*["\']16px["\']', 'borderRadius: "14px"', content)
content = re.sub(r'borderRadius:\s*["\'](?:20|24)px["\']', 'borderRadius: "18px"', content)
content = re.sub(r'borderRadius:\s*["\'](?:10|12)px["\']', 'borderRadius: "8px"', content)

# 4. THE TYPOGRAPHY
# Inject the signature Apple-style -0.01em letter spacing into all major headers
content = re.sub(
    r'(fontSize:\s*["\'](?:18|20|22|24|28|36)px["\'],\s*fontWeight:\s*["\'](?:600|700|800)["\'])(?!,\s*letterSpacing)', 
    r'\1, letterSpacing: "-0.01em"', 
    content
)
# Soften the heaviest 800/700 font weights down to a cleaner 700/600 hierarchy
content = re.sub(r'fontWeight:\s*["\']800["\']', 'fontWeight: "700"', content)
content = re.sub(r'fontWeight:\s*["\']700["\']', 'fontWeight: "600"', content)

with open('src/Inventory.js', 'w') as f:
    f.write(content)

print("✅ src/Inventory.js patched! Geometry, physics, and typography successfully synchronized with Kinetic Assets.")
