import React from 'react';

const BulkActionToolbar = ({ 
  selectedDevices, setSelectedDevices, bulkGroupInput, setBulkGroupInput, 
  applyBulkGroup, bulkNameInput, setBulkNameInput, applyBulkSequentialNaming,
  bulkNoteInput, setBulkNoteInput, applyBulkNote, applyBulkSetHome, 
  applyBulkClearHome, applyBulkFactoryReset, assets, updateAttribute, setMarineModes,
  inputStyle, primaryButtonStyle, secondaryButtonStyle
}) => {
  if (selectedDevices.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#1c1c1e',
      border: '1px solid #3a3a3c',
      borderRadius: '14px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      padding: '20px 40px',
      marginTop: '16px',
      boxSizing: 'border-box',
      width: '100%'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em' }}>{selectedDevices.length} Kinetic Card{selectedDevices.length === 1 ? '' : 's'} Selected</div>
          <div style={{ fontSize: '14px', color: '#86868b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedDevices([])}>Deselect all records</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              list="group-suggestions-list"
              placeholder="Assign to Group..." 
              value={bulkGroupInput}
              onChange={(e) => setBulkGroupInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={applyBulkGroup} disabled={!bulkGroupInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkGroupInput.trim() ? 1 : 0.4 }}>Move</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              placeholder="e.g. Cosmo-1"
              value={bulkNameInput}
              onChange={(e) => setBulkNameInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={() => applyBulkSequentialNaming(bulkNameInput)} disabled={!bulkNameInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkNameInput.trim() ? 1 : 0.4 }}>Sequence Name</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              placeholder="Post log to Group..." 
              value={bulkNoteInput}
              onChange={(e) => setBulkNoteInput(e.target.value)}
              style={inputStyle}
            />
            <button onClick={applyBulkNote} disabled={!bulkNoteInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkNoteInput.trim() ? 1 : 0.4 }}>Post log to Group</button>
          </div>

          <div className="marine-home-group">
            <button onClick={applyBulkSetHome} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#34c759", color: "#34c759" }}>Set Home Anchors</button>
            <button onClick={async () => { 
              if (!window.confirm("Are you sure you want to toggle Marine Mode for " + selectedDevices.length + " selected device(s)?")) return; 
              await Promise.all(selectedDevices.map(id => { 
                const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id); 
                const currentVal = !!dev.isMarineMode; 
                return updateAttribute(dev.deviceId, 'LATEST', 'isMarineMode', !currentVal, '#mm', true); 
              })); 
              setMarineModes(prev => { 
                const res = {...prev}; 
                selectedDevices.forEach(id => res[id] = !res[id]); 
                return res; 
              }); 
              alert("Marine Mode permanently updated in database."); 
              setSelectedDevices([]); 
            }} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#007aff", color: "#007aff" }}>⚓ Toggle Marine Mode</button>
          </div>

          <button onClick={applyBulkClearHome} style={{ ...secondaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', borderColor: '#ff9500', color: '#ff9500' }}>Clear Home Anchors</button>
          <button onClick={applyBulkFactoryReset} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#ff3b30", color: "#ff3b30" }}>Factory Reset</button>

        </div>
      </div>
    </div>
  );
};

export default BulkActionToolbar;
