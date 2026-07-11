import React, { useState } from 'react';

function Tools({ user }) {
  const [selectedToolId, setSelectedToolId] = useState("DEWALT-001");
  const [flippedCards, setFlippedCards] = useState({});
  const [cardTabs, setCardTabs] = useState({});
  
  const [tools, setTools] = useState([
    { toolId: "DEWALT-001", name: "20V Max Hammer Drill", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [{user: "Mario Diaz", action: "Returned", date: "3 days ago", condition: "Good"}] },
    { toolId: "FLIR-042", name: "Thermal Imaging Camera", status: "CHECKED_OUT", condition: "Good", assignedUser: "Mario Diaz", daysOut: 3, history: [{user: "Mario Diaz", action: "Checked Out", date: "3 days ago", condition: "Good"}] },
    { toolId: "MILWK-077", name: "M18 Fuel Hackzall", status: "CHECKED_OUT", condition: "Fair", assignedUser: "Chris Evans", daysOut: 1, history: [{user: "Chris Evans", action: "Checked Out", date: "1 day ago", condition: "Fair"}] },
    { toolId: "DEWALT-002", name: "20V Max XR Impact Driver", status: "AVAILABLE", condition: "New", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "DEWALT-003", name: "20V Max XR Impact Driver", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-109", name: "M18 Search Light", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-136", name: "M18 Packout Radio", status: "AVAILABLE", condition: "Good", assignedUser: null, daysOut: 0, history: [] },
    { toolId: "MILWK-078", name: "M18 Rover Flood Light", status: "CHECKED_OUT", condition: "Good", assignedUser: "Sarah Connor", daysOut: 2, history: [] }
  ]);

  const selectedTool = tools.find(t => t.toolId === selectedToolId) || tools[0];

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '16px 12px 40px 12px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      <style>{`
        .inspector-scroll::-webkit-scrollbar { width: 6px; }
        .inspector-scroll::-webkit-scrollbar-track { background: transparent; }
        .inspector-scroll::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
        
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; min-height: 190px; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; border-radius: 12px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; background-color: #1c1c1e; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #1c1c1e; display: flex; flex-direction: column; padding: 16px; overflow: hidden; }
        
        .tab-btn { flex: 1; padding: 6px; font-size: 11px; font-weight: 700; cursor: pointer; border-radius: 6px; text-align: center; border: none; transition: all 0.2s; }
        .tab-active { background-color: #ffffff; color: #1d1d1f; }
        .tab-inactive { background-color: #2c2c2e; color: #86868b; }
        .tab-inactive:hover { background-color: #3a3a3c; color: #d2d2d7; }
      `}</style>

      {/* LEFT COLUMN: THE MATRIX */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {tools.map(tool => {
          const isSelected = tool.toolId === selectedToolId;
          const isOut = tool.status === 'CHECKED_OUT';
          const isFlipped = !!flippedCards[tool.toolId];
          const activeTab = cardTabs[tool.toolId] || 'manifest';
          
          return (
            <div 
              key={tool.toolId} 
              className="card-perspective-wrapper"
              onClick={() => setSelectedToolId(tool.toolId)}
            >
              <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT OF CARD */}
                <div className="card-face card-front" style={{ padding: '16px', border: isSelected ? '2px solid #007aff' : '1px solid #3a3a3c', boxShadow: isSelected ? '0 0 15px rgba(0, 122, 255, 0.2)' : 'none', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isOut ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)', color: isOut ? '#ff9500' : '#34c759', letterSpacing: '0.05em' }}>
                      {isOut ? 'DEPLOYED' : 'IN CRIB'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '1px', textAlign: 'center', color: '#ffffff' }}>
                    [ || {tool.toolId} ]
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: isSelected ? '#007aff' : '#2c2c2e', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {isOut ? 'RETURN' : 'CHECK OUT'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d2d2d7', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      Flip ⤹
                    </button>
                  </div>
                </div>

                {/* BACK OF CARD (TABS) */}
                <div className="card-face card-back" style={{ border: isSelected ? '2px solid #007aff' : '1px solid #3a3a3c', boxShadow: isSelected ? '0 0 15px rgba(0, 122, 255, 0.2)' : 'none' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '12px' }}>
                      <button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}>Kits</button>
                      <button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}>QR</button>
                      <button className={`tab-btn ${activeTab === 'specs' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'specs'})); }}>Specs</button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: false})); }} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* MANIFEST TAB */}
                    {activeTab === 'manifest' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {['2x 20V Batteries', 'Charging Block', 'Hard Shell Case'].map((item, i) => (
                          <label key={i} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#d2d2d7', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '14px', height: '14px', accentColor: '#007aff' }} /> {item}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {/* QR TRANSFER TAB */}
                    {activeTab === 'qr' && (
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '8px', display: 'inline-block' }}>
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=TRANSFER_${tool.toolId}&color=000000&bgcolor=ffffff`} alt="QR" style={{ width: '80px', height: '80px', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '8px', fontWeight: '600' }}>SCAN FOR CUSTODY</div>
                      </div>
                    )}
                    
                    {/* SPECS TAB */}
                    {activeTab === 'specs' && (
                      <div style={{ fontSize: '12px', color: '#86868b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>S/N:</span> {tool.toolId}-9X8B</div>
                        <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Purchased:</span> Jan 14, 2024</div>
                        <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Warranty:</span> Expires Jan 2029</div>
                        <div style={{ color: '#007aff', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>📄 Download PDF Manual</div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: THE INSPECTOR */}
      <div style={{ width: '420px', backgroundColor: '#1c1c1e', borderRadius: '16px', border: '1px solid #3a3a3c', padding: '24px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c' }}>
          <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>INSPECTOR DASHBOARD</div>
          <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
            {selectedTool.toolId}
          </div>
          <div style={{ color: '#007aff', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>{selectedTool.name}</div>
        </div>

        {/* LOG HISTORY BLOCK */}
        <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>LOG HISTORY</div>
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

        {/* STATUS READOUT */}
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px' }}>CURRENT STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
             <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759', boxShadow: `0 0 10px ${selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759'}` }}></span>
             <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>
                {selectedTool.status === 'CHECKED_OUT' ? 'DEPLOYED' : 'IN CRIB'}
             </span>
          </div>
          {selectedTool.status === 'CHECKED_OUT' && (
            <div style={{ marginTop: '12px', color: '#86868b', fontSize: '14px', lineHeight: '1.5' }}>
              Assigned to: <strong style={{ color: '#ffffff' }}>{selectedTool.assignedUser}</strong> <br/>
              Time in field: <strong style={{ color: '#ff9500' }}>{selectedTool.daysOut} days</strong>
            </div>
          )}
        </div>

        {/* MASTER ACTION DECK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          {selectedTool.status === 'AVAILABLE' ? (
            <button style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
              CHECK OUT TO EMPLOYEE
            </button>
          ) : (
            <button style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#ff9500', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
              RETURN TO TOOL CRIB
            </button>
          )}
          <button style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'transparent', color: '#ff3b30', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            FLAG AS DAMAGED / MAINTENANCE
          </button>
        </div>

      </div>
    </div>
  );
}

export default Tools;
