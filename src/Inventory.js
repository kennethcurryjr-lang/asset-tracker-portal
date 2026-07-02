import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from './dynamoClient';

const initialMockData = [
  { barcode: "082123456781", lotNumber: "LOT-2026-01", brand: "Citrus Springs", flavor: "100% Orange Juice Concentrate", type: "3G Bag-in-Box", quantity: 420, zone: "Cooler Bay-01" },
  { barcode: "082123456782", lotNumber: "LOT-2026-02", brand: "Citrus Springs", flavor: "Apple Juice Premium", type: "3G Bag-in-Box", quantity: 180, zone: "Cooler Bay-01" },
  { barcode: "082123456783", lotNumber: "LOT-2026-03", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 310, zone: "Dry Aisle A" },
  { barcode: "082123456784", lotNumber: "LOT-2026-04", brand: "Twisted Branch", flavor: "Craft Lemonade Base", type: "3G Bag-in-Box", quantity: 35, zone: "Dry Aisle B" },
  { barcode: "082123456785", lotNumber: "LOT-2026-05", brand: "Madrinas Coffee", flavor: "Vanilla Cold Brew RTD", type: "24-Can Case", quantity: 300, zone: "Dry Aisle C" }
];

export default function Inventory({ user }) {
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPalletMode, setIsPalletMode] = useState(false);
  const [customQty, setCustomQty] = useState(1);
  const [scanMode, setScanMode] = useState("receive");
  const [activeZone, setActiveZone] = useState("Unassigned Warehouse");
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");
  
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ barcode: "", brand: "Citrus Springs", flavor: "", type: "3G Bag-in-Box", lotNumber: "", quantity: 1, zone: "" });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Custom Frosted Glass Modal States
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState([]);

  const totalBoxes = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeFlavorsCount = new Set(stock.map(item => item.flavor)).size;
  
  const lowStockItems = stock.filter(item => item.quantity < 50);

  const filteredStock = stock.filter(item => 
    item.flavor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchInventory = async () => {
    try {
      const response = await docClient.send(new ScanCommand({ TableName: "BeverageInventoryData" }));
      if (response.Items && response.Items.length > 0) {
        setStock(response.Items);
      } else {
        await Promise.all(initialMockData.map(item => docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))));
        setStock(initialMockData);
      }
    } catch (err) {
      console.error("DynamoDB Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 3000);
    return () => clearInterval(interval);
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
      setPendingAction({ targetItem, boxAdjustment, newQuantity, newZone, actionName: scanMode === "receive" ? "📥 Receive" : "🚚 Ship", isPallet: isPalletMode, rawQty: parsedQty });
      setShowConfirmModal(true);
    } else {
      setNewItemForm({ barcode: cleanScan, brand: "Citrus Springs", flavor: "", type: "3G Bag-in-Box", lotNumber: "", quantity: boxAdjustment, zone: activeZone !== "Unassigned Warehouse" ? activeZone : "Unassigned Warehouse" });
      setShowNewItemModal(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { targetItem, boxAdjustment, newQuantity, newZone, actionName } = pendingAction;
    
    const logEntry = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      user: user?.email || "Admin Mode",
      action: actionName.replace(/[^a-zA-Z]/g, ""),
      qty: boxAdjustment,
      flavor: targetItem.flavor
    };
    setAuditLog(prev => [logEntry, ...prev]);

    setStock(prevStock => prevStock.map(item => item.barcode === targetItem.barcode ? { ...item, quantity: newQuantity, zone: newZone } : item));
    setScanFeedback(`✅ ${actionName.replace(/[^a-zA-Z]/g, "")} ${boxAdjustment} boxes of ${targetItem.flavor}`);
    setShowConfirmModal(false);
    setPendingAction(null);

    try {
      await docClient.send(new UpdateCommand({
        TableName: "BeverageInventoryData",
        Key: { barcode: targetItem.barcode, lotNumber: targetItem.lotNumber },
        UpdateExpression: "SET quantity = :q, #z = :z",
        ExpressionAttributeNames: { "#z": "zone" },
        ExpressionAttributeValues: { ":q": newQuantity, ":z": newZone }
      }));
    } catch (err) { console.error("Cloud update failed:", err); }
    setTimeout(() => setScanFeedback(""), 4000);
  };

  const handleManualAdd = () => {
    setNewItemForm({ barcode: "", brand: "Citrus Springs", flavor: "", type: "3G Bag-in-Box", lotNumber: "", quantity: 0, zone: "Unassigned Warehouse" });
    setShowNewItemModal(true);
  };

  const handleSaveNewItem = () => {
    if (!newItemForm.barcode || !newItemForm.flavor || !newItemForm.lotNumber) return alert("Required fields missing.");
    setShowRegisterConfirm(true); 
  };

  const executeSaveNewItem = async () => {
    setStock(prev => { const exists = prev.find(i => i.barcode === newItemForm.barcode); return exists ? prev : [...prev, newItemForm]; });
    setShowNewItemModal(false);
    setShowRegisterConfirm(false); 
    setScanFeedback(`✅ 📥 Registered Product: ${newItemForm.flavor}`);
    setTimeout(() => setScanFeedback(""), 4000);

    try { await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: newItemForm })); } 
    catch (err) { console.error("Failed to register:", err); }
  };

  const handleExportCSV = () => {
    const headers = ["Brand", "Flavor", "Packaging Type", "Current Count", "Warehouse Zone", "Lot Number"];
    const csvRows = [headers.join(",")];
    stock.forEach(item => {
      const row = [ `"${item.brand}"`, `"${item.flavor}"`, `"${item.type}"`, item.quantity, `"${item.zone}"`, `"${item.lotNumber}"` ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CS_Inventory_Snapshot_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processRef = useRef();
  processRef.current = processScannedCode;

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 30, qrbox: { width: 300, height: 150 }, rememberLastUsedCamera: true, aspectRatio: 1.777778 });
      scanner.render((decodedText) => { scanner.clear(); setIsScanning(false); if (processRef.current) processRef.current(decodedText); }, (error) => {});
      return () => { scanner.clear().catch(e => console.log(e)); };
    }
  }, [isScanning]);

  return (
    <div className="inventory-container" style={{ backgroundColor: "#1c1c1e", color: "#ffffff", minHeight: "100vh", padding: "32px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      <style>{`
        @media (max-width: 768px) {
          .inventory-container { padding: 16px !important; }
          .header-stack { flex-direction: column !important; align-items: flex-start !important; gap: 16px; }
          .toolbar-stack { flex-direction: column !important; align-items: stretch !important; }
          .responsive-table thead { display: none; }
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; box-sizing: border-box; }
          .responsive-table tr { margin-bottom: 16px; border: 1px solid #3a3a3c !important; border-radius: 12px; background-color: #242426; padding: 8px 0; }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px !important; text-align: right; }
          .responsive-table td::before { content: attr(data-label); font-weight: 600; color: #8e8e93; font-size: 12px; text-transform: uppercase; margin-right: 16px; text-align: left; }
        }
        #reader { border: 2px solid #007aff !important; border-radius: 16px; overflow: hidden; background: #000; }
      `}</style>

      {/* HEADER BAR */}
      <div className="header-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em" }}>📦 Commercial Beverage Operations</h1>
          <p style={{ margin: "4px 0 0 0", color: "#8e8e93", fontSize: "14px" }}>Warehouse Logged in as: {user?.email || "Admin Mode"}</p>
        </div>
        <div style={{ display: "flex", backgroundColor: "#2c2c2e", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          <button onClick={() => { if (scanMode !== "receive") setPendingModeSwitch("receive"); }} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "receive" ? "#34c759" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>📥 Receive</button>
          <button onClick={() => { if (scanMode !== "ship") setPendingModeSwitch("ship"); }} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "ship" ? "#ff3b30" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>🚚 Ship</button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ backgroundColor: "rgba(255, 149, 0, 0.15)", border: "1px solid rgba(255, 149, 0, 0.4)", borderRadius: "16px", padding: "20px", marginBottom: "24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "32px", lineHeight: "1" }}>⚠️</span>
            <div>
              <h4 style={{ margin: 0, color: "#ff9500", fontSize: "18px", fontWeight: "700" }}>Critical Stock Alert</h4>
              <p style={{ margin: "4px 0 0 0", color: "#ffffff", fontSize: "14px", lineHeight: "1.4" }}>{lowStockItems.length} flavor lineup(s) have dropped below the safe operational threshold of 50 boxes.</p>
            </div>
          </div>
          <button onClick={() => {
            const body = "Please process a replenishment order for the following low-stock items:%0D%0A%0D%0A" + lowStockItems.map(i => `[ ] ${i.flavor} - Only ${i.quantity} boxes remaining (Zone: ${i.zone})`).join("%0D%0A") + "%0D%0A%0D%0A- Generated by Kinetic Cards Inventory System";
            window.location.href = `mailto:purchasing@csgroup.com?subject=URGENT: Warehouse Restock Required&body=${body}`;
          }} style={{ backgroundColor: "#ff9500", color: "#ffffff", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
            ✉️ Email Restock Report
          </button>
        </div>
      )}

      {/* KPI METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>TOTAL WAREHOUSE STOCK</div>
          <div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px", color: "#34c759" }}>{totalBoxes.toLocaleString()} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Boxes</span></div>
        </div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>ACTIVE FLAVOR VARIETIES</div>
          <div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px" }}>{activeFlavorsCount} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Flavors</span></div>
        </div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>ACTIVE PLACEMENT ZONE</div>
          <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "12px", color: activeZone.includes("Unassigned") ? "#ff9500" : "#007aff" }}>{activeZone.replace("ZONE-", "").replace("BAY-", "")}</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-stack" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "16px", backgroundColor: "#242426", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
        <input type="text" placeholder="🔎 Filter Inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "14px 16px", width: "100%", maxWidth: "260px", color: "#ffffff" }} />
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: "1", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "4px 12px" }}>
            <span style={{ color: "#8e8e93", fontSize: "14px", fontWeight: "600" }}>QTY:</span>
            <input type="number" min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} style={{ width: "40px", backgroundColor: "transparent", border: "none", color: "#ffffff", fontSize: "16px", fontWeight: "700", outline: "none", textAlign: "center" }} />
          </div>
          
          <button onClick={() => setIsPalletMode(!isPalletMode)} style={{ backgroundColor: isPalletMode ? "rgba(255, 149, 0, 0.15)" : "#1c1c1e", border: isPalletMode ? "1px solid #ff9500" : "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: isPalletMode ? "#ff9500" : "#ffffff", fontWeight: "600", cursor: "pointer" }}>
            🪵 {isPalletMode ? `${70 * (parseInt(customQty) || 1)} Boxes` : "Single"}
          </button>
          
          <button onClick={() => setShowAuditModal(true)} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
            📋 Audit
          </button>
          
          <button onClick={handleExportCSV} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
            📥 CSV
          </button>

          <button onClick={handleManualAdd} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", padding: "12px 16px", borderRadius: "12px", color: "#ffffff", fontWeight: "600", cursor: "pointer" }}>
            ➕ Add
          </button>

          <button onClick={() => setIsScanning(true)} style={{ backgroundColor: "#007aff", border: "none", padding: "12px 24px", borderRadius: "12px", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>
            📷 SCAN
          </button>
        </div>
      </div>

      {/* INVENTORY KINETIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
        {filteredStock.map((item) => {
          const isLowStock = item.quantity < 50;
          return (
            <div key={`${item.barcode}-${item.lotNumber}`} style={{ backgroundColor: '#2c2c2e', borderRadius: '16px', padding: '24px', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)' }}>
              
              {/* Header: Brand & Lot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.brand}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginTop: '4px', lineHeight: '1.2' }}>{item.flavor}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#8e8e93', backgroundColor: '#1c1c1e', padding: '4px 8px', borderRadius: '8px', border: '1px solid #3a3a3c', whiteSpace: 'nowrap', marginLeft: '12px' }}>Lot: {item.lotNumber}</div>
              </div>

              {/* Tags / Packaging */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: '#1c1c1e', color: '#8e8e93', borderRadius: '8px', border: '1px solid #3a3a3c' }}>📦 {item.type}</span>
                {isLowStock && <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', backgroundColor: 'rgba(255, 59, 48, 0.15)', color: '#ff3b30', borderRadius: '8px' }}>⚠️ LOW STOCK</span>}
              </div>

              {/* Data Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #3a3a3c' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Placement Zone</div>
                  <div style={{ fontSize: '14px', color: activeZone.includes("Unassigned") ? "#ff9500" : "#007aff", fontWeight: '600' }}>📍 {item.zone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8e8e93', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>In Stock</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: isLowStock ? '#ff3b30' : '#34c759', lineHeight: '1' }}>{item.quantity} <span style={{ fontSize: '14px', fontWeight: '600', color: '#8e8e93' }}>box</span></div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>

      {/* ACTION CONFIRM MODAL */}
      {showConfirmModal && pendingAction && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "700" }}>⚠️ Confirm Update</h3>
            <p style={{ margin: 0, color: "#ffffff", fontSize: "17px", lineHeight: "1.5" }}>
              Action: <span style={{ color: pendingAction.actionName.includes("Ship") ? "#ff3b30" : "#34c759", fontWeight: "800" }}>{pendingAction.actionName.replace(/[^a-zA-Z]/g, "")} {pendingAction.boxAdjustment} Boxes</span> of <strong style={{color: "#007aff"}}>{pendingAction.targetItem.flavor}</strong>
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "16px", borderRadius: "12px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirmAction} style={{ flex: 2, backgroundColor: pendingAction.actionName.includes("Ship") ? "#ff3b30" : "#34c759", color: "#ffffff", border: "none", padding: "16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Commit Action</button>
            </div>
          </div>
        </div>
      )}

      {/* MODE SWITCH STYLED MODAL */}
      {pendingModeSwitch && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", lineHeight: "1", marginBottom: "-8px" }}>{pendingModeSwitch === "ship" ? "🚚" : "📥"}</div>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "700" }}>Switch to {pendingModeSwitch === "ship" ? "Shipping" : "Receiving"}?</h3>
            <p style={{ margin: 0, color: "#8e8e93", fontSize: "15px", lineHeight: "1.6" }}>
              Any barcodes scanned will now be <strong style={{ color: pendingModeSwitch === "ship" ? "#ff3b30" : "#34c759" }}>{pendingModeSwitch === "ship" ? "DEDUCTED from" : "ADDED to"}</strong> the live warehouse inventory.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setPendingModeSwitch(null)} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "14px", borderRadius: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Cancel</button>
              <button onClick={() => { setScanMode(pendingModeSwitch); setPendingModeSwitch(null); }} style={{ flex: 2, backgroundColor: pendingModeSwitch === "ship" ? "#ff3b30" : "#34c759", color: "#ffffff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", boxShadow: pendingModeSwitch === "ship" ? "0 4px 15px rgba(255,59,48,0.3)" : "0 4px 15px rgba(52,199,89,0.3)", transition: "all 0.2s" }}>Confirm {pendingModeSwitch === "ship" ? "Ship" : "Receive"}</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ITEM REGISTRATION STYLED MODAL */}
      {showRegisterConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", lineHeight: "1", marginBottom: "-8px" }}>☁️</div>
            <h3 style={{ margin: 0, color: "#ffffff", fontSize: "24px", fontWeight: "700" }}>Register New Product?</h3>
            <p style={{ margin: 0, color: "#8e8e93", fontSize: "15px", lineHeight: "1.6" }}>
              Permanently add <strong style={{ color: "#007aff" }}>{newItemForm.flavor}</strong> to the cloud database?
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setShowRegisterConfirm(false)} style={{ flex: 1, backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "14px", borderRadius: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Cancel</button>
              <button onClick={executeSaveNewItem} style={{ flex: 2, backgroundColor: "#007aff", color: "#ffffff", border: "none", padding: "14px", borderRadius: "12px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,122,255,0.3)", transition: "all 0.2s" }}>Confirm Registration</button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG MODAL */}
      {showAuditModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "700px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "80vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3a3a3c", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "22px" }}>📋 Session Transaction Audit</h3>
              <button onClick={() => setShowAuditModal(false)} style={{ background: "transparent", color: "#8e8e93", border: "none", fontSize: "16px", cursor: "pointer" }}>Close ✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "8px" }}>
              {auditLog.length === 0 ? (
                <div style={{ color: "#8e8e93", textAlign: "center", padding: "40px" }}>No transactions recorded in this session.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px", color: "#ffffff" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #3a3a3c", color: "#8e8e93" }}>
                      <th style={{ padding: "12px 8px" }}>Time</th>
                      <th style={{ padding: "12px 8px" }}>Operator</th>
                      <th style={{ padding: "12px 8px" }}>Action</th>
                      <th style={{ padding: "12px 8px" }}>Product Identity</th>
                      <th style={{ padding: "12px 8px", textAlign: "right" }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(log => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #2c2c2e" }}>
                        <td style={{ padding: "12px 8px", fontSize: "12px", color: "#8e8e93" }}>{log.time}</td>
                        <td style={{ padding: "12px 8px" }}>{log.user.split('@')[0]}</td>
                        <td style={{ padding: "12px 8px", color: log.action === "Ship" ? "#ff3b30" : "#34c759", fontWeight: "700" }}>{log.action}</td>
                        <td style={{ padding: "12px 8px" }}>{log.flavor}</td>
                        <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700" }}>{log.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCANNER OVERLAY */}
      {isScanning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9998, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#1c1c1e", padding: "24px", borderRadius: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "20px" }}>📷 Viewfinder</h3>
              <button onClick={() => setIsScanning(false)} style={{ background: "transparent", color: "#ff3b30", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel ✕</button>
            </div>
            <div id="reader" style={{ width: "100%" }}></div>
          </div>
        </div>
      )}

    </div>
  );
}
