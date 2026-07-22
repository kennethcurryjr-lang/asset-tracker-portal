import re
import shutil
import os
import glob

def find_app_js():
    # 1. Search current directory and common paths
    candidates = glob.glob("**/App.js", recursive=True) + glob.glob("../**/App.js", recursive=True)
    for c in candidates:
        if "node_modules" not in c and "build" not in c:
            return c
    return None

def apply_patches():
    app_file = find_app_js()
    if not app_file:
        print("❌ Error: Could not locate App.js automatically.")
        return

    print(f"🎯 Found target file: {app_file}")
    backup_file = f"{app_file}.bak"

    # 2. Create a safe backup copy
    shutil.copy(app_file, backup_file)
    print(f"🛡️  Backup created at {backup_file}")

    with open(app_file, "r", encoding="utf-8") as f:
        content = f.read()

    # --- FIX 1: Add showAllCompanyFleets to fetchDevices useCallback dependencies ---
    content = content.replace(
        "}, [auth.isAuthenticated, auth.user]);",
        "}, [auth.isAuthenticated, auth.user, showAllCompanyFleets]);"
    )

    # --- FIX 2: Standardize noteInputs and maintenanceInputs to use full deviceId ---
    content = content.replace("noteInputs[item.deviceId.slice(-5)]", "noteInputs[item.deviceId]")
    content = content.replace("maintenanceInputs[item.deviceId.slice(-5)]", "maintenanceInputs[item.deviceId]")

    # --- FIX 3: Change button hover target from e.target to e.currentTarget ---
    content = content.replace("e.target.style.", "e.currentTarget.style.")

    # Write patched code back to App.js
    with open(app_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Successfully patched {app_file}!")

if __name__ == "__main__":
    apply_patches()
