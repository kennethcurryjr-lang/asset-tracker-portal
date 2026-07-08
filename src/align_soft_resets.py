import re

with open('src/App.js', 'r') as f:
    content = f.read()

# 1. Convert single reset to a Soft Wipe (if not already done)
single_pattern = r'const applySingleFactoryReset = async \(id, batteryLevel, lat, lon\) => \{.*?alert\("Reset failed\. Check console for details\."\); \n    \}\n  \};'
single_replacement = """const applySingleFactoryReset = async (deviceId) => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: Are you sure you want to clear the Name, Group, Home Anchor, and Service Schedule for this device?`)) return;
    try {
        await docClient.send(new UpdateCommand({
          TableName: "AssetTrackerData",
          Key: { deviceId, timestamp: "LATEST" },
          UpdateExpression: "SET tag = :c, #grp = :c, homeLat = :c, homeLon = :c, maintenanceInterval = :c, maintenanceDueDate = :c, isServiceMode = :sm",
          ExpressionAttributeNames: { "#grp": "group" },
          ExpressionAttributeValues: { 
            ":c": "CLEARED",
            ":sm": true
          }
        }));
        await addNote(deviceId, "LATEST", "🔄 Device profile soft-reset (Watchdog OFF).");
        alert(`Successfully reset profile for ${deviceId.slice(-5)}.`);
        fetchDevices();
    } catch (err) { 
        console.error("Soft Reset Error:", err);
        alert("Reset failed. Check console for details."); 
    }
  };"""
content = re.sub(single_pattern, single_replacement, content, flags=re.DOTALL)

# 2. Wire single button to the back of the card (if not already there)
if "⚠️ Factory Reset Profile" not in content:
    old_back = "<div style={{ fontSize: '14px', fontWeight: '500', color: '#d2d2d7' }}>Expansion Slot Ready</div>"
    new_back = """{isAdmin && (
                      <button onClick={() => applySingleFactoryReset(item.deviceId)} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30', width: '100%', marginBottom: '16px' }}>
                        ⚠️ Factory Reset Profile
                      </button>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#d2d2d7' }}>Expansion Slot Ready</div>"""
    content = content.replace(old_back, new_back)

# 3. OVERHAUL the Bulk Factory Reset to use the safe Soft Wipe logic
bulk_pattern = r'const applyBulkFactoryReset = async \(\) => \{.*?alert\("Bulk reset failed\. Check console for details\."\); \n    \}\n  \};'
bulk_replacement = """const applyBulkFactoryReset = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: Are you sure you want to clear the Name, Group, Home Anchor, and Service Schedule for all ${selectedDevices.length} selected devices?`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
            if (!dev) return;
            await docClient.send(new UpdateCommand({
              TableName: "AssetTrackerData",
              Key: { deviceId: dev.deviceId, timestamp: "LATEST" },
              UpdateExpression: "SET tag = :c, #grp = :c, homeLat = :c, homeLon = :c, maintenanceInterval = :c, maintenanceDueDate = :c, isServiceMode = :sm",
              ExpressionAttributeNames: { "#grp": "group" },
              ExpressionAttributeValues: { 
                ":c": "CLEARED",
                ":sm": true
              }
            }));
            await addNote(dev.deviceId, "LATEST", "🔄 Device profile soft-reset (Watchdog OFF).");
        }));
        alert(`Successfully soft-reset profiles for ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { 
        console.error("Bulk Soft Reset Error:", err);
        alert("Bulk reset failed. Check console for details."); 
    }
  };"""
content = re.sub(bulk_pattern, bulk_replacement, content, flags=re.DOTALL)

with open('src/App.js', 'w') as f:
    f.write(content)

print("✅ Single soft-reset applied and mounted to card back.")
print("✅ Bulk factory reset completely overhauled into a safe soft-reset.")
