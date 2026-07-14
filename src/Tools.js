import { docClient } from './dynamoClient';
import { ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import SignatureCanvas from 'react-signature-canvas';
import React, { useEffect,  useState, useMemo } from 'react';
import { uploadData, getUrl } from "aws-amplify/storage";

// NLP Ingest Engine for Smart Checklists
const generateSmartChecklist = (id, name) => {
  const lowerName = (name || '').toLowerCase();
  const prefix = id ? id.split('-')[0] : '';
  
  if (prefix === 'HVAC' || lowerName.includes('ac') || lowerName.includes('chiller') || lowerName.includes('condenser') || lowerName.includes('ton') || prefix === 'GOODMAN' || prefix === 'CARRIER' || prefix === 'TRANE') 
    return ['Filter Status', 'Voltage Output Test', 'Refrigerant Line Check'];
  if (prefix === 'VEH' || lowerName.includes('truck') || lowerName.includes('car') || lowerName.includes('tesla')) 
    return ['Tire Tread Depth', 'Fluid Levels', 'Brake Pad Inspection'];
  if (prefix === 'CAT' || prefix === 'LIFT' || lowerName.includes('lift') || lowerName.includes('excavator') || lowerName.includes('loader')) 
    return ['Hydraulic Line Check', 'Grease Points', 'Emergency Stop Test'];
  if (prefix === 'GEN' || lowerName.includes('generator') || lowerName.includes('tower')) 
    return ['Filter Status', 'Voltage Output Test', 'Fuel Line Check'];
  if (prefix === 'TECH' || lowerName.includes('switch') || lowerName.includes('camera') || lowerName.includes('laptop') || lowerName.includes('toughbook')) 
    return ['Diagnostic Interface Audit', 'Firmware Version Verification', 'Port/Cable Integrity'];
  if (prefix === 'MILW' || prefix === 'DWLT' || prefix === 'HILT' || lowerName.includes('drill') || lowerName.includes('saw') || lowerName.includes('impact') || lowerName.includes('press')) 
    return ['Battery/Cord Check', 'Chuck/Collet Alignment', 'Trigger Safety Test'];
  if (prefix === 'SURV' || lowerName.includes('leica') || lowerName.includes('station')) 
    return ['Lens/Optics Check', 'Tripod Mount Integrity', 'Calibration Verification'];
    
  return ['Visual Inspection', 'Power Cycle', 'Safety Test']; // Fallback
};

// Generates universal tools with dynamic PM metrics (Time, Usage, Cycles)
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
    
    const toolMetrics = t.metrics.map(m => {
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
      isSpecialty: t.value >= 20000, maxCheckoutDays: 14,
      metrics: toolMetrics,
      history: isOut ? [
        { user: assignedUser, action: "Checked Out", date: `${daysOut} days ago`, condition: condition }
      ] : (Math.random() > 0.5 ? [{ user: "Admin", action: "Returned", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: condition }] : [])
    });
  }
  return generated;
};

