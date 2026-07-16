import { docClient } from './dynamoClient';
import { ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import SignatureCanvas from 'react-signature-canvas';
import React, { useEffect,  useState, useMemo } from 'react';
import { uploadData, getUrl } from "aws-amplify/storage";

// Lightweight Image Compression (HTML5 Canvas)
const compressImage = (file, maxWidth = 1024, quality = 0.6) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          let cleanName = file.name.replace(/\.[^/.]+$/, "");
          // Truncate massively long file names to keep the UI clean
          if (cleanName.length > 15) {
            cleanName = cleanName.substring(0, 12) + '...';
          }
          resolve(new File([blob], cleanName + ".jpg", { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', quality);
      };
    };
  });
};

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


// NLP Ingest Engine for Smart Manifests
const generateSmartManifest = (id, name, category) => {
  const lowerName = (name || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();
  const prefix = id ? id.split('-')[0] : '';

  if (prefix === 'VEH' || prefix === 'BMW' || prefix === 'FORD' || lowerCat.includes('vehicle') || lowerName.includes('truck') || lowerName.includes('car') || lowerName.includes('m5'))
    return ['Ignition Keys / Fob', 'Registration & Insurance', 'Clean Interior / Exterior'];
  if (prefix === 'TECH' || lowerCat.includes('it equipment') || lowerName.includes('laptop') || lowerName.includes('camera') || lowerName.includes('switch'))
    return ['Primary Device', 'Power / Comm Cables', 'Protective Case'];
  if (prefix === 'SURV' || lowerName.includes('leica') || lowerName.includes('station'))
    return ['Primary Optic Unit', 'Tripod / Mount', 'Calibration Certificate'];
  if (prefix === 'MILW' || prefix === 'DWLT' || prefix === 'HILT' || prefix === 'MAKI' || lowerCat.includes('power tool'))
    return ['Primary Tool Body', 'Battery / Power Unit', 'Accessories / Bits'];
  if (id && id.startsWith('KIT'))
    return ['Hard Hat & Safety Glasses', '25ft Tape Measure', 'Multi-tool', 'Safety Vest'];

  return ['Primary Body', 'Key Component / Battery', 'Accessories']; // Fallback
};

function Tools({ user }) {
  const getDisplayStatus = (item) => (item?.isStatic && item?.status === 'IN-STOCK') ? 'OPERATIONAL' : (item?.status || 'IN-STOCK');


  const fetchDB = async () => {
    // 🚧 LOCALHOST BYPASS: Stop AWS from crashing the initial page load
    if (window.location.hostname === 'localhost') {
      console.log('🛠️ LOCAL DEV MODE: Bypassed AWS DynamoDB fetch. Starting with empty local inventory.');
      return;
    }
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
  // 🚧 ABSOLUTE LOCALHOST OVERRIDE: Stop AWS dead in its tracks
  if (window.location.hostname === 'localhost') {
    console.log('🛠️ LOCAL DEV: Bypassed AWS PutCommand successfully.');
    return true;
  }
  try {
    await docClient.send(new PutCommand({ TableName: 'KineticToolsData', Item: item }));
    return true;
  } catch (err) {
    console.error("DB Sync Error:", err);
    alert("AWS Database Sync Failed: " + (err?.message || err));
    return false;
  }
};

  const deleteTool = async (toolId) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ${toolId} from the database? This cannot be undone.`)) return;
    try {
      setTools(prev => prev.filter(t => t.toolId !== toolId)); setSelectedToolId(null); await docClient.send(new DeleteCommand({ TableName: 'KineticToolsData', Key: { toolId } }));
    } catch (err) { console.error("Delete Error:", err); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { 
      fetchDB(); 
      if (window.location.search.includes('code=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, []);

  const [inventory] = useState({ 'HVAC': [{ item: '24x24x2 Pleated Air Filter', stock: 45 }, { item: 'R-410A Refrigerant (lbs)', stock: 12 }], 'MILW': [{ item: 'M18 REDLITHIUM 5.0Ah Battery', stock: 22 }, { item: 'Press Tool Jaw Grease', stock: 6 }], 'VEH': [{ item: '5W-30 Synthetic Oil (Qts)', stock: 32 }, { item: 'Wiper Fluid (Gal)', stock: 14 }] });
  const [tools, setTools] = useState([]);

  const [dismissedTips, setDismissedTips] = useState(() => JSON.parse(localStorage.getItem('kinetic_tips') || '{}'));
  const dismissTip = (tip) => { const next = {...dismissedTips, [tip]: true}; setDismissedTips(next); localStorage.setItem('kinetic_tips', JSON.stringify(next)); };

  const resetTour = () => { 
    if(window.confirm("Restart the Kinetic Operations Assistant? This will reset all tooltips and guides.")) { 
      setTutorialStep(1); 
      localStorage.setItem('kinetic_tour', 1); 
      setDismissedTips({}); 
      localStorage.removeItem('kinetic_tips'); 
    } 
  };

  const [tutorialStep, setTutorialStep] = useState(() => { const saved = localStorage.getItem('kinetic_tour'); return saved ? parseInt(saved) : 0; });
  const nextTourStep = (step) => { setTutorialStep(step); localStorage.setItem('kinetic_tour', step); };
  const endTour = () => { setTutorialStep(-1); localStorage.setItem('kinetic_tour', -1); };
  React.useEffect(() => { if (tools.length === 0 && tutorialStep === 0) nextTourStep(1); }, [tools.length]);
  
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
    const fetchEnterpriseRoster = async () => {
       if (window.location.hostname === 'localhost') {
           console.log("🛠️ LOCAL DEV MODE: Using mocked enterprise directory (Sarah Connor, Tony Stark, etc).");
           return; // Keeps the default fictional roster in state
       }
       try {
           // TO DO: Import 'API' and 'graphqlOperation' from 'aws-amplify' when enabling this!
           // const users = await API.graphql(graphqlOperation(listUsers));
           // const fetchedNames = users.data.listUsers.items.map(u => u.fullName).sort();
           // if (fetchedNames.length > 0) setPersonnel(fetchedNames);
           console.log("🚀 PRODUCTION: Ready to fetch enterprise roster!");
       } catch (err) {
           console.error("Failed to fetch user directory", err);
       }
    };
    fetchEnterpriseRoster();
  }, []);

  const [dispatchUser, setDispatchUser] = useState("");
  const [dispatchCondition, setDispatchCondition] = useState("Excellent");
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [dispatchProject, setDispatchProject] = useState("");
  const [dispatchTerms, setDispatchTerms] = useState(false);
  const [dispatchPhoto, setDispatchPhoto] = useState(null);
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
    notifyNew: false,
    notifyCustody: true,
    notifyHighValue: false,
    notifyLowStock: true
  });
  const [newTool, setNewTool] = useState({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '0', isDispatchable: true, isSpecialty: false });
  
  
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
    if (!newTool.prefix || (!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value) { alert('Validation Error: Core asset details missing. Please fill out the Brand and Value.'); return; }
    
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
      link: newTool.link || 'N/A',
      isDispatchable: newTool.prefix?.toUpperCase() === 'KIT' ? true : newTool.isDispatchable,
      isSpecialty: newTool.isSpecialty,
      status: newTool.assignee ? "CHECKED_OUT" : "AVAILABLE",
      condition: newTool.condition,
      assignedUser: newTool.assignee || null,
      daysOut: 0,
      metrics: [{ unit: newTool.pmMetric, current: 0, interval: parseInt(newTool.pmInterval) || 90 }], maxCheckoutDays: (newTool.maxCheckoutDays === '' || newTool.maxCheckoutDays === undefined) ? 0 : parseInt(newTool.maxCheckoutDays),
      history: newTool.assignee ? [{ user: newTool.assignee, action: "Auto-Dispatched during ingestion" + (isKit ? " | E-Signed" : ""), ...(ingestSigData && { signatureUrl: ingestSigData }), ...(ingestPhotoUrl && { attachmentUrl: ingestPhotoUrl, attachment: ' Kit Manifest: ' + ingestPhotoName }), date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }, { user: "Admin", action: "Tool Ingested to Database", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }] : [{ user: "Admin", action: "Tool Ingested to Database", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: newTool.condition }]
    };
    
    const isDbSuccess = await syncDB(newToolObj);
    if (!isDbSuccess) return; // 🛑 Halt the UI update if AWS rejects it!
    setTools(prev => [newToolObj, ...prev]);
    setAddModalOpen(false);
    setNewTool({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '0', isDispatchable: true, isSpecialty: false, assignee: '' });
    setIngestTerms(false);
    setIngestPhoto(null);
    if (sigPad.current) sigPad.current.clear();
    setSelectedToolId(generatedId);
    setActiveView('DISPATCH');
      
    // 🤖 ASYNCHRONOUS AI WORKER (LIVE AWS BEDROCK)
    setTimeout(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      try {
        console.log("🚀 Firing AI request to AWS Bedrock for " + generatedId + "...");
        const res = await fetch("https://fbniarej2hy3gazti3l7mnnlsi0hpukv.lambda-url.us-east-2.on.aws/", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand: newTool.prefix, model: newTool.name || 'Standard Unit' }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const aiData = await res.json();
        setTools(currentTools => {
          const toolToUpdate = currentTools.find(t => t.toolId === generatedId);
          if (!toolToUpdate) return currentTools;
          const aiUpdate = {
            ...toolToUpdate,
            pmChecklist: aiData.pmChecklist || generateSmartChecklist(generatedId, newTool.name),
            customManifest: aiData.manifest || generateSmartManifest(generatedId, newTool.name, newTool.category)
          };
          syncDB(aiUpdate);
          console.log("✅ AWS Processing Complete for " + generatedId);
          return currentTools.map(t => t.toolId === generatedId ? aiUpdate : t);
        });
      } catch(err) {
        clearTimeout(timeoutId);
        console.error("❌ AI Fetch Failed:", err);
        alert(`AI Generation Failed for ${generatedId}: ${err.name === 'AbortError' ? 'Request timed out after 45 seconds.' : err.message}`);
      }
    }, 100);
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
    let dispatchPhotoUrl = null;
    let dispatchPhotoName = null;
    if (dispatchPhoto) {
      try {
        const uploadedFilename = `DISPATCH-${selectedToolId}-${Date.now()}-${dispatchPhoto.name.replace(/\s+/g, '_')}`;
        await uploadData({
          path: `public/service-logs/${uploadedFilename}`,
          data: dispatchPhoto,
          options: { contentType: dispatchPhoto.type }
        }).result;
        const link = await getUrl({ path: `public/service-logs/${uploadedFilename}` });
        dispatchPhotoUrl = link.url.toString();
        dispatchPhotoName = dispatchPhoto.name;
      } catch (err) { console.error("Dispatch Photo Upload Failed:", err); }
    }
    
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
    telemetry: telemetryData,
    ...(dispatchPhotoUrl && { attachmentUrl: dispatchPhotoUrl, attachment: 'Outbound Photo: ' + dispatchPhotoName })
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
    setDispatchTerms(false); setDispatchPhoto(null);
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
        alert(" REPAIR PROTOCOL: To clear this damaged status, you must detail the fix (include the word 'repair') AND attach a photo of the completed work.");
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
        const ut = { ...t, condition: "Damaged", history: [{ user: "Admin", action: "Flagged as Damaged ", date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), condition: "Damaged", note: note }, ...t.history] };
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
      <div className="animate-in" style={{ backgroundColor: isOverdue ? 'rgba(0, 0, 0,0.08)' : (isSelected ? 'rgba(0, 0, 0,0.05)' : '#f3f4f6'), border: isOverdue ? '1px solid #9ca3af' : (isSelected ? '1px solid #374151' : '1px solid #d1d5db'), borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center', transition: 'all 0.15s', cursor: 'pointer' }} 
        onClick={() => toggleBulkSelection(tool.toolId)}
      >
        <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: '15px', height: '15px', accentColor: '#374151', cursor: 'pointer', margin: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0a1b35', lineHeight: '1.2' }}>{tool.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.02em' }}>[{tool.toolId}]</span>
            <span style={{ fontSize: '11px', color: isOverdue ? '#dc2626' : '#374151', fontWeight: '600' }}>
              {isOverdue ? `LOCKED: Overdue by ${Math.abs(remaining)} ${critical.unit}` : `Due in ${remaining} ${critical.unit}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', padding: '0 12px 100px 12px', color: '#0a1b35', fontFamily: '"SF Pro Display", sans-serif', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <style>{`
        .inspector-scroll::-webkit-scrollbar, .inspector-container::-webkit-scrollbar { width: 6px; }
        .inspector-scroll::-webkit-scrollbar-track, .inspector-container::-webkit-scrollbar-track { background: transparent; }
        .inspector-scroll::-webkit-scrollbar-thumb, .inspector-container::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; min-height: 340px; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-flipper.flipped .card-front { pointer-events: none; }
        .card-flipper.flipped .card-back { z-index: 5; }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; border-radius: 12px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; background-color: #ffffff; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #ffffff; display: flex; flex-direction: column; padding: 16px; overflow: visible; }
        .tab-btn { flex: 1; padding: 4px; font-size: 10px; font-weight: 700; cursor: pointer; border-radius: 6px; text-align: center; border: none; transition: all 0.2s; white-space: nowrap; }
        .tab-active { background-color: #0052cc; color: #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); }
        .tab-inactive { background-color: #f3f4f6; color: #6b7280; }
        .custom-input { padding: 12px 16px; border-radius: 8px; border: 1px solid #d1d5db; background-color: #ffffff; color: #0a1b35; width: 100%; box-sizing: border-box; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .custom-input:focus { border-color: #1f2937; }
        @keyframes criticalPulse { 0% { box-shadow: 0 0 0 0 rgba(0, 0, 0,0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 0, 0,0); } 100% { box-shadow: 0 0 0 0 rgba(0, 0, 0,0); } }

        .desktop-layout { display: flex; gap: 32px; align-items: flex-start; flex: 1; flex-direction: row; }
        .inspector-container { width: 420px; background-color: #ffffff; border-radius: 16px; border: 1px solid #d1d5db; padding: 24px; position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; max-height: calc(100vh - 48px); overflow-y: auto; }
        .hud-layout { display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 16px 24px; border-radius: 12px; border: 1px solid #d1d5db; margin-top: 16px; flex-direction: row; }
        .hud-divider { width: 1px; height: 40px; background-color: #e5e7eb; }
        .hud-stat-block { display: flex; flex-direction: column; }
        .kanban-col { flex: 1; display: flex; flex-direction: column; gap: 8px; background-color: #ffffff; padding: 16px; border-radius: 16px; border: 1px solid #d1d5db; min-height: 400px; }

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
            border: 1px solid #d1d5db !important;
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
      /* Soft base shadow for the Inspector Panel */
        .inspector-container {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
        }
        
        /* Smooth transition for the Matrix Cards */
        .card-front { 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; 
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        }
        
        /* The Hover Lift Effect */
        .card-perspective-wrapper:hover .card-front {
          transform: translateY(-4px) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          border-color: #d1d5db !important;
        }

        /* Subtle click scale for Primary Buttons */
        button:active {
          transform: scale(0.98);
        }
      /* High-Contrast Placeholders */
        .standard-input::placeholder { color: #6b7280 !important; opacity: 1 !important; font-weight: 500 !important; }
        .mandatory-input::placeholder { color: #dc2626 !important; opacity: 1 !important; font-weight: 800 !important; letter-spacing: 0.02em !important; }
  
      
      /* Core UI Choreography */
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseAlert {
          0% { transform: scale(1); box-shadow: 0 0 8px rgba(239,68,68,0.5); }
          50% { transform: scale(1.4); box-shadow: 0 0 16px rgba(239,68,68,0.9); }
          100% { transform: scale(1); box-shadow: 0 0 8px rgba(239,68,68,0.5); }
        }
        .animate-in {
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
  
      
      
        @keyframes floatY { 0%, 100% { margin-top: 0px; } 50% { margin-top: -6px; } }
        @keyframes floatX { 0%, 100% { margin-left: 0px; } 50% { margin-left: -6px; } }
        .tour-float-y { animation: floatY 1.5s infinite ease-in-out; }
        .tour-float-x { animation: floatX 1.5s infinite ease-in-out; }
      `}</style>

      {/* MASTER TOGGLE & INGEST ACTION DECK */}
      <div className="responsive-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1b35', padding: '12px 24px', boxShadow: '0 10px 30px rgba(10, 27, 53, 0.2)', borderRadius: '16px', width: '100%', boxSizing: 'border-box', flexWrap: 'wrap', gap: '16px', border: 'none', marginTop: '24px', marginBottom: '12px' }}>
        
        {/* LEFT: Role Toggle */}
        <div className="responsive-header-col" style={{ display: 'flex', flex: 1, justifyContent: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: '8px', padding: '4px', border: '1px solid #d1d5db' }}>
            <button onClick={() => setUserRole('TECH')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'TECH' ? '#0a1b35' : 'transparent', color: userRole === 'TECH' ? '#f8f9fa' : '#6b7280', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>TECH</button>
            <button onClick={() => setUserRole('ADMIN')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: userRole === 'ADMIN' ? '#0a1b35' : 'transparent', color: userRole === 'ADMIN' ? '#f8f9fa' : '#6b7280', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>ADMIN</button>
          </div>
        </div>

        {/* CENTER: Main Operations */}
        <div className="responsive-header-col" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: '8px', padding: '4px', border: '1px solid #d1d5db' }}>
            <button onClick={() => setActiveView('DISPATCH')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'DISPATCH' ? '#0a1b35' : 'transparent', color: activeView === 'DISPATCH' ? '#ffffff' : '#6b7280', boxShadow: activeView === 'DISPATCH' ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none' }}>
             ASSET HUB
          </button>
          {userRole === 'ADMIN' && (
            
  <div style={{ position: 'relative', display: 'flex' }}>
    <button onClick={() => { setActiveView('MAINTENANCE'); if (tutorialStep === 24) nextTourStep(25); }} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'MAINTENANCE' || tutorialStep === 24 ? '#0a1b35' : 'transparent', color: activeView === 'MAINTENANCE' || tutorialStep === 24 ? '#ffffff' : '#6b7280', boxShadow: tutorialStep === 24 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : (activeView === 'MAINTENANCE' ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none') }}>
       PM HUB
    </button>
    {tutorialStep === 24 && (
                <div className="tour-float-y" style={{ position: 'absolute', top: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
        <div>Step 24: Track maintenance</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>

          )}
          </div>
          
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: '8px', padding: '4px', border: '1px solid #d1d5db', marginLeft: '8px' }}>
              <div style={{ position: 'relative', display: 'flex' }}>
              <button onClick={() => { setAddModalOpen(true); if (tutorialStep === 1) nextTourStep(2); }} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: tutorialStep === 1 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>
                ADD
              </button>
              {tutorialStep === 1 && (
                <div className="tour-float-y" style={{ position: 'absolute', top: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
                  <div>Step 1: Add an asset!</div>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
                </div>
              )}
            </div>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#e5e7eb', margin: '0 4px' }}></div>
              <button onClick={() => setBulkModalOpen(true)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(0, 0, 0,0.1)', color: '#1f2937', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                BULK ADD
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Admin Tools (Cohesive Control Pad) */}
        <div className="responsive-header-col" style={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
          {userRole === 'ADMIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#e5e7eb', padding: '2px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
              
  <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
    <button onClick={() => { setActiveView('LEDGER'); if (tutorialStep === 25) nextTourStep(26); }} style={{ padding: '4px 14px', borderRadius: '6px', border: 'none', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: activeView === 'LEDGER' || tutorialStep === 25 ? '#0a1b35' : 'transparent', color: activeView === 'LEDGER' || tutorialStep === 25 ? '#ffffff' : '#6b7280', boxShadow: tutorialStep === 25 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : (activeView === 'LEDGER' ? '0 4px 12px rgba(0, 0, 0, 0.25)' : 'none'), width: '100%', textAlign: 'center' }}>
       MASTER LEDGER
    </button>
    {tutorialStep === 25 && (
                <div className="tour-float-x" style={{ position: 'absolute', right: '105%', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', borderWidth: '6px 0 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent transparent #0052cc' }}></div>
        <div>Step 25: View audit logs</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>

              <div style={{ display: 'flex', gap: '2px' }}>
                <button onClick={() => setAlertsModalOpen(true)} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#0a1b35', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}>
                   ALERTS
                </button>
                <div style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '2px 0' }}></div>
                <button onClick={() => setGuideModalOpen(true)} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#374151', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}>
                   GUIDE
                </button>
                
                <div style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '2px 0' }}></div>
                
  <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
    <button onClick={() => { setFinanceModalOpen(true); if (tutorialStep === 26) endTour(); }} style={{ flex: 1, padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: tutorialStep === 26 ? '#0052cc' : 'transparent', color: tutorialStep === 26 ? '#ffffff' : '#4b5563', fontWeight: '800', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: tutorialStep === 26 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : 'none' }}>
       FINANCE
    </button>
    {tutorialStep === 26 && (
                <div className="tour-float-y" style={{ position: 'absolute', top: '150%', right: '0', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '-6px', right: '16px', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
        <div>Final Step: Fleet Valuation!</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Finish</div>
      </div>
    )}
  </div>

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
            
            
            {userRole === 'TECH' && !dismissedTips['TECH_HUB'] && (
              <div className="animate-in" style={{ backgroundColor: '#0052cc', color: '#fff', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,82,204,0.3)', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🛠️</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Welcome to the Field Tech Portal!</div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>Use the search bar below to locate your assigned assets. Click <strong>CHECK OUT</strong> to take custody, or <strong>RETURN</strong> to clear a tool from your liability.</div>
                  </div>
                </div>
                <button onClick={() => dismissTip('TECH_HUB')} style={{ backgroundColor: '#ffffff', color: '#0052cc', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>Got it!</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input type="text" placeholder="Search by Asset ID, Name, or Assigned Tech..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" />
                </div>
            </div>

            <div className="matrix-grid" style={{ display: 'grid', gridTemplateColumns: filteredTools.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', alignContent: 'start' }}>
                {filteredTools.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35', marginBottom: '8px' }}>INVENTORY EMPTY</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Your asset matrix is currently clear. Click "ADD" or "BULK ADD" above to ingest new tools.</div>
                  </div>
                ) : filteredTools.filter(tool_obj => tool_obj.status !== 'DECOMMISSIONED').map(tool => {
                const isSelected = tool.toolId === selectedToolId;
                const isOut = tool.status === 'CHECKED_OUT';
                const isServiceDue = checkIsOverdue(tool.metrics);
                const isFlipped = !!flippedCards[tool.toolId];
                const canReturn = userRole === 'ADMIN' || tool.assignedUser === (user?.profile?.email || dispatchUser);
                const activeTab = cardTabs[tool.toolId] || 'service';
                
                let cardBorder = '1px solid #d1d5db';
                let cardShadow = 'none';
                let cardBg = isServiceDue ? '#fafafa' : '#ffffff';
                if (isSelected) {
                  cardBorder = '1px solid #374151';
                  cardShadow = '0 0 0 1px #374151';
                  cardBg = isServiceDue ? '#f3f4f6' : '#f3f4f6';
                } else if (isServiceDue) { cardBorder = '1px solid #d1d5db'; }

                return (
                    <div key={tool.toolId} className="card-perspective-wrapper animate-in" onClick={() => setSelectedToolId(tool.toolId)}>
                    <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                        
                        {/* FRONT FACE */}
                        <div className="card-face card-front" style={{ padding: '16px', border: cardBorder, boxShadow: cardShadow, display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', backgroundColor: cardBg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: isServiceDue ? 'rgba(0, 0, 0,0.15)' : (isOut ? 'rgba(0, 0, 0,0.15)' : 'rgba(0, 0, 0,0.15)'), color: isServiceDue ? '#9ca3af' : (isOut ? '#6b7280' : '#374151'), letterSpacing: '0.05em' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', backgroundColor: isServiceDue ? '#ef4444' : (isOut ? '#f59e0b' : '#10b981'), boxShadow: isServiceDue ? '0 0 8px rgba(239,68,68,0.5)' : (isOut ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(16,185,129,0.5)'), animation: isServiceDue ? 'pulseAlert 2s infinite' : 'none' }}></span> {isServiceDue ? 'SERVICE DUE' : (isOut ? 'DEPLOYED' : (tool.isDispatchable === false ? 'OPERATIONAL' : 'IN-STOCK'))}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>[ {tool.toolId} ]</span>
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', lineHeight: '1.3', color: '#0a1b35' }}>{tool.name}</div>
                            {isOut && (<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontWeight: '600' }}> {tool.assignedUser}</div>)}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', position: 'relative' }}>
                            {tool.isDispatchable !== false ? (
                              (() => {
                                const isAdmin = userRole === 'ADMIN';
                                const isLocked = isServiceDue || tool.condition === 'Damaged';
                                if (isOut) {
                                  if (!canReturn) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,28,30,0.9)', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: '#9ca3af', border: '1px solid #9ca3af' }}>🔒 LOCKED</div>;
                                  return <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #3f3f46', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>RETURN</button>;
                                }
                                if (isLocked && !isAdmin) return <button disabled style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#636366', border: 'none', fontWeight: '800', fontSize: '11px', cursor: 'not-allowed' }}>LOCKED</button>;
                                if (isLocked && isAdmin) return <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setCheckoutModalOpen(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0,0.1)', color: '#6b7280', border: '1px solid #6b7280', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>{tool.condition === 'Damaged' ? 'REPAIR' : 'SERVICE'}</button>;
                                return <div style={{ position: 'relative', display: 'flex', flex: 1, zIndex: tutorialStep === 14 ? 10 : 1 }}>
      <button onClick={(e) => { e.stopPropagation(); setSelectedToolId(tool.toolId); setCheckoutModalOpen(true); if(tutorialStep === 14) nextTourStep(15); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#374151', border: tutorialStep === 14 ? '2px solid #0052cc' : '1px solid #3f3f46', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>CHECK OUT</button>
      {tutorialStep === 14 && (
        <div className="tour-float-y" style={{ position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 99999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
          <div>Step 14: Dispatch to the field!</div>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
        </div>
      )}
    </div>;
                              })()
                            ) : (
                              <div style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#6b7280', border: '1px solid #d1d5db', fontWeight: '700', fontSize: '12px', textAlign: 'center', boxSizing: 'border-box' }}>STATIC</div>
                            )}
                            <div style={{ position: 'relative', display: 'flex', flex: 'none', zIndex: tutorialStep === 14 ? 10 : 1 }}>
                            <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: true})); if (tutorialStep === 20) nextTourStep(21); }} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: '#4b5563', border: tutorialStep === 14 ? '2px solid #0052cc' : '1px solid #d1d5db', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                              Flip ⤹
                            </button>
                            {tutorialStep === 20 && (
    <div className="tour-float-y" style={{ position: 'absolute', top: '130%', right: '0', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: '-6px', right: '16px', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
      <div>Step 20: Flip card to view metrics!</div>
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
    </div>
  )}
                          </div>
                        </div>
                        </div>

                        {/* BACK FACE (UNIVERSAL METRICS) */}
                        <div className="card-face card-back" style={{ border: cardBorder, boxShadow: cardShadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative', display: 'flex', gap: '4px', flex: 1, marginRight: '8px', flexWrap: 'wrap', boxShadow: tutorialStep === 21 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : 'none', borderRadius: '4px' }}>
      {tutorialStep === 21 && (
        <div className="tour-float-y" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: '0', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', zIndex: 99999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', top: '-6px', left: '20px', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
          <div style={{ whiteSpace: 'nowrap' }}>Step 21: Access PM logs & manifests here!</div>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(22); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', fontWeight: '800' }}>Next</div>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
        </div>
      )}
                            <button className={`tab-btn ${activeTab === 'service' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'service'})); }}> PM</button>
                            {tool.isDispatchable !== false && !tool.toolId.startsWith('KIT') && (<button className={`tab-btn ${activeTab === 'manifest' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'manifest'})); }}> MANIFEST</button>)}
                            {tool.isDispatchable !== false && !tool.toolId.startsWith('KIT') && (<button className={`tab-btn ${activeTab === 'qr' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'qr'})); }}> QR</button>)}
                            <button className={`tab-btn ${activeTab === 'specs' ? 'tab-active' : 'tab-inactive'}`} onClick={(e) => { e.stopPropagation(); setCardTabs(prev => ({...prev, [tool.toolId]: 'specs'})); }}> INFO</button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({...prev, [tool.toolId]: false})); }} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px', padding: 0, marginTop: '2px' }}>✕</button>
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
                                        <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{metric.unit} INTERVAL</div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: isMetricDue ? '#9ca3af' : '#0a1b35' }}>
                                          {metric.current.toLocaleString()} / {metric.interval.toLocaleString()} <span style={{fontSize: '11px', color: '#6b7280'}}>{metric.unit.toUpperCase()}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                
                                {/* PROCEDURAL CHECKLIST */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#e5e7eb', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', maxHeight: '160px', overflowY: 'auto' }}>
                                  {(tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).map(step => {
                                    const isChecked = (serviceChecklists[tool.toolId] || []).includes(step);
                                    return (
                                      <label key={step} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: isChecked ? '#374151' : '#4b5563', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                                        <input type="checkbox" checked={isChecked} onChange={() => { setServiceChecklists(prev => { const curr = prev[tool.toolId] || []; return { ...prev, [tool.toolId]: curr.includes(step) ? curr.filter(s => s !== step) : [...curr, step] }; }); }} style={{ width: '12px', height: '12px', accentColor: '#374151', margin: 0 }} />{step} {userRole === 'ADMIN' && <span style={{ color: '#9ca3af', cursor: 'pointer', marginLeft: '8px', fontWeight: '800' }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); const currentList = tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name); const ut = { ...tool, pmChecklist: currentList.filter(s => s !== step) };
          setTools(tools.map(t => t.toolId === tool.toolId ? ut : t));
          syncDB(ut);
                }}>✕</span>}</label>
                                    );
                                  })}
                                </div>
                                
                                {/* TECH NOTES & PHOTO */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {userRole === 'ADMIN' && (
    <input 
      type="text" 
      placeholder="+ Add Custom Step (Press Enter)" 
      style={{ padding: '8px', borderRadius: '4px', border: '1px dashed #e5e7eb', backgroundColor: 'transparent', color: '#374151', fontSize: '12px', outline: 'none', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
          e.preventDefault();
          const currentList = tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name);
          const newList = [...currentList, e.target.value.trim()];
          const ut = { ...tool, pmChecklist: newList };
          setTools(tools.map(t => t.toolId === tool.toolId ? ut : t));
          syncDB(ut);
          e.target.value = '';
        }
      }} 
    />
  )}
