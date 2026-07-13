import { docClient } from './dynamoClient';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import React, { useState, useMemo } from 'react';

// Generates universal assets with dynamic PM metrics (Time, Usage, Cycles)
const generateTools = () => {
  const templates = [
    { prefix: "VEH", name: "Ford F-150 Fleet Truck", value: 45000, metrics: [{ unit: "Days", current: 0, interval: 180 }, { unit: "Miles", current: 0, interval: 5000 }] },
    { prefix: "VEH", name: "RAM 2500 Heavy Duty", value: 55000, metrics: [{ unit: "Days", current: 0, interval: 180 }, { unit: "Miles", current: 0, interval: 5000 }] },
    { prefix: "VEH", name: "Tesla Model 3 (Site Supervisor)", value: 42000, metrics: [{ unit: "Days", current: 0, interval: 365 }, { unit: "Miles", current: 0, interval: 10000 }] },
    { prefix: "CAT", name: "Caterpillar 320 Excavator", value: 185000, isDispatchable: false, metrics: [{ unit: "Hours", current: 0, interval: 500 }, { unit: "Days", current: 0, interval: 180 }] },
    { prefix: "CAT", name: "CAT 259D3 Compact Track Loader", value: 65000, metrics: [{ unit: "Hours", current: 0, interval: 250 }] },
    { prefix: "LIFT", name: "JLG 1930ES Scissor Lift", value: 15000, metrics: [{ unit: "Days", current: 0, interval: 90 }, { unit: "Hours", current: 0, interval: 150 }] },
    { prefix: "LIFT", name: "Genie Z-45 XC Boom Lift", value: 85000, metrics: [{ unit: "Days", current: 0, interval: 90 }] },
    { prefix: "GEN", name: "Honda EU3000iS Generator", value: 2500, metrics: [{ unit: "Hours", current: 0, interval: 100 }] },
    { prefix: "GEN", name: "Generac Mobile Diesel Light Tower", value: 14000, metrics: [{ unit: "Hours", current: 0, interval: 200 }] },
    { prefix: "HVAC", name: "Carrier 5-Ton Rooftop AC", value: 6500, isDispatchable: false, metrics: [{ unit: "Days", current: 0, interval: 365 }, { unit: "Hours", current: 0, interval: 2000 }] },
    { prefix: "HVAC", name: "Trane Portable Chiller Unit", value: 12000, metrics: [{ unit: "Days", current: 0, interval: 180 }] },
    { prefix: "MILW", name: "Milwaukee M18 Force Logic Press", value: 2400, metrics: [{ unit: "Days", current: 0, interval: 60 }, { unit: "Crimps", current: 0, interval: 10000 }] },
    { prefix: "MILW", name: "Milwaukee M18 Fuel Hammer Drill", value: 299, metrics: [{ unit: "Days", current: 0, interval: 90 }] },
    { prefix: "MILW", name: "Milwaukee M18 Super Hawg", value: 450, metrics: [{ unit: "Days", current: 0, interval: 90 }] },
    { prefix: "MILW", name: "Milwaukee Packout Radio/Charger", value: 299, metrics: [{ unit: "Days", current: 0, interval: 365 }] },
    { prefix: "DWLT", name: "DeWalt 20V Max XR Impact Driver", value: 149, metrics: [{ unit: "Days", current: 0, interval: 90 }] },
    { prefix: "DWLT", name: "DeWalt Flexvolt Table Saw", value: 599, metrics: [{ unit: "Days", current: 0, interval: 90 }] },
    { prefix: "HILT", name: "Hilti TE 70-ATC Rotary Hammer", value: 1850, metrics: [{ unit: "Days", current: 0, interval: 45 }] },
    { prefix: "TECH", name: "Panasonic Toughbook 55", value: 2200, metrics: [{ unit: "Days", current: 0, interval: 365 }] },
    { prefix: "TECH", name: "FLIR E8-XT Thermal Camera", value: 3400, metrics: [{ unit: "Days", current: 0, interval: 365 }] },
    { prefix: "TECH", name: "Cisco Catalyst 9300 Switch", value: 4500, isDispatchable: false, metrics: [{ unit: "Days", current: 0, interval: 365 }] },
    { prefix: "SURV", name: "Leica TS16 Total Station", value: 28000, metrics: [{ unit: "Days", current: 0, interval: 180 }, { unit: "Uses", current: 0, interval: 50 }] }
  ];

  const users = ["Mario Diaz", "Chris Evans", "Sarah Connor", "Marcus Johnson", "Elena Rodriguez", "David Kim", "Priya Patel", "John Wick", "Ellen Ripley", "Tony Stark"];
  const conditions = ["New", "Excellent", "Good", "Fair", "Requires Maintenance"];

  let generated = [];
  for (let i = 1; i <= 100; i++) {
    const t = templates[Math.floor(Math.random() * templates.length)];
    const isOut = (Math.random() > 0.6); 
    const assignedUser = isOut ? users[Math.floor(Math.random() * users.length)] : null;
    const daysOut = isOut ? Math.floor(Math.random() * 20) + 1 : 0;
    
    // 5% chance it's literally flagged as Damaged
    const isDamaged = Math.random() > 0.95;
    const condition = isDamaged ? "Damaged" : conditions[Math.floor(Math.random() * conditions.length)];
    
    const idNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const generatedId = `${t.prefix}-${idNum}`;
    
    const assetMetrics = t.metrics.map(m => {
      let variance = m.interval * (Math.random() * 1.15); // Randomize up to 115% of interval to create some overdues
      return { ...m, current: Math.floor(variance) };
    });

    generated.push({
      toolId: generatedId,
      name: t.name,
      value: t.value,
      category: t.prefix === "TECH" ? "IT Equipment" : (t.prefix === "VEH" ? "Fleet Vehicle" : "Heavy/Power Tools"),
      location: isOut ? "Field" : "Main Tool Crib",
      serial: "SN-" + Math.floor(Math.random() * 100000000),
      link: "",
      status: isOut ? "CHECKED_OUT" : "AVAILABLE",
      condition: condition,
      assignedUser: assignedUser,
      daysOut: daysOut,
      isDispatchable: t.isDispatchable !== false,
      isSpecialty: t.value >= 20000,
      metrics: assetMetrics,
      history: isOut ? [
        { user: assignedUser, action: "Checked Out", date: `${daysOut} days ago`, condition: condition }
      ] : (Math.random() > 0.5 ? [{ user: "Admin", action: "Returned", date: "2 days ago", condition: condition }] : [])
    });
  }
  return generated;
};

