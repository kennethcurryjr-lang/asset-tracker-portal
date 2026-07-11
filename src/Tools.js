import React, { useState } from 'react';

function Tools({ user }) {
  const [selectedToolId, setSelectedToolId] = useState("DEWALT-001");
  
  // Dense matrix data simulation
  const [tools, setTools] = useState([
    { toolId: "DEWALT-001", name: "20V Max Hammer Drill", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [{user: "Mario Diaz", action: "Returned", date: "3 days ago", condition: "Good"}, {user: "Mario Diaz", action: "Checked Out", date: "5 days ago", condition: "Good"}] },
    { toolId: "FLIR-042", name: "Thermal Imaging Camera", status: "CHECKED_OUT", condition: "Good", assignedUser: "Mario Diaz", daysOut: 3, history: [{user: "Mario Diaz", action: "Checked Out", date: "3 days ago", condition: "Good"}] },
    { toolId: "MILWK-077", name: "M18 Fuel Hackzall", status: "CHECKED_OUT", condition: "Fair", assignedUser: "Chris Evans", daysOut: 1, history: [{user: "Chris Evans", action: "Checked Out", date: "1 day ago", condition: "Fair"}] },
    { toolId: "DEWALT-002", name: "20V Max XR Impact Driver", status: "AVAILABLE", condition: "New", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "DEWALT-003", name: "20V Max XR Impact Driver", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-109", name: "M18 Search Light", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-136", name: "M18 Packout Radio", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-078", name: "M18 Rover Flood Light", status: "CHECKED_OUT", condition: "Good", assignedUser: "Sarah Connor", daysOut: 2, history: [] },
    { toolId: "DEWALT-005", name: "20V Max Grinder", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "FLIR-097", name: "Thermal Sensor Mk II", status: "CHECKED_OUT", condition: "Good", assignedUser: "Mario Diaz", daysOut: 4, history: [] },
    { toolId: "MILWK-080", name: "M18 Force Logic Press", status: "AVAILABLE", condition: "New", assignedUser: null, daysOut: 0, history: [] }
  ]);

  const selectedTool = tools.find(t => t.toolId === selectedToolId) || tools[0];

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', padding: '16px 12px 40px 12px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      <style>{`
        /* Custom Scrollbar for Inspector Logs */
        .inspector-scroll::-webkit-scrollbar { width: 6px; }
        .inspector-scroll::-webkit-scrollbar-track { background: transparent; }
        .inspector-scroll::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
      `}</style>

      {/* LEFT COLUMN: THE MATRIX */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {tools.map(tool => {
          const isSelected = tool.toolId === selectedToolId;
          const isOut = tool.status === 'CHECKED_OUT';
          
          return (
            <div 
              key={tool.toolId} 
              onClick={() => setSelectedToolId(tool.toolId)}
              style={{ 
                backgroundColor: '#1c1c1e', 
                borderRadius: '12px', 
                padding: '16px', 
                border: isSelected ? '1px solid #007aff' : '1px solid #3a3a3c', 
                boxShadow: isSelected ? '0 0 20px rgba(0, 122, 255, 0.25)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                transition: 'all 0.15s ease-in-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: isOut ? '#ff9500' : '#34c759', letterSpacing: '0.05em' }}>
                  {isOut ? 'CHECKED_OUT' : 'AVAILABLE'}
                </span>
              </div>
              
              <div style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '1px', textAlign: 'center' }}>
                [ || {tool.toolId} ]
              </div>
              
              <button style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '8px', 
                backgroundColor: isSelected ? '#ffffff' : 'transparent', 
                color: isSelected ? '#1d1d1f' : '#ffffff',
                border: isSelected ? 'none' : '1px solid #ffffff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}>
                [ {isOut ? 'RETURN' : 'CHECK OUT'} ]
              </button>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: THE INSPECTOR */}
      <div style={{ width: '420px', backgroundColor: 'transparent', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#d2d2d7' }}>INSPECTOR:</span> <span style={{ color: '#ff9500' }}>{selectedTool.toolId}</span>
          </div>
          <div style={{ color: '#86868b', fontSize: '15px', marginTop: '4px' }}>{selectedTool.name}</div>
        </div>

        {/* LOG HISTORY BLOCK */}
        <div style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '600', letterSpacing: '0.05em' }}>LOG HISTORY</div>
          <div className="inspector-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
            {selectedTool.history.length > 0 ? selectedTool.history.map((log, i) => (
              <div key={i} style={{ borderBottom: '1px solid #2c2c2e', paddingBottom: '8px' }}>
                <div style={{ fontSize: '13px', color: '#d2d2d7', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong style={{ color: '#ffffff' }}>[{log.user}]</strong> {log.action}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{log.date}</span>
                  <span>Condition: {log.condition}</span>
                </div>
              </div>
            )) : <div style={{ fontSize: '13px', color: '#86868b', fontStyle: 'italic' }}>No deployment history on record.</div>}
          </div>
        </div>

        {/* MAINTENANCE RECORD BLOCK */}
        <div style={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '600', letterSpacing: '0.05em' }}>MAINTENANCE RECORD</div>
          <div style={{ fontSize: '13px', color: '#86868b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div>[Date] Service Performed: Brush Replacement</div>
             <div>[Date] Service Performed: Calibration Check</div>
          </div>
        </div>

        {/* STATUS READOUT */}
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '26px', fontWeight: '700', color: selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759', letterSpacing: '1px' }}>
            **{selectedTool.status}**
          </div>
          {selectedTool.status === 'CHECKED_OUT' && (
            <div style={{ marginTop: '10px', color: '#d2d2d7', fontSize: '14px' }}>
              Time in Field <br/>
              <span style={{ color: '#86868b', fontSize: '13px' }}>Deployed {selectedTool.daysOut} days ago</span>
            </div>
          )}
        </div>

        {/* MASTER ACTION DECK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ flex: 1, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: selectedTool.status === 'AVAILABLE' ? 1 : 0.2 }}>
              [CHECK OUT]
            </button>
            <button style={{ flex: 1, padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#1d1d1f', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: selectedTool.status === 'CHECKED_OUT' ? 1 : 0.2 }}>
              [RETURN TO CRIB]
            </button>
          </div>
          <button style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'transparent', color: '#ff3b30', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            [FLAG DAMAGED]
          </button>
        </div>

      </div>
    </div>
  );
}

export default Tools;
