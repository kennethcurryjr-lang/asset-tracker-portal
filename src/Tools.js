import React, { useState } from 'react';

function Tools({ user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [flippedCards, setFlippedCards] = useState({});
  
  // A solid array of demo data to show the client a busy, active system
  const [tools, setTools] = useState([
    { toolId: "DEWALT-001", name: "20V Max Hammer Drill", status: "AVAILABLE", condition: "GOOD", assignedUser: null, daysOut: 0 },
    { toolId: "FLIR-042", name: "Thermal Imaging Camera", status: "CHECKED_OUT", condition: "GOOD", assignedUser: "MARIO DIAZ", daysOut: 3 },
    { toolId: "MILWK-077", name: "M18 Fuel Hackzall", status: "AVAILABLE", condition: "GOOD", assignedUser: null, daysOut: 0 },
    { toolId: "HILTI-993", name: "TE 70-ATC Rotary Hammer", status: "CHECKED_OUT", condition: "FAIR", assignedUser: "CHRIS EVANS", daysOut: 1 },
    { toolId: "DEWALT-005", name: "20V Max XR Impact Driver", status: "AVAILABLE", condition: "NEW", assignedUser: null, daysOut: 0 },
    { toolId: "FLUKE-87V", name: "Industrial Multimeter", status: "CHECKED_OUT", condition: "GOOD", assignedUser: "SARAH CONNOR", daysOut: 5 }
  ]);

  const containerStyle = { backgroundColor: 'transparent', minHeight: '100vh', padding: '0 12px 40px 12px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto' };
  const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#1c1c1e', color: '#ffffff', width: '100%', boxSizing: 'border-box' };
  
  return (
    <div style={containerStyle}>
      <style>{`
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; min-height: 240px; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; border-radius: 14px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #1c1c1e; border: 1px solid #3a3a3c; padding: 24px; display: flex; flex-direction: column; }
        
        .kinetic-tool-card {
            background-color: #1c1c1e;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        .kinetic-tool-card.checked-out {
            border: 1px solid rgba(255, 149, 0, 0.6);
            background: linear-gradient(180deg, rgba(255, 149, 0, 0.08) 0%, #1c1c1e 40%);
            box-shadow: 0 0 15px rgba(255, 149, 0, 0.15);
        }
        .kinetic-tool-card.available {
            border: 1px solid #3a3a3c;
        }
        
        .pill-btn { padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 13px; flex: 1; transition: opacity 0.2s; }
        .pill-btn:hover { opacity: 0.8; }
        .btn-checkout { background-color: #ffffff; color: #1d1d1f; }
        .btn-return { background-color: #ff9500; color: #1d1d1f; }
        .btn-flip { background-color: #2c2c2e; color: #d2d2d7; border: 1px solid #3a3a3c; }
        
        /* Custom Scrollbar for Timeline */
        .timeline-scroll::-webkit-scrollbar { width: 6px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', marginTop: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}></h2>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <input type="text" placeholder="Scan Barcode or Search ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {tools.map(tool => {
          const isFlipped = !!flippedCards[tool.toolId];
          const isOut = tool.status === 'CHECKED_OUT';

          return (
            <div key={tool.toolId} className="card-perspective-wrapper">
              <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT OF CARD */}
                <div className={`card-face card-front kinetic-tool-card ${isOut ? 'checked-out' : 'available'}`}>
                  
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isOut ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)', color: isOut ? '#ff9500' : '#34c759', letterSpacing: '0.05em' }}>
                      {isOut ? 'DEPLOYED' : 'IN CRIB'}
                    </span>
                    <span style={{ fontSize: '13px', color: '#86868b', fontFamily: 'monospace', letterSpacing: '1px' }}>[ || {tool.toolId} ]</span>
                  </div>

                  {/* Morphing Data Block */}
                  {isOut ? (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: '#86868b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.05em' }}>Assigned To</div>
                      <div style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '4px' }}>{tool.assignedUser}</div>
                      <div style={{ fontSize: '14px', color: '#a1a1a6' }}>{tool.name}</div>
                      <div style={{ marginTop: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500', boxShadow: '0 0 8px rgba(255,149,0,0.6)' }}></span>
                          <span style={{ color: '#ff9500', fontWeight: '600' }}>Time in field: {tool.daysOut} {tool.daysOut === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', paddingBottom: '16px' }}>
                      <div style={{ fontSize: '22px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '8px' }}>{tool.name}</div>
                      <div style={{ fontSize: '14px', color: '#86868b' }}>Condition: <span style={{ color: '#d2d2d7', fontWeight: '500' }}>{tool.condition}</span></div>
                    </div>
                  )}

                  {/* Action Deck */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #3a3a3c' }}>
                    {isOut ? (
                      <button className="pill-btn btn-return">[ RETURN TO CRIB ]</button>
                    ) : (
                      <button className="pill-btn btn-checkout">[ CHECK OUT ]</button>
                    )}
                    <button className="pill-btn btn-flip" style={{ flex: 0.3 }} onClick={() => setFlippedCards(prev => ({...prev, [tool.toolId]: !prev[tool.toolId]}))}>Flip ⤹</button>
                  </div>
                </div>

                {/* BACK OF CARD (CUSTODY LOG) */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Custody Log</div>
                    <button className="pill-btn btn-flip" style={{ flex: 'none', padding: '6px 12px', fontSize: '11px' }} onClick={() => setFlippedCards(prev => ({...prev, [tool.toolId]: !prev[tool.toolId]}))}>⤶ Back</button>
                  </div>
                  
                  <div className="timeline-scroll" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ borderLeft: '2px solid #3a3a3c', marginLeft: '6px', paddingLeft: '16px', position: 'relative' }}>
                      
                      <div style={{ paddingBottom: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9500', border: '2px solid #1c1c1e' }}></div>
                        <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Checked out to {tool.assignedUser || 'Mario Diaz'}</div>
                        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px' }}>Jul 10, 2026 • Notes: Project Alpha</div>
                      </div>

                      <div style={{ paddingBottom: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#34c759', border: '2px solid #1c1c1e' }}></div>
                        <div style={{ fontSize: '14px', color: '#d2d2d7', fontWeight: '500' }}>Returned to Crib</div>
                        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px' }}>Jul 08, 2026 • Condition: Good</div>
                      </div>
                      
                      <div style={{ paddingBottom: '8px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9500', border: '2px solid #1c1c1e' }}></div>
                        <div style={{ fontSize: '14px', color: '#d2d2d7', fontWeight: '500' }}>Checked out to Chris Evans</div>
                        <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px' }}>Jun 29, 2026 • Emergency Dispatch</div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tools;