<div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                  <input type="text" className={tool.condition === "Damaged" || tool.condition === "Requires Maintenance" ? "mandatory-input" : "standard-input"} placeholder={tool.condition === "Damaged" || tool.condition === "Requires Maintenance" ? "REQUIRED: Explain fault..." : "Add Service Notes..."} value={serviceNotes[tool.toolId] || ''} onChange={(e) => setServiceNotes(prev => ({...prev, [tool.toolId]: e.target.value}))} onClick={(e) => e.stopPropagation()} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '11px', outline: 'none' }} />
                                  <label htmlFor={`file-${tool.toolId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: pendingAttachments[tool.toolId] ? '#374151' : '#4b5563', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {pendingAttachments[tool.toolId] ? '✅' : '📷'}
                                  </label>
                                  <input type="file" id={`file-${tool.toolId}`} style={{ display: 'none' }} onChange={async (e) => { if(e.target.files[0]) { const compressed = await compressImage(e.target.files[0]); setPendingAttachments(prev => ({...prev, [tool.toolId]: compressed})); } }} />
                                </div>
                                </div>

                                <button disabled={(serviceChecklists[tool.toolId] || []).length !== (tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).length || ((tool.condition === 'Damaged' || tool.condition === 'Requires Maintenance') && !(serviceNotes[tool.toolId] || '').trim())} onClick={(e) => { e.stopPropagation(); logService(tool.toolId); }} style={{ marginTop: 'auto', padding: '10px', borderRadius: '8px', backgroundColor: (isOut && tool.condition === 'Damaged') ? '#9ca3af' : (tool.condition === 'Damaged' ? '#6b7280' : '#0a1b35'), color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer', opacity: ((serviceChecklists[tool.toolId] || []).length === (tool.pmChecklist || generateSmartChecklist(tool.toolId, tool.name)).length && (!(['Damaged', 'Requires Maintenance'].includes(tool.condition)) || (serviceNotes[tool.toolId] || '').trim())) ? 1 : 0.4 }}>{(isOut && tool.condition === 'Damaged') ? 'RETURN (DAMAGED)' : (tool.condition === 'Damaged' ? 'LOG REPAIR & RESET' : (isOut ? 'LOG RETURN & RESET' : 'LOG SERVICE & RESET'))}</button>
                              </div>
                            )}

                            {activeTab === 'manifest' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {userRole === 'ADMIN' && (
                                  <input 
                                    type="text" 
                                    placeholder="+ Add Custom Manifest Item (Press Enter)" 
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px dashed #e5e7eb', backgroundColor: 'transparent', color: '#374151', fontSize: '12px', outline: 'none', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }} 
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.target.value.trim()) {
                                        e.preventDefault();
                                        const defaultMan = generateSmartManifest(tool.toolId, tool.name, tool.category);
                                        const currentList = tool.customManifest || defaultMan;
                                        const newList = [...currentList, e.target.value.trim()];
                                        const ut = { ...tool, customManifest: newList };
                                        setTools(tools.map(t => t.toolId === tool.toolId ? ut : t));
                                        syncDB(ut);
                                        e.target.value = '';
                                      }
                                    }} 
                                  />
                                )}
                                {(tool.customManifest || ((tool.category === 'Fleet Vehicle' || tool.toolId.startsWith('VEH') || tool.toolId.startsWith('BMW')) ? ['Ignition Keys / Fob', 'Registration & Insurance Card', 'Clean Interior / Exterior'] : ['Primary Body', 'Key Component / Battery', 'Accessories'])).map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <label onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#4b5563', cursor: 'pointer', flex: 1, margin: 0 }}>
                                      <input type="checkbox" defaultChecked style={{ width: '14px', height: '14px', accentColor: '#1f2937' }} /> {item}
                                    </label>
                                    {userRole === 'ADMIN' && (
                                      <span style={{ color: '#9ca3af', cursor: 'pointer', marginLeft: '8px', fontWeight: '800' }} onClick={(e) => { 
                                        e.preventDefault(); e.stopPropagation(); 
                                        const defaultMan = generateSmartManifest(tool.toolId, tool.name, tool.category);
                                        const currentList = tool.customManifest || defaultMan;
                                        const ut = { ...tool, customManifest: currentList.filter(s => s !== item) };
                                        setTools(tools.map(t => t.toolId === tool.toolId ? ut : t));
                                        syncDB(ut);
                                      }}>✕</span>
                                    )}
                                  </div>
                                ))}
                            </div>
                            )}
                            
                            {activeTab === 'qr' && (
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ padding: '8px', backgroundColor: '#0a1b35', borderRadius: '8px', display: 'inline-block' }}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=TRANSFER_${tool.toolId}&color=000000&bgcolor=ffffff`} alt="QR" style={{ width: '80px', height: '80px', display: 'block' }} /></div>
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontWeight: '600' }}>SCAN FOR CUSTODY</div>
                                <button onClick={(e) => { e.stopPropagation(); const content = e.currentTarget.parentElement.innerHTML; const printWin = window.open('', '', 'width=400,height=400'); const cleanContent = content.replace(new RegExp('<button[\\s\\S]*?<\\/button>', 'g'), ''); printWin.document.write('<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;text-align:center;">' + cleanContent + '</body></html>'); printWin.document.close(); setTimeout(() => { printWin.print(); printWin.close(); }, 300); }} style={{ marginTop: '12px', padding: '8px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #3f3f46', borderRadius: '6px', fontWeight: '800', fontSize: '11px', cursor: 'pointer', width: '100%', textTransform: 'uppercase' }}>Print</button>
                            </div>
                            )}

                            {activeTab === 'specs' && (
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Value:</span> ${tool.value}</div>
                                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Category:</span> {tool.category}</div>
                                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>{tool.toolId.startsWith('KIT') ? 'Tracked Items:' : 'Serial / VIN:'}</span> {tool.serial || 'N/A'}</div>
                                {tool.manualUrl ? (
      <div onClick={(e) => { e.stopPropagation(); window.open(tool.manualUrl, "_blank"); }} style={{ color: '#374151', fontWeight: '800', cursor: 'pointer', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(0, 0, 0,0.1)', borderRadius: '6px', border: '1px solid rgba(0, 0, 0,0.3)' }}>
        <span></span> VIEW PDF MANUAL
      </div>
    ) : (
      <div style={{ marginTop: '8px' }}>
        <label htmlFor={`manual-${tool.toolId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px dashed #6b7280', color: '#94a3b8', fontWeight: '800', fontSize: '11px', cursor: 'pointer', backgroundColor: 'rgba(0, 0, 0,0.05)', transition: 'all 0.2s' }}>
          <span></span> UPLOAD PDF MANUAL
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
                    <div style={{ paddingBottom: '16px', borderBottom: '1px solid #d1d5db', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#374151' }}>${selectedTool.value.toLocaleString()}</div>
                    {selectedTool?.toolId && !selectedTool.toolId.startsWith('KIT') && ( <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedTool.toolId}`} alt="Asset QR" style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px solid #d1d5db', padding: '4px', backgroundColor: '#ffffff' }} /> )}
                  </div>
                    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px', display: 'inline-block', boxShadow: tutorialStep === 22 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : 'none', borderRadius: '4px', background: tutorialStep === 22 ? 'rgba(0, 82, 204, 0.1)' : 'transparent', padding: tutorialStep === 22 ? '2px 4px' : '0' }}>INSPECTOR DASHBOARD</div>
      {tutorialStep === 22 && (
    <div className="tour-float-y" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: '0', backgroundColor: '#0052cc', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', zIndex: 99999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '280px', whiteSpace: 'normal' }}>
      <div style={{ position: 'absolute', top: '-6px', left: '20px', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
      <div style={{ flex: 1, lineHeight: '1.4' }}>Step 22: The Inspector tracks detailed global history!</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline' }}>Skip</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(23); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', fontWeight: '800' }}>Next</div>
      </div>
    </div>
  )}
    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0a1b35' }}>{selectedTool.toolId}</div>
                    <div style={{ color: checkIsOverdue(selectedTool.metrics) ? '#9ca3af' : '#1f2937', fontSize: '16px', fontWeight: '600', marginTop: '4px', lineHeight: '1.3' }}>{selectedTool.name}</div>
                    </div>

                    {selectedTool.condition === 'Damaged' && (
                      <div style={{ backgroundColor: 'rgba(0, 0, 0,0.08)', border: '1px solid rgba(0, 0, 0,0.5)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span></span> TOOL DAMAGED / OUT OF SERVICE
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.5' }}>
                          This tool has been manually flagged as damaged. It cannot be dispatched until a technician logs a repair service.
                        </div>
                      </div>
                    )}
                    {checkIsOverdue(selectedTool.metrics) && (
                      <div style={{ backgroundColor: 'rgba(0, 0, 0,0.08)', border: '1px solid rgba(0, 0, 0,0.5)', padding: '16px', borderRadius: '12px', animation: 'criticalPulse 2s infinite' }}>
                        <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span></span> PREVENTATIVE MAINTENANCE LOCK
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.5' }}>
                          This tool has exceeded one or more of its critical service intervals. Dispatch capabilities have been securely locked until a technician verifies integrity and resets the timers.
                        </div>
                      </div>
                    )}

                    <div style={{ backgroundColor: '#e5e7eb', borderRadius: '12px', border: '1px solid #d1d5db', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>LOG HISTORY</div>
                    <div className="inspector-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
                        {selectedTool.history.length > 0 ? selectedTool.history.map((log, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                            <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', justifyContent: 'space-between' }}>
                              <span><strong style={{ color: '#0a1b35' }}>[{log.user}]</strong> {log.action}</span>
                            </div>
                            
                            {log.note && (
                              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px', fontStyle: 'italic', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '6px 8px', borderRadius: '6px' }}>
                                <span>📝</span> "{log.note}"
                              </div>
                            )}
                            
                            {log.signatureUrl && (
                              <div style={{ marginTop: '8px', padding: '4px', backgroundColor: '#ffffff', borderRadius: '4px', display: 'inline-block', border: '1px solid #d1d5db' }}>
                                <img src={log.signatureUrl} alt="Signature" style={{ height: '40px', display: 'block' }} />
                              </div>
                            )}
                            {log.attachment && (
                                  <div style={{ marginTop: '12px', marginBottom: '4px' }}>
                                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>ATTACHED MEDIA</div>
                                    <div onClick={() => log.attachmentUrl && window.open(log.attachmentUrl, "_blank")} style={{ display: 'inline-block', position: 'relative', cursor: log.attachmentUrl ? 'pointer' : 'default', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                      <img src={log.attachmentUrl} alt={log.attachment} style={{ display: 'block', maxHeight: '140px', maxWidth: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; }} />
                                      <div style={{ padding: '8px 12px', fontSize: '11px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                                        <span>📎</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{log.attachment}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{log.date}</span>
                              <span>Condition: {log.condition}</span>
                            </div>
                            {log.telemetry && (
                              <div style={{ fontSize: '9px', color: '#636366', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '0.02em', borderTop: '1px solid #f3f4f6', paddingTop: '4px' }}>
                                [SYS_AUTH] {log.telemetry}
                              </div>
                            )}
                        </div>
                        )) : <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>No deployment history on record.</div>}
                    </div>
                    </div>

                    <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px' }}>CURRENT STATUS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#e5e7eb', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedTool.status === 'CHECKED_OUT' ? '#6b7280' : '#374151', boxShadow: `0 0 10px ${selectedTool.status === 'CHECKED_OUT' ? '#6b7280' : '#374151'}` }}></span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: '#0a1b35', letterSpacing: '1px' }}>{selectedTool.status === 'CHECKED_OUT' ? 'DEPLOYED' : (selectedTool.isDispatchable === false ? 'OPERATIONAL' : 'IN-STOCK')}</span>
                    </div>
                    {selectedTool.status === 'CHECKED_OUT' && (
                        <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
                        Assigned to: <strong style={{ color: '#0a1b35' }}>{selectedTool.assignedUser}</strong> <br/>
                        Time in field: <strong style={{ color: '#6b7280' }}>{selectedTool.daysOut} {selectedTool.daysOut === 1 ? 'day' : 'days'}</strong>
                        </div>
                    )}
                      {selectedTool.condition !== 'Damaged' && (
                        <button onClick={() => reportDamage(selectedTool.toolId)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#9ca3af', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                           REPORT DAMAGE / FAULT
                        </button>
                      )}
                      {userRole === 'ADMIN' && (
                        <>
<button onClick={() => { setEditTool({...selectedTool}); setEditModalOpen(true); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: 'transparent', color: '#374151', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: '8px' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#374151'; e.target.style.color = '#0a1b35'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#374151'; }}> EDIT ASSET DETAILS</button>
                        <button onClick={() => {
            if (window.confirm(' DECOMMISSION PROTOCOL: Are you sure you want to permanently retire this asset?\n\nIt will be hidden from the active matrix, but its history will be preserved in the Global Audit Ledger.')) {
                setTools(tools.map(t => t.toolId === selectedTool.toolId ? { ...t, status: 'DECOMMISSIONED', condition: 'Decommissioned', history: [{ action: 'Decommissioned', user: 'ADMIN', date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }), note: 'Asset permanently written off and retired' }, ...t.history] } : t));
                }
          }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #9ca3af', backgroundColor: 'transparent', color: '#9ca3af', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: '8px' }} onMouseOver={(e) => { e.target.style.backgroundColor = '#9ca3af'; e.target.style.color = '#0a1b35'; }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#9ca3af'; }}> DECOMMISSION ASSET</button>
</>
                      )}
                    </div>
                    {selectedTool && inventory[selectedTool.prefix] && (
        <div style={{ backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
            <div style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span></span> REQUIRED CONSUMABLES & PARTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inventory[selectedTool.prefix].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#4b5563', fontSize: '13px', fontWeight: '600' }}>{item.item}</span>
                        <span style={{ color: item.stock < 15 ? '#6b7280' : '#374151', fontSize: '13px', fontWeight: '800', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{item.stock} IN STOCK</span>
                    </div>
                ))}
            </div>
        </div>
    )}
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', boxShadow: tutorialStep === 23 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : 'none', borderRadius: '8px', padding: tutorialStep === 23 ? '4px' : '0' }}>
      {tutorialStep === 23 && (
    <div className="tour-float-y" style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '0', backgroundColor: '#0052cc', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', zIndex: 99999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '280px', whiteSpace: 'normal' }}>
      <div style={{ position: 'absolute', bottom: '-6px', left: '20px', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
      <div style={{ flex: 1, lineHeight: '1.4' }}>Step 23: Deploy, return, or service assets directly from here!</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline' }}>Skip</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(24); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', fontWeight: '800' }}>Next</div>
      </div>
    </div>
  )}
                    {selectedTool.status === 'AVAILABLE' ? (
                        selectedTool.isDispatchable !== false ? (
                            (() => {
                                const isLocked = checkIsOverdue(selectedTool.metrics) || selectedTool.condition === 'Damaged';
                                const isAdmin = userRole === 'ADMIN';
                                if (isLocked && !isAdmin) return <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', color: '#636366', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>LOCKED: SERVICE REQUIRED</button>;
                                if (isLocked && isAdmin) return <button onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #6b7280', backgroundColor: 'rgba(0, 0, 0,0.1)', color: '#94a3b8', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}> ADMIN OVERRIDE: FORCE DISPATCH</button>;
                                return <button onClick={() => setCheckoutModalOpen(true)} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>CHECK OUT TO EMPLOYEE</button>;
                            })()
                        ) : (
                            <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#94a3b8', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>STATIC TOOL (NON-DISPATCHABLE)</button>
                        )
                    ) : (
                        (userRole === 'ADMIN' || selectedTool.assignedUser === user?.profile?.email) ? (
                            <button onClick={() => { setFlippedCards(prev => ({...prev, [selectedTool.toolId]: true})); }} style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>FLIP CARD TO LOG RETURN</button>
                        ) : (
                            <button disabled style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #9ca3af', backgroundColor: 'rgba(0, 0, 0,0.1)', color: '#9ca3af', fontWeight: '800', fontSize: '15px', cursor: 'not-allowed' }}>🔒 CUSTODY LOCKED TO {selectedTool.assignedUser}</button>
                        )
                    )}
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No assets match your search.</div>
            )}
          </div>
        </div>
      ) : activeView === 'MAINTENANCE' ? (
        /* MAINTENANCE HUB VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {!dismissedTips['PM_HUB'] && (
      <div className="animate-in" style={{ backgroundColor: '#0052cc', color: '#fff', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,82,204,0.3)', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>👋</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Welcome to the PM Hub!</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>This dashboard automatically tracks your fleet's upcoming service dates. Assets that appear in the grey Triage Alert Center directly below need immediate attention!</div>
          </div>
        </div>
        <button onClick={() => dismissTip('PM_HUB')} style={{ backgroundColor: '#ffffff', color: '#0052cc', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>Got it!</button>
      </div>
    )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ flex: 1, position: 'relative' }}><input type="text" placeholder="Search Triage & Kanban by Tool ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="custom-input" /></div></div>
          
          <div style={{ backgroundColor: 'rgba(0, 0, 0,0.05)', border: '1px solid #9ca3af', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '18px' }}></span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#9ca3af', letterSpacing: '0.05em' }}>TRIAGE ALERT CENTER: ACTION REQUIRED</span>
            </div>
            {overdueTools.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {overdueTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={true} />)}
              </div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>No tools are currently overdue for maintenance.</div>
            )}
          </div>

          <div className="kanban-scroll-wrapper">
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS WEEK</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{thisWeekTools.length} Tools Pending</div>
              </div>
              {thisWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
            
            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#374151', fontWeight: '800', letterSpacing: '0.05em' }}>DUE NEXT WEEK</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{nextWeekTools.length} Tools Pending</div>
              </div>
              {nextWeekTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>

            <div className="kanban-col">
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', color: '#374151', fontWeight: '800', letterSpacing: '0.05em' }}>DUE THIS MONTH</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{thisMonthTools.length} Tools Pending</div>
              </div>
              {thisMonthTools.map(t => <RenderKanbanCard key={t.toolId} tool={t} isOverdue={false} />)}
            </div>
          </div>

        </div>
      ) : activeView === 'LEDGER' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {!dismissedTips['LEDGER'] && (
      <div className="animate-in" style={{ backgroundColor: '#0052cc', color: '#fff', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,82,204,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Welcome to the Master Ledger!</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>This is the immutable, global record of every transaction across the entire company. Export logs directly to AWS SES from here.</div>
          </div>
        </div>
        <button onClick={() => dismissTip('LEDGER')} style={{ backgroundColor: '#ffffff', color: '#0052cc', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>Got it!</button>
      </div>
    )}
          
        
        {tools.filter(t => t.status === 'CHECKED_OUT' && t.maxCheckoutDays > 0 && t.daysOut > t.maxCheckoutDays).length > 0 && (
          <div style={{ backgroundColor: 'rgba(0, 0, 0,0.05)', border: '1px solid rgba(0, 0, 0,0.3)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}></span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#1f2937', letterSpacing: '0.05em' }}>LONG-TERM CUSTODY REVIEW</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                <input type="text" placeholder="🔍 Search overdue assets or users..." value={custodySearch} onChange={(e) => setCustodySearch(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '13px', outline: 'none', flex: 1, maxWidth: '250px' }} />
                <select value={custodySort} onChange={(e) => setCustodySort(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
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
                <div key={t.toolId} style={{ backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0a1b35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={t.name}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>[{t.toolId}]</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#6b7280', whiteSpace: 'nowrap' }}>{t.daysOut} / {t.maxCheckoutDays || 14}d</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#4b5563' }}>With: <strong style={{ color: '#0a1b35' }}>{t.assignedUser}</strong></div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button onClick={(e) => { e.stopPropagation(); alert('Automated email ping sent to ' + t.assignedUser + '.'); }} style={{ flex: 1, padding: '8px', backgroundColor: 'transparent', border: '1px solid #374151', color: '#374151', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}> PING</button>
                    <button onClick={(e) => { e.stopPropagation(); handleReturn(t.toolId); }} style={{ flex: 1, padding: '8px', backgroundColor: '#0a1b35', border: 'none', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>RETURN</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #d1d5db' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#0a1b35', letterSpacing: '-0.02em' }}>Global Audit Ledger</h2>
              <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Immutable record of all fleet transactions, checkouts, and maintenance logs.</p>
              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="🔍 Search ledger by asset, user, action, condition, or date..." 
                  value={ledgerSearch} 
                  onChange={(e) => setLedgerSearch(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>
              {selectedLedgerLogs.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#1f2937', fontWeight: '600' }}>
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
                  
                  // 🚧 LOCALHOST BYPASS: Prevent fetch crash if API URL is missing locally
                  if (!API_URL || window.location.hostname === 'localhost') {
                      console.log("🛠️ LOCAL DEV MODE: Bypassing AWS SES Export. Payload ready:", payload);
                      alert('✅ [LOCAL BYPASS] Audit log payload generated successfully! (Check console to view data)');
                      return;
                  }

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
            }} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: selectedLedgerLogs.length > 0 ? '#0a1b35' : '#f3f4f6', color: selectedLedgerLogs.length > 0 ? '#ffffff' : '#9ca3af', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <span></span> {selectedLedgerLogs.length > 0 ? 'EXPORT SELECTED LOGS' : 'EXPORT ALL LOGS'}
            </button>
          </div>
          <div className="ledger-table-container" style={{ backgroundColor: '#e5e7eb', borderRadius: '16px', border: '1px solid #d1d5db', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 2fr 1fr 1.5fr', minWidth: '900px', gap: '16px', padding: '16px 24px', backgroundColor: '#ffffff', borderBottom: '1px solid #d1d5db', fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.05em', alignItems: 'center' }}>
              <div>
                <input type="checkbox" checked={selectedLedgerLogs.length === tools.reduce((acc, t) => acc + t.history.length, 0) && selectedLedgerLogs.length > 0} onChange={(e) => {
                  const totalCount = tools.reduce((acc, t) => acc + t.history.length, 0);
                  if (e.target.checked) { setSelectedLedgerLogs(Array.from({length: totalCount}, (_, i) => i)); } else { setSelectedLedgerLogs([]); }
                }} style={{ width: '16px', height: '16px', accentColor: '#1f2937', cursor: 'pointer' }} title="Select All" />
              </div>
              
              <div onClick={() => handleSort('toolName')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#0a1b35'} onMouseOut={(e)=>e.target.style.color=''}>ASSET {sortConfig.key === 'toolName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('user')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#0a1b35'} onMouseOut={(e)=>e.target.style.color=''}>USER {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('action')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#0a1b35'} onMouseOut={(e)=>e.target.style.color=''}>ACTION {sortConfig.key === 'action' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('condition')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#0a1b35'} onMouseOut={(e)=>e.target.style.color=''}>CONDITION {sortConfig.key === 'condition' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
              <div onClick={() => handleSort('date')} style={{cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s'}} onMouseOver={(e)=>e.target.style.color='#0a1b35'} onMouseOut={(e)=>e.target.style.color=''}>TIMESTAMP & TELEMETRY {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</div>
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
                <div key={i} onClick={() => setSelectedLedgerLogs(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])} style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 2fr 1fr 1.5fr', minWidth: '900px', gap: '16px', padding: '16px 24px', borderBottom: '1px solid #f3f4f6', alignItems: 'center', transition: 'background-color 0.2s', cursor: 'pointer', backgroundColor: selectedLedgerLogs.includes(i) ? 'rgba(0, 0, 0,0.05)' : 'transparent' }}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedLedgerLogs.includes(i)} onChange={() => setSelectedLedgerLogs(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])} style={{ width: '16px', height: '16px', accentColor: '#1f2937', cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '14px', fontWeight: '700', color: '#0a1b35' }}>{log.toolName}</span><span style={{ fontSize: '12px', color: '#6b7280' }}>[{log.toolId}]</span></div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>{log.user}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '13px', color: '#0a1b35' }}>{log.action}</span>{log.note && <span style={{ fontSize: '12px', color: '#1f2937', fontStyle: 'italic' }}>"{log.note}"</span>}</div>
                  <div><span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: log.condition === 'Damaged' ? 'rgba(0, 0, 0,0.15)' : 'rgba(0, 0, 0,0.05)', color: log.condition === 'Damaged' ? '#9ca3af' : '#4b5563' }}>{log.condition}</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '13px', color: '#6b7280' }}>{log.date}</span>{log.telemetry && <span style={{ fontSize: '9px', color: '#636366', fontFamily: 'monospace' }}>{log.telemetry.split(' | ')[0]}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {bulkSelectedTools.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #d1d5db', padding: '20px 40px', zIndex: 5000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#0a1b35' }}>{bulkSelectedTools.length} Tools Selected</span>
            <span style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setBulkSelectedTools([])}>Clear Selection</span>
          </div>
          <button onClick={logBulkService} style={{ padding: '16px 32px', backgroundColor: 'transparent', color: '#374151', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 0, 0,0.3)' }}>
            LOG BULK PM SERVICE
          </button>
        </div>
      )}

      
      {/* EDIT ASSET MODAL */}
      {editModalOpen && editTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: "32px", borderRadius: "16px", border: "1px solid #d1d5db", width: "800px", maxWidth: "90%", color: "#0a1b35", boxSizing: "border-box" }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#0a1b35', letterSpacing: '-0.02em' }}>Edit Asset: {editTool.toolId}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px', marginTop: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET NAME</label>
                  <input type="text" value={editTool.name || ''} onChange={(e) => setEditTool({...editTool, name: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE ($)</label>
                  <input type="number" value={editTool.value || 0} onChange={(e) => setEditTool({...editTool, value: Number(e.target.value)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>CATEGORY</label>
                  <input type="text" value={editTool.category || ''} onChange={(e) => setEditTool({...editTool, category: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>LOCATION</label>
                  <input type="text" value={editTool.location || ''} onChange={(e) => setEditTool({...editTool, location: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>SERIAL / VIN</label>
                  <input type="text" value={editTool.serial || ''} onChange={(e) => setEditTool({...editTool, serial: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>MAX CUSTODY (0 = NO LIMIT)</label>
                  <input type="number" value={editTool.maxCheckoutDays === undefined ? '' : editTool.maxCheckoutDays} onChange={(e) => setEditTool({...editTool, maxCheckoutDays: e.target.value === '' ? '' : Number(e.target.value)})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>

              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <input type="text" value={editTool.link || ''} onChange={(e) => setEditTool({...editTool, link: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>PM ALERT (DAYS)</label>
                  <input type="number" value={editTool.pmInterval || (editTool.metrics?.find(m => m.unit === 'Days')?.interval || 90)} onChange={(e) => setEditTool({...editTool, pmInterval: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION OVERRIDE</label>
                  <select value={editTool.condition || 'New'} onChange={(e) => setEditTool({...editTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', flex: 1 }}>
                  <input type="checkbox" checked={editTool.isDispatchable !== false} onChange={(e) => setEditTool({...editTool, isDispatchable: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#374151', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '700' }}>Enable Field Checkout</span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>If disabled, this tool will be permanently locked to its home location.</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0,0.3)', flex: 1 }}>
                  <input type="checkbox" checked={editTool.isSpecialty || false} onChange={(e) => setEditTool({...editTool, isSpecialty: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#1f2937', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '700' }}>Specialty / High-Value</span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Enforces physical manifest audit upon return.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setEditModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
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
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}
  
      {/* INGEST TOOL MODAL */}
      {addModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: "32px", borderRadius: "16px", border: "1px solid #d1d5db", width: "800px", maxWidth: "90%", color: "#0a1b35", boxSizing: "border-box" }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '800', color: '#0a1b35', letterSpacing: '-0.02em' }}>INGEST NEW ASSET</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>BRAND (Single OR EMP KIT)</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input 
      list="prefix-options"
      placeholder="e.g. MILW, CAT, JD"
      value={newTool.prefix} 
      onChange={(e) => setNewTool({...newTool, prefix: e.target.value.toUpperCase()})} onFocus={() => { if(tutorialStep === 2) nextTourStep(3); }} 
      style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 2 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }}
    />
    {tutorialStep === 2 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 2: Start with the Brand!</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
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
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>REPLACEMENT VALUE ($)</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input 
      type="number" 
      placeholder="e.g. 45000" 
      value={newTool.value}
      onChange={(e) => setNewTool({...newTool, value: e.target.value})} onFocus={() => { if(tutorialStep === 3) nextTourStep(4); }}
      style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 3 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }}
    />
    {tutorialStep === 3 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 3: Enter replacement value!</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>{newTool.prefix?.toUpperCase() === "KIT" ? "NAME: KIT DESCRIPTION" : "ASSET NAME / MODEL"}</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input type="text" placeholder="e.g. Ford F-150 Fleet Truck" value={newTool.name} onChange={(e) => setNewTool({...newTool, name: e.target.value})} onFocus={() => { if(tutorialStep === 4) nextTourStep(5); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 4 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 4 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 4: Name it! (Other fields optional)</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION</label>
                  <select value={newTool.condition} onChange={(e) => setNewTool({...newTool, condition: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }}>
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>ASSET / TOOL CLASS / CATEGORY</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input list="category-options" placeholder={newTool.prefix?.toUpperCase() === "KIT" ? "Auto-assigned" : "e.g. HVAC, Power Tool"} value={newTool.prefix?.toUpperCase() === "KIT" ? "Standard Kit" : newTool.category} disabled={newTool.prefix?.toUpperCase() === "KIT"} onChange={(e) => setNewTool({...newTool, category: e.target.value})} onFocus={() => { if(tutorialStep === 5) nextTourStep(6); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 5 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', opacity: newTool.prefix?.toUpperCase() === "KIT" ? 0.5 : 1, transition: 'border 0.2s' }} />
    {tutorialStep === 5 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 5: Define the Category!</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
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
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>HOME LOCATION / ZONE / EMP TITLE</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input list="location-options" placeholder="e.g. Roof, Lot B" value={newTool.location} onChange={(e) => setNewTool({...newTool, location: e.target.value})} onFocus={() => { if(tutorialStep === 6) nextTourStep(7); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 6 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 6 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 6: Where does this live?</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
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
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>{newTool.prefix?.toUpperCase() === "KIT" ? "TRACKED ITEM SERIALS (IGNORE STANDARD GEAR)" : "SERIAL NUMBER / VIN"}</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input type="text" placeholder={newTool.prefix?.toUpperCase() === 'KIT' ? "e.g. Drill: SN123, Radio: SN456" : "e.g. 1FTEW1E49K..."} value={newTool.serial} onChange={(e) => setNewTool({...newTool, serial: e.target.value})} onFocus={() => { if(tutorialStep === 7) nextTourStep(8); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 7 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 7 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 7: Add Serial/VIN</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
                <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>EXTERNAL LINK / URL</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input type="text" placeholder="e.g. https://..." value={newTool.link} onChange={(e) => setNewTool({...newTool, link: e.target.value})} onFocus={() => { if(tutorialStep === 8) nextTourStep(9); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 8 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 8 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 8: Add a link (Optional)</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
              </div>

              {newTool.prefix?.toUpperCase() === 'KIT' && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.05em' }}>RAPID ASSIGN TO EMPLOYEE (OPTIONAL)</label>
                  <input type="text" placeholder="e.g. Sarah Connor (Leave blank to ingest to Tool Crib)" value={newTool.assignee || ''} onChange={(e) => setNewTool({...newTool, assignee: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0,0.5)', backgroundColor: 'rgba(0, 0, 0,0.08)', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
                  {newTool.assignee && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '8px', border: '1px solid #6b7280' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#4b5563', cursor: 'pointer', lineHeight: '1.4' }}>
                        <input type="checkbox" checked={ingestTerms} onChange={(e) => setIngestTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#6b7280', marginTop: '2px' }} />
                        I acknowledge receipt of this standard kit and accept full responsibility for its condition.
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: ingestTerms ? 1 : 0.4, pointerEvents: ingestTerms ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.05em' }}>DRAW SIGNATURE</label>
                          <button onClick={(e) => { e.preventDefault(); sigPad.current?.clear(); sigPad.current?.on();; }} type="button" style={{ background: 'transparent', border: 'none', color: '#1f2937', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>CLEAR PAD</button><button onClick={(e) => { e.preventDefault(); sigPad.current?.off(); }} type="button" style={{ background: 'transparent', border: 'none', color: '#374151', fontSize: '11px', cursor: 'pointer', fontWeight: '700', marginLeft: '16px' }}>LOCK PAD</button>
                        </div>
                        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                          <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'sigCanvas', style: { width: '100%', height: '80px', touchAction: 'none' }}} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(0, 0, 0,0.3)', marginTop: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.05em' }}>KIT MANIFEST PHOTO</label>
                           <span style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>Attach a photo of the complete kit contents. Must include standard issue:</span>
                       <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: '600', listStyleType: 'square' }}>
                         <li>Hard Hat & Safety Glasses</li>
                         <li>25ft Tape Measure</li>
                         <li>Multi-tool / Leatherman</li>
                         <li>High-Vis Safety Vest</li>
                       </ul>
                        </div>
                        <label htmlFor="ingest-photo" style={{ padding: '8px 16px', borderRadius: '6px', border: ingestPhoto ? '1px solid #374151' : '1px solid #6b7280', color: ingestPhoto ? '#374151' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: '800', backgroundColor: ingestPhoto ? 'rgba(0, 0, 0,0.1)' : 'transparent', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                          {ingestPhoto ? '✅ ' + ingestPhoto.name : ' UPLOAD PHOTO'}
                        </label>
                        <input type="file" id="ingest-photo" style={{ display: 'none' }} accept="image/*" onChange={async (e) => { if(e.target.files[0]) { const compressed = await compressImage(e.target.files[0]); setIngestPhoto(compressed); } }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>SET PM METRIC</label>
                  <select value={newTool.pmMetric} disabled style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#6b7280', fontSize: '15px', outline: 'none', cursor: 'not-allowed', WebkitAppearance: 'none' }}>
                    <option value="Days">Days</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>SET PM ALERT (DAYS)</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input type="number" placeholder="e.g. 90, 5000" value={newTool.pmInterval} onChange={(e) => setNewTool({...newTool, pmInterval: e.target.value})} onFocus={() => { if(tutorialStep === 9) nextTourStep(10); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 9 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 9 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 9: Set PM interval</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>MAX CUSTODY (0 = NO LIMIT)</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
    <input type="number" placeholder="0 = No Limit" value={newTool.maxCheckoutDays === undefined ? '' : newTool.maxCheckoutDays} onChange={(e) => setNewTool({...newTool, maxCheckoutDays: e.target.value})} onFocus={() => { if(tutorialStep === 10) nextTourStep(11); }} style={{ padding: '14px', borderRadius: '8px', border: tutorialStep === 10 ? '2px solid #0052cc' : '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none', transition: 'border 0.2s' }} />
    {tutorialStep === 10 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 10: Set custody limit</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
      </div>
    )}
  </div>
                </div>
              </div>

              
              
  
<div onClick={() => { if(tutorialStep === 11) nextTourStep(12); }} style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'stretch', borderRadius: '8px', boxShadow: tutorialStep === 11 ? '0 0 0 2px #0052cc' : 'none' }}>
              {tutorialStep === 11 && (
                <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
                  <div>Step 11: Set permissions</div>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
                </div>
              )}
              <div style={{ display: newTool.prefix?.toUpperCase() === 'KIT' ? 'none' : 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db', flex: 1 }}>
                <input type="checkbox" id="dispatchableToggle" checked={(newTool.prefix?.toUpperCase() === 'KIT' && newTool.assignee) ? true : newTool.isDispatchable} onChange={(e) => setNewTool({...newTool, isDispatchable: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#374151', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="dispatchableToggle" style={{ fontSize: '14px', color: '#1f2937', fontWeight: '700', cursor: 'pointer' }}>Enable Field Checkout</label>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>If disabled, this tool will be permanently locked to its home location.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0, 0, 0,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0,0.3)', flex: 1 }}>
                <input type="checkbox" id="specialtyToggle" checked={newTool.isSpecialty} onChange={(e) => setNewTool({...newTool, isSpecialty: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#1f2937', cursor: 'pointer' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {newTool.prefix?.toUpperCase() !== 'KIT' && (
              <label htmlFor="specialtyToggle" style={{ fontSize: '14px', color: '#1f2937', fontWeight: '700', cursor: 'pointer' }}>Specialty / High-Value</label>
            )}
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Enforces physical manifest audit upon return.</span>
                </div>
              </div>
            </div>

            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => { setAddModalOpen(false); setIngestTerms(false); setIngestPhoto(null); setNewTool({ prefix: '', name: '', value: '', category: '', location: '', serial: '', link: '', condition: 'New', pmMetric: 'Days', pmInterval: '90', maxCheckoutDays: '0', isDispatchable: true, isSpecialty: false, assignee: '' }); if(sigPad.current) sigPad.current.clear(); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
              <button onClick={() => { setConfirmIngestOpen(true); if(tutorialStep === 12) nextTourStep(13); }} disabled={!newTool.prefix || (!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: tutorialStep === 12 ? '0 0 0 4px rgba(0, 82, 204, 0.4)' : '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: ((!newTool.name && newTool.prefix?.toUpperCase() !== 'KIT') || !newTool.value) ? 0.4 : 1, transition: 'all 0.2s' }}>ADD TO INVENTORY</button>
              {tutorialStep === 12 && (
                <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
                  <div>Step 12: Save to database!</div>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      
      {/* CONFIRM INGEST MODAL */}
      {confirmIngestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 10000, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #1f2937', width: '600px', maxWidth: '90%', color: '#0a1b35', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Confirm Asset Details</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>Please review the entered information before committing to the database.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#e5e7eb', padding: '20px', borderRadius: '12px', border: '1px solid #d1d5db', marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>BRAND / PREFIX</span><div style={{ fontSize: '15px' }}>{newTool.prefix || 'N/A'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>VALUE</span><div style={{ fontSize: '15px', color: '#374151' }}>${newTool.value || '0'}</div></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>ASSET NAME</span><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{newTool.name || 'Standard Kit'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>CONDITION</span><div style={{ fontSize: '15px' }}>{newTool.condition}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>CATEGORY</span><div style={{ fontSize: '15px' }}>{newTool.category || 'General'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>LOCATION</span><div style={{ fontSize: '15px' }}>{newTool.location || 'Unassigned'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>SERIAL / VIN</span><div style={{ fontSize: '15px', fontFamily: 'monospace' }}>{newTool.serial || 'N/A'}</div></div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>LINK</span><div style={{ fontSize: '15px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newTool.link || 'None'}</div></div>
                
                <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #e5e7eb', margin: '8px 0' }}></div>
                
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>PM METRIC</span><div style={{ fontSize: '15px' }}>{newTool.pmMetric}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>PM INTERVAL</span><div style={{ fontSize: '15px' }}>{newTool.pmInterval || '90'}</div></div>
                <div><span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>MAX CUSTODY</span><div style={{ fontSize: '15px' }}>{newTool.maxCheckoutDays == 0 ? 'No Limit' : (newTool.maxCheckoutDays || '14') + ' Days'}</div></div>
                
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: newTool.isDispatchable ? '#374151' : '#9ca3af' }}>{newTool.isDispatchable ? 'YES' : 'NO'}</span>
                    <span style={{ fontSize: '13px' }}>Dispatchable</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: newTool.isSpecialty ? '#1f2937' : '#6b7280' }}>{newTool.isSpecialty ? 'YES' : 'NO'}</span>
                    <span style={{ fontSize: '13px' }}>Specialty / High-Value</span>
                  </div>
                </div>
                
                {newTool.assignee && (
                  <>
                    <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #e5e7eb', margin: '8px 0' }}></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800' }}>RAPID ASSIGNMENT TO:</span><div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>{newTool.assignee}</div></div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmIngestOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>Edit / Go Back</button>
              <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
              <button onClick={() => { setConfirmIngestOpen(false); handleAddTool(); if(tutorialStep === 13) nextTourStep(14); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>CONFIRM & SUBMIT</button>
              {tutorialStep === 13 && (
                <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 99999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
                  <div>Step 13: Confirm and save!</div>
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); endTour(); }} style={{ cursor: 'pointer', opacity: 0.8, fontSize: '10px', textDecoration: 'underline', marginLeft: '12px' }}>Skip</div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK INGEST MODAL */}
      {bulkModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', width: '800px', maxWidth: '90%', color: '#0a1b35', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Bulk Ingest Assets (CSV)</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>Upload a standard CSV file to rapidly deploy multiple tools into the matrix.</p>
            
            {!csvData.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', border: '2px dashed #e5e7eb', borderRadius: '12px', backgroundColor: '#e5e7eb', cursor: 'pointer', transition: 'border-color 0.2s' }} onClick={() => document.getElementById('csv-upload').click()}>
                    <span style={{ fontSize: '32px', marginBottom: '16px' }}></span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#0a1b35' }}>Click to Browse or Drag CSV Here</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>Expected columns: prefix, name, value, category, location</span>
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
                    <div style={{ padding: '16px', backgroundColor: '#e5e7eb', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>✅ {csvData.length} records parsed and staged for review</span>
                            <button onClick={() => setCsvData([])} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}>✕ CLEAR & RESTART</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #f3f4f6', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6' }}>
                                    <tr>
                                        {Object.keys(csvData[0]).map((key, i) => <th key={i} style={{ padding: '10px 12px', borderBottom: '1px solid #d1d5db', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.slice(0, 50).map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                                            {Object.values(row).map((val, j) => <td key={j} style={{ padding: '10px 12px', color: '#4b5563' }}>{val}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {csvData.length > 50 && <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>Showing first 50 records...</div>}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setBulkModalOpen(false); setCsvData([]); setIsUploading(false); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
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
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', opacity: (!csvData.length || isUploading) ? 0.4 : 1, transition: 'all 0.2s' }}>
                  {isUploading ? 'INGESTING TO AWS CLOUD...' : 'PUSH BATCH TO DATABASE'}
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* RAPID DISPATCH MODAL */}
      {checkoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", width: '500px', maxWidth: '90%', backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', color: '#0a1b35' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Dispatch Asset</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>Transferring custody of <strong style={{color: '#1f2937'}}>[{selectedTool?.toolId}]</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>EMPLOYEE / TECH NAME</label>
        <div style={{ position: 'relative' }}>
    <select value={dispatchUser} onChange={(e) => { setDispatchUser(e.target.value); if(tutorialStep === 15) nextTourStep(16); }} disabled={userRole === 'TECH'} style={{ padding: '14px', borderRadius: '8px', border: userRole === 'TECH' ? '1px solid #374151' : '1px solid #d1d5db', backgroundColor: userRole === 'TECH' ? 'rgba(0, 0, 0,0.05)' : '#f8f9fa', color: userRole === 'TECH' ? '#374151' : '#0a1b35', fontSize: '15px', outline: 'none', cursor: userRole === 'TECH' ? 'not-allowed' : 'pointer', WebkitAppearance: 'none', width: '100%' }}>
          <option value="" disabled>Select Authorized Personnel...</option>
          {personnel.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
          {(userRole === 'TECH' || (dispatchUser && !personnel.includes(dispatchUser))) && (
            <option value={dispatchUser}>{dispatchUser}</option>
          )}
        </select>
    {tutorialStep === 15 && (
      <div className="tour-float-y" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
        <div>Step 15: Select the technician taking custody</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(16); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', fontWeight: '800' }}>Next</div>
      </div>
    )}
  </div>
      </div>
      <div onClick={() => { if(tutorialStep === 16) nextTourStep(17); }} style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', boxShadow: tutorialStep === 16 ? '0 0 0 2px #0052cc' : 'none', borderRadius: '8px' }}>
    {tutorialStep === 16 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 16: Log outbound condition & notes</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(17); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', fontWeight: '800' }}>Next</div>
      </div>
    )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 250px', minWidth: '250px' }}>
          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>CONDITION</label>
          <select value={dispatchCondition} onChange={(e) => setDispatchCondition(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }}>
            <option value="New">New</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Damaged">Damaged / Missing Parts</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '2 1 250px', minWidth: '250px' }}>
          <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>DISPATCH NOTES</label>
          <input type="text" placeholder="e.g. Scratched case, missing battery..." value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
        </div>
      </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px dashed #d1d5db', marginBottom: '4px', marginTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <label style={{ fontSize: '11px', color: '#0a1b35', fontWeight: '800', letterSpacing: '0.05em' }}>OUTBOUND CONDITION PHOTO</label>
                   <span style={{ fontSize: '11px', color: '#6b7280' }}>Attach a photo of the asset prior to handoff. (Optional)</span>
                </div>
                <div style={{ position: 'relative' }}>
    <label htmlFor="dispatch-photo" style={{ padding: '8px 16px', borderRadius: '6px', border: dispatchPhoto ? '1px solid #374151' : '1px solid #d1d5db', color: dispatchPhoto ? '#ffffff' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: '800', backgroundColor: dispatchPhoto ? '#0a1b35' : '#ffffff', transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                  {dispatchPhoto ? '✅ ' + dispatchPhoto.name : '📷 UPLOAD PHOTO'}
                </label>
    {tutorialStep === 17 && (
      <div className="tour-float-y" style={{ position: 'absolute', top: '120%', right: '0', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '-6px', right: '16px', borderWidth: '0 6px 6px 6px', borderStyle: 'solid', borderColor: 'transparent transparent #0052cc transparent' }}></div>
        <div>Step 17: Attach a photo of the tool</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(18); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', fontWeight: '800' }}>Next</div>
      </div>
    )}
  </div>
                <input type="file" id="dispatch-photo" style={{ display: 'none' }} accept="image/*" onChange={async (e) => { if(e.target.files[0]) { const compressed = await compressImage(e.target.files[0]); setDispatchPhoto(compressed); } }} />
              </div>
              
              <div onClick={() => { if(tutorialStep === 18) nextTourStep(19); }} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '8px', border: tutorialStep === 18 ? '2px solid #0052cc' : '1px solid #d1d5db' }}>
    {tutorialStep === 18 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 18: Accept terms & sign</div>
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextTourStep(19); }} style={{ cursor: 'pointer', backgroundColor: '#ffffff', color: '#0052cc', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', fontWeight: '800' }}>Next</div>
      </div>
    )}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '13px', color: '#4b5563', cursor: 'pointer', lineHeight: '1.4' }}>
                  <input type="checkbox" checked={dispatchTerms} onChange={(e) => setDispatchTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#374151', marginTop: '2px' }} />
                  I acknowledge receipt of this asset and accept full responsibility for its condition and return.
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: dispatchTerms ? 1 : 0.4, pointerEvents: dispatchTerms ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>DRAW SIGNATURE</label>
                    <button onClick={() => { sigPad.current?.clear(); sigPad.current?.on(); }} style={{ background: 'transparent', border: 'none', color: '#1f2937', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>CLEAR PAD</button><button onClick={(e) => { e.preventDefault(); sigPad.current?.off(); }} type="button" style={{ background: 'transparent', border: 'none', color: '#374151', fontSize: '11px', cursor: 'pointer', fontWeight: '700', marginLeft: '16px' }}>LOCK PAD</button>
                  </div>
                  <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                    <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{className: 'sigCanvas', style: { width: '100%', height: '80px', touchAction: 'none' }}} />
                  </div>
                </div>
              </div>
              </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => { setCheckoutModalOpen(false); setDispatchUser(""); setDispatchCondition("Excellent"); setDispatchNotes(""); setDispatchTerms(false); setDispatchPhoto(null); if(sigPad.current) sigPad.current.clear(); }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
    <button onClick={() => { handleCheckout(); if(tutorialStep === 19) nextTourStep(20); }} disabled={!dispatchUser.trim() || !dispatchTerms} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', opacity: (dispatchUser.trim() && dispatchTerms) ? 1 : 0.4 }}>AUTHORIZE</button>
    {tutorialStep === 19 && (
      <div className="tour-float-y" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0052cc', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px 6px 0 6px', borderStyle: 'solid', borderColor: '#0052cc transparent transparent transparent' }}></div>
        <div>Step 19: Complete dispatch!</div>
      </div>
    )}
  </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS MODAL */}
      {alertsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', width: '500px', maxWidth: '90%', color: '#0a1b35' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Notification Preferences</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>Configure how and when the system alerts you.</p>
            {!dismissedTips['ALERTS'] && (
          <div className="animate-in" style={{ backgroundColor: '#0052cc', color: '#fff', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,82,204,0.3)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🔔</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Configure AWS SNS Alerts!</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>Set up your automated digest frequency. The system will alert you to custody violations, damage flags, and low stock.</div>
              </div>
            </div>
            <button onClick={() => dismissTip('ALERTS')} style={{ backgroundColor: '#ffffff', color: '#0052cc', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}>Got it!</button>
          </div>
        )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>TARGET EMAIL</label>
                <input type="email" value={alertPrefs.email} onChange={(e) => setAlertPrefs({...alertPrefs, email: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>DIGEST FREQUENCY</label>
                <select value={alertPrefs.frequency} onChange={(e) => setAlertPrefs({...alertPrefs, frequency: e.target.value})} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontSize: '15px', outline: 'none' }}>
                  <option value="Instant">Instant (On Event)</option>
                  <option value="Hourly">Hourly Batch (Top of Hour)</option>
                  <option value="Daily Digest">Daily Morning Digest (7:00 AM)</option>
                  <option value="Daily EOD">Daily End-of-Day (5:00 PM)</option>
                  <option value="Weekly Digest">Weekly Summary (Friday 5PM)</option>
                  <option value="Monthly 1st">1st of the Month (8:00 AM)</option>
                  <option value="Monthly EOM">End of the Month (5:00 PM)</option>
                  <option value="Muted">Muted (No Emails)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#e5e7eb', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>ALERT TRIGGERS</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyDamaged} onChange={(e) => setAlertPrefs({...alertPrefs, notifyDamaged: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#9ca3af' }} />
                  Tool Flagged as Damaged 
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyOverdue} onChange={(e) => setAlertPrefs({...alertPrefs, notifyOverdue: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#1f2937' }} />
                  PM Service Interval Overdue 
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyNew} onChange={(e) => setAlertPrefs({...alertPrefs, notifyNew: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#374151' }} />
                  New Tool Ingested 
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyCustody} onChange={(e) => setAlertPrefs({...alertPrefs, notifyCustody: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#0a1b35' }} />
                  Asset Overdue for Return (Custody Violation) 
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyHighValue} onChange={(e) => setAlertPrefs({...alertPrefs, notifyHighValue: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#4b5563' }} />
                  Specialty/High-Value Asset Movement 
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={alertPrefs.notifyLowStock} onChange={(e) => setAlertPrefs({...alertPrefs, notifyLowStock: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: '#6b7280' }} />
                  Consumables Low-Stock Warning 
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => setAlertsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>SAVE PREFERENCES</button>
            </div>
          </div>
        </div>
      )}
    
      {/* RETURN AUDIT MODAL */}
      {returnModalOpen && selectedTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', width: '500px', maxWidth: '90%', color: '#0a1b35' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937', letterSpacing: '-0.02em' }}>Audit Required</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>Confirm the manifest for high-value tool <strong style={{color: '#0a1b35'}}>[{selectedTool.toolId}]</strong></p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {Object.keys(returnChecklist).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: returnChecklist[key] ? '#374151' : '#0a1b35', cursor: 'pointer', padding: '16px', backgroundColor: '#e5e7eb', borderRadius: '8px', border: returnChecklist[key] ? '1px solid #374151' : '1px solid #d1d5db', margin: 0, fontWeight: '600' }}>
                  <input type="checkbox" checked={returnChecklist[key]} onChange={(e) => setReturnChecklist({...returnChecklist, [key]: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: '#374151', margin: 0 }} />
                  {key === 'primary' ? 'Primary Tool Body' : key === 'battery' ? 'Battery / Power Unit' : 'All Provided Accessories'}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={() => setReturnModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#e5e7eb', color: '#0a1b35', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                const allChecked = Object.values(returnChecklist).every(Boolean);
                const condition = allChecked ? selectedTool.condition : "Damaged";
                const action = allChecked ? "Audited & Returned" : "Returned Incomplete/Damaged ";
                executeReturn(selectedTool, condition, action);
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: Object.values(returnChecklist).every(Boolean) ? '#0a1b35' : '#9ca3af', color: Object.values(returnChecklist).every(Boolean) ? '#ffffff' : '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                {Object.values(returnChecklist).every(Boolean) ? "CONFIRM SECURE RETURN" : "FLAG AS INCOMPLETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* FINANCIAL MODAL */}
      {financeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', width: '800px', maxWidth: '90%', color: '#0a1b35' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#0a1b35' }}>Fleet Financial Summary</h2>
                <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Capital expenditure and current deployment valuation.</p>
              </div>
              <button onClick={() => setFinanceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e5e7eb', padding: '24px', borderRadius: '12px', border: '1px solid #d1d5db', flexDirection: 'row' }}>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>TOTAL FLEET TOOL VALUE</span>
                <span className="hud-stat-value" style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0a1b35' }}>${totalValue.toLocaleString()}</span>
              </div>
              <div className="hud-divider" style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }}></div>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>VALUE DEPLOYED IN FIELD</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b7280' }}></span>
                  <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#6b7280' }}>${deployedValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#6b7280' }}>({deployedTools.length} Units)</span></span>
                </div>
              </div>
              <div className="hud-divider" style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }}></div>
              <div className="hud-stat-block">
                <span className="hud-stat-label" style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>SECURED IN TOOL CRIB</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0a1b35' }}></span>
                  <span className="hud-stat-value" style={{ fontSize: '24px', fontWeight: '700', color: '#374151' }}>${cribValue.toLocaleString()} <span style={{ fontSize: '12px', color: '#6b7280' }}>({tools.length - deployedTools.length} Units)</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* OPERATIONS GUIDE MODAL */}
      {guideModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, overflowY: 'auto', padding: '5vh 0', display: 'block' }}>
          <div className="modal-container" style={{ margin: "0 auto", maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #d1d5db', width: '600px', maxWidth: '90%', color: '#0a1b35', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em', color: '#0a1b35' }}>Kinetic Tools Operations Guide</h2>
              </div>
              <button onClick={() => setGuideModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
              
              <div style={{ backgroundColor: '#e5e7eb', padding: '20px', borderRadius: '12px', border: '1px solid #d1d5db' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1f2937', letterSpacing: '0.05em', textTransform: 'uppercase' }}>👷 FIELD TECHNICIAN PROTOCOLS</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong style={{color: '#0a1b35'}}>🔍 Locating Equipment:</strong> Use the search bar in the <em>FLEET DISPATCH</em> view to instantly find a specific tool by its ID, Tag, or Category.</li>
                  <li><strong style={{color: '#0a1b35'}}> Checking Tools Out/In:</strong> When taking a tool to the field, click <em>CHECK OUT</em>. When returning it to the crib, click <em>RETURN</em> to clear your liability and mark it IN-STOCK.</li>
                  <li><strong style={{color: '#0a1b35'}}> Reporting Damage:</strong> If a tool is broken or missing components upon return, click <em>REPORT DAMAGE / FAULT</em> so the Admin team knows to pull it for maintenance.</li>
                </ul>
              </div>

              <div style={{ backgroundColor: '#e5e7eb', padding: '20px', borderRadius: '12px', border: '1px solid #d1d5db' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>👨‍💻 ADMINISTRATOR PROTOCOLS</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong style={{color: '#0a1b35'}}>📥 Ingesting Inventory:</strong> Use <em>+ SINGLE</em> to manually create a profile for a newly purchased tool, or <em>+ BULK CSV</em> to upload an entire pallet.</li>
                  <li><strong style={{color: '#0a1b35'}}> Maintenance Hub:</strong> Track preventative maintenance (PM) schedules. See what tools are due for service, log repairs, and reset their service timers.</li>
                  <li><strong style={{color: '#0a1b35'}}> Master Ledger:</strong> View the complete history of every tool checkout, return, and status change across the entire company.</li>
                  <li><strong style={{color: '#0a1b35'}}> Alerts &  Finance:</strong> Configure your automatic AWS email routing for offline/missing tools, and monitor the real-time financial depreciation of the active fleet.</li>
                </ul>
              </div>

            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { 
                  if(window.confirm("This will reset all onboarding tutorials and contextual tips. Continue?")) {
                      setGuideModalOpen(false); 
                      setTutorialStep(1); 
                      localStorage.setItem('kinetic_tour', 1); 
                      if (typeof setDismissedTips === 'function') {
                          setDismissedTips({}); 
                          localStorage.removeItem('kinetic_tips'); 
                      }
                  }
              }} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                ↺ RESTART TUTORIALS
              </button>
              <button onClick={() => setGuideModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#ffffff', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                CLOSE GUIDE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tools;
