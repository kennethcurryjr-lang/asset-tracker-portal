import React, { useState, useMemo } from 'react';

// Generates 100 heavy-duty power tools with realistic asset values
const generateTools = () => {
  const toolTemplates = [
    { prefix: "MILW", name: "Milwaukee M18 Fuel Hammer Drill", value: 299 },
    { prefix: "MILW", name: "Milwaukee M18 Hackzall", value: 159 },
    { prefix: "MILW", name: "Milwaukee M18 Force Logic Press", value: 2400 },
    { prefix: "MILW", name: "Milwaukee M12 ProPEX Expansion Tool", value: 450 },
    { prefix: "MILW", name: "Milwaukee M18 Angle Grinder", value: 199 },
    { prefix: "DWLT", name: "DeWalt 20V Max XR Impact Driver", value: 149 },
    { prefix: "DWLT", name: "DeWalt 20V Max Reciprocating Saw", value: 199 },
    { prefix: "DWLT", name: "DeWalt 20V Max Oscillating Multi-Tool", value: 179 },
    { prefix: "DWLT", name: "DeWalt 60V Max Flexvolt Circular Saw", value: 399 },
    { prefix: "DWLT", name: "DeWalt 20V Max Jobsite Blower", value: 169 },
    { prefix: "MAKI", name: "Makita 18V LXT Sub-Compact Drill", value: 179 },
    { prefix: "MAKI", name: "Makita 18V LXT Brushless Router", value: 229 },
    { prefix: "MAKI", name: "Makita 36V Rear Handle Circular Saw", value: 349 },
    { prefix: "HILT", name: "Hilti TE 70-ATC Rotary Hammer", value: 1850 },
    { prefix: "HILT", name: "Hilti DX 460 Powder-Actuated Tool", value: 950 },
    { prefix: "HILT", name: "Hilti PM 40-MG Multi-Line Laser", value: 1200 },
    { prefix: "BSCH", name: "Bosch 18V Bulldog Extreme Rotary Hammer", value: 350 },
    { prefix: "BSCH", name: "Bosch GLM 400 CL Laser Measure", value: 299 },
    { prefix: "FEST", name: "Festool TS 55 REQ Track Saw", value: 750 },
    { prefix: "FEST", name: "Festool CT 15 HEPA Dust Extractor", value: 499 },
    { prefix: "RIDG", name: "Ridgid 18V Brushless Jobsite Table Saw", value: 550 }
  ];

  const users = ["Mario Diaz", "Chris Evans", "Sarah Connor", "Marcus Johnson", "Elena Rodriguez", "David Kim", "James Holden"];
  const conditions = ["New", "Excellent", "Good", "Good", "Fair", "Requires Maintenance"];

  let generated = [];
  for (let i = 1; i <= 100; i++) {
    const template = toolTemplates[i % toolTemplates.length];
    const isOut = (i % 3 === 0); 
    const assignedUser = isOut ? users[i % users.length] : null;
    const daysOut = isOut ? (i % 14) + 1 : 0;
    const condition = conditions[i % conditions.length];
    const idNum = String(i).padStart(3, '0');
    
    generated.push({
      toolId: `${template.prefix}-${idNum}`,
      name: template.name,
      value: template.value,
      status: isOut ? "CHECKED_OUT" : "AVAILABLE",
      condition: condition,
      assignedUser: assignedUser,
      daysOut: daysOut,
      history: isOut ? [
        { user: assignedUser, action: "Checked Out", date: `${daysOut} days ago`, condition: condition }
      ] : (i % 2 === 0 ? [{ user: users[(i+1)%users.length], action: "Returned", date: `${(i % 10)+2} days ago`, condition: condition }] : [])
    });
  }
  return generated;
};

