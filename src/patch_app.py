import shutil

APP_FILE = "App.js"
BACKUP_FILE = "App.js.bak"

def apply_patches():
    # 1. Create a safe backup copy
    shutil.copy(APP_FILE, BACKUP_FILE)
    print(f"🛡️  Backup created at {BACKUP_FILE}")

    with open(APP_FILE, "r", encoding="utf-8") as f:
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
    with open(APP_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Successfully patched {APP_FILE}!")

if __name__ == "__main__":
    apply_patches()