function Tools({ user }) {

  const fetchDB = async () => {
    try {
      const data = await docClient.send(new ScanCommand({ TableName: 'KineticToolsData' }));
      if (data.Items && data.Items.length > 0) {
        setTools(data.Items);
      }
    } catch (err) { console.error("DB Fetch Error:", err); }
  };

  const syncDB = async (item) => {
    try {
      await docClient.send(new PutCommand({ TableName: 'KineticToolsData', Item: item }));
    } catch (err) { console.error("DB Sync Error:", err); }
  };

  React.useEffect(() => { fetchDB(); }, []);

  const [inventory, setInventory] = useState({ 'HVAC': [{ item: '24x24x2 Pleated Air Filter', stock: 45 }, { item: 'R-410A Refrigerant (lbs)', stock: 12 }], 'MILW': [{ item: 'M18 REDLITHIUM 5.0Ah Battery', stock: 22 }, { item: 'Press Tool Jaw Grease', stock: 6 }], 'VEH': [{ item: '5W-30 Synthetic Oil (Qts)', stock: 32 }, { item: 'Wiper Fluid (Gal)', stock: 14 }] });
  const [tools, setTools] = useState(generateTools);
  const [activeView, setActiveView] = useState('DISPATCH');
  const [userRole, setUserRole] = useState('ADMIN');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToolId, setSelectedToolId] = useState("VEH-007");
  const [flippedCards, setFlippedCards] = useState({});
  const [cardTabs, setCardTabs] = useState({});
  const [pendingAttachments, setPendingAttachments] = useState({});
  const [serviceNotes, setServiceNotes] = useState({});
  const [serviceChecklists, setServiceChecklists] = useState({});
  const [bulkSelectedTools, setBulkSelectedTools] = useState([]);
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [dispatchUser, setDispatchUser] = useState("");
  const [dispatchProject, setDispatchProject] = useState("");
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnChecklist, setReturnChecklist] = useState({ primary: false, battery: false, accessories: false });
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState({ 
    email: 'kennethcurryjr@gmail.com', 
    frequency: 'Daily Digest', 
    notifyDamaged: true, 
    notifyOverdue: true, 
    notifyNew: false 
  });
  const [newTool, setNewTool] = useState({ prefix: 'MILW', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', isDispatchable: true, isSpecialty: false });

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

  const totalValue = tools.reduce((acc, t) => acc + t.value, 0);
  const deployedTools = tools.filter(t => t.status === 'CHECKED_OUT');
  const deployedValue = deployedTools.reduce((acc, t) => acc + t.value, 0);
  const cribValue = totalValue - deployedValue;

  // Universal Logic: An asset is overdue if ANY of its metrics exceed their interval.
  const checkIsOverdue = (metrics) => metrics.some(m => m.current >= m.interval);
  
  // To sort the Kanban, we find the metric closest to failing (lowest percentage remaining)
  const getMostCriticalMetric = (metrics) => {
    return metrics.reduce((mostCritical, current) => {
      const currentRemainingPct = (current.interval - current.current) / current.interval;
      const mostCriticalRemainingPct = (mostCritical.interval - mostCritical.current) / mostCritical.interval;
      return currentRemainingPct < mostCriticalRemainingPct ? current : mostCritical;
    });
  };

  const overdueTools = tools.filter(t => checkIsOverdue(t.metrics));
  
  const thisWeekTools = tools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.90 && pct < 1.0; 
  });
  
  const nextWeekTools = tools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.80 && pct < 0.90;
  });
  
  const thisMonthTools = tools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.60 && pct < 0.80;
  });

  
  const seedDatabase = async () => {
    if (!window.confirm("WARNING: This will generate 100 random assets and push them to your live DynamoDB table. Proceed?")) return;
    const newTools = generateTools();
    
    setTools(prev => [...newTools, ...prev]);
    
    for (const t of newTools) {
      await syncDB(t);
    }
    console.log("✅ Seed complete!");
    alert("100 Assets successfully seeded to DynamoDB!");
  };

  const handleAddAsset = () => {
    if (!newTool.name || !newTool.value) return;
    const idNum = String(Math.floor(Math.random() * 900) + 100);
    const generatedId = `${newTool.prefix}-${idNum}`;
    
    const newToolObj = {
      toolId: generatedId,
      name: newTool.name,
      value: parseInt(newTool.value) || 0,
      category: newTool.category || 'General',
      location: newTool.location || 'Unassigned',
      serial: newTool.serial || 'N/A',
      link: newTool.link || '',
      isDispatchable: newTool.isDispatchable,
      isSpecialty: newTool.isSpecialty,
      status: "AVAILABLE",
      condition: newTool.condition,
      assignedUser: null,
      daysOut: 0,
      metrics: [{ unit: newTool.pmMetric, current: 0, interval: parseInt(newTool.pmInterval) || 90 }],
      history: [{ user: "Admin", action: "Asset Ingested to Database", date: "Just now", condition: newTool.condition }]
    };
    
    syncDB(newToolObj);
    setTools(prev => [newToolObj, ...prev]);
    setAddModalOpen(false);
    setNewTool({ prefix: 'MILW', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', isDispatchable: true, isSpecialty: false });
    setSelectedToolId(generatedId);
    setActiveView('DISPATCH');
  };

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

  const executeReturn = (tool, newCondition, actionText) => {
    const ut = {
      ...tool,
      status: 'AVAILABLE',
      assignedUser: null,
      daysOut: 0,
      condition: newCondition,
      history: [{ user: "Admin", action: actionText, date: 'Just now', condition: newCondition }, ...tool.history]
    };
    syncDB(ut); // SILENT BUG FIXED: Return actions now save to cloud
    setTools(prev => prev.map(t => t.toolId === tool.toolId ? ut : t));
    setReturnModalOpen(false);
  };

  const handleReturn = (targetId) => {
    const idToUse = typeof targetId === 'string' ? targetId : selectedToolId;
    const toolToReturn = tools.find(t => t.toolId === idToUse);
    if (toolToReturn) setSelectedToolId(idToUse);
    if (toolToReturn && (toolToReturn.isSpecialty || toolToReturn.value >= 20000)) {
      setReturnChecklist({ primary: false, battery: false, accessories: false });
      setReturnModalOpen(true);
      return;
    }
    if (toolToReturn) {
      executeReturn(toolToReturn, toolToReturn.condition, "Returned to Crib");
    }
  };

  const logService = (toolId) => {
    const attachedFile = pendingAttachments[toolId];
    const note = serviceNotes[toolId];
    setTools(prev => prev.map(t => {
      if (t.toolId === toolId) {
        const resetMetrics = t.metrics.map(m => ({ ...m, current: 0 }));
        const ut = {
          ...t,
          metrics: resetMetrics,
          condition: "Excellent",
          history: [{ 
            user: "Admin", 
            action: "PM Service Completed & Intervals Reset", 
            date: 'Just now', 
            condition: "Excellent",
            attachment: attachedFile || null,
            note: note || null
          }, ...t.history]
        };
        syncDB(ut);
        return ut;
      }
      return t;
    }));
    
    setPendingAttachments(prev => { const newState = { ...prev }; delete newState[toolId]; return newState; });
    setServiceNotes(prev => { const newState = { ...prev }; delete newState[toolId]; return newState; });
    setServiceChecklists(prev => { const newState = { ...prev }; delete newState[toolId]; return newState; });
    setFlippedCards(prev => { const newState = { ...prev }; newState[toolId] = false; return newState; });
  };

  const logBulkService = () => {
    setTools(prev => prev.map(t => {
      if (bulkSelectedTools.includes(t.toolId)) {
        const resetMetrics = t.metrics.map(m => ({ ...m, current: 0 }));
        return {
          ...t,
          metrics: resetMetrics,
          condition: "Excellent",
          history: [{ 
            user: "Admin", 
            action: "Bulk PM Service Completed", 
            date: 'Just now', 
            condition: "Excellent"
          }, ...t.history]
        };
      }
      return t;
    }));
    setBulkSelectedTools([]);
  };

  const reportDamage = (toolId) => {
    const note = window.prompt("Enter details about the damage or fault:");
    if (note === null) return;
    setTools(prev => prev.map(t => {
      if (t.toolId === toolId) {
        const ut = { ...t, condition: "Damaged", history: [{ user: "Admin", action: "Flagged as Damaged 🚩", date: 'Just now', condition: "Damaged", note: note }, ...t.history] };
        syncDB(ut);
        return ut;
      }
      return t;
    }));
  };

  const toggleBulkSelection = (toolId) => {
    setBulkSelectedTools(prev => 
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const RenderKanbanCard = ({ tool, isOverdue }) => {
    const isSelected = bulkSelectedTools.includes(tool.toolId);
    const critical = getMostCriticalMetric(tool.metrics);
    const remaining = critical.interval - critical.current;
    
    return (
      <div 
        style={{ backgroundColor: isOverdue ? 'rgba(255,59,48,0.08)' : (isSelected ? 'rgba(52,199,89,0.05)' : '#2c2c2e'), border: isOverdue ? '1px solid #ff3b30' : (isSelected ? '1px solid #34c759' : '1px solid #3a3a3c'), borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center', transition: 'all 0.15s', cursor: 'pointer' }} 
        onClick={() => toggleBulkSelection(tool.toolId)}
      >
        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: '15px', height: '15px', accentColor: '#34c759', cursor: 'pointer', margin: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', lineHeight: '1.2' }}>{tool.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.02em' }}>[{tool.toolId}]</span>
            <span style={{ fontSize: '11px', color: isOverdue ? '#ff3b30' : '#86868b', fontWeight: '600' }}>
              {isOverdue ? `LOCKED: Overdue by ${Math.abs(remaining)} ${critical.unit}` : `Due in ${remaining} ${critical.unit}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '0 12px 100px 12px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <style>{`
        .inspector-scroll::-webkit-scrollbar, .inspector-container::-webkit-scrollbar { width: 6px; }
        .inspector-scroll::-webkit-scrollbar-track, .inspector-container::-webkit-scrollbar-track { background: transparent; }
        .inspector-scroll::-webkit-scrollbar-thumb, .inspector-container::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; min-height: 280px; }
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
        .inspector-container { width: 420px; background-color: #1c1c1e; border-radius: 16px; border: 1px solid #3a3a3c; padding: 24px; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; max-height: calc(100vh - 48px); overflow-y: auto; }
        .hud-layout { display: flex; justify-content: space-between; align-items: center; background-color: #1c1c1e; padding: 16px 24px; border-radius: 12px; border: 1px solid #3a3a3c; margin-top: 16px; flex-direction: row; }
        .hud-divider { width: 1px; height: 40px; background-color: #3a3a3c; }
        .hud-stat-block { display: flex; flex-direction: column; }
        .kanban-col { flex: 1; display: flex; flex-direction: column; gap: 8px; background-color: #1c1c1e; padding: 16px; border-radius: 16px; border: 1px solid #3a3a3c; min-height: 400px; }

        @media (max-width: 960px) {
          .desktop-layout { flex-direction: column-reverse; gap: 24px; }
          .inspector-container { width: 100%; position: relative; top: 0; padding: 16px; }
          .hud-layout { flex-direction: column; align-items: stretch; gap: 16px; padding: 16px; }
          .hud-divider { width: 100%; height: 1px; }
          .hud-stat-block { flex-direction: row; justify-content: space-between; align-items: center; width: 100%; }
          .kanban-col { min-width: 100%; }
          .kanban-scroll-wrapper { overflow-x: auto; display: flex; gap: 16px; padding-bottom: 16px; }
        }
      `}</style>

      {/* MASTER TOGGLE & INGEST ACTION DECK */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1c1c1e', padding: '6px', borderRadius: '12px', width: 'fit-content', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1c1c1e', borderRadius: '8px', padding: '4px', border: '1px solid #3a3a3c', marginRight: '16px' }}>
      <button onClick={() => setUserRole('TECH')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'TECH' ? '#34c759' : 'transparent', color: userRole === 'TECH' ? '#1d1d1f' : '#86868b', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>TECH</button>
      <button onClick={() => setUserRole('ADMIN')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'ADMIN' ? '#ffcc00' : 'transparent', color: userRole === 'ADMIN' ? '#1d1d1f' : '#86868b', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>ADMIN</button>
    </div>
    <button onClick={() => setActiveView('DISPATCH')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'DISPATCH' ? '#ffcc00' : 'transparent', color: activeView === 'DISPATCH' ? '#1d1d1f' : '#86868b' }}>
          📦 FLEET DISPATCH
        </button>
        {userRole === 'ADMIN' && <button onClick={() => setActiveView('MAINTENANCE')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'MAINTENANCE' ? '#ffcc00' : 'transparent', color: activeView === 'MAINTENANCE' ? '#1d1d1f' : '#86868b' }}>
          🛠️ MAINTENANCE HUB
        </button>}
        <div style={{ width: '1px', backgroundColor: '#3a3a3c', margin: '4px 8px' }}></div>
        {userRole === 'ADMIN' && <button onClick={() => setAddModalOpen(true)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #34c759', backgroundColor: 'transparent', color: '#34c759', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>
          + INGEST ASSET
        </button>}
        {userRole === 'ADMIN' && <button onClick={() => setAlertsModalOpen(true)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #007aff', backgroundColor: 'transparent', color: '#007aff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '8px' }}>🔔 ALERT SETTINGS</button>}
        {userRole === 'ADMIN' && <button onClick={seedDatabase} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px dashed #ff9500', backgroundColor: 'transparent', color: '#ff9500', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '8px' }}>🎲 SEED DB</button>}
        {userRole === 'ADMIN' && <button onClick={() => setFinanceModalOpen(true)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #86868b', backgroundColor: 'transparent', color: '#d2d2d7', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', marginLeft: '8px' }}>📊 FLEET VALUE</button>}
      </div>

      {/* VIEW ROUTING */}
      {activeView === 'DISPATCH' ? (
        <div className="desktop-layout">
          {/* LEFT COLUMN: THE MATRIX */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input type="text" placeholder="Search by Asset ID, Name, or Assigned Tech..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', alignContent: 'start' }}>
                {filteredTools.map(tool => {
                const isSelected = tool.toolId === selectedToolId;
                const isOut = tool.status === 'CHECKED_OUT';
                const isServiceDue = checkIsOverdue(tool.metrics);
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
                        
                        {/* FRONT FACE */}
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
                            {tool.isDispatchable !== false ? (
                              <button disabled={isServiceDue && !isOut} onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); isOut ? handleReturn(tool.toolId) : setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: isServiceDue ? '#2c2c2e' : (isSelected ? '#ffcc00' : '#2c2c2e'), color: isServiceDue ? '#636366' : (isSelected ? '#1d1d1f' : '#ffffff'), border: 'none', fontWeight: '700', fontSize: '12px', cursor: isServiceDue && !isOut ? 'not-allowed' : 'pointer' }}>
                                {isServiceDue && !isOut ? 'LOCKED' : (isOut ? 'RETURN' : 'CHECK OUT')}
                              </button>
                            ) : (
                              <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#1c1c1e', color: '#86868b', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }}>STATIC ASSET</div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d2d2d7', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                              Flip ⤹
                            </button>
                        </div>
                        </div>

                        {/* BACK FACE (UNIVERSAL METRICS) */}
                        <div className="card-face card-back" style={{ border: cardBorder, boxShadow: cardShadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '8px', flexWrap: 'wrap' }}>
                            <button className={`tab-btn ${activeTab === 'service' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'service'})); }}>🛠️ PM</button>
                            <button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}>🧰 KITS</button>
                            <button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}>📱 QR</button>
                            <button className={`tab-btn ${activeTab === 'specs' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'specs'})); }}>📄 INFO</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: false})); }} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '16px', padding: 0, marginTop: '2px' }}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            
                            {activeTab === 'service' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', height: '100%' }}>
                                
                                {/* DYNAMIC UNIVERSAL METRICS MAPPING */}
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                  {tool.metrics.map((metric, idx) => {
                                    const isMetricDue = metric.current >= metric.interval;
                                    return (
                                      <div key={idx} style={{ marginBottom: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{metric.unit} INTERVAL</div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: isMetricDue ? '#ff3b30' : '#ffffff' }}>
                                          {metric.current.toLocaleString()} / {metric.interval.toLocaleString()} <span style={{fontSize: '11px', color: '#86868b'}}>{metric.unit.toUpperCase()}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                
                                {/* PROCEDURAL CHECKLIST */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#121212', padding: '8px', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                                  {['Visual Inspection', 'Calibration', 'Safety Test'].map(step => {
                                    const isChecked = (serviceChecklists[tool.toolId] || []).includes(step);
                                    return (
                                      <label key={step} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: isChecked ? '#34c759' : '#d2d2d7', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                                        <input type="checkbox" checked={isChecked} onChange={() => { setServiceChecklists(prev => { const curr = prev[tool.toolId] || []; return { ...prev, [tool.toolId]: curr.includes(step) ? curr.filter(s => s !== step) : [...curr, step] }; }); }} style={{ width: '12px', height: '12px', accentColor: '#34c759', margin: 0 }} />
                                        {step}
                                      </label>
                                    );
                                  })}
                                </div>
                                
                                {/* TECH NOTES & PHOTO */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input type="text" placeholder="Add Service Notes..." value={serviceNotes[tool.toolId] || ''} onChange={(e) => setServiceNotes(prev => ({...prev, [tool.toolId]: e.target.value}))} onClick={(e) => e.stopPropagation()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '11px', outline: 'none' }} />
                                  <label htmlFor={`file-${tool.toolId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', borderRadius: '8px', backgroundColor: pendingAttachments[tool.toolId] ? 'rgba(52,199,89,0.15)' : '#2c2c2e', border: pendingAttachments[tool.toolId] ? '1px solid #34c759' : '1px dashed #86868b', color: pendingAttachments[tool.toolId] ? '#34c759' : '#d2d2d7', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {pendingAttachments[tool.toolId] ? '📎' : '📷'}
                                  </label>
                                  <input type="file" id={`file-${tool.toolId}`} style={{ display: 'none' }} onChange={(e) => { if(e.target.files[0]) { setPendingAttachments(prev => ({...prev, [tool.toolId]: e.target.files[0].name})); } }} />
                                </div>

                                <button disabled={(serviceChecklists[tool.toolId] || []).length !== 3} onClick={(e) => { e.stopPropagation(); logService(tool.toolId); }} style={{ marginTop: 'auto', padding: '10px', borderRadius: '8px', backgroundColor: '#34c759', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', opacity: (serviceChecklists[tool.toolId] || []).length === 3 ? 1 : 0.4 }}>
                                  LOG SERVICE & RESET
                                </button>
                              </div>
                            )}

                            {activeTab === 'manifest' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {['Primary Body', 'Key Component / Battery', 'Accessories'].map((item, i) => (
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
          <div className="inspector-container">
            {selectedTool ? (
                <>
                    <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: '18px', fontWeight: '700', color: '#34c759' }}>${selectedTool.value.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>{userRole === 'TECH' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>📱</span>
            <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>SCANNER MODE</h3>
            <p style={{ color: '#86868b', fontSize: '13px', textAlign: 'center', maxWidth: '80%', lineHeight: '1.5' }}>Admin telemetry is locked. Tap tools in the matrix to deploy.</p>
        </div>
    )}
    INSPECTOR DASHBOARD</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>{selectedTool.toolId}</div>
                    <div style={{ color: checkIsOverdue(selectedTool.metrics) ? '#ff3b30' : '#ffcc00', fontSize: '16px', fontWeight: '600', marginTop: '4px', lineHeight: '1.3' }}>{selectedTool.name}</div>
                    </div>

                    {selectedTool.condition === 'Damaged' && (
                      <div style={{ backgroundColor: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.5)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ color: '#ff9500', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🚩</span> ASSET DAMAGED / OUT OF SERVICE
                        </div>
                        <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                          This asset has been manually flagged as damaged. It cannot be dispatched until a technician logs a repair service.
                        </div>
                      </div>
                    )}
                    {checkIsOverdue(selectedTool.metrics) && (
                      <div style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.5)', padding: '16px', borderRadius: '12px', animation: 'criticalPulse 2s infinite' }}>
                        <div style={{ color: '#ff3b30', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛑</span> PREVENTATIVE MAINTENANCE LOCK
                        </div>
                        <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                          This asset has exceeded one or more of its critical service intervals. Dispatch capabilities have been securely locked until a technician verifies integrity and resets the timers.
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
                            
                            {log.note && (
                              <div style={{ fontSize: '12px', color: '#d2d2d7', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: '6px' }}>
                                <span>📝</span> "{log.note}"
                              </div>
                            )}
                            
                            {log.attachment && (
                              <div style={{ fontSize: '12px', color: '#007aff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                <span>📎</span> {log.attachment}
                              </div>
                            )}

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
                      {selectedTool.condition !== 'Damaged' && (
                        <button onClick={() => reportDamage(selectedTool.toolId)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,59,48,0.5)', backgroundColor: 'transparent', color: '#ff3b30', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          🚩 REPORT DAMAGE / FAULT
                        </button>
                      )}
                    </div>
                    {selectedTool && inventory[selectedTool.prefix] && (
        <div style={{ backgroundColor: '#121212', border: '1px solid #3a3a3c', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
            <div style={{ color: '#86868b', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🧰</span> REQUIRED CONSUMABLES & PARTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inventory[selectedTool.prefix].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', padding: '10px 12px', borderRadius: '8px', border: '1px solid #2c2c2e' }}>
                        <span style={{ color: '#d2d2d7', fontSize: '13px', fontWeight: '600' }}>{item.item}</span>
                        <span style={{ color: item.stock < 15 ? '#ff9500' : '#34c759', fontSize: '13px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{item.stock} IN STOCK</span>
                    </div>
                ))}
            </div>
        </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                    {selectedTool.status === 'AVAILABLE' ? (
                        selectedTool.isDispatchable !== false ? (
                          <button disabled={checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged'} onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: (checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged') ? '#2c2c2e' : '#34c759', color: (checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged') ? '#636366' : '#ffffff', fontWeight: '800', fontSize: '15px', cursor: (checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged') ? 'not-allowed' : 'pointer' }}>
                            {(checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged') ? 'LOCKED: SERVICE REQUIRED' : 'CHECK OUT TO EMPLOYEE'}
                          </button>
                        ) : (
                          <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#1c1c1e', color: '#86868b', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>
                            STATIC ASSET (NON-DISPATCHABLE)
                          </button>
                        )
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
      ) : (
        /* MAINTENANCE HUB VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: 'rgba(255,59,48,0.05)', border: '1px solid #ff3b30', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '18px' }}>🚨</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#ff3b30', letterSpacing: '0.05em' }}>TRIAGE ALERT CENTER: ACTION REQUIRED</span>
            </div>
            {overdueTools.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {overdueTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={true} />)}
              </div>
            ) : (
              <div style={{ color: '#86868b', fontSize: '14px', fontStyle: 'italic' }}>No assets are currently overdue for maintenance.</div>
            )}
          </div>

          <div className="kanban-scroll-wrapper">
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#ffcc00', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS WEEK</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{thisWeekTools.length} Assets Pending</div>
              </div>
              {thisWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
            
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#34c759', fontWeight: '800', letterSpacing: '0.05em' }}>DUE NEXT WEEK</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{nextWeekTools.length} Assets Pending</div>
              </div>
              {nextWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>

            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#007aff', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS MONTH</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{thisMonthTools.length} Assets Pending</div>
              </div>
              {thisMonthTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
          </div>

        </div>
      )}

      {/* BULK SERVICE DRAWER */}
      {bulkSelectedTools.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#1c1c1e', borderTop: '1px solid #3a3a3c', padding: '20px 40px', zIndex: 5000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{bulkSelectedTools.length} Assets Selected</span>
            <span style={{ fontSize: '13px', color: '#86868b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setBulkSelectedTools([])}>Clear Selection</span>
          </div>
          <button onClick={logBulkService} style={{ padding: '16px 32px', backgroundColor: '#34c759', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(52,199,89,0.3)' }}>
            LOG BULK PM SERVICE
          </button>
        </div>
      )}

      {/* INGEST ASSET MODAL */}
      {addModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container">
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Ingest New Asset</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Register hardware into the active matrix.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>BRAND PREFIX (CUSTOM OR PRESET)</label>
                  <input 
                    list="prefix-options"
                    placeholder="e.g. MILW, CAT, JD"
                    value={newTool.prefix} 
                    onChange={(e) => setNewTool({...newTool, prefix: e.target.value.toUpperCase()})} 
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}
                  />
                  <datalist id="prefix-options">
                    <option value="VEH">Vehicle</option>
                    <option value="HVAC">Climate Control</option>
                    <option value="MILW">Milwaukee</option>
                    <option value="DWLT">DeWalt</option>
                    <option value="HILT">Hilti</option>
                    <option value="MAKI">Makita</option>
                    <option value="BSCH">Bosch</option>
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>REPLACEMENT VALUE ($)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 45000" 
                    value={newTool.value}
                    onChange={(e) => setNewTool({...newTool, value: e.target.value})}
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 2 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET NAME / MODEL</label>
                  <input type="text" placeholder="e.g. Ford F-150 Fleet Truck" value={newTool.name} onChange={(e) => setNewTool({...newTool, name: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION</label>
                  <select value={newTool.condition} onChange={(e) => setNewTool({...newTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET CLASS / CATEGORY</label>
                  <input list="category-options" placeholder="e.g. HVAC, Power Tool" value={newTool.category} onChange={(e) => setNewTool({...newTool, category: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                  <datalist id="category-options">
                    <option value="Power Tool">Power Tool</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="HVAC Equipment">HVAC</option>
                    <option value="Plumbing Fixture">Plumbing</option>
                    <option value="Fleet Vehicle">Fleet Vehicle</option>
                    <option value="IT Equipment">IT Equipment</option>
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>HOME LOCATION / ZONE</label>
                  <input list="location-options" placeholder="e.g. Roof, Lot B" value={newTool.location} onChange={(e) => setNewTool({...newTool, location: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                  <datalist id="location-options">
                    <option value="Main Tool Crib">Main Tool Crib</option>
                    <option value="Fleet Lot A">Fleet Lot A</option>
                    <option value="Roof Deck">Roof Deck</option>
                    <option value="Basement Utility">Basement Utility</option>
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SERIAL NUMBER / VIN</label>
                  <input type="text" placeholder="e.g. 1FTEW1E49K..." value={newTool.serial} onChange={(e) => setNewTool({...newTool, serial: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <input type="text" placeholder="e.g. https://..." value={newTool.link} onChange={(e) => setNewTool({...newTool, link: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>PM METRIC</label>
                  <select value={newTool.pmMetric} onChange={(e) => setNewTool({...newTool, pmMetric: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                    <option value="Days">Days</option>
                    <option value="Miles">Miles</option>
                    <option value="Hours">Hours</option>
                    <option value="Crimps">Cycles / Crimps</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>PM INTERVAL LIMIT</label>
                  <input type="number" placeholder="e.g. 90, 5000" value={newTool.pmInterval} onChange={(e) => setNewTool({...newTool, pmInterval: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c', flex: 1 }}>
                <input type="checkbox" id="dispatchableToggle" checked={newTool.isDispatchable} onChange={(e) => setNewTool({...newTool, isDispatchable: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#34c759', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="dispatchableToggle" style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Enable Field Checkout</label>
                  <span style={{ fontSize: '11px', color: '#86868b' }}>If disabled, this asset will be permanently locked to its home location.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,204,0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,204,0,0.3)', flex: 1 }}>
                <input type="checkbox" id="specialtyToggle" checked={newTool.isSpecialty} onChange={(e) => setNewTool({...newTool, isSpecialty: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="specialtyToggle" style={{ fontSize: '14px', color: '#ffcc00', fontWeight: '700', cursor: 'pointer' }}>Specialty / High-Value</label>
                  <span style={{ fontSize: '11px', color: '#86868b' }}>Enforces physical manifest audit upon return.</span>
                </div>
              </div>
            </div>

            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAddModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddAsset} disabled={!newTool.name || !newTool.value} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: (!newTool.name || !newTool.value) ? 0.4 : 1 }}>ADD TO INVENTORY</button>
            </div>
          </div>
        </div>
      )}

      {/* RAPID DISPATCH MODAL */}
      {checkoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container">
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Dispatch Asset</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Transferring custody of <strong style={{color: '#ffcc00'}}>[{selectedTool.toolId}]</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EMPLOYEE / TECH NAME</label>
                <input type="text" placeholder="e.g. Chris Evans" value={dispatchUser} onChange={(e) => setDispatchUser(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} autoFocus />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setCheckoutModalOpen(false); setDispatchUser(""); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCheckout} disabled={!dispatchUser.trim()} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: dispatchUser.trim() ? 1 : 0.4 }}>AUTHORIZE</button>
            </div>
          </div>
        </div>
      )}

    
      {/* ALERTS MODAL */}
      {alertsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '500px', maxWidth: '90%', color: '#ffffff' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Notification Preferences</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Configure how and when the system alerts you.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TARGET EMAIL</label>
                <input type="email" value={alertPrefs.email} onChange={(e) => setAlertPrefs({...alertPrefs, email: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>DIGEST FREQUENCY</label>
                <select value={alertPrefs.frequency} onChange={(e) => setAlertPrefs({...alertPrefs, frequency: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                  <option value="Instant">Instant (On Event)</option>
                  <option value="Daily Digest">Daily Digest (7:00 AM)</option>
                  <option value="Weekly Digest">Weekly Summary (Friday 5PM)</option>
                  <option value="Muted">Muted (No Emails)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>ALERT TRIGGERS</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyDamaged} onChange={(e) => setAlertPrefs({...alertPrefs, notifyDamaged: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ff3b30' }} />
                  Asset Flagged as Damaged 🚩
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyOverdue} onChange={(e) => setAlertPrefs({...alertPrefs, notifyOverdue: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ffcc00' }} />
                  PM Service Interval Overdue 🛑
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyNew} onChange={(e) => setAlertPrefs({...alertPrefs, notifyNew: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#34c759' }} />
                  New Asset Ingested 📦
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>SAVE PREFERENCES</button>
            </div>
          </div>
        </div>
      )}
    
      {/* RETURN AUDIT MODAL */}
      {returnModalOpen && selectedTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '500px', maxWidth: '90%', color: '#ffffff' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffcc00', letterSpacing: '-0.02em' }}>Audit Required</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Confirm the manifest for high-value asset <strong style={{color: '#ffffff'}}>[{selectedTool.toolId}]</strong></p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {Object.keys(returnChecklist).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: returnChecklist[key] ? '#34c759' : '#ffffff', cursor: 'pointer', padding: '16px', backgroundColor: '#121212', borderRadius: '8px', border: returnChecklist[key] ? '1px solid #34c759' : '1px solid #3a3a3c', margin: 0, fontWeight: '600' }}>
                  <input type="checkbox" checked={returnChecklist[key]} onChange={(e) => setReturnChecklist({...returnChecklist, [key]: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: '#34c759', margin: 0 }} />
                  {key === 'primary' ? 'Primary Asset Body' : key === 'battery' ? 'Battery / Power Unit' : 'All Provided Accessories'}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setReturnModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                const allChecked = Object.values(returnChecklist).every(Boolean);
                const condition = allChecked ? selectedTool.condition : "Damaged";
                const action = allChecked ? "Audited & Returned" : "Returned Incomplete/Damaged 🚩";
                executeReturn(selectedTool, condition, action);
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: Object.values(returnChecklist).every(Boolean) ? '#34c759' : '#ff3b30', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                {Object.values(returnChecklist).every(Boolean) ? "CONFIRM SECURE RETURN" : "FLAG AS INCOMPLETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* FINANCIAL MODAL */}
      {financeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '800px', maxWidth: '90%', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>Fleet Financial Summary</h2>
                <p style={{ margin: '0', fontSize: '14px', color: '#86868b' }}>Capital expenditure and current deployment valuation.</p>
              </div>
              <button onClick={() => setFinanceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #3a3a3c', flexDirection: 'row' }}>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TOTAL FLEET ASSET VALUE</span>
                <span className="hud-stat-value" style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>${totalValue.toLocaleString()}</span>
              </div>
              <div className="hud-divider" style={{ width: '1px', height: '40px', backgroundColor: '#3a3a3c' }}></div>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE DEPLOYED IN FIELD</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500' }}></span>
                  <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#ff9500' }}>${deployedValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#86868b' }}>({deployedTools.length} Units)</span></span>
                </div>
              </div>
              <div className="hud-divider" style={{ width: '1px', height: '40px', backgroundColor: '#3a3a3c' }}></div>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SECURED IN TOOL CRIB</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34c759' }}></span>
                  <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#34c759' }}>${cribValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#86868b' }}>({tools.length - deployedTools.length} Units)</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tools;