function Tools({ user }) {

  const fetchDB = async () => {
    try {
      const tenantId = user?.profile?.["custom:tenant_id"];
      let params = { TableName: "KineticToolsData" };
      if (tenantId) {
        params.FilterExpression = "tenant_id = :tid";
        params.ExpressionAttributeValues = { ":tid": tenantId };
      }
      const data = await docClient.send(new ScanCommand(params));
      if (data.Items) {
        setTools(data.Items);
      }
    } catch (err) { console.error("DB Fetch Error:", err); }
  };

  const syncDB = async (item) => {
    try {
      await docClient.send(new PutCommand({ TableName: 'KineticToolsData', Item: item }));
    } catch (err) { console.error("DB Sync Error:", err); }
  };

  const deleteTool = async (toolId) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ${toolId} from the database? This cannot be undone.`)) return;
    try {
      setTools(prev => prev.filter(t => t.toolId !== toolId)); setSelectedToolId(null); await docClient.send(new DeleteCommand({ TableName: 'KineticToolsData', Key: { toolId } }));
    } catch (err) { console.error("Delete Error:", err); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { fetchDB(); }, []);

  const [inventory] = useState({ 'HVAC': [{ item: '24x24x2 Pleated Air Filter', stock: 45 }, { item: 'R-410A Refrigerant (lbs)', stock: 12 }], 'MILW': [{ item: 'M18 REDLITHIUM 5.0Ah Battery', stock: 22 }, { item: 'Press Tool Jaw Grease', stock: 6 }], 'VEH': [{ item: '5W-30 Synthetic Oil (Qts)', stock: 32 }, { item: 'Wiper Fluid (Gal)', stock: 14 }] });
  const [tools, setTools] = useState(generateTools);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [custodySearch, setCustodySearch] = useState('');
  const [custodySort, setCustodySort] = useState('daysDesc');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };
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
  const [selectedLedgerLogs, setSelectedLedgerLogs] = useState([]);
  const [auditCleared, setAuditCleared] = useState({});
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [personnel, setPersonnel] = useState(['Chris Evans', 'David Kim', 'Elena Rodriguez', 'Ellen Ripley', 'John Wick', 'Marcus Johnson', 'Mario Diaz', 'Priya Patel', 'Sarah Connor', 'Tony Stark']);
  
  useEffect(() => {
    // ENTERPRISE INTEGRATION POINT: 
    // Replace this block with your AWS Amplify/Cognito fetch call when the backend is ready
    /*
    const fetchEnterpriseRoster = async () => {
       try {
           const users = await API.graphql(graphqlOperation(listUsers));
           setPersonnel(users.data.listUsers.items.map(u => u.fullName).sort());
       } catch (err) {
           console.error("Failed to fetch user directory", err);
       }
    };
    fetchEnterpriseRoster();
    */
  }, []);

  const [dispatchUser, setDispatchUser] = useState("");
  const [dispatchCondition, setDispatchCondition] = useState("Excellent");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchProject, setDispatchProject] = useState("");
  const [dispatchTerms, setDispatchTerms] = useState(false);
  const [ingestTerms, setIngestTerms] = useState(false);
  const [ingestPhoto, setIngestPhoto] = useState(null);
  const sigPad = React.useRef(null);
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTool, setEditTool] = useState(null);
  const [confirmIngestOpen, setConfirmIngestOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnChecklist, setReturnChecklist] = useState({ primary: false, battery: false, accessories: false });
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [alertPrefs, setAlertPrefs] = useState({ 
    email: '', 
    frequency: 'Daily Digest', 
    notifyDamaged: true, 
    notifyOverdue: true, 
    notifyNew: false 
  });
  const [newTool, setNewTool] = useState({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '14', isDispatchable: true, isSpecialty: false });

  
  React.useEffect(() => {
    if (checkoutModalOpen && userRole === 'TECH') {
      setDispatchUser(user?.profile?.email || 'Logged-In Tech');
    }
  }, [checkoutModalOpen, userRole, user]);
  
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

  // Universal Logic: An tool is overdue if ANY of its metrics exceed their interval.
  const checkIsOverdue = (metrics) => metrics.some(m => m.current >= m.interval);
  
  // To sort the Kanban, we find the metric closest to failing (lowest percentage remaining)
  const getMostCriticalMetric = (metrics) => {
    return metrics.reduce((mostCritical, current) => {
      const currentRemainingPct = (current.interval - current.current) / current.interval;
      const mostCriticalRemainingPct = (mostCritical.interval - mostCritical.current) / mostCritical.interval;
      return currentRemainingPct < mostCriticalRemainingPct ? current : mostCritical;
    });
  };

  const overdueTools = filteredTools.filter(t => checkIsOverdue(t.metrics));
  
  const thisWeekTools = filteredTools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.90 && pct < 1.0; 
  });
  
  const nextWeekTools = filteredTools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.80 && pct < 0.90;
  });
  
  const thisMonthTools = filteredTools.filter(t => {
    if (checkIsOverdue(t.metrics)) return false;
    const critical = getMostCriticalMetric(t.metrics);
    const pct = critical.current / critical.interval;
    return pct >= 0.60 && pct < 0.80;
  });

  
  // eslint-disable-next-line no-unused-vars
  const seedDatabase = async () => {
    if (!window.confirm("WARNING: This will generate 100 random tools and push them to your live DynamoDB table. Proceed?")) return;
    const newTools = generateTools();
    
    setTools(prev => [...newTools, ...prev]);
    
    for (const t of newTools) {
      await syncDB(t);
    }
    console.log("✅ Seed complete!");
    alert("100 Tools successfully seeded to DynamoDB!");
  };

  const handleAddTool = async () => {
    if (!newTool.prefix || (!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value) return;
    
    const standardPrefixes = ['VEH', 'HVAC', 'MILW', 'DWLT', 'HILT', 'MAKI', 'BSCH', 'CAT', 'LIFT', 'GEN', 'TECH', 'SURV', 'KIT'];
    if (!standardPrefixes.includes(newTool.prefix.toUpperCase())) {
      if (!window.confirm(`Warning: "${newTool.prefix.toUpperCase()}" is not a standard brand prefix in your matrix.\n\nAre you sure it is spelled correctly?`)) {
        return;
      }
    }
    
    const isKit = newTool.prefix?.toUpperCase() === 'KIT';
    if (isKit && newTool.assignee) {
      if (!ingestTerms || !sigPad.current || sigPad.current.isEmpty()) {
        alert("Please accept the terms and provide a signature to rapid-assign this kit.");
        return;
      }
    }
    const ingestSigData = (isKit && newTool.assignee && sigPad.current && !sigPad.current.isEmpty()) ? sigPad.current.getCanvas().toDataURL('image/png') : null;

    let ingestPhotoUrl = null;
    let ingestPhotoName = null;
    if (isKit && newTool.assignee && ingestPhoto) {
      try {
        const uploadedFilename = `KIT-${Date.now()}-${ingestPhoto.name.replace(/\s+/g, '_')}`;
        await uploadData({
          path: `public/service-logs/${uploadedFilename}`,
          data: ingestPhoto,
          options: { contentType: ingestPhoto.type }
        }).result;
        const link = await getUrl({ path: `public/service-logs/${uploadedFilename}` });
        ingestPhotoUrl = link.url.toString();
        ingestPhotoName = ingestPhoto.name;
      } catch (err) { console.error("Kit Photo Upload Failed:", err); }
    }

    const idNum = String(Math.floor(Math.random() * 900) + 100);
    const generatedId = `${newTool.prefix}-${idNum}`;
    
    const newToolObj = {
      toolId: generatedId,
      name: newTool.prefix?.toUpperCase() === 'KIT' ? 'Standard Deployment Kit' : newTool.name,
      value: parseInt(newTool.value) || 0,
      category: newTool.prefix?.toUpperCase() === 'KIT' ? 'Standard Kit' : (newTool.category || 'General'),
      location: newTool.location || 'Unassigned',
      serial: newTool.serial || 'N/A',
      link: newTool.link || '',
      isDispatchable: newTool.prefix?.toUpperCase() === 'KIT' ? true : newTool.isDispatchable,
      isSpecialty: newTool.isSpecialty,
      status: newTool.assignee ? "CHECKED_OUT" : "AVAILABLE",
      condition: newTool.condition,
      assignedUser: newTool.assignee || null,
      daysOut: 0,
      metrics: [{ unit: newTool.pmMetric, current: 0, interval: parseInt(newTool.pmInterval) || 90 }], maxCheckoutDays: (newTool.maxCheckoutDays === '' || newTool.maxCheckoutDays === undefined) ? 14 : parseInt(newTool.maxCheckoutDays),
      history: newTool.assignee ? [{ user: newTool.assignee, action: "Auto-Dispatched during ingestion" + (isKit ? " | E-Signed" : ""), ...(ingestSigData && { signatureUrl: ingestSigData }), ...(ingestPhotoUrl && { attachmentUrl: ingestPhotoUrl, attachment: '📷 Kit Manifest: ' + ingestPhotoName }), date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }, { user: "Admin", action: "Tool Ingested to Database", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }] : [{ user: "Admin", action: "Tool Ingested to Database", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }]
    };
    
    syncDB(newToolObj);
    setTools(prev => [newToolObj, ...prev]);
    setAddModalOpen(false);
    setNewTool({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '14', isDispatchable: true, isSpecialty: false, assignee: '' });
    setIngestTerms(false);
    setIngestPhoto(null);
    if (sigPad.current) sigPad.current.clear();
    setSelectedToolId(generatedId);
    setActiveView('DISPATCH');
  };

  const handleCheckout = async () => {
    if (!dispatchUser) return;
    
    
    if (!dispatchTerms || !sigPad.current || sigPad.current.isEmpty()) {
      alert("Please accept the terms and provide a signature to authorize this dispatch.");
      return;
    }
    
    const sigData = (sigPad.current && !sigPad.current.isEmpty()) ? sigPad.current.getCanvas().toDataURL('image/png') : null;

    // --- TELEMETRY CAPTURE ---
    let ipAddress = "Unknown IP";
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipAddress = data.ip;
    } catch(err) { console.warn("IP fetch failed"); }

    let deviceId = localStorage.getItem('kinetic_device_id');
    if (!deviceId) {
      deviceId = 'AUTH-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('kinetic_device_id', deviceId);
    }
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
    const telemetryData = `IP: ${ipAddress} | ID: ${deviceId} | ${isMobile}`;
    // -------------------------
    
    setTools(prev => prev.map(t => {
if (t.toolId === selectedToolId) {
const ut = {
  ...t,
  status: 'CHECKED_OUT',
  assignedUser: dispatchUser,
  daysOut: 0,
  condition: dispatchCondition,
  history: [{ 
    user: dispatchUser, 
    action: `Dispatched to: ${dispatchProject || 'Field'} | E-Signed`, 
    ...(sigData && { signatureUrl: sigData }),
    note: dispatchNotes,
    date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), 
    condition: dispatchCondition,
    telemetry: telemetryData
  }, ...t.history]
};
syncDB(ut); // Save the updated condition to the database
return ut;
}
return t;
}));
    
    setCheckoutModalOpen(false);
    setAuditCleared(prev => { const newState = { ...prev }; delete newState[selectedToolId]; return newState; });
    setDispatchUser("");
    setDispatchProject("");
    setDispatchCondition("Excellent");
    setDispatchNotes("");
    setDispatchTerms(false);
    if (sigPad.current) sigPad.current.clear();
  };

  const executeReturn = (tool, newCondition, actionText) => {
    const ut = {
      ...tool,
      status: 'AVAILABLE',
      assignedUser: null,
      daysOut: 0,
      condition: newCondition,
      history: [{ user: "Admin", action: actionText, date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newCondition }, ...tool.history]
    };
    syncDB(ut); // SILENT BUG FIXED: Return actions now save to cloud
    setTools(prev => prev.map(t => t.toolId === selectedTool.toolId ? ut : t));
    setReturnModalOpen(false);
    setAuditCleared(prev => { const newState = { ...prev }; delete newState[tool.toolId]; return newState; });
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

  const logService = async (toolId) => {
    const fileObj = pendingAttachments[toolId];
    const note = serviceNotes[toolId];
    const targetTool = tools.find(t => t.toolId === toolId);
    if (targetTool?.condition === 'Damaged' && targetTool?.status !== 'CHECKED_OUT') {
      if (!note || !note.toLowerCase().includes('repair') || !fileObj) {
        alert("🚨 REPAIR PROTOCOL: To clear this damaged status, you must detail the fix (include the word 'repair') AND attach a photo of the completed work.");
        return;
      }
    }
    let uploadedFilename = null;
    let viewableUrl = null;
    if (fileObj) {
      try {
        uploadedFilename = `${toolId}-${Date.now()}-${fileObj.name}`;
        await uploadData({
          path: `public/service-logs/${uploadedFilename}`,
          data: fileObj,
          options: { contentType: fileObj.type }
        }).result;
        const link = await getUrl({ path: `public/service-logs/${uploadedFilename}` });
        viewableUrl = link.url.toString();
      } catch (err) { console.error("S3 Upload Failed:", err); }
    }
    setTools(prev => prev.map(t => {
      if (t.toolId === toolId) {
        const resetMetrics = t.metrics.map(m => ({ ...m, current: 0 }));
        const ut = {
                  ...t,
                  metrics: resetMetrics,
                  condition: (t.condition === 'Damaged' && t.status !== 'CHECKED_OUT' && note?.toLowerCase().includes('repair') && fileObj) ? 'Good' : (t.condition === 'Damaged' ? 'Damaged' : 'Excellent'),
                  status: t.status === 'CHECKED_OUT' ? 'AVAILABLE' : t.status,
                  assignedUser: t.status === 'CHECKED_OUT' ? null : t.assignedUser,
                  daysOut: t.status === 'CHECKED_OUT' ? 0 : t.daysOut,
                  history: [{ 
                    user: t.status === 'CHECKED_OUT' ? (t.assignedUser || "Admin") : "Admin", 
                    action: t.status === 'CHECKED_OUT' ? "Returned, Audited & Serviced" : "PM Service Completed & Intervals Reset", 
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), 
            condition: (t.condition === 'Damaged' && t.status !== 'CHECKED_OUT' && note?.toLowerCase().includes('repair') && fileObj) ? 'Good' : (t.condition === 'Damaged' ? 'Damaged' : 'Excellent'),
            attachment: fileObj ? fileObj.name : null,
            attachmentUrl: viewableUrl,
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
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), 
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
        const ut = { ...t, condition: "Damaged", history: [{ user: "Admin", action: "Flagged as Damaged 🚩", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: "Damaged", note: note }, ...t.history] };
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
        @media (max-width: 960px) { .responsive-header-col { justify-content: center !important; min-width: 100% !important; flex: 1 1 100% !important; margin-bottom: 8px; } }
      @media (max-width: 768px) {
          /* Matrix Layout & Inspector Bottom Sheet */
          .desktop-layout { flex-direction: column !important; padding-bottom: 50vh !important; }
          .matrix-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          
          .inspector-container { 
            position: fixed !important; 
            bottom: 0 !important; 
            left: 0 !important; 
            right: 0 !important; 
            width: 100% !important; 
            top: auto !important; 
            z-index: 1000 !important; 
            border-radius: 24px 24px 0 0 !important; 
            border: 1px solid #3a3a3c !important;
            border-bottom: none !important; 
            max-height: 50vh !important; 
            padding: 24px 16px 16px 16px !important; 
            box-shadow: 0 -15px 40px rgba(0,0,0,0.9) !important; 
            background-color: rgba(28,28,30,0.95) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
          }
          /* Add an iOS-style drag handle visual to the inspector */
          .inspector-container::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 5px;
            background-color: #636366;
            border-radius: 10px;
          }
          
          /* Full Screen Modals for Touch Signatures */
          .modal-container { 
            width: 100% !important; 
            height: 100% !important; 
            max-height: 100vh !important; 
            max-width: 100% !important; 
            border-radius: 0 !important; 
            padding: 24px 16px 100px 16px !important; 
            border: none !important; 
          }
          
          /* Top Nav Horizontal Scroll */
          .responsive-header-container { padding: 12px !important; gap: 12px !important; flex-direction: column !important; align-items: stretch !important; }
          .responsive-header-col { overflow-x: auto !important; white-space: nowrap !important; flex-wrap: nowrap !important; justify-content: flex-start !important; flex: none !important; width: 100%; margin-bottom: 0 !important; padding-bottom: 8px; }
          .responsive-header-col::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* MASTER TOGGLE & INGEST ACTION DECK */}
      <div className="responsive-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', padding: '12px 24px', borderRadius: '16px', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap', gap: '16px', border: '1px solid #3a3a3c', marginTop: '24px', marginBottom: '12px' }}>
        
        {/* LEFT: Role Toggle */}
        <div className="responsive-header-col" style={{ display: 'flex', flex: 1, justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#121212', borderRadius: '8px', padding: '4px', border: '1px solid #3a3a3c' }}>
            <button onClick={() => setUserRole('TECH')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'TECH' ? '#ffffff' : 'transparent', color: userRole === 'TECH' ? '#121212' : '#86868b', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>TECH</button>
            <button onClick={() => setUserRole('ADMIN')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'ADMIN' ? '#ffffff' : 'transparent', color: userRole === 'ADMIN' ? '#121212' : '#86868b', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>ADMIN</button>
          </div>
        </div>

        {/* CENTER: Main Operations */}
        <div className="responsive-header-col" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveView('DISPATCH')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'DISPATCH' ? '#ffffff' : 'transparent', color: activeView === 'DISPATCH' ? '#121212' : '#86868b' }}>
            📦 ASSET HUB
          </button>
          {userRole === 'ADMIN' && (
            <button onClick={() => setActiveView('MAINTENANCE')} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'MAINTENANCE' ? '#ffffff' : 'transparent', color: activeView === 'MAINTENANCE' ? '#121212' : '#86868b' }}>
              🛠️ PM HUB
            </button>
          )}
          
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#121212', borderRadius: '8px', padding: '4px', border: '1px solid #3a3a3c', marginLeft: '8px' }}>
              <button onClick={() => setAddModalOpen(true)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                ADD
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#3a3a3c', margin: '0 4px' }}></div>
              <button onClick={() => setBulkModalOpen(true)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(255,204,0,0.1)', color: '#ffcc00', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                BULK ADD
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Admin Tools (Cohesive Control Pad) */}
        <div className="responsive-header-col" style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#121212', padding: '2px', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
              <button onClick={() => setActiveView('LEDGER')} style={{ padding: '4px 14px', borderRadius: '6px', border: 'none', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'LEDGER' ? '#ffffff' : 'transparent', color: activeView === 'LEDGER' ? '#121212' : '#86868b', width: '100%', textAlign: 'center' }}>
                📜 MASTER LEDGER
              </button>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button onClick={() => setAlertsModalOpen(true)} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}>
                  🔔 ALERTS
                </button>
                <div style={{ width: '1px', backgroundColor: '#3a3a3c', margin: '2px 0' }}></div>
                <button onClick={() => setGuideModalOpen(true)} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#007aff', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}>
                  📖 GUIDE
                </button>
                <div style={{ width: '1px', backgroundColor: '#3a3a3c', margin: '2px 0' }}></div>
                <button onClick={() => setFinanceModalOpen(true)} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#d2d2d7', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}>
                  📊 FINANCE
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      
      {/* VIEW ROUTING */}
      {activeView === 'DISPATCH' ? (
        <div className="desktop-layout">
          {/* LEFT COLUMN: THE MATRIX */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input type="text" placeholder="Search by Tool ID, Name, or Assigned Tech..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" />
                </div>
            </div>

            <div className="matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', alignContent: 'start' }}>
                {filteredTools.filter(tool_obj => tool_obj.status !== 'DECOMMISSIONED').map(tool => {
                const isSelected = tool.toolId === selectedToolId;
                const isOut = tool.status === 'CHECKED_OUT';
                const isServiceDue = checkIsOverdue(tool.metrics);
                const isFlipped = !!flippedCards[tool.toolId];
                const canReturn = userRole === 'ADMIN' || tool.assignedUser === (user?.profile?.email || dispatchUser);
                const activeTab = cardTabs[tool.toolId] || 'service';
                
                let cardBorder = '1px solid #3a3a3c';
                let cardShadow = 'none';
                let cardBg = isServiceDue ? '#221515' : '#1c1c1e';
                if (isSelected) {
                  cardBorder = '1px solid #007aff';
                  cardShadow = '0 0 0 1px #007aff';
                  cardBg = isServiceDue ? '#2a1a1a' : '#222226';
                } else if (isServiceDue) { cardBorder = '1px solid #3a3a3c'; }

                return (
                    <div key={tool.toolId} className="card-perspective-wrapper" onClick={() => setSelectedToolId(tool.toolId)}>
                    <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                        
                        {/* FRONT FACE */}
                        <div className="card-face card-front" style={{ padding: '16px', border: cardBorder, boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', backgroundColor: cardBg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isServiceDue ? 'rgba(255,59,48,0.15)' : (isOut ? 'rgba(255,149,0,0.15)' : 'rgba(52,199,89,0.15)'), color: isServiceDue ? '#ff3b30' : (isOut ? '#ff9500' : '#34c759'), letterSpacing: '0.05em' }}>
                            {isServiceDue ? 'SERVICE DUE' : (isOut ? 'DEPLOYED' : 'IN-STOCK')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#86868b', fontWeight: '600' }}>[ {tool.toolId} ]</span>
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.3', color: '#ffffff' }}>{tool.name}</div>
                            {isOut && (<div style={{ fontSize: '12px', color: '#ff9500', marginTop: '6px', fontWeight: '600' }}>👤 {tool.assignedUser}</div>)}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', position: 'relative' }}>
                            {tool.isDispatchable !== false ? (
                              (() => {
                                const isAdmin = userRole === 'ADMIN';
                                const isLocked = isServiceDue || tool.condition === 'Damaged';
                                if (isOut) {
                                  if (!canReturn) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,30,0.9)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#ff3b30', border: '1px solid #ff3b30' }}>🔒 LOCKED</div>;
                                  return <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#007aff', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>RETURN</button>;
                                }
                                if (isLocked && !isAdmin) return <button disabled style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#2c2c2e', color: '#636366', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'not-allowed' }}>LOCKED</button>;
                                if (isLocked && isAdmin) return <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,149,0,0.1)', color: '#ff9500', border: '1px solid #ff9500', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>{tool.condition === 'Damaged' ? 'REPAIR' : 'SERVICE'}</button>;
                                return <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#007aff', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>CHECK OUT</button>;
                              })()
                            ) : (
                              <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#1c1c1e', color: '#86868b', border: '1px solid #3a3a3c', fontWeight: '700', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }}>STATIC</div>
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
                            {tool.isDispatchable !== false && (<button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}>🧰 KITS</button>)}
                            {tool.isDispatchable !== false && (<button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}>📱 QR</button>)}
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#121212', padding: '8px', borderRadius: '8px', border: '1px solid #3a3a3c', maxHeight: '160px', overflowY: 'auto' }}>
                                  {(tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).map(step => {
                                    const isChecked = (serviceChecklists[tool.toolId] || []).includes(step);
                                    return (
                                      <label key={step} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: isChecked ? '#34c759' : '#d2d2d7', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                                        <input type="checkbox" checked={isChecked} onChange={() => { setServiceChecklists(prev => { const curr = prev[tool.toolId] || []; return { ...prev, [tool.toolId]: curr.includes(step) ? curr.filter(s => s !== step) : [...curr, step] }; }); }} style={{ width: '12px', height: '12px', accentColor: '#34c759', margin: 0 }} />{step} {userRole === 'ADMIN' && <span style={{ color: '#ff3b30', cursor: 'pointer', marginLeft: '8px', fontWeight: '800' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); const currentList = tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name); setTools(tools.map(t => t.toolId === selectedTool.toolId ? { ...t, pmChecklist: currentList.filter(s => s !== step) } : t));
                }}>✕</span>}</label>
                                    );
                                  })}
                                </div>
                                
                                {/* TECH NOTES & PHOTO */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  {userRole === 'ADMIN' && (
    <input 
      type="text" 
      placeholder="+ Add Custom Step (Press Enter)" 
      style={{ padding: '8px', borderRadius: '4px', border: '1px dashed #3a3a3c', backgroundColor: 'transparent', color: '#34c759', fontSize: '12px', outline: 'none', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          const currentList = tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name);
          const newList = [...currentList, e.target.value.trim()];
          setTools(tools.map(t => t.toolId === selectedTool.toolId ? { ...t, pmChecklist: newList } : t));
          e.target.value = '';
        }
      }} 
    />
  )}
<input type="text" placeholder={tool.condition === "Damaged" || tool.condition === "Requires Maintenance" ? "🚨 MANDATORY: Explain damage/fault here..." : "Add Service Notes..."} value={serviceNotes[tool.toolId] || ''} onChange={(e) => setServiceNotes(prev => ({...prev, [tool.toolId]: e.target.value}))} onClick={(e) => e.stopPropagation()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '11px', outline: 'none' }} />
                                  <label htmlFor={`file-${tool.toolId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', borderRadius: '8px', backgroundColor: pendingAttachments[tool.toolId] ? 'rgba(52,199,89,0.15)' : '#2c2c2e', border: pendingAttachments[tool.toolId] ? '1px solid #34c759' : '1px dashed #86868b', color: pendingAttachments[tool.toolId] ? '#34c759' : '#d2d2d7', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {pendingAttachments[tool.toolId] ? '📎' : '📷'}
                                  </label>
                                  <input type="file" id={`file-${tool.toolId}`} style={{ display: 'none' }} onChange={(e) => { if(e.target.files[0]) { setPendingAttachments(prev => ({...prev, [tool.toolId]: e.target.files[0]})); } }} />
                                </div>

                                <button disabled={(serviceChecklists[tool.toolId] || []).length !== (tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).length || ((tool.condition === 'Damaged' || tool.condition === 'Requires Maintenance') && !(serviceNotes[tool.toolId] || '').trim())} onClick={(e) => { e.stopPropagation(); logService(tool.toolId); }} style={{ marginTop: 'auto', padding: '10px', borderRadius: '8px', backgroundColor: (isOut && tool.condition === 'Damaged') ? '#ff3b30' : (tool.condition === 'Damaged' ? '#ff9500' : '#34c759'), color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', opacity: ((serviceChecklists[tool.toolId] || []).length === (tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).length && (!(['Damaged', 'Requires Maintenance'].includes(tool.condition)) || (serviceNotes[tool.toolId] || '').trim())) ? 1 : 0.4 }}>{(isOut && tool.condition === 'Damaged') ? 'RETURN (DAMAGED)' : (tool.condition === 'Damaged' ? 'LOG REPAIR & RESET' : (isOut ? 'LOG RETURN & RESET' : 'LOG SERVICE & RESET'))}</button>
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
                                <button onClick={(e) => { e.stopPropagation(); const content = e.currentTarget.parentElement.innerHTML; const printWin = window.open('', '', 'width=400,height=400'); const cleanContent = content.replace(new RegExp('<button[\\s\\S]*?<\\/button>', 'g'), ''); printWin.document.write('<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;">' + cleanContent + '</body></html>'); printWin.document.close(); setTimeout(() => { printWin.print(); printWin.close(); }, 300); }} style={{ marginTop: '12px', padding: '8px', backgroundColor: '#34c759', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', width: '100%', textTransform: 'uppercase' }}>Print</button>
                            </div>
                            )}

                            {activeTab === 'specs' && (
                            <div style={{ fontSize: '12px', color: '#86868b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Value:</span> ${tool.value}</div>
                                <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Purchased:</span> Jan 14, 2024</div>
                                <div><span style={{ color: '#d2d2d7', fontWeight: '600' }}>Warranty:</span> Expires Jan 2029</div>
                                {tool.manualUrl ? (
      <div onClick={(e) => { e.stopPropagation(); window.open(tool.manualUrl, "_blank"); }} style={{ color: '#007aff', fontWeight: '800', cursor: 'pointer', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(0,122,255,0.1)', borderRadius: '6px', border: '1px solid rgba(0,122,255,0.3)' }}>
        <span>📄</span> VIEW PDF MANUAL
      </div>
    ) : (
      <div style={{ marginTop: '8px' }}>
        <label htmlFor={`manual-${tool.toolId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #ff9500', color: '#ff9500', fontWeight: '800', fontSize: '11px', cursor: 'pointer', backgroundColor: 'rgba(255,149,0,0.05)', transition: 'all 0.2s' }}>
          <span>⬆️</span> UPLOAD PDF MANUAL
        </label>
        <input type="file" id={`manual-${tool.toolId}`} accept="application/pdf" style={{ display: 'none' }} onChange={async (e) => {
          if(e.target.files[0]) {
            try {
              const file = e.target.files[0];
              const filename = `manuals/${tool.toolId}-${Date.now()}.pdf`;
              await uploadData({ path: `public/${filename}`, data: file, options: { contentType: 'application/pdf' } }).result;
              const link = await getUrl({ path: `public/${filename}` });
              const updatedTool = { ...tool, manualUrl: link.url.toString() };
              syncDB(updatedTool);
              setTools(prev => prev.map(t => t.toolId === selectedTool.toolId ? updatedTool : t));
            } catch(err) { console.error("Manual Upload Failed:", err); }
          }
        }} />
      </div>
    )}
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
                    <div style={{ fontSize: '13px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>INSPECTOR DASHBOARD</div>
                    <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>{selectedTool.toolId}</div>
                    <div style={{ color: checkIsOverdue(selectedTool.metrics) ? '#ff3b30' : '#ffcc00', fontSize: '16px', fontWeight: '600', marginTop: '4px', lineHeight: '1.3' }}>{selectedTool.name}</div>
                    </div>

                    {selectedTool.condition === 'Damaged' && (
                      <div style={{ backgroundColor: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.5)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ color: '#ff9500', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🚩</span> TOOL DAMAGED / OUT OF SERVICE
                        </div>
                        <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                          This tool has been manually flagged as damaged. It cannot be dispatched until a technician logs a repair service.
                        </div>
                      </div>
                    )}
                    {checkIsOverdue(selectedTool.metrics) && (
                      <div style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.5)', padding: '16px', borderRadius: '12px', animation: 'criticalPulse 2s infinite' }}>
                        <div style={{ color: '#ff3b30', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛑</span> PREVENTATIVE MAINTENANCE LOCK
                        </div>
                        <div style={{ color: '#d2d2d7', fontSize: '13px', lineHeight: '1.5' }}>
                          This tool has exceeded one or more of its critical service intervals. Dispatch capabilities have been securely locked until a technician verifies integrity and resets the timers.
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
                            
                            {log.signatureUrl && (
                              <div style={{ marginTop: '8px', padding: '4px', backgroundColor: '#ffffff', borderRadius: '4px', display: 'inline-block', border: '1px solid #3a3a3c' }}>
                                <img src={log.signatureUrl} alt="Signature" style={{ height: '40px', display: 'block' }} />
                              </div>
                            )}
                            {log.attachment && (
                              <div onClick={() => log.attachmentUrl && window.open(log.attachmentUrl, "_blank")} style={{ fontSize: "12px", color: log.attachmentUrl ? "#007aff" : "#86868b", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", cursor: log.attachmentUrl ? "pointer" : "default", fontWeight: "600", textDecoration: log.attachmentUrl ? "underline" : "none" }}>
                                <span>📎</span> {log.attachment}
                              </div>
                            )}

                            <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{log.date}</span>
                              <span>Condition: {log.condition}</span>
                            </div>
                            {log.telemetry && (
                              <div style={{ fontSize: '9px', color: '#636366', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '0.02em', borderTop: '1px solid #2c2c2e', paddingTop: '4px' }}>
                                [SYS_AUTH] {log.telemetry}
                              </div>
                            )}
                        </div>
                        )) : <div style={{ fontSize: '13px', color: '#86868b', fontStyle: 'italic' }}>No deployment history on record.</div>}
                    </div>
                    </div>

                    <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px' }}>CURRENT STATUS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759', boxShadow: `0 0 10px ${selectedTool.status === 'CHECKED_OUT' ? '#ff9500' : '#34c759'}` }}></span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', letterSpacing: '1px' }}>{selectedTool.status === 'CHECKED_OUT' ? 'DEPLOYED' : 'IN-STOCK'}</span>
                    </div>
                    {selectedTool.status === 'CHECKED_OUT' && (
                        <div style={{ marginTop: '12px', color: '#86868b', fontSize: '14px', lineHeight: '1.5' }}>
                        Assigned to: <strong style={{ color: '#ffffff' }}>{selectedTool.assignedUser}</strong> <br/>
                        Time in field: <strong style={{ color: '#ff9500' }}>{selectedTool.daysOut} {selectedTool.daysOut === 1 ? 'day' : 'days'}</strong>
                        </div>
                    )}
                      {selectedTool.condition !== 'Damaged' && (
                        <button onClick={() => reportDamage(selectedTool.toolId)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ff3b30', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          🚩 REPORT DAMAGE / FAULT
                        </button>
                      )}
                      {userRole === 'ADMIN' && (
                        <>
<button onClick={() => { setEditTool({...selectedTool}); setEditModalOpen(true); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #007aff', backgroundColor: 'transparent', color: '#007aff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: '8px' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#007aff'; e.target.style.color = '#ffffff'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#007aff'; }}>✏️ EDIT ASSET DETAILS</button>
                        <button onClick={() => {
            if (window.confirm('🚨 DECOMMISSION PROTOCOL: Are you sure you want to permanently retire this asset?\n\nIt will be hidden from the active matrix, but its history will be preserved in the Global Audit Ledger.')) {
                setTools(tools.map(t => t.toolId === selectedTool.toolId ? { ...t, status: 'DECOMMISSIONED', condition: 'Decommissioned', history: [{ action: 'Decommissioned', user: 'ADMIN', date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), note: 'Asset permanently written off and retired' }, ...t.history] } : t));
                }
          }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'transparent', color: '#ff3b30', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: '8px' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#ff3b30'; e.target.style.color = '#ffffff'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#ff3b30'; }}>🛑 DECOMMISSION ASSET</button>
</>
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
                            (() => {
                                const isLocked = checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged';
                                const isAdmin = userRole === 'ADMIN';
                                if (isLocked && !isAdmin) return <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#2c2c2e', color: '#636366', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>LOCKED: SERVICE REQUIRED</button>;
                                if (isLocked && isAdmin) return <button onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #ff9500', backgroundColor: 'rgba(255,149,0,0.1)', color: '#ff9500', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>⚠️ ADMIN OVERRIDE: FORCE DISPATCH</button>;
                                return <button onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>CHECK OUT TO EMPLOYEE</button>;
                            })()
                        ) : (
                            <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#1c1c1e', color: '#86868b', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>STATIC TOOL (NON-DISPATCHABLE)</button>
                        )
                    ) : (
                        (userRole === 'ADMIN' || selectedTool.assignedUser === user?.profile?.email) ? (
                            <button onClick={() => { setFlippedCards(prev => ({...prev, [selectedTool.toolId]: true})); }} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>FLIP CARD TO LOG RETURN</button>
                        ) : (
                            <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>🔒 CUSTODY LOCKED TO {selectedTool.assignedUser}</button>
                        )
                    )}
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontStyle: 'italic', fontSize: '14px' }}>No tools match your search.</div>
            )}
          </div>
        </div>
      ) : activeView === 'MAINTENANCE' ? (
        /* MAINTENANCE HUB VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ flex: 1, position: 'relative' }}><input type="text" placeholder="Search Triage & Kanban by Tool ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" /></div></div>
          
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
              <div style={{ color: '#86868b', fontSize: '14px', fontStyle: 'italic' }}>No tools are currently overdue for maintenance.</div>
            )}
          </div>

          <div className="kanban-scroll-wrapper">
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#ffcc00', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS WEEK</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{thisWeekTools.length} Tools Pending</div>
              </div>
              {thisWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
            
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#34c759', fontWeight: '800', letterSpacing: '0.05em' }}>DUE NEXT WEEK</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{nextWeekTools.length} Tools Pending</div>
              </div>
              {nextWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>

            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #3a3a3c', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#007aff', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS MONTH</div>
                <div style={{ fontSize: '14px', color: '#86868b', marginTop: '4px' }}>{thisMonthTools.length} Tools Pending</div>
              </div>
              {thisMonthTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
          </div>

        </div>
      ) : activeView === 'LEDGER' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
        
        {tools.filter(t => t.status === 'CHECKED_OUT' && t.maxCheckoutDays > 0 && t.daysOut > t.maxCheckoutDays).length > 0 && (
          <div style={{ backgroundColor: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffcc00', letterSpacing: '0.05em' }}>LONG-TERM CUSTODY REVIEW</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                <input type="text" placeholder="🔍 Search overdue assets or users..." value={custodySearch} onChange={(e) => setCustodySearch(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '13px', outline: 'none', flex: 1, maxWidth: '250px' }} />
                <select value={custodySort} onChange={(e) => setCustodySort(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                  <option value="daysDesc">Arrange by: Most Overdue</option>
                  <option value="daysAsc">Arrange by: Least Overdue</option>
                  <option value="user">Arrange by: Employee Name</option>
                  <option value="name">Arrange by: Asset Name</option>
                </select>
              </div>
            </div>
            
            <div className="inspector-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '8px' }}>
              {tools.filter(t => t.status === 'CHECKED_OUT' && t.maxCheckoutDays > 0 && t.daysOut > t.maxCheckoutDays)
                .filter(t => !custodySearch || (t.name + ' ' + t.toolId + ' ' + t.assignedUser).toLowerCase().includes(custodySearch.toLowerCase()))
                .sort((a, b) => {
                  if (custodySort === 'daysDesc') return b.daysOut - a.daysOut;
                  if (custodySort === 'daysAsc') return a.daysOut - b.daysOut;
                  if (custodySort === 'user') return (a.assignedUser || '').localeCompare(b.assignedUser || '');
                  if (custodySort === 'name') return a.name.localeCompare(b.name);
                  return 0;
                })
                .map(t => (
                <div key={t.toolId} style={{ backgroundColor: '#121212', border: '1px solid #3a3a3c', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={t.name}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#86868b' }}>[{t.toolId}]</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#ff9500', whiteSpace: 'nowrap' }}>{t.daysOut} / {t.maxCheckoutDays || 14}d</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#d2d2d7' }}>With: <strong style={{ color: '#ffffff' }}>{t.assignedUser}</strong></div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button onClick={(e) => { e.stopPropagation(); alert('Automated email ping sent to ' + t.assignedUser + '.'); }} style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: '1px solid #007aff', color: '#007aff', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>✉️ PING</button>
                    <button onClick={(e) => { e.stopPropagation(); handleReturn(t.toolId); }} style={{ flex: 1, padding: '8px', backgroundColor: '#34c759', border: 'none', color: '#ffffff', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>RETURN</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1c1e', padding: '24px', borderRadius: '16px', border: '1px solid #3a3a3c' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Global Audit Ledger</h2>
              <p style={{ margin: '0', fontSize: '14px', color: '#86868b' }}>Immutable record of all fleet transactions, checkouts, and maintenance logs.</p>
              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="🔍 Search ledger by asset, user, action, condition, or date..." 
                  value={ledgerSearch} 
                  onChange={(e) => setLedgerSearch(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              {selectedLedgerLogs.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#ffcc00', fontWeight: '600' }}>
                  {selectedLedgerLogs.length} specific entry selected for export. <span style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '8px' }} onClick={() => setSelectedLedgerLogs([])}>Clear Selection</span>
                </div>
              )}
            </div>
            <button onClick={async () => {
              const allLogs = tools.flatMap(t => t.history.map(h => ({...h, toolId: t.toolId, toolName: t.name}))).filter(log => !ledgerSearch || Object.values(log).map(v => String(v || '')).join(' ').toLowerCase().includes(ledgerSearch.toLowerCase())).sort((a, b) => {
    if (a.date === 'Just now') return -1;
    if (b.date === 'Just now') return 1;
    
    let valA = a[sortConfig.key] || '';
    let valB = b[sortConfig.key] || '';
    
    // Parse timestamps securely for accurate chronological sorting
    if (sortConfig.key === 'date') {
      valA = new Date(a.date).getTime() || 0;
      valB = new Date(b.date).getTime() || 0;
    }
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
              const logsToExport = selectedLedgerLogs.length > 0 ? allLogs.filter((_, i) => selectedLedgerLogs.includes(i)) : allLogs;

              const payload = {
                  targetEmail: alertPrefs.email,
                  logs: logsToExport.map(l => ({
                      date: l.date,
                      toolName: l.toolName,
                      toolId: l.toolId,
                      user: l.user,
                      action: l.action,
                      condition: l.condition,
                      telemetry: l.telemetry || null,
                      signature: l.signatureUrl || null // The massive Base64 string payload
                  }))
              };

              try {
                  // We will drop your AWS API Gateway URL right here shortly
                  const API_URL = process.env.REACT_APP_API_URL;
                  
                  await fetch(API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
                  
                  console.log("🚀 Payload ready for AWS:", payload);
                  alert('✅ Audit log securely dispatched via AWS SES!');
              } catch(err) {
                  alert('❌ API Export failed.');
              }
            }} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: selectedLedgerLogs.length > 0 ? '#ffcc00' : '#007aff', color: selectedLedgerLogs.length > 0 ? '#121212' : '#ffffff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <span>📤</span> {selectedLedgerLogs.length > 0 ? 'EXPORT SELECTED LOGS' : 'EXPORT ALL LOGS'}
            </button>
          </div>
          <div className="ledger-table-container" style={{ backgroundColor: '#121212', borderRadius: '16px', border: '1px solid #3a3a3c', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 2fr 1fr 1.5fr', minWidth: '900px', gap: '16px', padding: '16px 24px', backgroundColor: '#1c1c1e', borderBottom: '1px solid #3a3a3c', fontSize: '11px', fontWeight: '800', color: '#86868b', letterSpacing: '0.05em', alignItems: 'center' }}>
              <div>
                <input type="checkbox" checked={selectedLedgerLogs.length === tools.reduce((acc, t) => acc + t.history.length, 0) && selectedLedgerLogs.length > 0} onChange={(e) => {
                  const totalCount = tools.reduce((acc, t) => acc + t.history.length, 0);
                  if (e.target.checked) { setSelectedLedgerLogs(Array.from({length: totalCount}, (_, i) => i)); } else { setSelectedLedgerLogs([]); }
                }} style={{ width: '16px', height: '16px', accentColor: '#ffcc00', cursor: 'pointer' }} title="Select All" />
              </div>
              
              <div onClick={() => handleSort('toolName')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#ffffff'} onMouseOut={(e)=>e.target.style.color=''}>ASSET {sortConfig.key === 'toolName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('user')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#ffffff'} onMouseOut={(e)=>e.target.style.color=''}>USER {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('action')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#ffffff'} onMouseOut={(e)=>e.target.style.color=''}>ACTION {sortConfig.key === 'action' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('condition')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#ffffff'} onMouseOut={(e)=>e.target.style.color=''}>CONDITION {sortConfig.key === 'condition' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('date')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#ffffff'} onMouseOut={(e)=>e.target.style.color=''}>TIMESTAMP & TELEMETRY {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
              {tools.flatMap(t => t.history.map(h => ({...h, toolId: t.toolId, toolName: t.name}))).filter(log => !ledgerSearch || Object.values(log).map(v => String(v || '')).join(' ').toLowerCase().includes(ledgerSearch.toLowerCase())).sort((a, b) => {
    if (a.date === 'Just now') return -1;
    if (b.date === 'Just now') return 1;
    
    let valA = a[sortConfig.key] || '';
    let valB = b[sortConfig.key] || '';
    
    // Parse timestamps securely for accurate chronological sorting
    if (sortConfig.key === 'date') {
      valA = new Date(a.date).getTime() || 0;
      valB = new Date(b.date).getTime() || 0;
    }
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }).map((log, i) => (
                <div key={i} onClick={() => setSelectedLedgerLogs(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])} style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 2fr 1fr 1.5fr', minWidth: '900px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #2c2c2e', alignItems: 'center', transition: 'background-color 0.2s', cursor: 'pointer', backgroundColor: selectedLedgerLogs.includes(i) ? 'rgba(255,204,0,0.05)' : 'transparent' }}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedLedgerLogs.includes(i)} onChange={() => setSelectedLedgerLogs(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])} style={{ width: '16px', height: '16px', accentColor: '#ffcc00', cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>{log.toolName}</span><span style={{ fontSize: '12px', color: '#86868b' }}>[{log.toolId}]</span></div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#d2d2d7' }}>{log.user}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '13px', color: '#ffffff' }}>{log.action}</span>{log.note && <span style={{ fontSize: '12px', color: '#ffcc00', fontStyle: 'italic' }}>"{log.note}"</span>}</div>
                  <div><span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: log.condition === 'Damaged' ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.05)', color: log.condition === 'Damaged' ? '#ff3b30' : '#d2d2d7' }}>{log.condition}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '13px', color: '#86868b' }}>{log.date}</span>{log.telemetry && <span style={{ fontSize: '9px', color: '#636366', fontFamily: 'monospace' }}>{log.telemetry.split(' | ')[0]}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {bulkSelectedTools.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#1c1c1e', borderTop: '1px solid #3a3a3c', padding: '20px 40px', zIndex: 5000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{bulkSelectedTools.length} Tools Selected</span>
            <span style={{ fontSize: '13px', color: '#86868b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setBulkSelectedTools([])}>Clear Selection</span>
          </div>
          <button onClick={logBulkService} style={{ padding: '16px 32px', backgroundColor: '#34c759', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(52,199,89,0.3)' }}>
            LOG BULK PM SERVICE
          </button>
        </div>
      )}

      
      {/* EDIT ASSET MODAL */}
      {editModalOpen && editTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: "85vh", overflowY: "auto", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "16px", border: "1px solid #3a3a3c", width: "800px", maxWidth: "90%", color: "#ffffff", boxSizing: "border-box" }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Edit Asset: {editTool.toolId}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', marginTop: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET NAME</label>
                  <input type="text" value={editTool.name || ''} onChange={(e) => setEditTool({...editTool, name: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE ($)</label>
                  <input type="number" value={editTool.value || 0} onChange={(e) => setEditTool({...editTool, value: Number(e.target.value)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>CATEGORY</label>
                  <input type="text" value={editTool.category || ''} onChange={(e) => setEditTool({...editTool, category: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>LOCATION</label>
                  <input type="text" value={editTool.location || ''} onChange={(e) => setEditTool({...editTool, location: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SERIAL / VIN</label>
                  <input type="text" value={editTool.serial || ''} onChange={(e) => setEditTool({...editTool, serial: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>MAX CUSTODY (0 = NO LIMIT)</label>
                  <input type="number" value={editTool.maxCheckoutDays === undefined ? '' : editTool.maxCheckoutDays} onChange={(e) => setEditTool({...editTool, maxCheckoutDays: e.target.value === '' ? '' : Number(e.target.value)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <input type="text" value={editTool.link || ''} onChange={(e) => setEditTool({...editTool, link: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>PM ALERT (DAYS)</label>
                  <input type="number" value={editTool.pmInterval || (editTool.metrics?.find(m => m.unit === 'Days')?.interval || 90)} onChange={(e) => setEditTool({...editTool, pmInterval: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION OVERRIDE</label>
                  <select value={editTool.condition || 'New'} onChange={(e) => setEditTool({...editTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                    <option value="New">New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Requires Maintenance">Requires Maintenance</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>
  
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c', flex: 1 }}>
                  <input type="checkbox" checked={editTool.isDispatchable !== false} onChange={(e) => setEditTool({...editTool, isDispatchable: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#34c759', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>Enable Field Checkout</span>
                    <span style={{ fontSize: '11px', color: '#86868b' }}>If disabled, this tool will be permanently locked to its home location.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,204,0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,204,0,0.3)', flex: 1 }}>
                  <input type="checkbox" checked={editTool.isSpecialty || false} onChange={(e) => setEditTool({...editTool, isSpecialty: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#ffcc00', fontWeight: '700' }}>Specialty / High-Value</span>
                    <span style={{ fontSize: '11px', color: '#86868b' }}>Enforces physical manifest audit upon return.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setEditModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                  
                  let finalInterval = editTool.pmInterval ? Number(editTool.pmInterval) : null;
                  const updated = {
                    ...editTool, 
                    maxCheckoutDays: editTool.maxCheckoutDays === '' || editTool.maxCheckoutDays === undefined ? 14 : Number(editTool.maxCheckoutDays),
                    metrics: editTool.metrics.map(m => (m.unit === 'Days' && finalInterval) ? { ...m, interval: finalInterval } : m)
                  };
                  setTools(prev => prev.map(t => t.toolId === updated.toolId ? updated : t));
                  syncDB(updated); // Flushes the exact edit straight back to AWS DynamoDB
                  setEditModalOpen(false);
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}
  
      {/* INGEST TOOL MODAL */}
      {addModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: "85vh", overflowY: "auto", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "16px", border: "1px solid #3a3a3c", width: "800px", maxWidth: "90%", color: "#ffffff", boxSizing: "border-box" }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.02em' }}>Ingest New ASSET</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>REGISTER ASSETS.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>BRAND (Single OR EMP KIT)</label>
                  <input 
                    list="prefix-options"
                    placeholder="e.g. MILW, CAT, JD"
                    value={newTool.prefix} 
                    onChange={(e) => setNewTool({...newTool, prefix: e.target.value.toUpperCase()})} 
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}
                  />
                  <datalist id="prefix-options">
                    <option value="KIT">Standard Employee Kit</option>
                    <option value="VEH">Vehicle</option>
                    <option value="HVAC">Climate Control</option>
                    <option value="MILW">Milwaukee</option>
                    <option value="DWLT">DeWalt</option>
                    <option value="HILT">Hilti</option>
                    <option value="MAKI">Makita</option>
                    <option value="BSCH">Bosch</option>
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>{newTool.prefix?.toUpperCase() === "KIT" ? "NAME: KIT DESCRIPTION" : "ASSET NAME / MODEL"}</label>
                  <input type="text" placeholder="e.g. Ford F-150 Fleet Truck" value={newTool.name} onChange={(e) => setNewTool({...newTool, name: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION</label>
                  <select value={newTool.condition} onChange={(e) => setNewTool({...newTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET / TOOL CLASS / CATEGORY</label>
                  <input list="category-options" placeholder={newTool.prefix?.toUpperCase() === "KIT" ? "Auto-assigned" : "e.g. HVAC, Power Tool"} value={newTool.prefix?.toUpperCase() === "KIT" ? "Standard Kit" : newTool.category} disabled={newTool.prefix?.toUpperCase() === "KIT"} onChange={(e) => setNewTool({...newTool, category: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none', opacity: newTool.prefix?.toUpperCase() === "KIT" ? 0.5 : 1 }} />
                  <datalist id="category-options">
                    <option value="Power Tool">Power Tool</option>
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="HVAC Equipment">HVAC</option>
                    <option value="Plumbing Fixture">Plumbing</option>
                    <option value="Fleet Vehicle">Fleet Vehicle</option>
                    <option value="IT Equipment">IT Equipment</option>
                  </datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>HOME LOCATION / ZONE / EMP TITLE</label>
                  <input list="location-options" placeholder="e.g. Roof, Lot B" value={newTool.location} onChange={(e) => setNewTool({...newTool, location: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                  <datalist id="location-options">
                    <option value="Main Tool Crib">Main Tool Crib</option>
                    <option value="Fleet Lot A">Fleet Lot A</option>
                    <option value="Roof Deck">Roof Deck</option>
                    <option value="Basement Utility">Basement Utility</option>
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>{newTool.prefix?.toUpperCase() === "KIT" ? "SERIAL NUMBERS (COMMA SEPARATED)" : "SERIAL NUMBER / VIN"}</label>
                  <input type="text" placeholder="e.g. 1FTEW1E49K..." value={newTool.serial} onChange={(e) => setNewTool({...newTool, serial: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <input type="text" placeholder="e.g. https://..." value={newTool.link} onChange={(e) => setNewTool({...newTool, link: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              {newTool.prefix?.toUpperCase() === 'KIT' && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#ff9500', fontWeight: '800', letterSpacing: '0.05em' }}>RAPID ASSIGN TO EMPLOYEE (OPTIONAL)</label>
                  <input type="text" placeholder="e.g. Sarah Connor (Leave blank to ingest to Tool Crib)" value={newTool.assignee || ''} onChange={(e) => setNewTool({...newTool, assignee: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,149,0,0.5)', backgroundColor: 'rgba(255,149,0,0.08)', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                  {newTool.assignee && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #ff9500' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#d2d2d7', cursor: 'pointer', lineHeight: '1.4' }}>
                        <input type="checkbox" checked={ingestTerms} onChange={(e) => setIngestTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ff9500', marginTop: '2px' }} />
                        I acknowledge receipt of this standard kit and accept full responsibility for its condition.
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: ingestTerms ? 1 : 0.4, pointerEvents: ingestTerms ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: '#ff9500', fontWeight: '800', letterSpacing: '0.05em' }}>DRAW SIGNATURE</label>
                          <button onClick={(e) => { e.preventDefault(); sigPad.current?.clear(); sigPad.current?.on();; }} type="button" style={{ background: 'transparent', border: 'none', color: '#ffcc00', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>CLEAR PAD</button><button onClick={(e) => { e.preventDefault(); sigPad.current?.off(); }} type="button" style={{ background: 'transparent', border: 'none', color: '#34c759', fontSize: '11px', cursor: 'pointer', fontWeight: '700', marginLeft: '16px' }}>LOCK PAD</button>
                        </div>
                        <div style={{ border: '1px solid #3a3a3c', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                          <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'sigCanvas', style: { width: '100%', height: '150px', touchAction: 'none' }}} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,149,0,0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(255,149,0,0.3)', marginTop: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <label style={{ fontSize: '11px', color: '#ff9500', fontWeight: '800', letterSpacing: '0.05em' }}>KIT MANIFEST PHOTO</label>
                           <span style={{ fontSize: '11px', color: '#86868b' }}>Attach a photo of the complete kit contents.</span>
                        </div>
                        <label htmlFor="ingest-photo" style={{ padding: '8px 16px', borderRadius: '6px', border: ingestPhoto ? '1px solid #34c759' : '1px solid #ff9500', color: ingestPhoto ? '#34c759' : '#ff9500', cursor: 'pointer', fontSize: '11px', fontWeight: '800', backgroundColor: ingestPhoto ? 'rgba(52,199,89,0.1)' : 'transparent', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                          {ingestPhoto ? '✅ ' + ingestPhoto.name : '📷 UPLOAD PHOTO'}
                        </label>
                        <input type="file" id="ingest-photo" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files[0]) setIngestPhoto(e.target.files[0]); }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SET PM METRIC</label>
                  <select value={newTool.pmMetric} disabled style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#1c1c1e', color: '#86868b', fontSize: '15px', outline: 'none', cursor: 'not-allowed', WebkitAppearance: 'none' }}>
                    <option value="Days">Days</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>SET PM ALERT (DAYS)</label>
                  <input type="number" placeholder="e.g. 90, 5000" value={newTool.pmInterval} onChange={(e) => setNewTool({...newTool, pmInterval: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>MAX CUSTODY (0 = NO LIMIT)</label>
                  <input type="number" placeholder="0 = No Limit" value={newTool.maxCheckoutDays === undefined ? '' : newTool.maxCheckoutDays} onChange={(e) => setNewTool({...newTool, maxCheckoutDays: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <input type="text" value={editTool.link || ''} onChange={(e) => setEditTool({...editTool, link: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>PM ALERT (DAYS)</label>
                  <input type="number" value={editTool.pmInterval || (editTool.metrics?.find(m => m.unit === 'Days')?.interval || 90)} onChange={(e) => setEditTool({...editTool, pmInterval: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION OVERRIDE</label>
                  <select value={editTool.condition || 'New'} onChange={(e) => setEditTool({...editTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
                    <option value="New">New</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Requires Maintenance">Requires Maintenance</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>
  
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'stretch' }}>
              <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c', flex: 1 }}>
                <input type="checkbox" id="dispatchableToggle" checked={(newTool.prefix?.toUpperCase() === 'KIT' && newTool.assignee) ? true : newTool.isDispatchable} onChange={(e) => setNewTool({...newTool, isDispatchable: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#34c759', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="dispatchableToggle" style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}>Enable Field Checkout</label>
                  <span style={{ fontSize: '11px', color: '#86868b' }}>If disabled, this tool will be permanently locked to its home location.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,204,0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,204,0,0.3)', flex: 1 }}>
                <input type="checkbox" id="specialtyToggle" checked={newTool.isSpecialty} onChange={(e) => setNewTool({...newTool, isSpecialty: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#ffcc00', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {newTool.prefix?.toUpperCase() !== 'KIT' && (
              <label htmlFor="specialtyToggle" style={{ fontSize: '14px', color: '#ffcc00', fontWeight: '700', cursor: 'pointer' }}>Specialty / High-Value</label>
            )}
                  <span style={{ fontSize: '11px', color: '#86868b' }}>Enforces physical manifest audit upon return.</span>
                </div>
              </div>
            </div>

            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => { setAddModalOpen(false); setIngestTerms(false); setIngestPhoto(null); setNewTool({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '14', isDispatchable: true, isSpecialty: false, assignee: '' }); if(sigPad.current) sigPad.current.clear(); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setConfirmIngestOpen(true)} disabled={(!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: ((!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value) ? 0.4 : 1 }}>ADD TO INVENTORY</button>
            </div>
          </div>
        </div>
      )}

      
      {/* CONFIRM INGEST MODAL */}
      {confirmIngestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #ffcc00', width: '600px', maxWidth: '90%', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(255, 204, 0, 0.2)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffcc00' }}>Confirm Asset Details</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Please review the entered information before committing to the database.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#121212', padding: '20px', borderRadius: '12px', border: '1px solid #3a3a3c', marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>BRAND / PREFIX</span><div style={{ fontSize: '15px' }}>{newTool.prefix || 'N/A'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>VALUE</span><div style={{ fontSize: '15px', color: '#34c759' }}>${newTool.value || '0'}</div></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>ASSET NAME</span><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{newTool.name || 'Standard Kit'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>CONDITION</span><div style={{ fontSize: '15px' }}>{newTool.condition}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>CATEGORY</span><div style={{ fontSize: '15px' }}>{newTool.category || 'General'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>LOCATION</span><div style={{ fontSize: '15px' }}>{newTool.location || 'Unassigned'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>SERIAL / VIN</span><div style={{ fontSize: '15px', fontFamily: 'monospace' }}>{newTool.serial || 'N/A'}</div></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>LINK</span><div style={{ fontSize: '15px', color: '#007aff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newTool.link || 'None'}</div></div>
                
                <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #3a3a3c', margin: '8px 0' }}></div>
                
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>PM METRIC</span><div style={{ fontSize: '15px' }}>{newTool.pmMetric}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>PM INTERVAL</span><div style={{ fontSize: '15px' }}>{newTool.pmInterval || '90'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#86868b', fontWeight: '700' }}>MAX CUSTODY</span><div style={{ fontSize: '15px' }}>{newTool.maxCheckoutDays == 0 ? 'No Limit' : (newTool.maxCheckoutDays || '14') + ' Days'}</div></div>
                
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: newTool.isDispatchable ? '#34c759' : '#ff3b30' }}>{newTool.isDispatchable ? '✅' : '❌'}</span>
                    <span style={{ fontSize: '13px' }}>Dispatchable</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: newTool.isSpecialty ? '#ffcc00' : '#86868b' }}>{newTool.isSpecialty ? '✅' : '❌'}</span>
                    <span style={{ fontSize: '13px' }}>Specialty / High-Value</span>
                  </div>
                </div>
                
                {newTool.assignee && (
                  <>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #3a3a3c', margin: '8px 0' }}></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#ff9500', fontWeight: '800' }}>RAPID ASSIGNMENT TO:</span><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9500' }}>{newTool.assignee}</div></div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmIngestOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>Edit / Go Back</button>
              <button onClick={() => { setConfirmIngestOpen(false); handleAddTool(); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#ffcc00', color: '#121212', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>CONFIRM & SUBMIT</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK INGEST MODAL */}
      {bulkModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: "85vh", overflowY: "auto", backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '800px', maxWidth: '90%', color: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Bulk Ingest Assets (CSV)</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Upload a standard CSV file to rapidly deploy multiple tools into the matrix.</p>
            
            {!csvData.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', border: '2px dashed #3a3a3c', borderRadius: '12px', backgroundColor: '#121212', cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => document.getElementById('csv-upload').click()}>
                    <span style={{ fontSize: '32px', marginBottom: '16px' }}>📄</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Click to Browse or Drag CSV Here</span>
                    <span style={{ fontSize: '13px', color: '#86868b', marginTop: '8px' }}>Expected columns: prefix, name, value, category, location</span>
                    <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const text = event.target.result;
                                const lines = text.split('\n').filter(l => l.trim().length > 0);
                                if(lines.length > 1) {
                                    // Strip weird characters from headers
                                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
                                    const parsed = lines.slice(1).map(line => {
                                        const values = line.split(',');
                                        let obj = {};
                                        headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : '');
                                        return obj;
                                    });
                                    setCsvData(parsed);
                                } else {
                                    alert('CSV appears empty or invalid.');
                                }
                            };
                            reader.readAsText(file);
                        }
                    }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#34c759' }}>✅ {csvData.length} records parsed and staged for review</span>
                            <button onClick={() => setCsvData([])} style={{ background: 'transparent', border: 'none', color: '#ff3b30', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}>✕ CLEAR & RESTART</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #2c2c2e', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2c2c2e' }}>
                                    <tr>
                                        {Object.keys(csvData[0]).map((key, i) => <th key={i} style={{ padding: '10px 12px', borderBottom: '1px solid #3a3a3c', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.slice(0, 50).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #2c2c2e', backgroundColor: i % 2 === 0 ? '#1c1c1e' : '#121212' }}>
                                            {Object.values(row).map((val, j) => <td key={j} style={{ padding: '10px 12px', color: '#d2d2d7' }}>{val}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {csvData.length > 50 && <div style={{ fontSize: '11px', color: '#86868b', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>Showing first 50 records...</div>}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setBulkModalOpen(false); setCsvData([]); setIsUploading(false); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button disabled={!csvData.length || isUploading} onClick={async () => {
                  setIsUploading(true);
                  const newTools = [];
                  for (const row of csvData) {
                      const idNum = String(Math.floor(Math.random() * 900) + 100);
                      const prefix = (row.prefix || 'GEN').toUpperCase().substring(0, 4);
                      const generatedId = prefix + '-' + idNum;
                      
                      const newToolObj = {
                          toolId: generatedId,
                          name: row.name || 'Imported Tool',
                          value: parseInt(row.value) || 0,
                          category: row.category || 'General',
                          location: row.location || 'Main Tool Crib',
                          serial: row.serial || 'N/A',
                          link: '',
                          isDispatchable: true,
                          isSpecialty: false,
                          status: "AVAILABLE",
                          condition: "New",
                          assignedUser: null,
                          daysOut: 0,
                          metrics: [{ unit: 'Days', current: 0, interval: 90 }],
                          history: [{ user: "Admin", action: "Bulk CSV Ingestion", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: "New" }]
                      };
                      newTools.push(newToolObj);
                      await syncDB(newToolObj);
                      // Add a tiny 25ms delay to prevent throttling DynamoDB write capacity
                      await new Promise(r => setTimeout(r, 25)); 
                  }
                  setTools(prev => [...newTools, ...prev]);
                  setIsUploading(false);
                  setCsvData([]);
                  setBulkModalOpen(false);
                  alert(newTools.length + " tools successfully ingested to the fleet matrix!");
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#ffcc00', color: '#121212', fontWeight: '800', fontSize: '14px', cursor: 'pointer', opacity: (!csvData.length || isUploading) ? 0.4 : 1, transition: 'all 0.2s' }}>
                  {isUploading ? 'INGESTING TO AWS CLOUD...' : 'PUSH BATCH TO DATABASE'}
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* RAPID DISPATCH MODAL */}
      {checkoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto',  width: '500px', maxWidth: '90%', backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', color: '#ffffff' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Dispatch Tool</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Transferring custody of <strong style={{color: '#ffcc00'}}>[{selectedTool?.toolId}]</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>EMPLOYEE / TECH NAME</label>
        <select value={dispatchUser} onChange={(e) => setDispatchUser(e.target.value)} disabled={userRole === 'TECH'} style={{ padding: '14px', borderRadius: '8px', border: userRole === 'TECH' ? '1px solid #34c759' : '1px solid #3a3a3c', backgroundColor: userRole === 'TECH' ? 'rgba(52,199,89,0.05)' : '#121212', color: userRole === 'TECH' ? '#34c759' : '#ffffff', fontSize: '15px', outline: 'none', cursor: userRole === 'TECH' ? 'not-allowed' : 'pointer', WebkitAppearance: 'none', width: '100%' }}>
          <option value="" disabled>Select Authorized Personnel...</option>
          {personnel.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
          {(userRole === 'TECH' || (dispatchUser && !personnel.includes(dispatchUser))) && (
            <option value={dispatchUser}>{dispatchUser}</option>
          )}
        </select>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
          <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TOOL CONDITION</label>
          <select value={dispatchCondition} onChange={(e) => setDispatchCondition(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }}>
            <option value="New">New</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Damaged">Damaged / Missing Parts</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
          <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>DISPATCH NOTES</label>
          <input type="text" placeholder="e.g. Scratched case, missing battery..." value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#ffffff', fontSize: '15px', outline: 'none' }} />
        </div>
      </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#121212', padding: '16px', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#d2d2d7', cursor: 'pointer', lineHeight: '1.4' }}>
                  <input type="checkbox" checked={dispatchTerms} onChange={(e) => setDispatchTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#34c759', marginTop: '2px' }} />
                  I acknowledge receipt of this asset and accept full responsibility for its condition and return.
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: dispatchTerms ? 1 : 0.4, pointerEvents: dispatchTerms ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>DRAW SIGNATURE</label>
                    <button onClick={() => { sigPad.current?.clear(); sigPad.current?.on(); }} style={{ background: 'transparent', border: 'none', color: '#ffcc00', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>CLEAR PAD</button><button onClick={(e) => { e.preventDefault(); sigPad.current?.off(); }} type="button" style={{ background: 'transparent', border: 'none', color: '#34c759', fontSize: '11px', cursor: 'pointer', fontWeight: '700', marginLeft: '16px' }}>LOCK PAD</button>
                  </div>
                  <div style={{ border: '1px solid #3a3a3c', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                    <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'sigCanvas', style: { width: '100%', height: '150px', touchAction: 'none' }}} />
                  </div>
                </div>
              </div>
              </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => { setCheckoutModalOpen(false); setDispatchUser(""); setDispatchCondition("Excellent"); setDispatchNotes(""); setDispatchTerms(false); if(sigPad.current) sigPad.current.clear(); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCheckout} disabled={!dispatchUser.trim() || !dispatchTerms} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#34c759', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: (dispatchUser.trim() && dispatchTerms) ? 1 : 0.4 }}>AUTHORIZE</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS MODAL */}
      {alertsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto',  backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '500px', maxWidth: '90%', color: '#ffffff' }}>
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
                  Tool Flagged as Damaged 🚩
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyOverdue} onChange={(e) => setAlertPrefs({...alertPrefs, notifyOverdue: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#ffcc00' }} />
                  PM Service Interval Overdue 🛑
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyNew} onChange={(e) => setAlertPrefs({...alertPrefs, notifyNew: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#34c759' }} />
                  New Tool Ingested 📦
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: 'transparent', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>SAVE PREFERENCES</button>
            </div>
          </div>
        </div>
      )}
    
      {/* RETURN AUDIT MODAL */}
      {returnModalOpen && selectedTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto',  backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '500px', maxWidth: '90%', color: '#ffffff' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#ffcc00', letterSpacing: '-0.02em' }}>Audit Required</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Confirm the manifest for high-value tool <strong style={{color: '#ffffff'}}>[{selectedTool.toolId}]</strong></p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {Object.keys(returnChecklist).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: returnChecklist[key] ? '#34c759' : '#ffffff', cursor: 'pointer', padding: '16px', backgroundColor: '#121212', borderRadius: '8px', border: returnChecklist[key] ? '1px solid #34c759' : '1px solid #3a3a3c', margin: 0, fontWeight: '600' }}>
                  <input type="checkbox" checked={returnChecklist[key]} onChange={(e) => setReturnChecklist({...returnChecklist, [key]: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: '#34c759', margin: 0 }} />
                  {key === 'primary' ? 'Primary Tool Body' : key === 'battery' ? 'Battery / Power Unit' : 'All Provided Accessories'}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto',  backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '800px', maxWidth: '90%', color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>Fleet Financial Summary</h2>
                <p style={{ margin: '0', fontSize: '14px', color: '#86868b' }}>Capital expenditure and current deployment valuation.</p>
              </div>
              <button onClick={() => setFinanceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #3a3a3c', flexDirection: 'row' }}>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#86868b', fontWeight: '700', letterSpacing: '0.05em' }}>TOTAL FLEET TOOL VALUE</span>
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


      {/* OPERATIONS GUIDE MODAL */}
      {guideModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#1c1c1e', padding: '32px', borderRadius: '16px', border: '1px solid #3a3a3c', width: '600px', maxWidth: '90%', color: '#ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>Kinetic Tools Operations Guide</h2>
              </div>
              <button onClick={() => setGuideModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.6', color: '#d2d2d7' }}>
              
              <div style={{ backgroundColor: '#121212', padding: '20px', borderRadius: '12px', border: '1px solid #3a3a3c' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ffcc00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>👷 FIELD TECHNICIAN PROTOCOLS</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong style={{color: '#ffffff'}}>🔍 Locating Equipment:</strong> Use the search bar in the <em>FLEET DISPATCH</em> view to instantly find a specific tool by its ID, Tag, or Category.</li>
                  <li><strong style={{color: '#ffffff'}}>📦 Checking Tools Out/In:</strong> When taking a tool to the field, click <em>CHECK OUT</em>. When returning it to the crib, click <em>RETURN</em> to clear your liability and mark it IN-STOCK.</li>
                  <li><strong style={{color: '#ffffff'}}>⚠️ Reporting Damage:</strong> If a tool is broken or missing components upon return, click <em>REPORT DAMAGE / FAULT</em> so the Admin team knows to pull it for maintenance.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#121212', padding: '20px', borderRadius: '12px', border: '1px solid #3a3a3c' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#007aff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>👨‍💻 ADMINISTRATOR PROTOCOLS</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong style={{color: '#ffffff'}}>📥 Ingesting Inventory:</strong> Use <em>+ SINGLE</em> to manually create a profile for a newly purchased tool, or <em>+ BULK CSV</em> to upload an entire pallet.</li>
                  <li><strong style={{color: '#ffffff'}}>🛠️ Maintenance Hub:</strong> Track preventative maintenance (PM) schedules. See what tools are due for service, log repairs, and reset their service timers.</li>
                  <li><strong style={{color: '#ffffff'}}>📜 Master Ledger:</strong> View the complete history of every tool checkout, return, and status change across the entire company.</li>
                  <li><strong style={{color: '#ffffff'}}>🔔 Alerts & 📊 Finance:</strong> Configure your automatic AWS email routing for offline/missing tools, and monitor the real-time financial depreciation of the active fleet.</li>
                </ul>
              </div>

            </div>
            
            <button onClick={() => setGuideModalOpen(false)} style={{ width: '100%', padding: '14px', marginTop: '24px', borderRadius: '8px', border: 'none', backgroundColor: '#3a3a3c', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Close Guide</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tools;
