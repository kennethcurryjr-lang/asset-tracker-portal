  const applyBulkGroup = async () => {
    if (!bulkGroupInput || !bulkGroupInput.trim()) return;
    const results = await Promise.all(selectedDevices.map(async (id) => {
      try {
        const dev = assets.find(a => a.deviceId.slice(-5) === id);
        if (!dev) throw new Error("Device " + id + " not found");
        await updateAttribute(dev.deviceId, "LATEST", 'group', bulkGroupInput.trim(), '#g');
        return { id, success: true };
      } catch (err) {
        return { id, success: false, error: err.message };
      }
    }));
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      alert(`Bulk group update partial failure: ${failures.map(f => f.id).join(", ")}`);
    } else {
      alert(`Assigned group folder "${bulkGroupInput.trim()}" to ${selectedDevices.length} Kinetic Cards.`);
    }
    resetAllInputs();
    fetchDevices();
  };
