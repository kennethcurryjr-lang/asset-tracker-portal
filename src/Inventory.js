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
  const [scanMode, setScanMode] = useState("receive");
  const [activeZone, setActiveZone] = useState("Unassigned Warehouse");
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ barcode: "", brand: "Citrus Springs", flavor: "", type: "3G Bag-in-Box", lotNumber: "", quantity: 1, zone: "" });

  const totalBoxes = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeFlavorsCount = new Set(stock.map(item => item.flavor)).size;
  const lowStockCount = stock.filter(item => item.quantity < 50).length;

  const filteredStock = stock.filter(item => 
    item.flavor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ☁️ LIVE CLOUD FETCH & AUTO-SEED
  const fetchInventory = async () => {
    try {
      const response = await docClient.send(new ScanCommand({ TableName: "BeverageInventoryData" }));
      if (response.Items && response.Items.length > 0) {
        setStock(response.Items);
      } else {
        await Promise.all(initialMockData.map(item => 
          docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))
        ));
        setStock(initialMockData);
      }
    } catch (err) {
      console.error("DynamoDB Fetch Error:", err);
    }
  };

  // Poll database every 3 seconds to keep all screens in perfect sync
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

    const boxAdjustment = isPalletMode ? 70 : 1;
    const targetItem = stock.find(item => item.barcode === cleanScan || cleanScan.includes(item.barcode) || item.barcode.includes(cleanScan));

    if (targetItem) {
      const newQuantity = scanMode === "receive" ? targetItem.quantity + boxAdjustment : Math.max(0, targetItem.quantity - boxAdjustment);
      const newZone = (scanMode === "receive" && activeZone !== "Unassigned Warehouse") ? activeZone : targetItem.zone;

      // 1. Optimistic UI Update (Instant feedback for the worker)
      setStock(prevStock => prevStock.map(item => 
        item.barcode === targetItem.barcode ? { ...item, quantity: newQuantity, zone: newZone } : item
      ));
      
      const action = scanMode === "receive" ? "📥 Received" : "🚚 Shipped";
      setScanFeedback(`✅ ${action} ${boxAdjustment} boxes of ${targetItem.flavor}`);

      // 2. Background Cloud Update (Sends exact math to DynamoDB)
      try {
        await docClient.send(new UpdateCommand({
          TableName: "BeverageInventoryData",
          Key: { barcode: targetItem.barcode, lotNumber: targetItem.lotNumber },
          UpdateExpression: "SET quantity = :q, #z = :z",
          ExpressionAttributeNames: { "#z": "zone" },
          ExpressionAttributeValues: { ":q": newQuantity, ":z": newZone }
        }));
      } catch (err) {
        console.error("Failed to update cloud inventory:", err);
      }
      
    } else {
      // Trigger the Learning Workflow
      setNewItemForm({
        barcode: cleanScan,
        brand: "Citrus Springs",
        flavor: "",
        type: "3G Bag-in-Box",
        lotNumber: "",
        quantity: boxAdjustment,
        zone: activeZone !== "Unassigned Warehouse" ? activeZone : "Unassigned Warehouse"
      });
      setShowNewItemModal(true);
    }
    // Only clear feedback if we aren't showing a modal
    if (targetItem) setTimeout(() => setScanFeedback(""), 4000);
  };


  const handleSaveNewItem = async () => {
    if (!newItemForm.flavor || !newItemForm.lotNumber) {
      alert("Flavor and Lot Number are required.");
      return;
    }
    
    // 1. Optimistic UI Update
    setStock(prev => [...prev, newItemForm]);
    setShowNewItemModal(false);
    setScanFeedback(`✅ 📥 Registered & Received ${newItemForm.quantity} boxes of ${newItemForm.flavor}`);
    setTimeout(() => setScanFeedback(""), 4000);

    // 2. Push to DynamoDB
    try {
      await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: newItemForm }));
    } catch (err) {
      console.error("Failed to register new item:", err);
    }
  };

  const processRef = useRef();
  processRef.current = processScannedCode;

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 30, qrbox: { width: 300, height: 150 }, rememberLastUsedCamera: true, aspectRatio: 1.777778 });
      scanner.render(
        (decodedText) => { scanner.clear(); setIsScanning(false); if (processRef.current) processRef.current(decodedText); },
        (error) => {}
      );
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
          .toolbar-stack input { width: 100% !important; max-width: 100% !important; box-sizing: border-box; }
          .toolbar-stack button { width: 100% !important; justify-content: center; }
          
          .responsive-table thead { display: none; }
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; box-sizing: border-box; }
          .responsive-table tr { margin-bottom: 16px; border: 1px solid #3a3a3c !important; border-radius: 12px; background-color: #242426; overflow: hidden; padding: 8px 0; }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px !important; border: none !important; text-align: right; }
          .responsive-table td::before { content: attr(data-label); font-weight: 600; color: #8e8e93; font-size: 12px; text-transform: uppercase; margin-right: 16px; text-align: left; }
          .responsive-table td:last-child { display: flex; justify-content: stretch; padding-top: 16px !important; border-top: 1px dashed #3a3a3c !important; margin-top: 4px; }
          .responsive-table td:last-child button { width: 100%; padding: 12px !important; font-size: 14px !important; }
        }
        
        #reader { border: 2px solid #007aff !important; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        #reader button { background-color: #007aff; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; font-family: inherit; }
        #reader select { padding: 8px; border-radius: 8px; margin-bottom: 10px; font-family: inherit; background-color: #2c2c2e; color: white; border: 1px solid #3a3a3c; }
        #reader a { display: none !important; }
      `}</style>

      {/* HEADER BAR */}
      <div className="header-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em" }}>📦 Commercial Beverage Operations</h1>
          <p style={{ margin: "4px 0 0 0", color: "#8e8e93", fontSize: "14px" }}>Warehouse Logged in as: {user?.email || "Admin Mode"}</p>
        </div>
        <div style={{ display: "flex", backgroundColor: "#2c2c2e", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
          <button onClick={() => setScanMode("receive")} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "receive" ? "#34c759" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>📥 Receive</button>
          <button onClick={() => setScanMode("ship")} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "ship" ? "#ff3b30" : "transparent", color: "#ffffff", flex: 1, transition: "all 0.2s" }}>🚚 Ship</button>
        </div>
      </div>

      {/* CAMERA SCANNER OVERLAY MODAL */}
      {isScanning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#1c1c1e", padding: "24px", borderRadius: "24px", border: "1px solid #3a3a3c", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "20px" }}>📷 {scanMode === "receive" ? "Receiving" : "Shipping"} Viewfinder</h3>
              <button onClick={() => setIsScanning(false)} style={{ background: "transparent", color: "#ff3b30", border: "none", fontSize: "16px", fontWeight: "bold", cursor: "pointer", padding: "8px" }}>Cancel ✕</button>
            </div>
            
            <div id="reader" style={{ width: "100%" }}></div>
            
            <div style={{ color: "#8e8e93", fontSize: "13px", textAlign: "center", lineHeight: "1.4" }}>
              Center standard 1D product barcode or Zone QR block inside the crosshairs. The scanner will capture automatically.
            </div>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS ROW */}
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
          <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "12px", color: activeZone.includes("Unassigned") ? "#ff9500" : "#007aff", wordBreak: "break-word", lineHeight: "1" }}>{activeZone.replace("ZONE-", "").replace("BAY-", "")}</div>
        </div>
      </div>

      {/* SCAN FEEDBACK ALERT */}
      {scanFeedback && (
        <div style={{ backgroundColor: scanFeedback.includes("⚠️") ? "rgba(255, 59, 48, 0.15)" : "rgba(52, 199, 89, 0.15)", color: scanFeedback.includes("⚠️") ? "#ff3b30" : "#34c759", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", border: scanFeedback.includes("⚠️") ? "1px solid rgba(255, 59, 48, 0.4)" : "1px solid rgba(52, 199, 89, 0.4)" }}>
          {scanFeedback}
        </div>
      )}

      {/* TOOLBAR CONTROLS */}
      <div className="toolbar-stack" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "16px", backgroundColor: "#242426", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
        <input 
          type="text" 
          placeholder="🔎 Filter by Flavor, Brand, or Zone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "14px 16px", width: "100%", maxWidth: "340px", color: "#ffffff", fontSize: "14px" }}
        />
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flex: "1" }}>
          <button 
            onClick={() => setIsPalletMode(!isPalletMode)} 
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: isPalletMode ? "rgba(255, 149, 0, 0.15)" : "#1c1c1e", border: isPalletMode ? "1px solid #ff9500" : "1px solid #3a3a3c", padding: "12px 20px", borderRadius: "12px", cursor: "pointer", color: isPalletMode ? "#ff9500" : "#ffffff", fontWeight: "600", transition: "all 0.2s", flex: "1", whiteSpace: "nowrap" }}
          >
            <span style={{ fontSize: "16px" }}>🪵</span> {isPalletMode ? "Pallet Mode: 70" : "Single Box"}
          </button>
          
          <button 
            onClick={() => setIsScanning(true)} 
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", backgroundColor: "#007aff", border: "none", padding: "12px 24px", borderRadius: "12px", cursor: "pointer", color: "#ffffff", fontWeight: "700", boxShadow: "0 4px 14px rgba(0, 122, 255, 0.3)", flex: "2", fontSize: "15px", whiteSpace: "nowrap" }}
          >
            <span style={{ fontSize: "20px" }}>📷</span> OPEN CAMERA SCANNER
          </button>
        </div>
      </div>

      {/* MAIN INVENTORY MATRIX TABLE */}
      <div style={{ backgroundColor: "#2c2c2e", borderRadius: "16px", border: "none", overflow: "hidden" }}>
        <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #3a3a3c", color: "#8e8e93", backgroundColor: "#242426" }}>
              <th style={{ padding: "16px" }}>Brand</th>
              <th style={{ padding: "16px" }}>Flavor Lineup</th>
              <th style={{ padding: "16px" }}>Packaging Type</th>
              <th style={{ padding: "16px" }}>Current Count</th>
              <th style={{ padding: "16px" }}>Warehouse Zone</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Manual Test</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((item) => (
              <tr key={`${item.barcode}-${item.lotNumber}`} style={{ borderBottom: "1px solid #3a3a3c" }}>
                <td data-label="Brand" style={{ padding: "16px", fontWeight: "600" }}>{item.brand}</td>
                <td data-label="Flavor Lineup" style={{ padding: "16px" }}>{item.flavor} <br/><span style={{ fontSize: "11px", color: "#8e8e93" }}>Lot: {item.lotNumber}</span></td>
                <td data-label="Packaging" style={{ padding: "16px", color: "#8e8e93" }}>{item.type}</td>
                <td data-label="In Stock" style={{ padding: "16px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "8px", fontWeight: "700", backgroundColor: item.quantity < 50 ? "rgba(255, 59, 48, 0.15)" : "rgba(52, 199, 89, 0.15)", color: item.quantity < 50 ? "#ff3b30" : "#34c759" }}>
                    {item.quantity} boxes
                  </span>
                </td>
                <td data-label="Zone" style={{ padding: "16px" }}>📍 {item.zone}</td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <button onClick={() => processScannedCode(item.barcode)} style={{ backgroundColor: "#3a3a3c", border: "none", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    Test Scan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW ITEM REGISTRATION MODAL */}
      {showNewItemModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "24px", border: "1px solid #3a3a3c", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #3a3a3c", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", fontSize: "22px" }}>✨ Register New Product</h3>
              <button onClick={() => setShowNewItemModal(false)} style={{ background: "transparent", color: "#8e8e93", border: "none", fontSize: "16px", cursor: "pointer" }}>Cancel ✕</button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Auto-Captured & Defaulted Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Barcode ID (Scanned)</label>
                <input disabled value={newItemForm.barcode} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", padding: "10px", color: "#8e8e93", fontSize: "14px", cursor: "not-allowed" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Initial Stock QTY</label>
                <input disabled value={newItemForm.quantity} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", padding: "10px", color: "#8e8e93", fontSize: "14px", cursor: "not-allowed" }} />
              </div>
            </div>

            {/* Manual Dropdowns */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Brand Name</label>
              <select value={newItemForm.brand} onChange={e => setNewItemForm({...newItemForm, brand: e.target.value})} style={{ backgroundColor: "#1c1c1e", border: "1px solid #007aff", borderRadius: "8px", padding: "12px", color: "#ffffff", fontSize: "15px", cursor: "pointer", outline: "none" }}>
                <option value="Citrus Springs">Citrus Springs</option>
                <option value="Cool Attitudes">Cool Attitudes</option>
                <option value="Twisted Branch">Twisted Branch</option>
                <option value="Madrinas Coffee">Madrinas Coffee</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Packaging Format</label>
              <select value={newItemForm.type} onChange={e => setNewItemForm({...newItemForm, type: e.target.value})} style={{ backgroundColor: "#1c1c1e", border: "1px solid #007aff", borderRadius: "8px", padding: "12px", color: "#ffffff", fontSize: "15px", cursor: "pointer", outline: "none" }}>
                <option value="3G Bag-in-Box">3G Bag-in-Box</option>
                <option value="1G Jug Case">1G Jug Case</option>
                <option value="24-Can Case">24-Can Case</option>
              </select>
            </div>

            {/* Manual Text Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", color: "#ff9500", fontWeight: "600", textTransform: "uppercase" }}>Flavor / Liquid Profile *</label>
              <input autoFocus placeholder="e.g. Strawberry Puree" value={newItemForm.flavor} onChange={e => setNewItemForm({...newItemForm, flavor: e.target.value})} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", padding: "12px", color: "#ffffff", fontSize: "15px", outline: "none" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "#ff9500", fontWeight: "600", textTransform: "uppercase" }}>Lot Number *</label>
                <input placeholder="e.g. LOT-104" value={newItemForm.lotNumber} onChange={e => setNewItemForm({...newItemForm, lotNumber: e.target.value})} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", padding: "10px", color: "#ffffff", fontSize: "14px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", color: "#8e8e93", fontWeight: "600", textTransform: "uppercase" }}>Storage Zone</label>
                <input disabled value={newItemForm.zone} style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", padding: "10px", color: "#8e8e93", fontSize: "14px", cursor: "not-allowed" }} />
              </div>
            </div>

            <button onClick={handleSaveNewItem} style={{ backgroundColor: "#34c759", color: "#ffffff", border: "none", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginTop: "8px", boxShadow: "0 4px 14px rgba(52, 199, 89, 0.3)" }}>
              📥 Save & Receive Item
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
