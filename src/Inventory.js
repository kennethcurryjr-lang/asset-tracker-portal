import React, { useState, useEffect } from 'react';

// Mock initial data matching CS Group flavor baseline for quick preview testing
const initialMockData = [
  { barcode: "082123456781", lotNumber: "LOT-2026-01", brand: "Citrus Springs", flavor: "100% Orange Juice Concentrate", type: "3G Bag-in-Box", quantity: 420, zone: "Cooler Bay-01" },
  { barcode: "082123456782", lotNumber: "LOT-2026-02", brand: "Citrus Springs", flavor: "Apple Juice Premium", type: "3G Bag-in-Box", quantity: 180, zone: "Cooler Bay-01" },
  { barcode: "082123456783", lotNumber: "LOT-2026-03", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 310, zone: "Dry Aisle A" },
  { barcode: "082123456784", lotNumber: "LOT-2026-04", brand: "Twisted Branch", flavor: "Craft Lemonade Base", type: "3G Bag-in-Box", quantity: 35, zone: "Dry Aisle B" }, // Low stock example
  { barcode: "082123456785", lotNumber: "LOT-2026-05", brand: "Madrinas Coffee", flavor: "Vanilla Cold Brew RTD", type: "24-Can Case", quantity: 300, zone: "Dry Aisle C" }
];

export default function Inventory({ user }) {
  const [stock, setStock] = useState(initialMockData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPalletMode, setIsPalletMode] = useState(false);
  const [scanMode, setScanMode] = useState("receive"); // receive | ship | location
  const [activeZone, setActiveZone] = useState("Unassigned Warehouse");

  // Dynamic calculations to solve the 3 golden client questions instantly
  const totalBoxes = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeFlavorsCount = new Set(stock.map(item => item.flavor)).size;
  const lowStockCount = stock.filter(item => item.quantity < 50).length;

  // Filter logic for quick searching by flavor family or zone
  const filteredStock = stock.filter(item => 
    item.flavor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // High-speed simulation handler for scanning inputs
  const handleSimulatedScan = (scannedBarcode) => {
    const boxAdjustment = isPalletMode ? 70 : 1;
    
    setStock(prevStock => prevStock.map(item => {
      if (item.barcode === scannedBarcode) {
        if (scanMode === "receive") {
          return { ...item, quantity: item.quantity + boxAdjustment };
        } else if (scanMode === "ship") {
          return { ...item, quantity: Math.max(0, item.quantity - boxAdjustment) };
        }
      }
      return item;
    }));
  };

  return (
    <div style={{ backgroundColor: "#1c1c1e", color: "#ffffff", minHeight: "100vh", padding: "32px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em" }}>📦 Commercial Beverage Operations</h1>
          <p style={{ margin: "4px 0 0 0", color: "#8e8e93", fontSize: "14px" }}>Warehouse Logged in as: {user?.email || "Admin Mode"}</p>
        </div>
        
        {/* DISPATCH MODE CONTROLS */}
        <div style={{ display: "flex", backgroundColor: "#2c2c2e", padding: "4px", borderRadius: "12px" }}>
          <button onClick={() => setScanMode("receive")} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "receive" ? "#34c759" : "transparent", color: "#ffffff" }}>📥 Receive</button>
          <button onClick={() => setScanMode("ship")} style={{ padding: "10px 16px", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "ship" ? "#ff3b30" : "transparent", color: "#ffffff" }}>🚚 Ship</button>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>TOTAL WAREHOUSE STOCK</div>
          <div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px", color: "#34c759" }}>{totalBoxes.toLocaleString()} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Boxes</span></div>
        </div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>ACTIVE FLAVOR VARIETIES</div>
          <div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px" }}>{activeFlavorsCount} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Flavors</span></div>
        </div>
        <div style={{ backgroundColor: "#2c2c2e", padding: "24px", borderRadius: "16px", border: "1px solid #3a3a3c" }}>
          <div style={{ fontSize: "14px", color: "#8e8e93", fontWeight: "600" }}>LOW STOCK ALERTS</div>
          <div style={{ fontSize: "36px", fontWeight: "700", marginTop: "8px", color: lowStockCount > 0 ? "#ff9500" : "#34c759" }}>{lowStockCount} <span style={{ fontSize: "16px", color: "#8e8e93" }}>Critical</span></div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <input 
          type="text" 
          placeholder="🔎 Filter by Flavor, Brand, or Warehouse Zone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ backgroundColor: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "12px", padding: "14px 16px", width: "100%", maxWidth: "400px", color: "#ffffff", fontSize: "14px" }}
        />

        {/* FORKLIFT BULK PALLET SWITCH */}
        <button 
          onClick={() => setIsPalletMode(!isPalletMode)} 
          style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: isPalletMode ? "rgba(255, 149, 0, 0.15)" : "#2c2c2e", border: isPalletMode ? "1px solid #ff9500" : "1px solid #3a3a3c", padding: "12px 20px", borderRadius: "12px", cursor: "pointer", color: isPalletMode ? "#ff9500" : "#ffffff", fontWeight: "600", transition: "all 0.2s" }}
        >
          <span style={{ fontSize: "18px" }}>🪵</span> 
          Pallet Mode Multiplier ({isPalletMode ? "⚡ 70 BOXES" : "1 Box"})
        </button>
      </div>

      {/* MAIN INVENTORY MATRIX TABLE */}
      <div style={{ backgroundColor: "#2c2c2e", borderRadius: "16px", border: "1px solid #3a3a3c", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #3a3a3c", color: "#8e8e93", backgroundColor: "#242426" }}>
              <th style={{ padding: "16px" }}>Brand</th>
              <th style={{ padding: "16px" }}>Flavor Lineup</th>
              <th style={{ padding: "16px" }}>Packaging Type</th>
              <th style={{ padding: "16px" }}>Current Count</th>
              <th style={{ padding: "16px" }}>Warehouse Zone</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Test Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((item) => (
              <tr key={`${item.barcode}-${item.lotNumber}`} style={{ borderBottom: "1px solid #3a3a3c", transition: "background-color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#323236"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "16px", fontWeight: "600" }}>{item.brand}</td>
                <td style={{ padding: "16px" }}>{item.flavor} <br/><span style={{ fontSize: "11px", color: "#8e8e93" }}>Lot: {item.lotNumber}</span></td>
                <td style={{ padding: "16px", color: "#8e8e93" }}>{item.type}</td>
                <td style={{ padding: "16px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: "8px", fontWeight: "700", backgroundColor: item.quantity < 50 ? "rgba(255, 59, 48, 0.15)" : "rgba(52, 199, 89, 0.15)", color: item.quantity < 50 ? "#ff3b30" : "#34c759" }}>
                    {item.quantity} boxes
                  </span>
                </td>
                <td style={{ padding: "16px" }}>📍 {item.zone}</td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <button onClick={() => handleSimulatedScan(item.barcode)} style={{ backgroundColor: "#3a3a3c", border: "none", color: "#ffffff", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                    ⚡ Scan Barcode
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
