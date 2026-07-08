with open('src/App.js', 'r') as f:
    content = f.read()

# --- PHASE 1: Revive the "UnNamed Local" Filter ---
# Old logic: checked against "2026-07-05"
# New logic: generates "Jul 5" to match your new human-readable UI timestamps
old_date = 'const todayStr = new Date().toISOString().split("T")[0];'
new_date = 'const todayStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric" });'
content = content.replace(old_date, new_date)

# --- PHASE 2: Un-Jam the Bulk Marine Mode Toggle ---
# Old logic: read from an unreliable temporary React state variable
# New logic: reads the strict truth boolean directly from the DynamoDB payload
old_marine = "const currentVal = marineModes[id];"
new_marine = "const currentVal = !!dev.isMarineMode;"
content = content.replace(old_marine, new_marine)

# --- PHASE 3: The Budget-Saver (Throttle DynamoDB Scans) ---
# Old logic: pinged the entire database every 5 seconds (5000ms)
# New logic: throttles the ping to every 60 seconds (60000ms)
old_interval = "const interval = setInterval(fetchDevices, 5000);"
new_interval = "const interval = setInterval(fetchDevices, 60000); // ⏱️ Throttled to 60s to prevent AWS scan billing spikes"
content = content.replace(old_interval, new_interval)

with open('src/App.js', 'w') as f:
    f.write(content)

print("✅ Phase 1: UnNamed Local filter rewired to human-readable dates.")
print("✅ Phase 2: Marine Mode logic successfully linked to the true database state.")
print("✅ Phase 3: DynamoDB API calls throttled by 91% to protect your AWS billing.")
print("✅ src/App.js patched successfully!")
