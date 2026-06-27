const applyBulkFactoryReset = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: PERMANENTLY wipe logs, reset names, and clear home/watchdog for all ${selectedDevices.length} selected devices?`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId === id);
            if (!dev) return;
            // 1. Update the record: Clear fields AND explicitly set isServiceMode to false
            await docClient.send(new UpdateCommand({ 
                TableName: "AssetTrackerData", 
                Key: { deviceId: dev.deviceId, timestamp: dev.timestamp }, 
                UpdateExpression: "REMOVE notesList, note, noteUser, noteTime, tag, homeLat, homeLon, lastServiceModeUser, lastServiceModeTime SET isServiceMode = :val",
                ExpressionAttributeValues: { ":val": false }
            }));
            // 2. Add a note to the timeline so the UI logs the change
            await addNote(dev.deviceId, dev.timestamp, "🛡️ Factory Reset: Watchdog Disabled");
        }));
        alert(`Successfully reset ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { 
        console.error(err);
        alert("Bulk reset failed."); 
    }
  };