function Tools({ user }) {
  const [tools, setTools] = useState(generateTools);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToolId, setSelectedToolId] = useState("MILW-001");
  const [flippedCards, setFlippedCards] = useState({});
  const [cardTabs, setCardTabs] = useState({});
  
  // Dispatch Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [dispatchUser, setDispatchUser] = useState("");
  const [dispatchProject, setDispatchProject] = useState("");

  const filteredTools = useMemo(() => {
    if (!searchTerm.trim()) return tools;
    const term = searchTerm.toLowerCase();
    return tools.filter(t => 
      t.toolId.toLowerCase().includes(term) || 
      t.name.toLowerCase().includes(term) ||
      (t.assignedUser && t.assignedUser.toLowerCase().includes(term))
    );
  }, [tools, searchTerm]);

  const selectedTool = tools.find(t => t.toolId === selectedToolId) || filteredTools[0] || tools[0];

  // Financial HUD Calculations
  const totalValue = tools.reduce((acc, t) => acc + t.value, 0);
  const deployedTools = tools.filter(t => t.status === 'CHECKED_OUT');
  const deployedValue = deployedTools.reduce((acc, t) => acc + t.value, 0);
  const cribValue = totalValue - deployedValue;

  const handleCheckout = () => {
    if (!dispatchUser) return;
    setTools(prev => prev.map(t => {
      if (t.toolId === selectedToolId) {
        return {
          ...t,
          status: 'CHECKED_OUT',
          assignedUser: dispatchUser,
          daysOut: 0,
          history: [{ user: dispatchUser, action: `Dispatched to: ${dispatchProject || 'Field'}`, date: 'Just now', condition: t.condition }, ...t.history]
        };
      }
      return t;
    }));
    setCheckoutModalOpen(false);
    setDispatchUser("");
    setDispatchProject("");
  };

  const handleReturn = () => {
    setTools(prev => prev.map(t => {
      if (t.toolId === selectedToolId) {
        return {
          ...t,
          status: 'AVAILABLE',
          assignedUser: null,
          daysOut: 0,
          history: [{ user: "Admin", action: "Returned to Crib", date: 'Just now', condition: t.condition }, ...t.history]
        };
      }
      return t;
    }));
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '0 12px 40px 12px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <style>{`
        .inspector-scroll::-webkit-scrollbar { width: 6px; }
        .inspector-scroll::-webkit-scrollbar-track { background: transparent; }
        .inspector-scroll::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; min-height: 200px; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; border-radius: 12px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; background-color: #1c1c1e; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #1c1c1e; display: flex; flex-direction: column; padding: 16px; overflow: hidden; }
        .tab-btn { flex: 1; padding: 6px; font-size: 11px; font-weight: 700; cursor: pointer; border-radius: 6px; text-align: center; border: none; transition: all 0.2s; }
        .tab-active { background-color: #ffffff; color: #1d1d1f; }
        .tab-inactive { background-color: #2c2c2e; color: #86868b; }
        .custom-input { padding: 12px 16px; border-radius: 8px; border: 1px solid #3a3a3c; background-color: #1c1c1e; color: #ffffff; width: 100%; box-sizing: border-box; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .custom-input:focus { border-color: #ffcc00; }
        @keyframes pulseAlert { 0% { box-shadow: 0 0 0 0 rgba(255,149,0,0.4); } 70% { box-shadow: 0 0 0 10px rgba(255,149,0,0); } 100% { box-shadow: 0 0 0 0 rgba(255,149,0,0); } }
      `}</style>

      {/* EXECUTIVE FINANCIAL HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', padding: '16px 24px', borderRadius: '12px', border: '1px solid #3a3a3c', marginTop: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TOTAL FLEET ASSET VALUE</span>
          <span style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>${totalValue.toLocaleString()}</span>
        </div>
        <div style={{ width: '1px', height: '40px', backgroundColor: '#3a3a3c' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE DEPLOYED IN FIELD</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500' }}></span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#ff9500' }}>${deployedValue.toLocaleString()} <span style={{ fontSize: '14px', color: '#86868b' }}>({deployedTools.length} Units)</span></span>
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', backgroundColor: '#3a3a3c' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SECURED IN TOOL CRIB</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#34c759' }}>${cribValue.toLocaleString()} <span style={{ fontSize: '14px', color: '#86868b' }}>({tools.length - deployedTools.length} Units)</span></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flex: 1 }}>
        {/* LEFT COLUMN: THE MATRIX */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                  <input type="text" placeholder="Search by Tool ID, Name, or Assigned Employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" />
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', alignContent: 'start' }}>
              {filteredTools.map(tool => {
              const isSelected = tool.toolId === selectedToolId;
              const isOut = tool.status === 'CHECKED_OUT';
              const isFlipped = !!flippedCards[tool.toolId];
              const activeTab = cardTabs[tool.toolId] || 'manifest';
              
              return (
                  <div key={tool.toolId} className="card-perspective-wrapper" onClick={() => setSelectedToolId(tool.toolId)}>
                  <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                      
                      <div className="card-face card-front" style={{ padding: '16px', border: isSelected ? '2px solid #ffcc00' : '1px solid #3a3a3c', boxShadow: isSelected ? '0 0 15px rgba(255, 204, 0, 0.15)' : 'none', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isOut ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)', color: isOut ? '#ff9500' : '#34c759', letterSpacing: '0.05em' }}>
                          {isOut ? 'DEPLOYED' : 'IN CRIB'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '600' }}>[ {tool.toolId} ]</span>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.3', color: '#ffffff' }}>{tool.name}</div>
                          {isOut && (<div style={{ fontSize: '12px', color: '#ff9500', marginTop: '6px', fontWeight: '600' }}>👤 {tool.assignedUser}</div>)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); isOut ? handleReturn() : setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: isSelected ? '#ffcc00' : '#2c2c2e', color: isSelected ? '#1d1d1f' : '#ffffff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                            {isOut ? 'RETURN' : 'CHECK OUT'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d2d2d7', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                            Flip ⤹
                          </button>
                      </div>
                      </div>

                      <div className="card-face card-back" style={{ border: isSelected ? '2px solid #ffcc00' : '1px solid #3a3a3c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '12px' }}>
                          <button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}>Kits</button>
                          <button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}>QR</button>
                          <button className={`tab-btn ${activeTab === 'specs' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'specs'})); }}>Specs</button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: false})); }} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                          {activeTab === 'manifest' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {['Primary Tool Body', 'High-Capacity Battery Pair', 'Rapid Charger Base', 'Hard Shell Case'].map((item, i) => (
                              <label key={i} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#d2d2d7', cursor: 'pointer' }}><input type="checkbox" defaultChecked style={{ width: '14px', height: '14px', accentColor: '#ffcc00' }} /> {item}</label>
                              ))}
                          </div>
                          )}
                          {activeTab === 'qr' && (
                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '8px', display: 'inline-block' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=TRANSFER_${tool.toolId}&color=000000&bgcolor=ffffff`} alt="QR" style={{ width: '80px', height: '80px', display: 'block' }} /></div>
                              <div style={{ fontSize: '11px', color: '#86868b', marginTop: '8px', fontWeight: '600' }}>SCAN FOR CUSTODY</div>
                          </div>
                          )}
                          {activeTab === 'specs' && (
                          <div style={{ fontSize: '12px', color: '#86868b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Value:</span> ${tool.value}</div>
                              <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Purchased:</span> Jan 14, 2024</div>
                              <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Warranty:</span> Expires Jan 2029</div>
                              <div style={{ color: '#ffcc00', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>📄 Download PDF Manual</div>
                          </div>
                          )}
                      </div>
                      </div>

                  </div>
                  </div>
              );
              })}
          </div>
        </div>

        {/* RIGHT COLUMN: THE INSPECTOR */}
        <div style={{ width: '420px', backgroundColor: '#1c1c1e', borderRadius: '16px', border: '1px solid #3a3a3c', padding: '24px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {selectedTool ? (
              <>
                  <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '18px', fontWeight: '700', color: '#34c759' }}>${selectedTool.value}</div>
                  <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>INSPECTOR DASHBOARD</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>{selectedTool.toolId}</div>
                  <div style={{ color: '#ffcc00', fontSize: '16px', fontWeight: '600', marginTop: '4px', lineHeight: '1.3' }}>{selectedTool.name}</div>
                  </div>

                  {/* PREDICTIVE AI WARNING */}
                  {(selectedTool.condition === 'Fair' || selectedTool.condition === 'Requires Maintenance' || selectedTool.daysOut > 7) && (
                    <div style={{ backgroundColor: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.5)', padding: '16px', borderRadius: '12px', animation: 'pulseAlert 2s infinite' }}>
                      <div style={{ color: '#ff9500', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>⚠️</span> PREDICTIVE MAINTENANCE AI
                      </div>
                      <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                        Based on field deployment telemetry and lifecycle modeling, carbon brush replacement and motor calibration are recommended within <strong>14 days</strong> to prevent catastrophic failure in the field.
                      </div>
                    </div>
                  )}

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

                  <div style={{ padding: '12px 0' }}>
                  <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px' }}>CURRENT STATUS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759', boxShadow: `0 0 10px ${selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759'}` }}></span>
                      <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>{selectedTool.status === 'CHECKED_OUT' ? 'DEPLOYED' : 'IN CRIB'}</span>
                  </div>
                  {selectedTool.status === 'CHECKED_OUT' && (
                      <div style={{ marginTop: '12px', color: '#86868b', fontSize: '14px', lineHeight: '1.5' }}>
                      Assigned to: <strong style={{ color: '#ffffff' }}>{selectedTool.assignedUser}</strong> <br/>
                      Time in field: <strong style={{ color: '#ff9500' }}>{selectedTool.daysOut} {selectedTool.daysOut === 1 ? 'day' : 'days'}</strong>
                      </div>
                  )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  {selectedTool.status === 'AVAILABLE' ? (
                      <button onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                      CHECK OUT TO EMPLOYEE
                      </button>
                  ) : (
                      <button onClick={handleReturn} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#ff9500', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                      RETURN TO TOOL CRIB
                      </button>
                  )}
                  <button style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'transparent', color: '#ff3b30', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                      FLAG AS DAMAGED / MAINTENANCE
                  </button>
                  </div>
              </>
          ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontStyle: 'italic', fontSize: '14px' }}>No assets match your search.</div>
          )}
        </div>
      </div>

      {/* RAPID DISPATCH MODAL */}
      {checkoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '440px', border: '1px solid #3a3a3c', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Dispatch Asset</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Transferring custody of <strong style={{color: '#ffcc00'}}>[{selectedTool.toolId}]</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EMPLOYEE / TECH NAME</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chris Evans" 
                  value={dispatchUser}
                  onChange={(e) => setDispatchUser(e.target.value)}
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>JOB SITE / PROJECT CODE (OPTIONAL)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Site Alpha - Level 3" 
                  value={dispatchProject}
                  onChange={(e) => setDispatchProject(e.target.value)}
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setCheckoutModalOpen(false); setDispatchUser(""); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCheckout} disabled={!dispatchUser.trim()} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: dispatchUser.trim() ? 1 : 0.4 }}>AUTHORIZE</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tools;
