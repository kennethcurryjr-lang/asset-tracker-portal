import React, { useState, useMemo } from 'react';

// Generates 100 heavy-duty power tools with PM data
const generateTools = () => {
  const toolTemplates = [
    { prefix: "MILW", name: "Milwaukee M18 Fuel Hammer Drill", value: 299, interval: 90 },
    { prefix: "MILW", name: "Milwaukee M18 Hackzall", value: 159, interval: 120 },
    { prefix: "MILW", name: "Milwaukee M18 Force Logic Press", value: 2400, interval: 60 },
    { prefix: "MILW", name: "Milwaukee M12 ProPEX Expansion Tool", value: 450, interval: 180 },
    { prefix: "DWLT", name: "DeWalt 20V Max XR Impact Driver", value: 149, interval: 90 },
    { prefix: "DWLT", name: "DeWalt 60V Max Flexvolt Circular Saw", value: 399, interval: 90 },
    { prefix: "HILT", name: "Hilti TE 70-ATC Rotary Hammer", value: 1850, interval: 45 },
    { prefix: "HILT", name: "Hilti PM 40-MG Multi-Line Laser", value: 1200, interval: 365 },
    { prefix: "BSCH", name: "Bosch GLM 400 CL Laser Measure", value: 299, interval: 365 },
    { prefix: "FEST", name: "Festool CT 15 HEPA Dust Extractor", value: 499, interval: 60 }
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
    
    // Simulate PM data (every 5th tool is randomly overdue for service)
    const daysSinceService = (i % 5 === 0) ? template.interval + (i % 10) + 1 : (i % template.interval);
    
    generated.push({
      toolId: `${template.prefix}-${idNum}`,
      name: template.name,
      value: template.value,
      status: isOut ? "CHECKED_OUT" : "AVAILABLE",
      condition: condition,
      assignedUser: assignedUser,
      daysOut: daysOut,
      serviceInterval: template.interval,
      daysSinceService: daysSinceService,
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

  // HUD Calcs
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

  const logService = (toolId) => {
    setTools(prev => prev.map(t => {
      if (t.toolId === toolId) {
        return {
          ...t,
          daysSinceService: 0,
          condition: "Excellent",
          history: [{ user: "Admin", action: "PM Service Completed", date: 'Just now', condition: "Excellent" }, ...t.history]
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
        .tab-btn { flex: 1; padding: 4px; font-size: 10px; font-weight: 700; cursor: pointer; border-radius: 6px; text-align: center; border: none; transition: all 0.2s; white-space: nowrap; }
        .tab-active { background-color: #ffffff; color: #1d1d1f; }
        .tab-inactive { background-color: #2c2c2e; color: #86868b; }
        .custom-input { padding: 12px 16px; border-radius: 8px; border: 1px solid #3a3a3c; background-color: #1c1c1e; color: #ffffff; width: 100%; box-sizing: border-box; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .custom-input:focus { border-color: #ffcc00; }
        @keyframes criticalPulse { 0% { box-shadow: 0 0 0 0 rgba(255,59,48,0.4); } 70% { box-shadow: 0 0 0 10px rgba(255,59,48,0); } 100% { box-shadow: 0 0 0 0 rgba(255,59,48,0); } }

        .desktop-layout { display: flex; gap: 32px; align-items: flex-start; flex: 1; flex-direction: row; }
        .inspector-container { width: 420px; background-color: #1c1c1e; border-radius: 16px; border: 1px solid #3a3a3c; padding: 24px; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; }
        .hud-layout { display: flex; justify-content: space-between; align-items: center; background-color: #1c1c1e; padding: 16px 24px; border-radius: 12px; border: 1px solid #3a3a3c; margin-top: 16px; flex-direction: row; }
        .hud-divider { width: 1px; height: 40px; background-color: #3a3a3c; }
        .hud-stat-block { display: flex; flex-direction: column; }
        .modal-container { background-color: #1c1c1e; padding: 32px; border-radius: 20px; width: 100%; max-width: 440px; border: 1px solid #3a3a3c; box-shadow: 0 25px 50px rgba(0,0,0,0.5); box-sizing: border-box; }

        @media (max-width: 960px) {
          .desktop-layout { flex-direction: column-reverse; gap: 24px; }
          .inspector-container { width: 100%; position: relative; top: 0; padding: 16px; }
          .hud-layout { flex-direction: column; align-items: stretch; gap: 16px; padding: 16px; }
          .hud-divider { width: 100%; height: 1px; }
          .hud-stat-block { flex-direction: row; justify-content: space-between; align-items: center; width: 100%; }
          .hud-stat-label { font-size: 10px !important; }
          .hud-stat-value { font-size: 20px !important; }
        }
      `}</style>

      {/* EXECUTIVE FINANCIAL HUD */}
      <div className="hud-layout">
        <div className="hud-stat-block">
          <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TOTAL FLEET ASSET VALUE</span>
          <span className="hud-stat-value" style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>${totalValue.toLocaleString()}</span>
        </div>
        <div className="hud-divider"></div>
        <div className="hud-stat-block">
          <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE DEPLOYED IN FIELD</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500' }}></span>
            <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#ff9500' }}>${deployedValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#86868b' }}>({deployedTools.length} Units)</span></span>
          </div>
        </div>
        <div className="hud-divider"></div>
        <div className="hud-stat-block">
          <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SECURED IN TOOL CRIB</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></span>
            <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#34c759' }}>${cribValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#86868b' }}>({tools.length - deployedTools.length} Units)</span></span>
          </div>
        </div>
      </div>

      <div className="desktop-layout">
        {/* LEFT COLUMN: THE MATRIX */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                  <input type="text" placeholder="Search by Tool ID, Name, or Assigned Employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" />
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', alignContent: 'start' }}>
              {filteredTools.map(tool => {
              const isSelected = tool.toolId === selectedToolId;
              const isOut = tool.status === 'CHECKED_OUT';
              const isServiceDue = tool.daysSinceService >= tool.serviceInterval;
              const isFlipped = !!flippedCards[tool.toolId];
              const activeTab = cardTabs[tool.toolId] || 'service';
              
              let cardBorder = '1px solid #3a3a3c';
              let cardShadow = 'none';
              if (isSelected) {
                cardBorder = isServiceDue ? '2px solid #ff3b30' : '2px solid #ffcc00';
                cardShadow = isServiceDue ? '0 0 15px rgba(255, 59, 48, 0.2)' : '0 0 15px rgba(255, 204, 0, 0.15)';
              } else if (isServiceDue) {
                cardBorder = '1px solid rgba(255,59,48,0.5)';
              }

              return (
                  <div key={tool.toolId} className="card-perspective-wrapper" onClick={() => setSelectedToolId(tool.toolId)}>
                  <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                      
                      <div className="card-face card-front" style={{ padding: '16px', border: cardBorder, boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', backgroundColor: isServiceDue ? '#221515' : '#1c1c1e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isServiceDue ? 'rgba(255,59,48,0.15)' : (isOut ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)'), color: isServiceDue ? '#ff3b30' : (isOut ? '#ff9500' : '#34c759'), letterSpacing: '0.05em' }}>
                          {isServiceDue ? 'SERVICE DUE' : (isOut ? 'DEPLOYED' : 'IN CRIB')}
                          </span>
                          <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '600' }}>[ {tool.toolId} ]</span>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.3', color: '#ffffff' }}>{tool.name}</div>
                          {isOut && (<div style={{ fontSize: '12px', color: '#ff9500', marginTop: '6px', fontWeight: '600' }}>👤 {tool.assignedUser}</div>)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          <button disabled={isServiceDue && !isOut} onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); isOut ? handleReturn() : setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: isServiceDue ? '#2c2c2e' : (isSelected ? '#ffcc00' : '#2c2c2e'), color: isServiceDue ? '#636366' : (isSelected ? '#1d1d1f' : '#ffffff'), border: 'none', fontWeight: '700', fontSize: '12px', cursor: isServiceDue && !isOut ? 'not-allowed' : 'pointer' }}>
                            {isServiceDue && !isOut ? 'LOCKED' : (isOut ? 'RETURN' : 'CHECK OUT')}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d2d2d7', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                            Flip ⤹
                          </button>
                      </div>
                      </div>

                      <div className="card-face card-back" style={{ border: cardBorder, boxShadow: cardShadow }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '8px' }}>
                          <button className={`tab-btn ${activeTab === 'service' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'service'})); }}>Service</button>
                          <button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}>Kits</button>
                          <button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}>QR</button>
                          <button className={`tab-btn ${activeTab === 'specs' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'specs'})); }}>Specs</button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: false})); }} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                          
                          {/* PREVENTATIVE MAINTENANCE TAB */}
                          {activeTab === 'service' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center', justifyContent: 'center', height: '100%' }}>
                              <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>PM INTERVAL</div>
                              <div style={{ fontSize: '20px', fontWeight: '800', color: isServiceDue ? '#ff3b30' : '#ffffff' }}>
                                {tool.daysSinceService} / {tool.serviceInterval} Days
                              </div>
                              {isServiceDue && <div style={{ fontSize: '11px', color: '#ff3b30', fontWeight: '700' }}>⚠️ MAINTENANCE OVERDUE</div>}
                              <button onClick={(e) => { e.stopPropagation(); logService(tool.toolId); }} style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#34c759', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>
                                LOG SERVICE & RESET
                              </button>
                            </div>
                          )}

                          {activeTab === 'manifest' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {['Primary Tool Body', 'High-Capacity Battery', 'Charger Base', 'Hard Case'].map((item, i) => (
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

                          {/* THE RESTORED SPECS TAB */}
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
        <div className="inspector-container">
          {selectedTool ? (
              <>
                  <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '18px', fontWeight: '700', color: '#34c759' }}>${selectedTool.value}</div>
                  <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>INSPECTOR DASHBOARD</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>{selectedTool.toolId}</div>
                  <div style={{ color: selectedTool.daysSinceService >= selectedTool.serviceInterval ? '#ff3b30' : '#ffcc00', fontSize: '16px', fontWeight: '600', marginTop: '4px', lineHeight: '1.3' }}>{selectedTool.name}</div>
                  </div>

                  {/* PREDICTIVE PM LOCK WARNING */}
                  {selectedTool.daysSinceService >= selectedTool.serviceInterval && (
                    <div style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.5)', padding: '16px', borderRadius: '12px', animation: 'criticalPulse 2s infinite' }}>
                      <div style={{ color: '#ff3b30', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🛑</span> PREVENTATIVE MAINTENANCE LOCK
                      </div>
                      <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                        This asset has exceeded its <strong>{selectedTool.serviceInterval}-day</strong> service interval. Dispatch capabilities have been securely locked until a technician verifies tool integrity and resets the timer.
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
                      <button 
                        disabled={selectedTool.daysSinceService >= selectedTool.serviceInterval}
                        onClick={() => setCheckoutModalOpen(true)} 
                        style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: selectedTool.daysSinceService >= selectedTool.serviceInterval ? '#2c2c2e' : '#34c759', color: selectedTool.daysSinceService >= selectedTool.serviceInterval ? '#636366' : '#ffffff', fontWeight: '800', fontSize: '15px', cursor: selectedTool.daysSinceService >= selectedTool.serviceInterval ? 'not-allowed' : 'pointer' }}>
                        {selectedTool.daysSinceService >= selectedTool.serviceInterval ? 'LOCKED: PM REQUIRED' : 'CHECK OUT TO EMPLOYEE'}
                      </button>
                  ) : (
                      <button onClick={handleReturn} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#ff9500', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                      RETURN TO TOOL CRIB
                      </button>
                  )}
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
          <div className="modal-container">
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
