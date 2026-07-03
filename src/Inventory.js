import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanCommand, UpdateCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from './dynamoClient';

const initialMockData = [
  { barcode: "082123456781", lotNumber: "LOT-2026-01", expiryDate: "2026-10-15", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "100% Orange Juice Concentrate", type: "", quantity: 420, zone: "Cooler Bay-01" },
  { barcode: "082123456782", lotNumber: "LOT-2026-02", expiryDate: "2026-11-01", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Apple Juice Premium", type: "", quantity: 180, zone: "Cooler Bay-01" },
  { barcode: "082123456783", lotNumber: "LOT-2026-03", expiryDate: "2027-01-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 310, zone: "Dry Aisle A" },
  { barcode: "082123456783-OLD", lotNumber: "LOT-2025-11", expiryDate: "2026-08-10", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 45, zone: "Dry Aisle B" },
  { barcode: "082123456784", lotNumber: "LOT-2026-04", expiryDate: "2026-12-05", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Craft Lemonade Base", type: "", quantity: 35, zone: "Dry Aisle B" },
  { barcode: "082123456785", lotNumber: "LOT-2026-05", expiryDate: "2027-03-10", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Vanilla Cold Brew RTD", type: "24-Can Case", quantity: 300, zone: "Dry Aisle C" }
];

const MANAGER_PIN = "1234";


const CustomAutocomplete = ({ value, onChange, placeholder, options, style }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: 'relative', flex: style.flex || 'unset', width: '100%' }}>
      <input 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        onFocus={() => setShow(true)} 
        onBlur={() => setTimeout(() => setShow(false), 200)} 
        placeholder={placeholder} 
        style={{ ...style, width: '100%', boxSizing: 'border-box', fontSize: '16px' }} 
      />
      {show && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10000, backgroundColor: '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', marginTop: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
          {options.filter(o => (o.label||'').toLowerCase().includes((value||'').toLowerCase())).map((o, i) => (
            <div key={i} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setShow(false); }} style={{ padding: '14px 16px', borderBottom: '1px solid #3a3a3c', color: '#fff', fontSize: '15px', cursor: 'pointer', backgroundColor: '#2c2c2e' }}>
              {o.label}
            </div>
          ))}
          {options.filter(o => (o.label||'').toLowerCase().includes((value||'').toLowerCase())).length === 0 && (
            <div style={{ padding: '14px 16px', color: '#8e8e93', fontSize: '15px', fontStyle: 'italic' }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Inventory({ user }) {
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
  }, []);
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPalletMode, setIsPalletMode] = useState(false);
  const [customQty, setCustomQty] = useState(1);
  const [scanMode, setScanMode] = useState("receive");
  const [activeZone, setActiveZone] = useState("Unassigned Warehouse");
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");
  
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ barcode: "", brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: 1, zone: "" });

    const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastScan, setLastScan] = useState({ code: null, time: 0 });
  const [pendingAction, setPendingAction] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  const [flippedCards, setFlippedCards] = useState([]);
  const [expandedCards, setExpandedCards] = useState([]);
  const [isMultiFlipMode, setIsMultiFlipMode] = useState(false);

  const [editModes, setEditModes] = useState({});
  const [editForms, setEditForms] = useState({});

  const [pinModal, setPinModal] = useState({ isOpen: false, callback: null, error: false });
  const [pinInput, setPinInput] = useState("");
  
  const [printLabelItem, setPrintLabelItem] = useState(null);

  const totalBoxes = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeFlavorsCount = new Set(stock.map(item => item.flavor)).size;
  const lowStockItems = stock.filter(item => item.quantity < 50);

  const filteredStock = stock.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    
    // 1. Deep Text Sweep (Checks literally every string field on the card)
    const textMatch = [
      item.flavor, item.brand, item.zone, item.barcode, 
      item.type, item.lotNumber, item.vendorEmail, item.expiryDate
    ].some(field => field && String(field).toLowerCase().includes(term));
    
    if (textMatch) return true;

    // 2. Smart "Today" & Time Engine
    if (term.includes("today") || term.includes("recent")) {
      const todayString = new Date().toDateString();
      if (item.recentScans && item.recentScans.some(scan => new Date(scan.timestamp).toDateString() === todayString)) {
        return true;
      }
    }

    // 3. Status & KPI Keywords
    if ((term === "low" || term === "low stock" || term === "warning") && item.quantity > 0 && item.quantity < 50) return true;
    if ((term === "out" || term === "empty" || term === "depleted") && item.quantity === 0) return true;

    // 4. Auto-Archive Engine (Hides cards at 0 stock for > 24hrs)
    if (item.quantity === 0 && item.lastScanTimestamp && (Date.now() - item.lastScanTimestamp > 86400000)) return false;
    
    return false;
  });

  // 🔥 DYNAMIC MEMORY ENGINE: Pulls core presets + any email saved to DynamoDB
  const uniqueVendors = [...new Set([
    "purchasing@csgroup.com",
    "orders@citrussprings.com",
    "wholesale@coolattitudes.com",
    "distro@twistedbranch.com",
    "supply@madrinas.com",
    ...stock.map(item => item.vendorEmail).filter(Boolean)
  ])];

  const requireManager = (callbackAction) => {
    setPinInput("");
    setPinModal({ isOpen: true, callback: callbackAction, error: false });
  };

  const submitPin = () => {
    if (pinInput === MANAGER_PIN) {
      if (pinModal.callback) pinModal.callback();
      setPinModal({ isOpen: false, callback: null, error: false });
    } else {
      setPinModal(prev => ({ ...prev, error: true }));
      setPinInput("");
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await docClient.send(new ScanCommand({ TableName: "BeverageInventoryData" }));
      if (response.Items && response.Items.length > 0) {
        setStock(response.Items);
      } else {
        await Promise.all(initialMockData.map(item => docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))));
        setStock(initialMockData);
      }
    } catch (err) { console.error("DynamoDB Fetch Error:", err); }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await docClient.send(new ScanCommand({ TableName: "BeverageAuditLogs" }));
      if (response.Items) setAuditLog(response.Items.sort((a, b) => b.id - a.id));
    } catch (err) { console.error("Failed to fetch historical audit logs:", err); }
  };

  useEffect(() => {
    fetchInventory();
    fetchAuditLogs();
    const interval = setInterval(() => { fetchInventory(); fetchAuditLogs(); }, 3000);
    
    // 🔥 Wake-Up Engine: Force sync when tab regains focus (bypasses browser throttling)
    const handleFocus = () => { fetchInventory(); fetchAuditLogs(); };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const processScannedCode = async (rawScan) => {
    const cleanScan = String(rawScan).trim();
    if (cleanScan.startsWith("ZONE-") || cleanScan.startsWith("BAY-")) {
      setActiveZone(cleanScan);
      setScanFeedback(`📍 Location Locked: New items will be routed to ${cleanScan}`);
      setTimeout(() => setScanFeedback(""), 4000);
      return;
    }
    const parsedQty = parseInt(customQty) || 1;
    const boxAdjustment = isPalletMode ? 70 * parsedQty : parsedQty;
    const targetItem = stock.find(item => item.barcode === cleanScan || cleanScan.includes(item.barcode) || item.barcode.includes(cleanScan));

    if (targetItem) {
      const newQuantity = scanMode === "receive" ? targetItem.quantity + boxAdjustment : Math.max(0, targetItem.quantity - boxAdjustment);
      const newZone = (scanMode === "receive" && activeZone !== "Unassigned Warehouse") ? activeZone : targetItem.zone;
      
      let fifoWarningItem = null;
      if (scanMode === "ship") {
        const olderLots = stock.filter(i => 
          i.flavor === targetItem.flavor && 
          i.quantity > 0 && 
          new Date(i.expiryDate) < new Date(targetItem.expiryDate)
        );
        if (olderLots.length > 0) {
          olderLots.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          fifoWarningItem = olderLots[0]; 
        }
      }

      setModalQty(boxAdjustment);
      setPendingAction({ targetItem, boxAdjustment, newQuantity, newZone, actionName: scanMode === "receive" ? "📥 Receive" : (scanMode === "transfer" ? "🔄 Transfer" : "🚚 Ship"), fifoWarningItem, isShrinkage: false });
      setShowConfirmModal(true);
    } else {
      setNewItemForm({ barcode: cleanScan, brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: boxAdjustment, zone: activeZone !== "Unassigned Warehouse" ? activeZone : "Unassigned Warehouse" });
      setShowNewItemModal(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    let { targetItem, newZone, actionName, isShrinkage } = pendingAction;
    if (isShrinkage) actionName = "💥 Shrinkage";
    const boxAdjustment = modalQty;

    // Initialize the locations array if it's an older single-zone card
    let updatedLocations = targetItem.locations || [{ name: targetItem.zone || "Unassigned Warehouse", qty: targetItem.quantity }];

    if (actionName === "🔄 Transfer" && newZone) {
        // Strict FIFO Check: Does this zone contain an older lot?
        const fifoViolation = stock.some(s => 
            s.flavor === targetItem.flavor && 
            s.barcode !== targetItem.barcode && 
            s.quantity > 0 &&
            (s.locations || []).some(l => l.name === newZone) && 
            new Date(s.expiryDate || "2099-12-31") < new Date(targetItem.expiryDate || "2099-12-31")
        );
        
        if (fifoViolation) {
            alert("🛑 FIFO VIOLATION: " + newZone + " already contains an older lot of " + targetItem.flavor + ". Please select a different placement zone to prevent pallet trapping.");
            return; // Hard stop
        }
        // Find the largest pool of stock to deduct from automatically
        let source = updatedLocations.reduce((prev, current) => (prev.qty > current.qty) ? prev : current);
        source.qty = Math.max(0, source.qty - boxAdjustment);
        
        // Add the stock to the new zone
        let dest = updatedLocations.find(loc => loc.name === newZone);
        if (dest) dest.qty += boxAdjustment;
        else updatedLocations.push({ name: newZone, qty: boxAdjustment });
    } else if (scanMode === "receive") {
        let destName = newZone || targetItem.zone || "Unassigned Warehouse";
        let dest = updatedLocations.find(loc => loc.name === destName);
        if (dest) dest.qty += boxAdjustment;
        else updatedLocations.push({ name: destName, qty: boxAdjustment });
    } else {
        // Shipping or Shrinkage: Deduct from the primary zone
        let source = updatedLocations.reduce((prev, current) => (prev.qty > current.qty) ? prev : current);
        source.qty = Math.max(0, source.qty - boxAdjustment);
    }

    // Clean up empty zones so they disappear from the UI
    updatedLocations = updatedLocations.filter(loc => loc.qty > 0);
    const newQuantity = updatedLocations.reduce((sum, loc) => sum + loc.qty, 0);
    
    const logEntry = { id: Date.now(), time: new Date().toLocaleString(), user: user?.email || "Operator", action: actionName.replace(/[^a-zA-Z]/g, ""), qty: boxAdjustment, flavor: targetItem.flavor };
    setAuditLog(prev => [logEntry, ...prev]);

    const newScan = { action: logEntry.action, qty: boxAdjustment, time: logEntry.time, timestamp: logEntry.id };
    const updatedScans = [newScan, ...(targetItem.recentScans || [])].slice(0, 5);

    setStock(prevStock => prevStock.map(item => item.barcode === targetItem.barcode ? { ...item, quantity: newQuantity, locations: updatedLocations, zone: newZone || item.zone, recentScans: updatedScans } : item));
    setScanFeedback(`✅ ${logEntry.action} ${boxAdjustment} boxes of ${targetItem.flavor}`);
    setShowConfirmModal(false); setPendingAction(null);

    try { await docClient.send(new UpdateCommand({ TableName: "BeverageInventoryData", Key: { barcode: targetItem.barcode, lotNumber: targetItem.lotNumber }, UpdateExpression: "SET quantity = :q, #z = :z, recentScans = :rs, locations = :locs", ExpressionAttributeNames: { "#z": "zone" }, ExpressionAttributeValues: { ":q": newQuantity, ":z": newZone || targetItem.zone, ":rs": updatedScans, ":locs": updatedLocations } })); } 
    catch (err) { console.error("Inventory cloud update failed:", err); }
    try { await docClient.send(new PutCommand({ TableName: "BeverageAuditLogs", Item: logEntry })); } 
    catch (err) { console.error("Audit log cloud sync failed:", err); }
    setTimeout(() => setScanFeedback(""), 4000);
  };

  const handleManualAdd = () => { setNewItemForm({ barcode: "", brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: 0, zone: "" }); setShowNewItemModal(true); };
  const handleSaveNewItem = () => { if (!newItemForm.barcode || !newItemForm.flavor || !newItemForm.lotNumber) return alert("Required fields missing."); executeSaveNewItem(); };

  const executeSaveNewItem = async () => {
    setStock(prev => { const exists = prev.find(i => i.barcode === newItemForm.barcode); return exists ? prev : [...prev, newItemForm]; });
    setShowNewItemModal(false); setShowRegisterConfirm(false); 
    setScanFeedback(`✅ 📥 Registered Product: ${newItemForm.flavor}`);
    setTimeout(() => setScanFeedback(""), 4000);
    try { await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: newItemForm })); } catch (err) { console.error("Failed to register:", err); }
  };

  const handleSaveCardEdit = async (barcode) => {
    const form = editForms[barcode];
    const originalItem = stock.find(i => i.barcode === barcode);
    if (!form) { alert("Error: Form is empty."); return; }
    if (!originalItem) { alert("Error: Item not found."); return; }

    // Reconcile Multi-Zone Arrays with the manual quantity edit
    let locSource = Array.isArray(originalItem.locations) ? originalItem.locations : [{name: originalItem.zone || "Unassigned", qty: originalItem.quantity}];
    let updatedLocs = JSON.parse(JSON.stringify(locSource));
    let diff = (parseInt(form.quantity) || 0) - (parseInt(originalItem.quantity) || 0);
    if (diff !== 0) {
        let targetLoc = updatedLocs.find(l => l.name === form.zone);
        if (targetLoc) targetLoc.qty = Math.max(0, targetLoc.qty + diff);
        else if (updatedLocs.length > 0) updatedLocs[0].qty = Math.max(0, updatedLocs[0].qty + diff);
        else updatedLocs.push({name: form.zone || "Unassigned", qty: form.quantity});
    }
    form.locations = updatedLocs;

    const logEntry = { id: Date.now(), time: new Date().toLocaleString(), user: user?.email || "Manager", action: "Admin Override", qty: form.quantity - originalItem.quantity, flavor: originalItem.flavor };
    setAuditLog(prev => [logEntry, ...prev]);

    setStock(prev => prev.map(item => item.barcode === barcode ? { ...item, ...form } : item));
    setEditModes(prev => ({...prev, [barcode]: false}));

    try {
      if (form.lotNumber !== originalItem.lotNumber) {
        await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: { ...originalItem, ...form } }));
        await docClient.send(new DeleteCommand({ TableName: "BeverageInventoryData", Key: { barcode: originalItem.barcode, lotNumber: originalItem.lotNumber } }));
      } else {
        // Scrub undefined variables that cause DynamoDB to crash and save the whole item
        const itemToSave = { ...originalItem, ...form };
        Object.keys(itemToSave).forEach(key => itemToSave[key] === undefined && delete itemToSave[key]);
        await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: itemToSave }));
      }
      await docClient.send(new PutCommand({ TableName: "BeverageAuditLogs", Item: logEntry }));
    } catch (err) { console.error("Admin edit cloud update failed:", err); }
  };

  const handleExportCSV = () => {
    const headers = ["Brand", "Flavor", "Packaging Type", "Current Count", "Warehouse Zone", "Lot Number", "Expiry Date", "Vendor Route"];
    const csvRows = [headers.join(",")];
    stock.forEach(item => { csvRows.push([ `"${item.brand}"`, `"${item.flavor}"`, `"${item.type}"`, item.quantity, `"${item.zone}"`, `"${item.lotNumber}"`, `"${item.expiryDate}"`, `"${item.vendorEmail}"` ].join(",")); });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `CS_Inventory_Snapshot_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const processRef = useRef(); processRef.current = processScannedCode;
  useEffect(() => {
    let qrCodeInstance;
    if (isScanning) {
      setTimeout(() => {
        qrCodeInstance = new Html5Qrcode("reader");
        qrCodeInstance.start(
          { facingMode: "environment" }, 
          { fps: 30, qrbox: { width: 300, height: 150 }, aspectRatio: 1.777778 },
          (decodedText) => {
            qrCodeInstance.stop().then(() => {
              setIsScanning(false);
              if (processRef.current) processRef.current(decodedText);
            }).catch(e => console.log(e));
          },
          (error) => { }
        ).catch(err => {
          console.error("Camera start error:", err);
          setIsScanning(false);
          alert("Unable to access rear camera. Please ensure permissions are granted.");
        });
      }, 100);
    }
    return () => {
      if (qrCodeInstance) {
        try { qrCodeInstance.stop().catch(e => {}); } catch(e) {}
      }
    };
  }, [isScanning]);

  const vendorsToAlert = [...new Set(lowStockItems.map(i => i.vendorEmail || "purchasing@csgroup.com"))];

  return (
    <div className="inventory-container print-hide" style={{ backgroundColor: "#1c1c1e", color: "#ffffff", minHeight: "100vh", padding: "32px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) { 
          .inventory-container { padding: 16px !important; } 
          .header-stack { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } 
          .toolbar-stack { flex-direction: column !important; align-items: stretch !important; } 
          .search-group { max-width: 100% !important; }
          .action-group-right { width: 100% !important; align-items: stretch !important; }
          .primary-row { justify-content: space-between !important; gap: 6px !important; flex-wrap: nowrap !important; width: 100% !important; }
          .primary-row > * { padding: 10px 8px !important; font-size: 13px !important; flex: 1; display: flex; justify-content: center; }
          .qty-box { padding: 4px !important; gap: 4px !important; }
          .hide-mobile { display: none !important; } 
          .qty-box input { width: 100% !important; max-width: 40px !important; font-size: 14px !important; }
          .secondary-row { width: 100% !important; justify-content: space-between !important; gap: 8px !important; margin-top: 8px !important; }
          .secondary-row > button { flex: 1; }
        }
        #reader { border: 2px solid #007aff !important; border-radius: 16px; overflow: hidden; background: #000; display: flex; justify-content: center; }
        #reader video { border-radius: 14px; object-fit: cover; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #1c1c1e; } ::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 4px; }
        
        @media print {
          body * { visibility: hidden; }
          #printable-label, #printable-label * { visibility: visible; }
          #printable-label { position: absolute; left: 0; top: 0; width: 100%; max-width: 4in; height: 6in; margin: 0; padding: 16px; background: white; color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;}
          .no-print { display: none !important; }
        }
      `}</style>

      {/* 🔥 DYNAMIC VENDOR DATALIST */}
      <datalist id="vendor-emails">
        {uniqueVendors.map(email => <option key={email} value={email} />)}
      </datalist>

      {/* HEADER & ALERTS */}
      <div className="header-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em" }}>📦 Commercial Beverage Operations <button onClick={() => setShowHelpModal(true)} style={{ marginLeft: '16px', backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', color: '#007aff', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', verticalAlign: 'middle' }}>📖 Guide</button></h1>
          <p style={{ margin: "4px 0 0 0", color: "#8e8e93", fontSize: "14px" }}>Active Operator: {user?.email || "Scanner Mode Active"}</p>
        </div>
        <div style={{ display: "flex", backgroundColor: "#2c2c2e", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          <button onClick={() => { if (scanMode !== "receive") setPendingModeSwitch("receive"); }} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "receive" ? "#34c759" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>📥 Receive</button>
          <button onClick={() => { if (scanMode !== "ship") setPendingModeSwitch("ship"); }} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "ship" ? "#ff3b30" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>🚚 Ship</button>
        <button onClick={() => { if (scanMode !== "transfer") setPendingModeSwitch("transfer"); }} style={{ backgroundColor: typeof scanMode !== "undefined" && scanMode === "transfer" ? "#007aff" : "transparent", color: typeof scanMode !== "undefined" && scanMode === "transfer" ? "#fff" : "#8e8e93", border: "1px solid #3a3a3c", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", marginLeft: "8px" }}>🔄 Transfer</button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ backgroundColor: "rgba(255, 149, 0, 0.15)", border: "1px solid rgba(255, 149, 0, 0.4)", borderRadius: "16px", padding: "20px", marginBottom: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "100%" }}>
            <style>{`
  details.hide-summary-marker > summary::-webkit-details-marker { display: none; }
  details.hide-summary-marker .accordion-toggle::after { content: "Tap to view details ▾"; }
  details.hide-summary-marker[open] .accordion-toggle::after { content: "Tap to Close ▴"; }
`}</style>
            <details style={{ cursor: "pointer" }} className="hide-summary-marker">
              <summary style={{ display: "flex", alignItems: "center", gap: "12px", outline: "none", listStyle: "none" }}>
                <span style={{ fontSize: "28px", lineHeight: "1" }}>⚠️</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <h4 style={{ margin: 0, color: "#ff9500", fontSize: "18px", fontWeight: "700" }}>Critical Stock Alert</h4>
                  <span style={{ color: "#ffffff", fontSize: "14px", marginTop: "2px" }}>
                    <strong style={{ color: "#ff9500" }}>{lowStockItems.length}</strong> items require attention. <span style={{ color: "#ff9500", marginLeft: "4px" }} className="accordion-toggle"></span>
                  </span>
                </div>
              </summary>
              <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                {lowStockItems.map(i => (
                  <div key={i.barcode} style={{ backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,149,0,0.2)", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.5px" }}>{i.brand}</span>
                    <strong style={{ color: "#ffffff", fontSize: "14px" }}>{i.flavor}</strong>
                    <span style={{ color: "#ff3b30", fontSize: "13px", fontWeight: "bold", marginTop: "4px" }}>{i.quantity} bx remaining</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {vendorsToAlert.map(vendorEmail => {
              const vendorSpecificItems = lowStockItems.filter(i => (i.vendorEmail || "purchasing@csgroup.com") === vendorEmail);
              const body = "Please process a replenishment order for the following low-stock items:%0D%0A%0D%0A" + vendorSpecificItems.map(i => `[ ] ${i.flavor} - Only ${i.quantity} boxes remaining (Zone: ${i.zone})`).join("%0D%0A") + "%0D%0A%0D%0A- Generated by Kinetic Cards Inventory System";
              return (
                <button 
                  key={vendorEmail}
                  onClick={() => { window.location.href = `mailto:${vendorEmail}?subject=URGENT: PO Request - Warehouse Restock Required&body=${body}`; }} 
                  style={{ backgroundColor: "#ff9500", color: "#ffffff", border: "none", padding: "12px 16px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
                >
                  ✉️ PO to {vendorEmail.split('@')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}><div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>TOTAL WAREHOUSE STOCK</div><div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px", color: "#34c759" }}>{totalBoxes.toLocaleString()} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Boxes</span></div></div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}><div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>ACTIVE FLAVOR VARIETIES</div><div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px" }}>{activeFlavorsCount} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Flavors</span></div></div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}><div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>ACTIVE PLACEMENT ZONE</div><div style={{ fontSize: "28px", fontWeight: "700", marginTop: "12px", color: activeZone.includes("Unassigned") ? "#ff9500" : "#007aff" }}>{activeZone.replace("ZONE-", "").replace("BAY-", "")}</div></div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-stack" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", padding: "16px", backgroundColor: "#242426", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
        <div className="search-group" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "280px" }}>
          <input type="text" placeholder="🔎 Filter Inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "14px 16px", width: "100%", boxSizing: "border-box", color: "#ffffff" }} />
          <button onClick={() => { setIsMultiFlipMode(!isMultiFlipMode); if (isMultiFlipMode) setFlippedCards([]); }} style={{ backgroundColor: isMultiFlipMode ? "rgba(0, 122, 255, 0.15)" : "#1c1c1e", border: isMultiFlipMode ? "1px solid #007aff" : "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: isMultiFlipMode ? "#007aff" : "#ffffff", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", width: "100%" }}>
            🔄 Multi-Flip {isMultiFlipMode ? "ON" : "OFF"}
          </button>
          <button onClick={handleManualAdd} style={{ backgroundColor: "#34c759", border: "none", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", width: "100%", marginTop: "4px", boxShadow: "0 4px 14px rgba(52, 199, 89, 0.3)" }}>➕ Register New Product</button>
        </div>
        <div className="action-group-right" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "1", alignItems: "flex-end" }}>
          <div className="primary-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div className="qty-box" style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "4px 12px" }}>
              <span className="hide-mobile" style={{ color: "#8e8e93", fontSize: "14px", fontWeight: "600" }}>QTY:</span>
              <input type="number" min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} style={{ width: "40px", backgroundColor: "transparent", border: "none", color: "#ffffff", fontSize: "16px", fontWeight: "700", outline: "none", textAlign: "center" }} />
            </div>
            <button onClick={() => setIsPalletMode(!isPalletMode)} style={{ backgroundColor: isPalletMode ? "rgba(255, 149, 0, 0.15)" : "#1c1c1e", border: isPalletMode ? "1px solid #ff9500" : "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: isPalletMode ? "#ff9500" : "#ffffff", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>🪵 {isPalletMode ? `${70 * (parseInt(customQty) || 1)} Boxes` : "Single"}</button>
            
            <button onClick={() => setIsScanning(true)} style={{ backgroundColor: "#007aff", border: "none", padding: "12px 24px", borderRadius: "12px", color: "#ffffff", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>📷 SCAN</button>
          </div>
          <div className="secondary-row" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button onClick={() => requireManager(() => setShowAuditModal(true))} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>📋 Security Audit</button>
            <button onClick={handleExportCSV} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>📥 CSV</button>
          </div>
        </div>
      </div>

      {/* FLIPPABLE KINETIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
        {filteredStock.map((item) => {
          const isLowStock = item.quantity < 50;
          const isFlipped = flippedCards.includes(item.barcode);
          
          const baseBurn = (item.flavor.length * 4) + 15; 
          const monthlyBurn = baseBurn;
          const quarterlyBurn = monthlyBurn * 3;
          const targetStock = quarterlyBurn; 
          const daysRemaining = item.quantity === 0 ? 0 : Math.max(1, Math.round(item.quantity / (monthlyBurn / 30)));
          const runOutDate = new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

          const healthPercent = Math.min(100, Math.round((item.quantity / targetStock) * 100));
          const recentLog = auditLog.find(log => log.flavor === item.flavor);
          let healthColor = "#007aff"; 
          if (item.quantity < 50) { healthColor = "#ff3b30"; } 
          else if (daysRemaining >= 30) { healthColor = "#34c759"; }

          return (
            <div 
              key={`${item.barcode}-${item.lotNumber}`} 
              style={{ perspective: '1200px', cursor: 'pointer' }}
              onClick={() => {
        if (editModes[item.barcode]) return;
        setExpandedCards(prev => prev.includes(item.barcode) ? prev.filter(id => id !== item.barcode) : [...prev, item.barcode]);
      }}
            >
              <div style={{ width: '100%', position: 'relative', transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                
                {/* 🟢 FRONT SIDE */}
                <div style={{ backfaceVisibility: 'hidden', backgroundColor: '#2c2c2e', borderRadius: '16px', padding: '24px', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', minHeight: '120px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.brand}</div><div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginTop: '4px', lineHeight: '1.2' }}>{item.flavor}</div><div style={{ fontSize: '15px', fontWeight: '800', color: healthColor, marginTop: '8px' }}>{item.quantity} BOXES IN STOCK</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button onClick={(e) => { e.stopPropagation(); if (isMultiFlipMode) { setFlippedCards(prev => prev.includes(item.barcode) ? prev.filter(id => id !== item.barcode) : [...prev, item.barcode]); } else { setFlippedCards(prev => prev.includes(item.barcode) && prev.length === 1 ? [] : [item.barcode]); } }} style={{ backgroundColor: '#007aff', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,122,255,0.3)', marginBottom: '4px' }}>Flip</button>
              <div style={{ fontSize: '11px', color: '#8e8e93', backgroundColor: '#1c1c1e', padding: '4px 8px', borderRadius: '8px', border: '1px solid #3a3a3c', whiteSpace: 'nowrap' }}>Lot: {item.lotNumber}</div>
                      <div style={{ fontSize: '10px', color: '#ff9500', fontWeight: '600' }}>Exp: {item.expiryDate || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: '#1c1c1e', color: '#8e8e93', borderRadius: '8px', border: '1px solid #3a3a3c' }}>📦 {item.type}</span>{isLowStock && <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', backgroundColor: 'rgba(255, 59, 48, 0.15)', color: '#ff3b30', borderRadius: '8px' }}>⚠️ LOW STOCK</span>}</div>
                  
                  {expandedCards.includes(item.barcode) && ( <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0 8px 0', borderTop: '1px solid #3a3a3c', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Pipeline Health</span>
                      <span style={{ fontSize: '12px', color: healthColor, fontWeight: '700' }}>{daysRemaining} Days Supply</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#1c1c1e', borderRadius: '5px', overflow: 'hidden', border: '1px solid #3a3a3c' }}>
                      <div style={{ width: `${healthPercent}%`, height: '100%', backgroundColor: healthColor, boxShadow: `0 0 10px ${healthColor}80`, transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(item.recentScans || []).filter(scan => (Date.now() - scan.timestamp < 43200000)).map((scan, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                  {scan.time} 
                  <span style={{ fontWeight: '800', marginLeft: '6px', fontSize: '13px', color: scan.action === 'Receive' ? '#34c759' : (scan.action === 'Ship' ? '#ff3b30' : (scan.action === 'Transfer' ? '#ff9500' : '#af52de')) }}>
                    {scan.qty}{scan.action === 'Receive' ? 'R' : (scan.action === 'Ship' ? 'S' : (scan.action === 'Transfer' ? 'T' : 'O'))}
                  </span>
                </div>
              ))}
            </div>
                <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'right', marginTop: '4px' }}>Target: {targetStock} bx</div>
              </div>
                  </div> )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #3a3a3c' }}>
                    <div><div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Placement Zone</div><div style={{ fontSize: '14px', color: activeZone.includes("Unassigned") ? "#ff9500" : "#007aff", fontWeight: '600' }}>📍 {item.zone}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>In Stock</div><div style={{ fontSize: '28px', fontWeight: '700', color: healthColor, lineHeight: '1' }}>{item.quantity} <span style={{ fontSize: '14px', fontWeight: '600', color: '#8e8e93' }}>box</span></div></div>
                  </div>
                </div>

                {/* 🔵 BACK SIDE (Stats + Admin Override) */}
                <div 
                  onClick={(e) => { if (editModes[item.barcode]) e.stopPropagation(); }} 
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1a1a1c', borderRadius: '16px', padding: '24px', border: editModes[item.barcode] ? '1px solid #ff3b30' : '1px solid #007aff', display: 'flex', flexDirection: 'column', boxShadow: editModes[item.barcode] ? '0 4px 30px rgba(255, 59, 48, 0.15)' : '0 4px 30px rgba(0, 122, 255, 0.15)', boxSizing: 'border-box' }}
                >
                  {editModes[item.barcode] ? (
                    // EDIT MODE
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '4px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>⚙️ Admin Override</div>
                        <button onClick={(e) => { e.stopPropagation(); setEditModes(prev => ({...prev, [item.barcode]: false})); }} style={{ background: 'transparent', color: '#ff3b30', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Cancel ✕</button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Zone</label>
                          <input value={editForms[item.barcode]?.zone ?? item.zone} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), zone: e.target.value}}))} style={{ backgroundColor: '#242426', border: '1px solid #3a3a3c', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Qty</label>
                          <input type="number" value={editForms[item.barcode]?.quantity ?? item.quantity} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), quantity: parseInt(e.target.value) || 0}}))} style={{ backgroundColor: '#242426', border: '1px solid #3a3a3c', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Lot No.</label>
                          <input value={editForms[item.barcode]?.lotNumber ?? item.lotNumber} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), lotNumber: e.target.value}}))} style={{ backgroundColor: '#242426', border: '1px solid #3a3a3c', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Expiry</label>
                          <input type="date" value={editForms[item.barcode]?.expiryDate ?? item.expiryDate} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), expiryDate: e.target.value}}))} style={{ backgroundColor: '#242426', border: '1px solid #3a3a3c', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Vendor Route Email</label>
                        <input list="vendor-emails" value={editForms[item.barcode]?.vendorEmail ?? item.vendorEmail ?? ""} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), vendorEmail: e.target.value}}))} style={{ backgroundColor: '#242426', border: '1px solid #3a3a3c', padding: '8px', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); handleSaveCardEdit(item.barcode); }} style={{ marginTop: 'auto', backgroundColor: '#007aff', color: '#fff', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>💾 Save</button>
                    </div>
                  ) : (
                    // STATS MODE
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>📊 Historical Velocity</div>
                        <div onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => prev.filter(id => id !== item.barcode)); }} style={{ fontSize: '10px', color: '#007aff', fontWeight: '700', backgroundColor: 'rgba(0,122,255,0.15)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>FLIP BACK</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
                        <div style={{ backgroundColor: '#242426', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>30-Day Burn</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{monthlyBurn} <span style={{fontSize: '12px', color:'#8e8e93'}}>bx</span></div></div>
                        <div style={{ backgroundColor: '#242426', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>90-Day Burn</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>{quarterlyBurn} <span style={{fontSize: '12px', color:'#8e8e93'}}>bx</span></div></div>
                        <div style={{ backgroundColor: '#242426', padding: '12px', borderRadius: '10px', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Est. Run-Out Date</div><div style={{ fontSize: '18px', fontWeight: '700', color: item.quantity === 0 ? '#ff3b30' : '#34c759', marginTop: '2px' }}>{item.quantity === 0 ? "Depleted" : runOutDate}</div></div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPrintLabelItem(item); }} 
                          style={{ flex: 1, backgroundColor: '#2c2c2e', color: '#ffffff', border: '1px solid #3a3a3c', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          🖨️ Print Label
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); requireManager(() => { setEditForms(prev => ({...prev, [item.barcode]: item})); setEditModes(prev => ({...prev, [item.barcode]: true})); }); }} 
                          style={{ flex: 1, backgroundColor: '#1c1c1e', color: '#ffffff', border: '1px solid #3a3a3c', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          🔒 Edit Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW MODAL: PRINT PREVIEW ENGINE */}
      {printLabelItem && (
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 10002, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "400px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "20px", fontWeight: "700" }}>🖨️ Print Preview</h3>
            <button onClick={() => setPrintLabelItem(null)} style={{ background: "transparent", color: "#ff3b30", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel ✕</button>
          </div>
          
          <div id="printable-label" style={{ width: "100%", maxWidth: "400px", aspectRatio: "4/6", backgroundColor: "#ffffff", padding: "32px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#000", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", textTransform: "uppercase" }}>{printLabelItem.brand}</h2>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: "600" }}>{printLabelItem.flavor}</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${printLabelItem.barcode}`} alt="QR Code" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "4px", marginBottom: "24px" }}>{printLabelItem.barcode}</div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "14px", fontWeight: "700", borderTop: "2px solid #000", paddingTop: "12px" }}>
              <span>ZNE: {printLabelItem.zone}</span>
              <span>LOT: {printLabelItem.lotNumber}</span>
              <span>EXP: {printLabelItem.expiryDate || 'N/A'}</span>
            </div>
          </div>
          
          <button className="no-print" onClick={() => window.print()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "#007aff", color: "#fff", padding: "16px", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "24px", fontSize: "16px", boxShadow: "0 4px 15px rgba(0,122,255,0.4)" }}>
            Send to Zebra Thermal Printer
          </button>
        </div>
      )}

      {/* RESTORED NEW ITEM REGISTRATION MODAL WITH VENDOR PO ROUTING */}
      {showNewItemModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3a3a3c", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "20px", fontWeight: "700" }}>➕ Register New Product</h3>
              <button onClick={() => setShowNewItemModal(false)} style={{ background: "transparent", color: "#ff3b30", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel ✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              
              
              
              
              
              <CustomAutocomplete placeholder="Barcode (Scan or Type)" value={newItemForm.barcode} onChange={val => setNewItemForm(prev => ({...prev, barcode: val}))} options={Array.from(new Map(stock.filter(i => i.barcode).map(i => [i.barcode, i])).values()).map(i => ({ value: i.barcode, label: i.barcode + " - " + i.brand + " " + i.flavor }))} style={{ backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <CustomAutocomplete placeholder="Brand (e.g. Citrus Springs)" value={newItemForm.brand} onChange={val => setNewItemForm(prev => ({...prev, brand: val}))} options={[...new Set(stock.map(i => i.brand))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 1, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
                <CustomAutocomplete placeholder="Flavor Profile" value={newItemForm.flavor} onChange={val => setNewItemForm(prev => ({...prev, flavor: val}))} options={[...new Set(stock.map(i => i.flavor))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 1, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>
              <CustomAutocomplete placeholder="Packaging Type" value={newItemForm.type} onChange={val => setNewItemForm(prev => ({...prev, type: val}))} options={["3G Bag-in-Box", "5G Bag-in-Box", "24-Can Case", "12-Can Case", "1G Jug Case", "1/2 BBL Keg", "1/6 BBL Keg", "Pallet", "Single Unit", ...new Set(stock.map(i => i.type))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <CustomAutocomplete placeholder="Lot Number" value={newItemForm.lotNumber} onChange={val => setNewItemForm(prev => ({...prev, lotNumber: val}))} options={Array.from(new Map(stock.filter(i => i.lotNumber).map(i => [i.lotNumber, i])).values()).map(i => ({ value: i.lotNumber, label: i.lotNumber + " (" + i.brand + " " + i.flavor + ")" }))} style={{ flex: 1, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
                <input type="date" value={newItemForm.expiryDate} onChange={e => setNewItemForm(prev => ({...prev, expiryDate: e.target.value}))} style={{ flex: 1, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none", fontSize: "14px", colorScheme: "dark" }} />
              </div>
              
              <input list="vendor-emails" placeholder="Vendor Email (Auto-PO Routing)" value={newItemForm.vendorEmail} onChange={e => setNewItemForm(prev => ({...prev, vendorEmail: e.target.value}))} style={{ backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none", fontSize: "14px" }} />
              
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="number" placeholder="Initial QTY" value={newItemForm.quantity || ""} onChange={e => setNewItemForm(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))} style={{ flex: 1, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none", fontSize: "14px" }} />
                <CustomAutocomplete placeholder="Placement Zone" value={newItemForm.zone} onChange={val => setNewItemForm(prev => ({...prev, zone: val}))} options={[...new Set(stock.flatMap(i => i.locations ? i.locations.map(l => l.name) : [i.zone]))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 2, backgroundColor: "#242426", border: "1px solid #3a3a3c", padding: "12px", borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>
            </div>
            <button onClick={handleSaveNewItem} style={{ width: "100%", backgroundColor: "#34c759", color: "#fff", padding: "14px", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", marginTop: "8px" }}>Proceed to Registration</button>
          </div>
        </div>
      )}

      {/* RBAC SECURITY PIN MODAL */}
      {pinModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(15px)", zIndex: 10001, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "380px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ fontSize: "40px", marginBottom: "-10px" }}>🔐</div>
            <div>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "22px", fontWeight: "700" }}>Manager Override</h3>
              <p style={{ margin: "8px 0 0 0", color: "#8e8e93", fontSize: "14px" }}>Enter 4-digit PIN to authorize action.</p>
            </div>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus style={{ backgroundColor: "#242426", border: pinModal.error ? "2px solid #ff3b30" : "2px solid #007aff", color: "#fff", fontSize: "32px", fontWeight: "800", textAlign: "center", letterSpacing: "12px", padding: "16px", borderRadius: "16px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            {pinModal.error && <div style={{ color: "#ff3b30", fontSize: "12px", fontWeight: "700", marginTop: "-12px" }}>INCORRECT PIN</div>}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setPinModal({ isOpen: false, callback: null, error: false })} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "14px", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={submitPin} style={{ flex: 2, backgroundColor: "#007aff", color: "#ffffff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER MODAL & FIFO INJECTION */}
      
      

      
      {showHelpModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000, backdropFilter: "blur(10px)" }}>
          <div style={{ backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "20px", border: "1px solid #3a3a3c", maxWidth: "600px", width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #3a3a3c", paddingBottom: "16px" }}>
              <h3 style={{ color: "#fff", margin: 0, fontSize: "24px", fontWeight: "700" }}>📖 Kinetic Asset Tracker Guide</h3>
              <button onClick={() => setShowHelpModal(false)} style={{ backgroundColor: "transparent", border: "none", color: "#8e8e93", fontSize: "28px", cursor: "pointer", transition: "color 0.2s" }}>&times;</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#d1d1d6", fontSize: "14px", lineHeight: "1.6" }}>
              
              <div>
                <h4 style={{ color: "#fff", fontSize: "18px", borderBottom: "1px solid #2c2c2e", paddingBottom: "8px", marginBottom: "12px", marginTop: 0 }}>1. Core Scanning Modes</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div><strong style={{ color: "#34c759" }}>📥 Receive Mode:</strong> Used when new freight arrives. Scanning a barcode <strong>adds</strong> stock.</div>
                  <div><strong style={{ color: "#ff3b30" }}>🚚 Ship Mode:</strong> Used when loading trucks out. Scanning a barcode <strong>deducts</strong> stock.</div>
                  <div><strong style={{ color: "#007aff" }}>🔄 Transfer Mode:</strong> Used for internal warehouse moves. Changes the placement zone without changing total inventory counts.</div>
                  <div><strong style={{ color: "#ff9500" }}>💥 Shrinkage / Damage:</strong> While in Ship Mode, scan an item and click "Flag as Damaged" to safely remove broken stock.</div>
                </div>
              </div>

              <div>
                <h4 style={{ color: "#fff", fontSize: "18px", borderBottom: "1px solid #2c2c2e", paddingBottom: "8px", marginBottom: "12px", marginTop: 0 }}>2. Scanner Modifiers (Set BEFORE Scanning)</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div><strong style={{ color: "#ff9500" }}>🪵 Single vs 🧱 Pallet:</strong> Tap to toggle between counting individual units or entire pallets.</div>
                  <div><strong style={{ color: "#fff" }}>QTY Multiplier:</strong> Change this number to scan multiple pallets or cases in a single scan trigger.</div>
                </div>
              </div>

              <div>
                <h4 style={{ color: "#fff", fontSize: "18px", borderBottom: "1px solid #2c2c2e", paddingBottom: "8px", marginBottom: "12px", marginTop: 0 }}>3. Database & Administration</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div><strong style={{ color: "#34c759" }}>➕ Register New Product:</strong> Use this ONLY for brand new SKUs that have never been in the system.</div>
                  <div><strong style={{ color: "#007aff" }}>🔄 Multi-Flip:</strong> Allows you to flip multiple cards open at the same time without them automatically closing. Perfect for comparing back-of-card info side-by-side.</div>
                  <div><strong style={{ color: "#fff" }}>📋 Security Audit:</strong> View the immutable cloud ledger of every scan, shipment, and manual edit (Manager PIN required).</div>
                </div>
              </div>

            </div>
            
            <button onClick={() => setShowHelpModal(false)} style={{ width: "100%", marginTop: "32px", padding: "16px", backgroundColor: "#007aff", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", transition: "all 0.2s" }}>Close</button>
          </div>
        </div>
      )}
{showConfirmModal && pendingAction && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "700" }}>⚠️ Confirm Update</h3>
            <p style={{ margin: 0, color: "#ffffff", fontSize: "17px", lineHeight: "1.5" }}>Action: <span style={{ color: pendingAction.actionName.includes("Ship") ? "#ff3b30" : "#34c759", fontWeight: "800" }}>{pendingAction.actionName.replace(/[^a-zA-Z]/g, "")}</span> <strong style={{color: "#007aff"}}>{pendingAction.targetItem.flavor}</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px" }}>
                <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", color: "#fff", width: "48px", height: "48px", borderRadius: "12px", fontSize: "24px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>-</button>
                <input type="number" min="1" value={modalQty} onChange={(e) => setModalQty(parseInt(e.target.value) || 1)} style={{ backgroundColor: "#1c1c1e", border: "2px solid #007aff", color: "#fff", fontSize: "28px", fontWeight: "800", textAlign: "center", width: "90px", padding: "8px", borderRadius: "12px", outline: "none" }} />
                <button onClick={() => setModalQty(modalQty + 1)} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", color: "#fff", width: "48px", height: "48px", borderRadius: "12px", fontSize: "24px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>+</button>
              </div>
              
              {pendingAction.actionName === '🔄 Transfer' && (
                <div style={{ marginTop: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', color: '#8e8e93', display: 'block', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>New Placement Zone:</label>
                  <input type="text" value={pendingAction.newZone || ''} onChange={(e) => setPendingAction({...pendingAction, newZone: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder="e.g. Cooler Bay-02" />
                </div>
              )}

              {pendingAction.actionName === '🚚 Ship' && (
                <button onClick={() => setPendingAction({...pendingAction, isShrinkage: !pendingAction.isShrinkage})} style={{ marginTop: '8px', backgroundColor: pendingAction.isShrinkage ? '#ff3b30' : '#2c2c2e', border: '1px solid #3a3a3c', color: '#fff', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                  {pendingAction.isShrinkage ? '💥 MARKED AS SHRINKAGE / DAMAGE' : 'Flag as Damaged / Shrinkage'}
                </button>
              )}
            </div>
            
            {pendingAction.fifoWarningItem && (
              <div style={{ backgroundColor: "rgba(255, 149, 0, 0.15)", border: "1px solid #ff9500", padding: "16px", borderRadius: "12px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ color: "#ff9500", fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>🛑 FIFO VIOLATION DETECTED</div>
                <div style={{ color: "#fff", fontSize: "13px", lineHeight: "1.5" }}>You are about to ship <strong style={{color: "#8e8e93"}}>{pendingAction.targetItem.lotNumber}</strong>, but older stock exists in the warehouse.</div>
                <div style={{ backgroundColor: "#242426", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#8e8e93" }}>
                  Please pull from <strong style={{color: "#fff"}}>{pendingAction.fifoWarningItem.zone}</strong>.<br/>
                  (Lot: {pendingAction.fifoWarningItem.lotNumber} • Expires: <span style={{color: "#ff3b30"}}>{pendingAction.fifoWarningItem.expiryDate}</span>)
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "16px", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirmAction} style={{ flex: 2, backgroundColor: pendingAction.actionName.includes("Ship") ? "#ff3b30" : "#34c759", color: "#ffffff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>{pendingAction.fifoWarningItem ? "Force Ship Anyway" : "Commit Action"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODE SWITCH MODALS */}
      {pendingModeSwitch && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", lineHeight: "1", marginBottom: "-8px" }}>{pendingModeSwitch === "ship" ? "🚚" : pendingModeSwitch === "transfer" ? "🔄" : "📥"}</div>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "700" }}>Switch to {pendingModeSwitch === "ship" ? "Shipping" : pendingModeSwitch === "transfer" ? "Transfer Mode" : "Receiving"}?</h3>
            <p style={{ margin: 0, color: "#8e8e93", fontSize: "15px", lineHeight: "1.6" }}>Any barcodes scanned will now be <strong style={{ color: pendingModeSwitch === "ship" ? "#ff3b30" : pendingModeSwitch === "transfer" ? "#007aff" : "#34c759" }}>{pendingModeSwitch === "ship" ? "DEDUCTED from" : pendingModeSwitch === "transfer" ? "MOVED within" : "ADDED to"}</strong> the live warehouse inventory.</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setPendingModeSwitch(null)} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "14px", borderRadius: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Cancel</button>
              <button onClick={() => { setScanMode(pendingModeSwitch); setPendingModeSwitch(null); }} style={{ flex: 2, backgroundColor: pendingModeSwitch === "ship" ? "#ff3b30" : pendingModeSwitch === "transfer" ? "#007aff" : "#34c759", color: "#ffffff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", boxShadow: pendingModeSwitch === "ship" ? "0 4px 15px rgba(255,59,48,0.3)" : pendingModeSwitch === "transfer" ? "0 4px 15px rgba(0,122,255,0.3)" : "0 4px 15px rgba(52,199,89,0.3)", transition: "all 0.2s" }}>Confirm {pendingModeSwitch === "ship" ? "Ship" : pendingModeSwitch === "transfer" ? "Transfer" : "Receive"}</button>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "700px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "80vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3a3a3c", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "22px" }}>📋 Historical Cloud Audit</h3>
              <button onClick={() => setShowAuditModal(false)} style={{ background: "transparent", color: "#8e8e93", border: "none", fontSize: "16px", cursor: "pointer" }}>Close ✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "8px" }}>
              {auditLog.length === 0 ? (
                <div style={{ color: "#8e8e93", textAlign: "center", padding: "40px" }}>No historical transactions found in the cloud ledger.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", color: "#ffffff" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #3a3a3c", color: "#8e8e93" }}><th style={{ padding: "12px 8px" }}>Time</th><th style={{ padding: "12px 8px" }}>Operator</th><th style={{ padding: "12px 8px" }}>Action</th><th style={{ padding: "12px 8px" }}>Product Identity</th><th style={{ padding: "12px 8px", textAlign: "right" }}>Qty</th></tr>
                  </thead>
                  <tbody>
                    {auditLog.map(log => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #2c2c2e" }}><td style={{ padding: "12px 8px", fontSize: "12px", color: "#8e8e93" }}>{log.time}</td><td style={{ padding: "12px 8px" }}>{log.user.split('@')[0]}</td><td style={{ padding: "12px 8px", color: log.action === "Ship" ? "#ff3b30" : "#34c759", fontWeight: "700" }}>{log.action}</td><td style={{ padding: "12px 8px" }}>{log.flavor}</td><td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700" }}>{log.qty}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CORE VIEW FINDER INJECTION */}
      {isScanning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9998, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#1c1c1e", padding: "24px", borderRadius: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "20px" }}>📷 Viewfinder</h3>
              <button onClick={() => setIsScanning(false)} style={{ background: "transparent", color: "#ff3b30", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel ✕</button>
            </div>
            <div id="reader" style={{ width: "100%", minHeight: "250px" }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
