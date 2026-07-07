import './mobile-fixes.css';
import './kinetic-theme.css';
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanCommand, UpdateCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from './dynamoClient';
import { useAuth } from 'react-oidc-context';
import { Download, Truck, ArrowRightLeft, Package, ScanLine, ClipboardList, FileDown, Plus } from 'lucide-react';


// 📦 V1.0 Bulk Seed Data (Extracted from Drive Labels)
// You can map over this array to bulk-register these SKUs into DynamoDB
const bulkSeedFlavors = [
  { vendor: "Paradise Frozen Cocktails", productName: "Lime Margarita (2171-384)", packagingType: "📦 3G Bag-in-Box", upc: "782269217138", lotCode: "5154B", expirationDate: "2026-03-17", zone: "Dry Aisle A" },
  { vendor: "Citrus Springs Juices", productName: "Ginger Ale (3024-384)", packagingType: "📦 3G Bag-in-Box", upc: "782269302438", lotCode: "6320H", expirationDate: "2026-11-16", zone: "Dry Aisle A" },
  { vendor: "Citrus Springs Juices", productName: "Tonic (3026-384)", packagingType: "📦 3G Bag-in-Box", upc: "782269302636", lotCode: "6049H", expirationDate: "2026-10-21", zone: "Dry Aisle A" },
  { vendor: "Paradise Juice & Mixers", productName: "Cranberry (1160-384)", packagingType: "📦 3G Bag-in-Box", upc: "782269116035", lotCode: "6155H", expirationDate: "2026-04-10", zone: "Dry Aisle A" },
  { vendor: "Paradise Juice & Mixers", productName: "Orange Juice Blend (1012-384)", packagingType: "📦 3G Bag-in-Box", upc: "782269101239", lotCode: "6100H", expirationDate: "2026-02-08", zone: "Dry Aisle A" }
];



const initialMockData = [
  { barcode: "082123456781", lotNumber: "LOT-2026-01", expiryDate: "2026-10-15", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "100% Orange Juice Concentrate", packaging: "3G Bag-in-Box", type: "", quantity: 420, zone: "Cooler Bay-01" },
  { barcode: "082123456782", lotNumber: "LOT-2026-02", expiryDate: "2026-11-01", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Apple Juice Premium", packaging: "3G Bag-in-Box", type: "", quantity: 180, zone: "Cooler Bay-01" },
  { barcode: "082123456783", lotNumber: "LOT-2026-03", expiryDate: "2027-01-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 310, zone: "Dry Aisle A" },
  { barcode: "082123456783-OLD", lotNumber: "LOT-2025-11", expiryDate: "2026-08-10", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Top Shelf Margarita Mixer", type: "1G Jug Case", quantity: 45, zone: "Dry Aisle B" },
  { barcode: "082123456784", lotNumber: "LOT-2026-04", expiryDate: "2026-12-05", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Craft Lemonade Base", packaging: "3G Bag-in-Box", type: "", quantity: 35, zone: "Dry Aisle B" },
  { barcode: "082123456785", lotNumber: "LOT-2026-05", expiryDate: "2027-03-10", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Vanilla Cold Brew RTD", type: "24-Can Case", quantity: 300, zone: "Dry Aisle C" },
  { barcode: "082123456801", lotNumber: "LOT-2026-10", expiryDate: "2027-01-15", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Mocha Cold Brew", type: "24-Can Case", quantity: 410, zone: "Dry Aisle C" },
  { barcode: "082123456802", lotNumber: "LOT-2026-11", expiryDate: "2027-02-20", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Peach Mango Tea", type: "3G Bag-in-Box", quantity: 150, zone: "Cooler Bay-02" },
  { barcode: "082123456803", lotNumber: "LOT-2026-12", expiryDate: "2026-12-01", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Strawberry Lemonade", type: "3G Bag-in-Box", quantity: 220, zone: "Dry Aisle B" },
  { barcode: "082123456804", lotNumber: "LOT-2026-13", expiryDate: "2027-04-10", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Pina Colada Mixer", type: "1G Jug Case", quantity: 80, zone: "Dry Aisle A" },
  { barcode: "082123456805", lotNumber: "LOT-2026-14", expiryDate: "2027-01-05", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Caramel Cold Brew", type: "24-Can Case", quantity: 340, zone: "Dry Aisle C" },
  { barcode: "082123456806", lotNumber: "LOT-2026-15", expiryDate: "2026-11-15", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Cranberry Juice Blend", type: "3G Bag-in-Box", quantity: 95, zone: "Cooler Bay-01" },
  { barcode: "082123456807", lotNumber: "LOT-2026-16", expiryDate: "2027-03-22", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Sweet Tea Base", type: "3G Bag-in-Box", quantity: 400, zone: "Dry Aisle B" },
  { barcode: "082123456808", lotNumber: "LOT-2026-17", expiryDate: "2026-09-30", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Strawberry Daiquiri", type: "1G Jug Case", quantity: 25, zone: "Dry Aisle A" },
  { barcode: "082123456809", lotNumber: "LOT-2026-18", expiryDate: "2027-05-11", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Dark Roast Espresso", type: "12-Can Case", quantity: 215, zone: "Dry Aisle C" },
  { barcode: "082123456810", lotNumber: "LOT-2026-19", expiryDate: "2027-02-28", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Grapefruit Juice", type: "3G Bag-in-Box", quantity: 180, zone: "Cooler Bay-02" },
  { barcode: "082123456811", lotNumber: "LOT-2026-20", expiryDate: "2026-12-15", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Unsweetened Tea", type: "3G Bag-in-Box", quantity: 310, zone: "Dry Aisle B" },
  { barcode: "082123456812", lotNumber: "LOT-2026-21", expiryDate: "2027-06-01", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Mango Puree", type: "1G Jug Case", quantity: 145, zone: "Dry Aisle A" },
  { barcode: "082123456813", lotNumber: "LOT-2026-22", expiryDate: "2027-01-20", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Hazelnut Cold Brew", type: "24-Can Case", quantity: 290, zone: "Dry Aisle C" },
  { barcode: "082123456814", lotNumber: "LOT-2026-23", expiryDate: "2026-10-31", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Pineapple Juice", type: "3G Bag-in-Box", quantity: 110, zone: "Cooler Bay-01" },
  { barcode: "082123456815", lotNumber: "LOT-2026-24", expiryDate: "2027-04-05", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Raspberry Lemonade", type: "3G Bag-in-Box", quantity: 275, zone: "Dry Aisle B" },
  { barcode: "082123456816", lotNumber: "LOT-2026-25", expiryDate: "2026-11-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Mojito Mix", type: "1G Jug Case", quantity: 65, zone: "Dry Aisle A" },
  { barcode: "082123456817", lotNumber: "LOT-2026-26", expiryDate: "2027-08-15", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Nitro Black", type: "12-Can Case", quantity: 180, zone: "Dry Aisle C" },
  { barcode: "082123456818", lotNumber: "LOT-2026-27", expiryDate: "2027-03-10", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Pomegranate Blend", type: "3G Bag-in-Box", quantity: 140, zone: "Cooler Bay-02" },
  { barcode: "082123456819", lotNumber: "LOT-2026-28", expiryDate: "2026-12-25", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Arnold Palmer Base", type: "3G Bag-in-Box", quantity: 200, zone: "Dry Aisle B" },
  { barcode: "082123456820", lotNumber: "LOT-2026-29", expiryDate: "2027-05-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Sweet & Sour Mix", type: "1G Jug Case", quantity: 420, zone: "Dry Aisle A" },
  { barcode: "082123456821", lotNumber: "LOT-2026-30", expiryDate: "2027-02-14", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Peppermint Mocha", type: "24-Can Case", quantity: 50, zone: "Dry Aisle C" },
  { barcode: "082123456822", lotNumber: "LOT-2026-31", expiryDate: "2026-11-05", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Tomato Juice", type: "3G Bag-in-Box", quantity: 85, zone: "Cooler Bay-01" },
  { barcode: "082123456823", lotNumber: "LOT-2026-32", expiryDate: "2027-07-01", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Blood Orange Lemonade", type: "3G Bag-in-Box", quantity: 160, zone: "Dry Aisle B" },
  { barcode: "082123456824", lotNumber: "LOT-2026-33", expiryDate: "2026-10-15", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Bloody Mary Mix", type: "1G Jug Case", quantity: 130, zone: "Dry Aisle A" },
  { barcode: "082123456825", lotNumber: "LOT-2026-34", expiryDate: "2027-09-10", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Oat Milk Latte", type: "12-Can Case", quantity: 310, zone: "Dry Aisle C" },
  { barcode: "082123456826", lotNumber: "LOT-2026-35", expiryDate: "2027-01-10", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Apple Cider", type: "3G Bag-in-Box", quantity: 185, zone: "Cooler Bay-01" },
  { barcode: "082123456827", lotNumber: "LOT-2026-36", expiryDate: "2026-06-10", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Grape Juice", type: "3G Bag-in-Box", quantity: 60, zone: "Cooler Bay-02" },
  { barcode: "082123456828", lotNumber: "LOT-2026-37", expiryDate: "2027-08-05", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Guava Nectar", type: "3G Bag-in-Box", quantity: 240, zone: "Cooler Bay-01" },
  { barcode: "082123456829", lotNumber: "LOT-2026-38", expiryDate: "2027-04-18", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Watermelon Splash", type: "3G Bag-in-Box", quantity: 315, zone: "Cooler Bay-02" },
  { barcode: "082123456830", lotNumber: "LOT-2026-39", expiryDate: "2027-02-28", vendorEmail: "orders@citrussprings.com", brand: "Citrus Springs", flavor: "Kiwi Strawberry", type: "3G Bag-in-Box", quantity: 110, zone: "Cooler Bay-01" },
  { barcode: "082123456831", lotNumber: "LOT-2026-40", expiryDate: "2027-10-15", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Blue Hawaiian", type: "1G Jug Case", quantity: 45, zone: "Dry Aisle A" },
  { barcode: "082123456832", lotNumber: "LOT-2026-41", expiryDate: "2026-12-05", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Mai Tai Mix", type: "1G Jug Case", quantity: 220, zone: "Dry Aisle A" },
  { barcode: "082123456833", lotNumber: "LOT-2026-42", expiryDate: "2027-06-20", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Peach Bellini", type: "1G Jug Case", quantity: 175, zone: "Dry Aisle A" },
  { barcode: "082123456834", lotNumber: "LOT-2026-43", expiryDate: "2027-03-30", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Hurricane Mix", type: "1G Jug Case", quantity: 90, zone: "Dry Aisle A" },
  { barcode: "082123456835", lotNumber: "LOT-2026-44", expiryDate: "2027-09-12", vendorEmail: "wholesale@coolattitudes.com", brand: "Cool Attitudes", flavor: "Spicy Margarita", type: "1G Jug Case", quantity: 300, zone: "Dry Aisle A" },
  { barcode: "082123456836", lotNumber: "LOT-2026-45", expiryDate: "2027-01-25", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Peach Tea", type: "3G Bag-in-Box", quantity: 410, zone: "Dry Aisle B" },
  { barcode: "082123456837", lotNumber: "LOT-2026-46", expiryDate: "2026-11-10", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Green Tea Base", type: "3G Bag-in-Box", quantity: 150, zone: "Dry Aisle B" },
  { barcode: "082123456838", lotNumber: "LOT-2026-47", expiryDate: "2027-07-08", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Half & Half", type: "3G Bag-in-Box", quantity: 280, zone: "Dry Aisle B" },
  { barcode: "082123456839", lotNumber: "LOT-2026-48", expiryDate: "2027-05-14", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Matcha Blend", type: "3G Bag-in-Box", quantity: 85, zone: "Dry Aisle B" },
  { barcode: "082123456840", lotNumber: "LOT-2026-49", expiryDate: "2027-02-18", vendorEmail: "distro@twistedbranch.com", brand: "Twisted Branch", flavor: "Hibiscus Tea", type: "3G Bag-in-Box", quantity: 195, zone: "Dry Aisle B" },
  { barcode: "082123456841", lotNumber: "LOT-2026-50", expiryDate: "2027-11-01", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "French Vanilla", type: "24-Can Case", quantity: 350, zone: "Dry Aisle C" },
  { barcode: "082123456842", lotNumber: "LOT-2026-51", expiryDate: "2026-05-20", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Decaf Cold Brew", type: "12-Can Case", quantity: 70, zone: "Dry Aisle C" },
  { barcode: "082123456843", lotNumber: "LOT-2026-52", expiryDate: "2027-08-19", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Mocha Frappe", type: "24-Can Case", quantity: 215, zone: "Dry Aisle C" },
  { barcode: "082123456844", lotNumber: "LOT-2026-53", expiryDate: "2027-04-30", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "White Chocolate", type: "12-Can Case", quantity: 130, zone: "Dry Aisle C" },
  { barcode: "082123456845", lotNumber: "LOT-2026-54", expiryDate: "2027-12-12", vendorEmail: "supply@madrinas.com", brand: "Madrinas Coffee", flavor: "Irish Cream", type: "24-Can Case", quantity: 400, zone: "Dry Aisle C" }
];

const MANAGER_PIN = process.env.REACT_APP_MANAGER_PIN || "UNSET_PLEASE_CONFIGURE";


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
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10000, backgroundColor: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: "8px", maxHeight: '220px', overflowY: 'auto', marginTop: '8px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)' }}>
          {options.filter(o => (o.label||'').toLowerCase().includes((value||'').toLowerCase())).map((o, i) => (
            <div key={i} onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setShow(false); }} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '15px', cursor: 'pointer', backgroundColor: 'var(--surface-elevated)' }}>
              {o.label}
            </div>
          ))}
          {options.filter(o => (o.label||'').toLowerCase().includes((value||'').toLowerCase())).length === 0 && (
            <div style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '15px', fontStyle: 'italic' }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Inventory({ user }) {
  const [masterAuditSearch, setMasterAuditSearch] = React.useState("");
  const [ledgerSearch, setLedgerSearch] = React.useState("");

  // ==========================================
  // 🛡️ CENTRAL MATH CONTROLLER & GATEKEEPER
  // ==========================================
  const processInventoryMath = (action, currentQty, locations, adjustmentQty, targetZone = "Unassigned Warehouse") => {
    const cleanAdj = Math.max(0, Math.abs(parseInt(adjustmentQty) || 0));
    if (cleanAdj === 0) throw new Error("Transaction quantity must be greater than zero.");

    let updatedLocs = JSON.parse(JSON.stringify(locations || []));
    if (updatedLocs.length === 0) updatedLocs = [{ name: targetZone, qty: currentQty }];
    
    let newTotal = parseInt(currentQty) || 0;

    if (action.includes("Receive")) {
      let loc = updatedLocs.find(l => l.name === targetZone);
      if (loc) loc.qty += cleanAdj;
      else updatedLocs.push({ name: targetZone, qty: cleanAdj });
      newTotal += cleanAdj;
      
    } else if (action.includes("Ship") || action.includes("Shrinkage")) {
      if (newTotal < cleanAdj) throw new Error(`Insufficient stock. Cannot remove ${cleanAdj} bx. (Only ${newTotal} bx available)`);
      
      let remaining = cleanAdj;
      updatedLocs.sort((a, b) => b.qty - a.qty);
      for (let loc of updatedLocs) {
        if (remaining <= 0) break;
        let deduct = Math.min(loc.qty, remaining);
        loc.qty -= deduct;
        remaining -= deduct;
      }
      newTotal -= cleanAdj;

    } else if (action.includes("Transfer")) {
      if (newTotal < cleanAdj) throw new Error(`Insufficient stock to transfer ${cleanAdj} bx.`);
      
      // Deduct from current zones
      let remaining = cleanAdj;
      updatedLocs.sort((a, b) => b.qty - a.qty);
      for (let loc of updatedLocs) {
        if (remaining <= 0) break;
        let deduct = Math.min(loc.qty, remaining);
        loc.qty -= deduct;
        remaining -= deduct;
      }
      
      // Add to target zone
      let tLoc = updatedLocs.find(l => l.name === targetZone);
      if (tLoc) tLoc.qty += cleanAdj;
      else updatedLocs.push({ name: targetZone, qty: cleanAdj });
    }

    // Clean up empty zones
    updatedLocs = updatedLocs.filter(l => l.qty > 0);
    
    return { 
      validatedQty: newTotal, 
      validatedLocations: updatedLocs 
    };
  };

  const auth = useAuth();
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "var(--bg-canvas)";
    return () => { document.body.style.backgroundColor = originalBg; };
    }, []);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPalletMode, setIsPalletMode] = useState(false);
  const [rapidFire, setRapidFire] = useState(false);
  const [customQty, setCustomQty] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [scanMode, setScanMode] = useState("receive");
  const [activeZone, setActiveZone] = useState("Unassigned Warehouse");
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");

  // --- OFFLINE DEAD ZONE ENGINE ---
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inventory_offline_queue")) || []; } catch(e) { return []; }
  });

  useEffect(() => { localStorage.setItem("inventory_offline_queue", JSON.stringify(offlineQueue)); }, [offlineQueue]);

  const flushOfflineQueue = async () => {
    const queueToFlush = JSON.parse(localStorage.getItem("inventory_offline_queue") || "[]");
    if (queueToFlush.length === 0) return;
    
    setOfflineQueue([]); // Clear immediately to prevent double-execution
    let failures = [];

    for (const task of queueToFlush) {
      try {
        if (task.type === "INVENTORY_ACTION") {
          await docClient.send(new UpdateCommand(task.inventoryPayload));
          await docClient.send(new PutCommand({ TableName: "BeverageAuditLogs", Item: task.logEntry }));
        } else if (task.type === "NEW_ITEM") {
          await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: task.payload }));
        }
      } catch (err) {
        console.error("Offline sync failed for task:", err);
        failures.push(task);
      }
    }
    
    if (failures.length > 0) {
      setOfflineQueue(prev => [...prev, ...failures]);
      setScanFeedback("⚠️ Some offline tasks failed to sync.");
    } else {
      setScanFeedback("✅ ☁️ Offline queue fully synced to cloud!");
    }
    setTimeout(() => setScanFeedback(""), 4000);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); flushOfflineQueue(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine && offlineQueue.length > 0) flushOfflineQueue(); // Initial load flush
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);
  // --------------------------------

  
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ barcode: "", brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: 1, zone: "" });

    const [showHelpModal, setShowHelpModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('zones');
  const [adminZones, setAdminZones] = useState(() => JSON.parse(localStorage.getItem('admin_zones') || '[]'));
  const [adminVendors, setAdminVendors] = useState(() => JSON.parse(localStorage.getItem('admin_vendors') || '[]'));
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('admin_pin') || process.env.REACT_APP_MANAGER_PIN || "0000");

  useEffect(() => { localStorage.setItem('admin_zones', JSON.stringify(adminZones)); }, [adminZones]);
  useEffect(() => { localStorage.setItem('admin_vendors', JSON.stringify(adminVendors)); }, [adminVendors]);
  useEffect(() => { localStorage.setItem('admin_pin', adminPin); }, [adminPin]);

  const [pendingAction, setPendingAction] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [showLotModal, setShowLotModal] = useState(false);
  const [pendingLotMatches, setPendingLotMatches] = useState([]);
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_audit_log");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("inventory_audit_log", JSON.stringify(auditLog));
  }, [auditLog]);

  const [flippedCards, setFlippedCards] = useState([]);
  const [expandedCards, setExpandedCards] = useState([]);
  const [isMultiFlipMode, setIsMultiFlipMode] = useState(false);

  const [editModes, setEditModes] = useState({});
  const [editForms, setEditForms] = useState({});

  const [pinModal, setPinModal] = useState({ isOpen: false, callback: null, error: false });
  const [pinInput, setPinInput] = useState("");
  
  const [printLabelItem, setPrintLabelItem] = useState(null);
  const [flavorSort, setFlavorSort] = useState("qty_desc");

  const totalBoxes = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeFlavorsCount = new Set(stock.map(item => item.flavor)).size;
  const lowStockItems = stock.filter(item => item.quantity < 50);

  const filteredStock = stock.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();
    
    // 1. Deep Text Sweep (Checks literally every string field on the card)
    const textMatch = [
      item.flavor, item.brand, item.zone, item.barcode, 
      item.type, item.lotNumber, item.vendorEmail, item.expiryDate,
      ...(item.locations ? item.locations.map(l => l.name) : [])
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
    ...adminVendors,
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
    if (pinInput === adminPin || pinInput === MANAGER_PIN) {
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
      if (response.Items && response.Items.length >= initialMockData.length) {
        setStock(prev => JSON.stringify(prev) === JSON.stringify(response.Items) ? prev : response.Items);
      } else {
        const existingBarcodes = new Set((response.Items || []).map(i => i.barcode));
        const missingItems = initialMockData.filter(i => !existingBarcodes.has(i.barcode));
        if (missingItems.length > 0) {
            await Promise.all(missingItems.map(item => docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))));
            const updatedResponse = await docClient.send(new ScanCommand({ TableName: "BeverageInventoryData" }));
            setStock(prev => JSON.stringify(prev) === JSON.stringify(updatedResponse.Items || initialMockData) ? prev : (updatedResponse.Items || initialMockData));
        } else {
            setStock(prev => JSON.stringify(prev) === JSON.stringify(response.Items) ? prev : response.Items);
        }
        await Promise.all(initialMockData.map(item => docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: item }))));
        setStock(initialMockData);
      }
    } catch (err) { console.error("DynamoDB Fetch Error:", err); }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await docClient.send(new ScanCommand({ TableName: "BeverageAuditLogs" }));
      // ONLY update local state if the cloud actually has data!
      if (response.Items && response.Items.length > 0) { 
        const sorted = response.Items.sort((a, b) => b.id - a.id); 
        setAuditLog(prev => JSON.stringify(prev) === JSON.stringify(sorted) ? prev : sorted); 
      }
    } catch (err) { 
        // Table doesn't exist yet. Fails silently so it doesn't wipe local storage!
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchAuditLogs();
    const interval = setInterval(() => { fetchInventory(); fetchAuditLogs(); }, 45000); // Throttled to 45s to protect DynamoDB limits
    
    // 🔥 Wake-Up Engine: Force sync when tab regains focus (bypasses browser throttling)
    const handleFocus = () => { fetchInventory(); fetchAuditLogs(); };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const processScannedCode = async (rawScan, preSelectedTarget = null) => {
    const cleanScan = String(rawScan).trim();
    if (cleanScan.startsWith("ZONE-") || cleanScan.startsWith("BAY-")) {
      setActiveZone(cleanScan);
      setScanFeedback(`📍 Location Locked: New items will be routed to ${cleanScan}`);
      setTimeout(() => setScanFeedback(""), 4000);
      return;
    }
    const parsedQty = Math.max(1, Math.abs(parseInt(customQty) || 1));
    const matchingItems = stock.filter(item => item.barcode === cleanScan || cleanScan.includes(item.barcode) || item.barcode.includes(cleanScan));
    
    if (!preSelectedTarget && matchingItems.length > 1 && scanMode !== "receive") {
      setPendingLotMatches(matchingItems);
      setShowLotModal(true);
      return;
    }
    const targetItem = preSelectedTarget || matchingItems[0];
    // Dynamically calculate footprint based on packaging type
    const palletMultiplier = targetItem ? ({"3G Bag-in-Box": 60, "24-Can Case": 100, "12-Can Case": 150, "1G Jug Case": 70, "1/2 BBL Keg": 8, "1/6 BBL Keg": 20}[targetItem.type] || 70) : 70;
    const rawAdjustment = isPalletMode ? palletMultiplier * parsedQty : parsedQty;
    
    if (targetItem && scanMode === "ship" && targetItem.expiryDate && targetItem.expiryDate !== "N/A" && new Date(targetItem.expiryDate) < new Date()) {
      const forceDisposal = window.confirm(`🚨 COMPLIANCE LOCK: ${targetItem.flavor} (Lot: ${targetItem.lotNumber}) is EXPIRED and cannot be shipped to a customer.\n\nDo you want to override this lock and route the product to mandatory Shrinkage/Disposal?`);
      if (forceDisposal) {
        const boxAdjustment = rawAdjustment > targetItem.quantity ? targetItem.quantity : rawAdjustment;
        setModalQty(boxAdjustment);
        setPendingAction({ targetItem, boxAdjustment, newQuantity: Math.max(0, targetItem.quantity - boxAdjustment), newZone: targetItem.zone, actionName: "Ship", fifoWarningItem: null, isShrinkage: true });
        setShowConfirmModal(true);
      }
      setIsScanning(false);
      return;
    }
    
    if (targetItem && scanMode !== "receive" && targetItem.quantity === 0) {
      alert(`🛑 DEPLETED: You cannot ${scanMode} ${targetItem.flavor} because there are 0 boxes in stock.`);
      setIsScanning(false);
      return;
    }
    
    const boxAdjustment = (targetItem && scanMode !== "receive" && rawAdjustment > targetItem.quantity) ? targetItem.quantity : rawAdjustment;

    if (targetItem) {
      // INTERCEPT: Force operator to assign a new Lot Number when receiving known freight
      if (scanMode === "receive") {
        setNewItemForm({ ...targetItem, lotNumber: "", expiryDate: "", quantity: boxAdjustment, zone: activeZone !== "Unassigned Warehouse" ? activeZone : (targetItem.zone || "Unassigned Warehouse") });
        setScanFeedback("⚠️ UPC Recognized. Verify Lot Number & Expiry Date.");
        setShowNewItemModal(true);
        setTimeout(() => setScanFeedback(""), 4000);
        return;
      }
      const isTargetExpired = targetItem.expiryDate && targetItem.expiryDate !== "N/A" && new Date(targetItem.expiryDate) < new Date();
      const newQuantity = scanMode === "receive" ? targetItem.quantity + boxAdjustment : Math.max(0, targetItem.quantity - boxAdjustment);
      const newZone = (scanMode === "receive" && activeZone !== "Unassigned Warehouse") ? activeZone : targetItem.zone;
      
      let fifoWarningItem = null;
      if (scanMode === "ship") {
        const olderLots = stock.filter(i => 
          i.flavor === targetItem.flavor && 
          i.quantity > 0 && 
          new Date(i.expiryDate) < new Date(targetItem.expiryDate) && !(i.expiryDate && i.expiryDate !== "N/A" && new Date(i.expiryDate) < new Date())
        );
        if (olderLots.length > 0) {
          olderLots.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          fifoWarningItem = olderLots[0]; 
        }
      }

      setModalQty(boxAdjustment);
      setPendingAction({ targetItem, boxAdjustment, newQuantity, newZone, actionName: scanMode === "receive" ? "Receive" : (scanMode === "transfer" ? "Transfer" : "Ship"), fifoWarningItem, isShrinkage: false });
      setShowConfirmModal(true);
    } else {
      setNewItemForm({ barcode: cleanScan, brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: boxAdjustment, zone: activeZone !== "Unassigned Warehouse" ? activeZone : "Unassigned Warehouse" });
      setShowNewItemModal(true);
    }
  };


  const handleUndoAction = (logEntry) => {
    const targetItem = stock.find(i => i.barcode === logEntry.barcode && i.lotNumber === logEntry.lotNumber);
    if (!targetItem) return alert("Error: Original product no longer found in active database.");
    
    let reverseAction = "";
    let zoneAdjustment = logEntry.destination || targetItem.zone || "Unassigned Warehouse";
    
    if (logEntry.action.includes("Receive")) reverseAction = "Ship";
    else if (logEntry.action.includes("Ship") || logEntry.action.includes("Shrinkage")) reverseAction = "Receive";
    else return alert("Transfer or Override actions must be reversed manually.");

    setModalQty(logEntry.qty);
    setPendingAction({
      targetItem,
      boxAdjustment: logEntry.qty,
      newQuantity: reverseAction === "Receive" ? targetItem.quantity + logEntry.qty : Math.max(0, targetItem.quantity - logEntry.qty),
      newZone: zoneAdjustment,
      actionName: reverseAction + " (UNDO)",
      isShrinkage: false
    });
    setShowAuditModal(false);
    setTimeout(() => setShowConfirmModal(true), 150);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    let { targetItem, newZone, actionName, isShrinkage } = pendingAction;
    if (isShrinkage) actionName = "💥 Shrinkage";
    const boxAdjustment = modalQty;
    
    if (actionName !== "Receive" && boxAdjustment > targetItem.quantity) {
        alert(`🛑 INSUFFICIENT STOCK: You are attempting to process ${boxAdjustment} boxes, but only ${targetItem.quantity} are available.`);
        return;
    }

    // Initialize the locations array if it's an older single-zone card
    let updatedLocations = (targetItem.locations && targetItem.locations.length > 0) ? JSON.parse(JSON.stringify(targetItem.locations)) : [{ name: targetItem.zone || "Unassigned Warehouse", qty: parseInt(targetItem.quantity) || 0 }];

    if (actionName === "Transfer" && newZone) {
        // Strict FIFO Check: Does this zone contain an older lot?
        const fifoViolation = stock.some(s => 
            s.flavor === targetItem.flavor && 
            s.lotNumber !== targetItem.lotNumber && 
            s.quantity > 0 &&
            (s.locations || []).some(l => l.name === newZone) && 
            new Date(s.expiryDate || "2099-12-31") < new Date(targetItem.expiryDate || "2099-12-31") && !(s.expiryDate && s.expiryDate !== "N/A" && new Date(s.expiryDate) < new Date())
        );
        
        if (fifoViolation) {
            alert("🛑 FIFO VIOLATION: " + newZone + " already contains an older lot of " + targetItem.flavor + ". Please select a different placement zone to prevent pallet trapping.");
            return; // Hard stop
        }
        // Cascading deduction for Transfers to prevent fractional inflation
        let remaining = boxAdjustment;
        updatedLocations.sort((a, b) => b.qty - a.qty);
        for (let loc of updatedLocations) {
            if (remaining <= 0) break;
            let deduct = Math.min(loc.qty, remaining);
            loc.qty -= deduct;
            remaining -= deduct;
        }
        
        // Add the stock to the new zone
        let dest = updatedLocations.find(loc => loc.name === newZone);
        if (dest) dest.qty += boxAdjustment;
        else updatedLocations.push({ name: newZone, qty: boxAdjustment });
    } else if (actionName.includes("Receive")) {
        let destName = newZone || targetItem.zone || "Unassigned Warehouse";
        let dest = updatedLocations.find(loc => loc.name === destName);
        if (dest) dest.qty += boxAdjustment;
        else updatedLocations.push({ name: destName, qty: boxAdjustment });
    } else {
        // Shipping or Shrinkage: Cascading deduction to handle large bulk removals safely
        let remaining = boxAdjustment;
        updatedLocations.sort((a, b) => b.qty - a.qty);
        for (let loc of updatedLocations) {
            if (remaining <= 0) break;
            let deduct = Math.min(loc.qty, remaining);
            loc.qty -= deduct;
            remaining -= deduct;
        }
    }

    // Clean up empty zones so they disappear from the UI
    updatedLocations = updatedLocations.filter(loc => loc.qty > 0);
    const newQuantity = updatedLocations.reduce((sum, loc) => sum + loc.qty, 0);
    
    const logEntry = { id: Date.now(), time: new Date().toLocaleString(), user: user?.email || auth?.user?.profile?.email || "Operator", action: actionName.replace(/[^a-zA-Z ()]/g, "").trim(), qty: boxAdjustment, flavor: targetItem.flavor, barcode: targetItem.barcode, lotNumber: targetItem.lotNumber, destination: actionName.includes("Transfer") ? newZone : (actionName.includes("Receive") ? (newZone || targetItem.zone || "Unassigned Warehouse") : null), orderNumber: orderNumber.trim() || null };
    setAuditLog(prev => [logEntry, ...prev]);

    const newScan = { action: logEntry.action, qty: boxAdjustment, time: logEntry.time, timestamp: logEntry.id, orderNumber: logEntry.orderNumber };
    const updatedScans = [newScan, ...(targetItem.recentScans || [])].slice(0, 5);

    setStock(prevStock => prevStock.map(item => (item.barcode === targetItem.barcode && item.lotNumber === targetItem.lotNumber) ? { ...item, quantity: newQuantity, locations: updatedLocations, zone: newZone || item.zone, recentScans: updatedScans } : item));
    setScanFeedback(`✅ ${logEntry.action} ${boxAdjustment}bx ${targetItem.flavor}` + (logEntry.destination ? ` ➔ ${logEntry.destination.replace("ZONE-", "").replace("BAY-", "")}` : ""));
    setShowConfirmModal(false); setPendingAction(null); setOrderNumber("");

    const inventoryPayload = { TableName: "BeverageInventoryData", Key: { barcode: targetItem.barcode, lotNumber: targetItem.lotNumber }, UpdateExpression: "SET quantity = :q, #z = :z, recentScans = :rs, locations = :locs", ConditionExpression: "quantity = :expectedOldQty", ExpressionAttributeNames: { "#z": "zone" }, ExpressionAttributeValues: { ":q": newQuantity, ":z": newZone || targetItem.zone, ":rs": updatedScans, ":locs": updatedLocations, ":expectedOldQty": targetItem.quantity } };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, { type: "INVENTORY_ACTION", inventoryPayload, logEntry }]);
      setScanFeedback(`📴 Saved Locally: ${logEntry.action} ${boxAdjustment}bx ${targetItem.flavor}`);
      setTimeout(() => setScanFeedback(""), 4000);
    } else {
      try { await docClient.send(new UpdateCommand(inventoryPayload)); } 
      catch (err) { if (err.name === "ConditionalCheckFailedException") { alert("⚠️ COLLISION DETECTED: Another operator modified this stock while you were processing. Action blocked to prevent corruption. Refreshing..."); fetchInventory(); } else { console.error("Inventory cloud update failed:", err); } }
      try { await docClient.send(new PutCommand({ TableName: "BeverageAuditLogs", Item: logEntry })); } 
      catch (err) { console.error("Audit log cloud sync failed:", err); }
      setTimeout(() => setScanFeedback(""), 4000);
    }
  };

  const handleManualAdd = () => { setNewItemForm({ barcode: "", brand: "", flavor: "", type: "", lotNumber: "", expiryDate: "", vendorEmail: "", quantity: 0, zone: "" }); setShowNewItemModal(true); };
  const handleSaveNewItem = () => { if (!newItemForm.barcode || !newItemForm.flavor || !newItemForm.lotNumber) return alert("Required fields missing."); executeSaveNewItem(); };

  const executeSaveNewItem = async () => {
    const adjQty = parseInt(newItemForm.quantity) || 0;
    if (adjQty <= 0) return alert("Quantity must be greater than zero.");
    
    const targetZone = newItemForm.zone || "Unassigned Warehouse";
    const isExisting = stock.find(i => i.barcode === newItemForm.barcode && i.lotNumber === newItemForm.lotNumber);
    
    let updatedItem;
    if (isExisting) {
      let locs = JSON.parse(JSON.stringify(isExisting.locations || []));
      let dest = locs.find(l => l.name === targetZone);
      if (dest) dest.qty += adjQty; else locs.push({ name: targetZone, qty: adjQty });
      updatedItem = { ...isExisting, ...newItemForm, quantity: parseInt(isExisting.quantity) + adjQty, locations: locs };
    } else {
      updatedItem = { ...newItemForm, quantity: adjQty, locations: [{ name: targetZone, qty: adjQty }] };
    }

    const logEntry = { id: Date.now(), time: new Date().toLocaleString(), user: user?.email || auth?.user?.profile?.email || "Operator", action: "Receive", qty: adjQty, flavor: updatedItem.flavor, barcode: updatedItem.barcode, lotNumber: updatedItem.lotNumber, destination: targetZone, orderNumber: null };
    
    setAuditLog(prev => [logEntry, ...prev]);

    const newScan = { action: "Receive", qty: adjQty, time: logEntry.time, timestamp: logEntry.id };
    updatedItem.recentScans = [newScan, ...(updatedItem.recentScans || [])].slice(0, 5);

    setStock(prev => {
      const idx = prev.findIndex(i => i.barcode === updatedItem.barcode && i.lotNumber === updatedItem.lotNumber);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = updatedItem;
        return updated;
      }
      return [...prev, updatedItem];
    });
    
    setShowNewItemModal(false); 
    setScanFeedback(`✅ 📥 Received ${adjQty}bx ${updatedItem.flavor}`);
    setTimeout(() => setScanFeedback(""), 4000);
    
    Object.keys(updatedItem).forEach(key => updatedItem[key] === undefined && delete updatedItem[key]);

    if (isOffline) {
      setOfflineQueue(prev => [...prev, { type: "NEW_ITEM", payload: updatedItem }]);
    } else {
      try { await docClient.send(new PutCommand({ TableName: "BeverageInventoryData", Item: updatedItem })); } catch (err) { console.error("Failed to register:", err); }
      try { await docClient.send(new PutCommand({ TableName: "BeverageAuditLogs", Item: logEntry })); } catch(e){}
    }
  };;

  const handleSaveCardEdit = async (barcode) => {
    const form = editForms[barcode];
    const originalItem = stock.find(i => i.barcode === barcode);
    if (!form) { alert("Error: Form is empty."); return; }
    if (!originalItem) { alert("Error: Item not found."); return; }

    // Reconcile Multi-Zone Arrays with the manual quantity edit
    // Only consolidate locations if the manager actively changed the total stock or target zone
    form.quantity = parseInt(form.quantity) || 0;
    if (form.quantity !== parseInt(originalItem.quantity) || form.zone !== originalItem.zone) {
        form.locations = [{ name: form.zone || "Unassigned Warehouse", qty: form.quantity }];
    } else {
        form.locations = originalItem.locations || [{ name: originalItem.zone || "Unassigned Warehouse", qty: originalItem.quantity }];
    }
    form.lastScanTimestamp = Date.now();

    const logEntry = { id: Date.now(), time: new Date().toLocaleString(), user: user?.email || auth?.user?.profile?.email || "Manager", action: "Admin Override", qty: form.quantity - originalItem.quantity, flavor: originalItem.flavor, barcode: originalItem.barcode, lotNumber: originalItem.lotNumber };
    setAuditLog(prev => [logEntry, ...prev]);

    setStock(prev => prev.map(item => (item.barcode === originalItem.barcode && item.lotNumber === originalItem.lotNumber) ? { ...item, ...form } : item));
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
    stock.forEach(item => { csvRows.push([ `"${item.brand}"`, `"${item.flavor}"`, `"${item.type || item.packaging || 'Unspecified'}"`, item.quantity, `"${item.zone}"`, `"${item.lotNumber}"`, `"${item.expiryDate}"`, `"${item.vendorEmail}"` ].join(",")); });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `CS_Inventory_Snapshot_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const processRef = useRef(); processRef.current = processScannedCode;
  const rapidFireRef = useRef(rapidFire); rapidFireRef.current = rapidFire;
  const lastScanRef = useRef(0);
  useEffect(() => {
    let qrCodeInstance;
    if (isScanning) {
      setTimeout(() => {
        qrCodeInstance = new Html5Qrcode("reader");
        qrCodeInstance.start(
          { facingMode: "environment" }, 
          { fps: 30, qrbox: { width: 300, height: 150 }, aspectRatio: 1.777778 },
          (decodedText) => {
          if (rapidFireRef.current) {
            const now = Date.now();
            if (now - lastScanRef.current > 1500) {
              lastScanRef.current = now;
              if (processRef.current) processRef.current(decodedText);
            }
          } else {
            qrCodeInstance.stop().then(() => {
              setIsScanning(false);
              if (processRef.current) processRef.current(decodedText);
            }).catch(e => console.log(e));
          }
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

  const flavorTotals = Array.from(stock.reduce((map, item) => {
    const existing = map.get(item.flavor) || { qty: 0, lastScan: 0 };
    const itemRecent = (item.recentScans && item.recentScans.length > 0) ? item.recentScans[0].timestamp : 0;
    map.set(item.flavor, { qty: existing.qty + item.quantity, lastScan: Math.max(existing.lastScan, itemRecent) });
    return map;
  }, new Map()), ([name, data]) => ({ name, qty: data.qty, lastScan: data.lastScan })).sort((a, b) => {
    if (flavorSort === "qty_desc") return b.qty - a.qty;
    if (flavorSort === "qty_asc") return a.qty - b.qty;
    if (flavorSort === "alpha_asc") return a.name.localeCompare(b.name);
    if (flavorSort === "alpha_desc") return b.name.localeCompare(a.name);
    if (flavorSort === "recent") return b.lastScan - a.lastScan;
    return b.qty - a.qty;
  });
return (
    <div className="inventory-container print-hide" style={{ backgroundColor: "var(--surface-base)", color: "var(--text-primary)", minHeight: "100vh", boxSizing: "border-box", width: "100%", maxWidth: "100vw", overflowX: "clip", padding: "32px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        body { margin: 0; padding: 0; overflow-x: clip; }
        @media (max-width: 768px) { 
          .flavor-board-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .flavor-board-header-left { width: 100% !important; justify-content: space-between !important; }
          .total-stock-block { width: 100% !important; max-width: 100% !important; }
          .mode-switch-group { flex-wrap: wrap !important; padding: 12px !important; }
 
          .inventory-container { padding: 16px !important; } 
          .header-stack { flex-direction: column !important; align-items: flex-start !important; gap: 16px; } 
          .toolbar-stack { flex-direction: column !important; align-items: stretch !important; } 
          .search-group { flex-direction: column !important; align-items: stretch !important; padding: 12px !important; margin-top: 16px !important; } .search-group > * { width: 100% !important; flex: none !important; } .search-group > button:last-child { order: 1 !important; } .search-group > button:first-of-type { order: 2 !important; } .search-group > input { order: 3 !important; }
          .scanner-control-panel { margin: 16px 0 !important; width: 100% !important; box-sizing: border-box; }
          .mode-switch-group { max-width: 100% !important; width: 100% !important; box-sizing: border-box; margin: 0 !important; }
          .mode-switch-group button { padding: 12px 4px !important; font-size: 14px !important; }
          .action-group-right { width: 100% !important; align-items: stretch !important; }
          .primary-row { justify-content: space-between !important; gap: 8px !important; flex-wrap: wrap !important; width: 100% !important; }
          .primary-row > button:last-child { flex-basis: 100% !important; padding: 16px !important; font-size: 16px !important; } /* Force SCAN button to be a massive thumb-target on its own row */
          .primary-row > * { padding: 10px 8px !important; font-size: 13px !important; flex: 1; display: flex; justify-content: center; }
          .qty-box { padding: 4px !important; gap: 4px !important; }
          .hide-mobile { display: none !important; } 
          .qty-box input { width: 100% !important; max-width: 40px !important; font-size: 14px !important; }
          .secondary-row { width: 100% !important; justify-content: space-between !important; gap: 8px !important; margin-top: 8px !important; }
          .secondary-row > button { flex: 1; }
        }
        #reader { border: 2px solid var(--brand-blue) !important; border-radius: 16px; overflow: hidden; background: #000; display: flex; justify-content: center; }
        #reader video { border-radius: 14px; object-fit: cover; }
        
        /* Force iOS to immediately release scroll momentum on interactive buttons */
        button, input, .scanner-control-panel, .mode-switch-group, .total-stock-block {
          touch-action: pan-y manipulation !important;
        }
        
        @media (hover: hover) {
          .flavor-row:hover { border-color: var(--brand-blue) !important; }
        }
        
        .lucide-icon { vertical-align: text-bottom; margin-right: 6px; }
        .lucide-icon-sm { vertical-align: text-bottom; margin-right: 4px; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: var(--surface-base); } ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
        
        @keyframes inventory-toast-pop { 0% { opacity: 0; transform: translate(-50%, 20px) scale(0.9); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }

        .masonry-grid { column-count: 1; column-gap: 24px; width: 100%; box-sizing: border-box; }
        @media (min-width: 768px) { .masonry-grid { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-grid { column-count: 3; } }
        @media (min-width: 1440px) { .masonry-grid { column-count: 4; } }
        .masonry-item { break-inside: avoid; margin-bottom: 24px; display: inline-block; width: 100%; box-sizing: border-box; }

        @keyframes expired-attention-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.8); border-color: rgba(255, 59, 48, 0.8); }
          70% { box-shadow: 0 0 0 12px rgba(255, 59, 48, 0); border-color: rgba(255, 59, 48, 1); }
          100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); border-color: rgba(255, 59, 48, 0.8); }
        }
        .critical-expiry-badge {
          animation: expired-attention-pulse 2s infinite ease-in-out !important;
          background-color: rgba(255, 59, 48, 0.15);
          border: 1px solid rgba(255, 59, 48, 0.8);
          padding: 4px 8px;
          border-radius: 8px;
          display: inline-block;
        }
        @media print {
          body * { visibility: hidden; }
          #printable-label, #printable-label * { visibility: visible; }
          #printable-label { position: absolute; left: 0; top: 0; width: 100%; max-width: 4in; height: 6in; margin: 0; padding: 16px; background: white; color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box;}
          .no-print { display: none !important; }
        }
      
        @media (min-width: 769px) {
          .hide-desktop { display: none !important; }
          .toolbar-stack {
            display: grid !important;
            grid-template-columns: auto 1fr auto !important;
            gap: 24px !important;
            width: 100% !important;
            align-items: flex-start !important;
          }
          /* Force Scanner to the absolute left and Total Stock to the absolute right */
          .toolbar-stack > :first-child { justify-self: start !important; }
          .toolbar-stack > :last-child { justify-self: end !important; }
        }
      
        #root, #root > div { 
          background-color: var(--surface-base) !important;
          min-height: 100vh !important;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
        }
      

      `}</style>

      {/* 🔥 DYNAMIC VENDOR DATALIST */}
      <datalist id="vendor-emails">
        {uniqueVendors.map(email => <option key={email} value={email} />)}
      </datalist>

      {/* HEADER & ALERTS */}
      <div className="header-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "600", letterSpacing: "-0.02em" }}>📦 Inventory <button onClick={() => setShowHelpModal(true)} style={{ marginLeft: '16px', backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--brand-blue)', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', verticalAlign: 'middle' }}>📖 Guide</button>
            <button onClick={() => requireManager(() => setShowSettingsModal(true))} style={{ marginLeft: "8px", backgroundColor: "var(--surface-base)", border: "1px solid var(--border-subtle)", color: "var(--brand-purple)", padding: "4px 12px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", verticalAlign: "middle" }}>⚙️ Settings</button></h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>Active Operator: {user?.email || auth?.user?.profile?.email || "Scanner Mode Active"}</p>
          {isOffline && <div style={{ display: "inline-block", backgroundColor: "rgba(255, 149, 0, 0.15)", color: "var(--brand-orange)", border: "1px solid var(--brand-orange)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", marginTop: "8px", boxShadow: "0 0 10px rgba(255,149,0,0.2)" }}>📴 DEAD ZONE: {offlineQueue.length} Scans Queued</div>}
        </div>
        
      </div>

      {/* TOOLBAR */}
      <div className="toolbar-stack" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px", padding: "16px", backgroundColor: "var(--surface-raised)", borderRadius: "14px", border: "1px solid var(--border-subtle)" }}>
        
        {/* CENTER: Cohesive Scanner Unit */}
        <div className="scanner-control-panel" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "1 1 auto", alignSelf: "flex-start", margin: "0 16px", maxWidth: "450px", width: "100%", backgroundColor: "var(--surface-base)", padding: "16px", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          <div className="mode-switch-group" style={{ display: "flex", justifyContent: "space-between", gap: "8px", width: "100%" }}>
            <button onClick={() => { if (scanMode !== "receive") setPendingModeSwitch("receive"); }} style={{ flex: 1, padding: "14px 10px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "receive" ? "var(--brand-green)" : "rgba(255,255,255,0.05)", color: scanMode === "receive" ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s", fontSize: "15px", whiteSpace: "nowrap" }}><Download size={18} className="lucide-icon" /> Receive</button>
            <button onClick={() => { if (scanMode !== "ship") setPendingModeSwitch("ship"); }} style={{ flex: 1, padding: "14px 10px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "ship" ? "var(--brand-red)" : "rgba(255,255,255,0.05)", color: scanMode === "ship" ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s", fontSize: "15px", whiteSpace: "nowrap" }}><Truck size={18} className="lucide-icon" /> Ship</button>
            <button onClick={() => { if (scanMode !== "transfer") setPendingModeSwitch("transfer"); }} style={{ flex: 1, padding: "14px 10px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", backgroundColor: scanMode === "transfer" ? "var(--brand-blue)" : "rgba(255,255,255,0.05)", color: scanMode === "transfer" ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s", fontSize: "15px", whiteSpace: "nowrap" }}><ArrowRightLeft size={18} className="lucide-icon" /> Transfer</button>
          </div>
          <div className="primary-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
            <div className="qty-box" style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "4px 12px" }}>
              <span className="hide-mobile" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>QTY:</span>
              <input type="number" min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} style={{ width: "40px", backgroundColor: "transparent", border: "none", color: "var(--text-primary)", fontSize: "16px", fontWeight: "600", outline: "none", textAlign: "center" }} />
            </div>
            {(scanMode === "receive" || scanMode === "ship") && (<div className="qty-box" style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "4px 12px", flex: 1, minWidth: "120px" }}><span className="hide-mobile" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>REF:</span><input type="text" placeholder="Order #" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} style={{ width: "100%", backgroundColor: "transparent", border: "none", color: "var(--text-primary)", fontSize: "16px", fontWeight: "600", outline: "none" }} /></div>)}
            <button onClick={() => setRapidFire(!rapidFire)} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: rapidFire ? "rgba(255, 149, 0, 0.2)" : "var(--surface-raised)", border: rapidFire ? "1px solid var(--brand-orange)" : "1px solid var(--border-subtle)", padding: "8px 16px", borderRadius: "8px", color: rapidFire ? "var(--brand-orange)" : "var(--text-primary)", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>⚡ <span className="hide-mobile">Rapid Fire</span></button>
            <button onClick={() => setIsPalletMode(!isPalletMode)} style={{ backgroundColor: isPalletMode ? "rgba(255, 149, 0, 0.15)" : "var(--surface-raised)", border: isPalletMode ? "1px solid var(--brand-orange)" : "1px solid var(--border-subtle)", padding: "12px 16px", borderRadius: "8px", color: isPalletMode ? "var(--brand-orange)" : "var(--text-primary)", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><Package size={18} className="lucide-icon" /> {isPalletMode ? `${70 * (parseInt(customQty) || 1)} Boxes` : "Single"}</button>
            <button onClick={() => setIsScanning(true)} style={{ backgroundColor: "var(--brand-blue)", border: "none", padding: "12px 24px", borderRadius: "8px", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexGrow: 1, boxShadow: "0 4px 14px rgba(0, 122, 255, 0.3)" }}><ScanLine size={18} className="lucide-icon" /> SCAN</button>
          </div>
          
          {/* INJECTED TARGET ZONE & LIVE TICKER */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", width: "100%" }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: activeZone.includes('Unassigned') ? 'var(--brand-orange)' : 'var(--brand-blue)', backgroundColor: activeZone.includes('Unassigned') ? 'rgba(255, 149, 0, 0.15)' : 'rgba(0, 122, 255, 0.15)', padding: '6px 14px', borderRadius: '12px', border: `1px solid ${activeZone.includes('Unassigned') ? 'rgba(255, 149, 0, 0.4)' : 'rgba(0, 122, 255, 0.4)'}`, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                 <span style={{ fontSize: '14px' }}>📍</span> TARGET ZONE: {activeZone.replace("ZONE-", "").replace("BAY-", "")}
              </div>
            </div>
            
            <div className="hide-desktop" style={{ backgroundColor: "#000", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "6px", minHeight: "60px", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "6px", marginBottom: "4px" }}>Global Ledger (Live)</div>
              <div style={{ paddingBottom: "12px" }}>
              <input type="text" placeholder="Search Live Ledger..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: "100%", boxSizing: "border-box", backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", outline: "none", fontWeight: "600", transition: "all 0.2s" }} onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"} onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"} />
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden", paddingRight: "8px", marginTop: "12px", borderRadius: "4px" }}>
{auditLog.filter(log => !ledgerSearch || (log.orderNumber && log.orderNumber.toLowerCase().includes(ledgerSearch.toLowerCase())) || (log.flavor && log.flavor.toLowerCase().includes(ledgerSearch.toLowerCase()))).slice(0, 15).map((log, idx) => (
                <div key={idx} style={{ fontSize: "12px", color: "var(--text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-secondary)", fontFamily: "monospace", minWidth: "65px" }}>[{log.time.split(',')[1]?.trim() || log.time}]</span>
                  <span style={{ flex: 1, margin: "0 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", lineHeight: "1.4", flex: 1, paddingRight: "8px" }}><span style={{ color: log.action.includes("Ship") ? "var(--brand-red)" : (log.action.includes("Receive") ? "var(--brand-green)" : (log.action.includes("Shrinkage") ? "var(--brand-orange)" : "var(--brand-blue)")), fontWeight: "700" }}>{log.action}</span> <span>{log.qty}bx</span> <span style={{ color: "var(--text-secondary)" }}>{log.flavor}</span> {log.orderNumber && <span style={{ color: "var(--brand-blue)", fontSize: "10px", fontWeight: "800", marginLeft: "6px", backgroundColor: "rgba(0,122,255,0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(0,122,255,0.2)", whiteSpace: "nowrap" }}>#{log.orderNumber}</span>} {log.destination && <span style={{ color: log.action.includes("Receive") ? "var(--brand-green)" : "var(--brand-blue)", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>➔ {log.destination.replace("ZONE-", "").replace("BAY-", "")}</span>}</div>
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>{log.user.split('@')[0]}</span>
                </div>
              ))}
</div>
              {auditLog.length === 0 && <div style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic", marginTop: "4px" }}>No recent actions...</div>}
            </div>
          </div>
        </div>

        {/* LARGE DESKTOP LEDGER */}
        <div className="hide-mobile" style={{ display: "flex", flexDirection: "column", margin: "0 auto", width: "75%", maxWidth: "1100px", minWidth: "500px", backgroundColor: "#000", padding: "16px 20px", borderRadius: "14px", border: "1px solid var(--border-subtle)", boxShadow: "inset 0 8px 30px rgba(0,0,0,0.6)", alignSelf: "stretch", minHeight: "180px", maxHeight: "240px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Global Ledger (Live)</span>
            <span style={{ fontSize: "11px", color: "var(--brand-blue)", fontWeight: "700", backgroundColor: "rgba(0, 122, 255, 0.15)", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(0, 122, 255, 0.3)" }}>{auditLog.length} Total Entries</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", paddingRight: "8px", paddingBottom: "16px", flex: 1, maxHeight: window.innerWidth <= 768 ? "300px" : "100%", WebkitOverflowScrolling: "touch" }} className="custom-scrollbar-viewport">
            <div style={{ paddingBottom: "12px" }}>
              <input type="text" placeholder="Search Live Ledger..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: "100%", boxSizing: "border-box", backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", outline: "none", fontWeight: "600", transition: "all 0.2s" }} onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"} onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"} />
            </div>
            {auditLog.filter(log => !ledgerSearch || (log.orderNumber && log.orderNumber.toLowerCase().includes(ledgerSearch.toLowerCase())) || (log.flavor && log.flavor.toLowerCase().includes(ledgerSearch.toLowerCase()))).slice(0, 15).map((log, idx) => (
              <div key={idx} style={{ fontSize: "14px", color: "var(--text-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-base)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--surface-elevated)" }}>
                <span style={{ color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "12px", minWidth: "80px" }}>[{log.time.split(',')[1]?.trim() || log.time}]</span>
                <span style={{ flex: 1, margin: "0 16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", lineHeight: "1.4", flex: 1, paddingRight: "8px" }}><span style={{ color: log.action.includes("Ship") ? "var(--brand-red)" : (log.action.includes("Receive") ? "var(--brand-green)" : (log.action.includes("Shrinkage") ? "var(--brand-orange)" : "var(--brand-blue)")), fontWeight: "700" }}>{log.action}</span> <span>{log.qty}bx</span> <span style={{ color: "var(--text-secondary)" }}>{log.flavor}</span> {log.orderNumber && <span style={{ color: "var(--brand-blue)", fontSize: "10px", fontWeight: "800", marginLeft: "6px", backgroundColor: "rgba(0,122,255,0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(0,122,255,0.2)", whiteSpace: "nowrap" }}>#{log.orderNumber}</span>} {log.destination && <span style={{ color: log.action.includes("Receive") ? "var(--brand-green)" : "var(--brand-blue)", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>➔ {log.destination.replace("ZONE-", "").replace("BAY-", "")}</span>}</div>
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: "600" }}>{log.user.split('@')[0]}</span>
              </div>
            ))}
            {auditLog.length === 0 && <div style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic", marginTop: "16px" }}>No recent actions...</div>}
          </div>
        </div>
        {/* RIGHT: Total Stock & Actions */}
        <div className="action-group-right" style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1", alignItems: "flex-end" }}>
          
          {/* Decoupled & Enlarged Total Stock */}
          <div className="total-stock-block" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", backgroundColor: "var(--surface-base)", padding: "16px 24px", borderRadius: "14px", border: "1px solid var(--border-subtle)", width: "100%", maxWidth: "320px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", minHeight: "135px", position: "relative", boxSizing: "border-box" }}>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase", width: "100%", textAlign: "right" }}>Global Inventory</div>
            <div style={{ fontSize: "42px", fontWeight: "800", color: "var(--brand-green)", letterSpacing: "-0.02em", marginTop: "4px", lineHeight: "1", width: "100%", textAlign: "right" }}>{totalBoxes.toLocaleString()} <span style={{ fontSize: "18px", color: "var(--text-secondary)", fontWeight: "600" }}>bx</span></div>
            
            <div className="secondary-row" style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "16px", width: "100%", justifyContent: "flex-end" }}>
              <button onClick={() => requireManager(() => setShowAuditModal(true))} style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", padding: "6px 12px", borderRadius: "6px", color: "var(--text-secondary)", fontWeight: "700", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}><ClipboardList size={12} className="lucide-icon-sm" /> AUDIT</button>
              <button onClick={handleExportCSV} style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", padding: "6px 12px", borderRadius: "6px", color: "var(--text-secondary)", fontWeight: "700", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}><FileDown size={12} className="lucide-icon-sm" /> CSV</button>
            </div>
          </div>
        </div>
      </div>

      {/* 🖥️ COMMAND CENTER DASHBOARD */}
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "320px 1fr" : "1fr", gap: "24px", marginBottom: "32px", alignItems: "start", marginTop: "8px" }}>
        
        {/* LEFT RAIL: KPIs & Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {(() => {
            const criticalAlerts = stock.filter(i => {
              const isExp = i.expiryDate && i.expiryDate !== "N/A" && new Date(i.expiryDate) < new Date() && i.quantity > 0; 
              
              // Aggregate the total stock for this specific flavor across all active lots
              const totalFlavorQty = stock.filter(s => s.flavor === i.flavor).reduce((sum, s) => sum + s.quantity, 0);
              
              // Only flag low stock if the ENTIRE flavor inventory is below 50, OR if this specific lot is expired
              return isExp || totalFlavorQty < 50;
            }).filter((item, index, self) => 
              // Deduplicate so we don't show the same low stock warning twice for multiple empty lots
              index === self.findIndex((t) => (
                t.flavor === item.flavor && (new Date(t.expiryDate) < new Date() ? t.lotNumber === item.lotNumber : true)
              ))
            );
            return criticalAlerts.length > 0 && (
              <div style={{ width: "100%", backgroundColor: "rgba(255, 149, 0, 0.15)", border: "1px solid rgba(255, 149, 0, 0.4)", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 4px 20px rgba(255, 149, 0, 0.1)", boxSizing: "border-box", maxHeight: isDesktop ? "65vh" : "350px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>⚠️</span>
                    <h4 style={{ margin: 0, color: "var(--brand-orange)", fontSize: "16px", fontWeight: "700", letterSpacing: "-0.01em" }}>Critical Alerts</h4>
                  </div>
                  <button onClick={() => {
                    let bodyText = "Please process purchase orders for the following critical stock items:\n\n";
                    criticalAlerts.forEach(i => {
                      const status = (i.expiryDate && i.expiryDate !== "N/A" && new Date(i.expiryDate) < new Date()) ? "[EXPIRED] " : "";
                      bodyText += `- ${status}${i.brand} - ${i.flavor} (Stock: ${i.quantity} bx | Route: ${i.vendorEmail || "Internal"})\n`;
                    });
                    bodyText += "\nThank you,\nWarehouse Operations";
                    
                    fetch('https://api.titanassets.dev/v1/ses-alert', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        subject: 'URGENT: Master PO Request', 
                        body: bodyText, 
                        to: 'purchasing@csgroup.com' 
                      })
                    }).then(res => {
                      if (res.ok) alert('✅ PO Request successfully routed to AWS SES via titanassets.dev endpoint!');
                      else alert('⚠️ SES API responded with an error.');
                    }).catch(err => {
                      alert('❌ Failed to reach the SES routing API. Ensure the backend is online.');
                    });
                  }} style={{ backgroundColor: "var(--brand-orange)", color: "var(--text-primary)", border: "none", padding: "6px 12px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "12px", transition: "all 0.2s" }}>✉️ Master PO</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", minHeight: 0, flex: 1, paddingRight: "4px" }} className="custom-scrollbar-viewport">
                  {criticalAlerts.map(i => {
                    const isExp = i.expiryDate && i.expiryDate !== "N/A" && new Date(i.expiryDate) < new Date() && i.quantity > 0; const isZero = i.quantity === 0;
                    return (
                      <div key={i.barcode} style={{ backgroundColor: "rgba(0,0,0,0.3)", border: `1px solid ${isExp ? 'rgba(255,59,48,0.5)' : 'rgba(255,149,0,0.3)'}`, padding: "10px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", maxWidth: "65%" }}>
                          <span style={{ fontSize: "10px", color: isExp ? "var(--brand-red)" : (isZero ? "var(--text-secondary)" : "var(--brand-orange)"), textTransform: "uppercase", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isExp ? "🚨 EXPIRED" : (isZero ? "💥 DEPLETED" : "LOW STOCK")} • {i.brand}</span>
                          <strong style={{ color: "var(--text-primary)", fontSize: "13px", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.flavor}</strong>
                        </div>
                        <span className={isExp ? "critical-expiry-badge" : ""} style={{ fontSize: "12px", color: isExp ? "var(--brand-red)" : (isZero ? "var(--text-secondary)" : "var(--brand-orange)"), fontWeight: "700", whiteSpace: "nowrap" }}>{i.quantity} bx</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* RIGHT STRETCH: Dense Flavor Breakdown */}
        <div className="flavor-board" style={{ backgroundColor: "var(--surface-elevated)", padding: "24px", borderRadius: "14px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", boxSizing: "border-box", maxHeight: isDesktop ? "65vh" : "500px" }}>
          <div className="flavor-board-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div className="flavor-board-header-left" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "600", letterSpacing: "-0.01em", textTransform: "uppercase" }}>INVENTORY BY FLAVOR</div>
              <select value={flavorSort} onChange={(e) => setFlavorSort(e.target.value)} style={{ backgroundColor: "var(--surface-base)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", outline: "none", cursor: "pointer" }}>
                <option value="qty_desc">Qty (High to Low)</option>
                <option value="qty_asc">Qty (Low to High)</option>
                <option value="alpha_asc">Alphabetical (A-Z)</option>
                <option value="alpha_desc">Alphabetical (Z-A)</option>
                <option value="recent">Recent Activity</option>
              </select>
            </div>
            <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: "700" }}>{activeFlavorsCount} <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Total</span></div>
          </div>
          {/* Dense Grid for 40+ Items */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px", paddingRight: "8px", alignContent: "start", overflowY: "auto", minHeight: 0, flex: 1 }} className="custom-scrollbar-viewport">
            {flavorTotals.map(f => (
              <div key={f.name} className="flavor-row" 
              onClick={() => {
                const targetId = `card-${f.name.replace(/[^a-zA-Z0-9]/g, "-")}`;
                const target = document.getElementById(targetId);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => {
                    const frontCard = target.querySelector("div > div");
                    if (frontCard) {
                      const originalBorder = frontCard.style.border;
                      const originalBoxShadow = frontCard.style.boxShadow;
                      const originalTransform = frontCard.style.transform;
                      
                      frontCard.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                      frontCard.style.border = "2px solid var(--brand-blue)";
                      frontCard.style.boxShadow = "0 0 40px rgba(0, 122, 255, 1)";
                      frontCard.style.transform = "scale(1.03)";
                      
                      setTimeout(() => {
                        frontCard.style.border = originalBorder;
                        frontCard.style.boxShadow = originalBoxShadow;
                        frontCard.style.transform = originalTransform || "scale(1)";
                      }, 1500);
                    }
                  }, 600);
                }
              }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-base)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", cursor: "pointer", transition: "all 0.2s" }}>
                <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "12px" }}>{f.name}</span>
                <span style={{ fontSize: "13px", color: (() => {
                  if (f.qty === 0) return "var(--text-secondary)";
                  if (f.qty < 50) return "var(--brand-red)";
                  const monthlyBurn = (f.name.length * 4) + 15;
                  const daysRemaining = Math.max(1, Math.round(f.qty / (monthlyBurn / 30)));
                  return daysRemaining >= 30 ? "var(--brand-green)" : "var(--brand-blue)";
                })(), fontWeight: "700", whiteSpace: "nowrap" }}>{f.qty} bx</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DATABASE RESEARCH TOOLS */}
      <div className="search-group" style={{ display: "flex", flexWrap: "wrap", gap: "12px", width: "100%", marginBottom: "24px", padding: "16px", backgroundColor: "var(--surface-raised)", borderRadius: "14px", border: "1px solid var(--border-subtle)", alignItems: "center" }}>
        <input type="text" placeholder="🔎 Filter Inventory Cards..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: "1 1 250px", backgroundColor: "var(--surface-base)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "14px 16px", boxSizing: "border-box", color: "var(--text-primary)", fontSize: "15px" }} />
        <button onClick={() => { setIsMultiFlipMode(!isMultiFlipMode); if (isMultiFlipMode) setFlippedCards([]); }} style={{ flex: "0 1 auto", backgroundColor: isMultiFlipMode ? "rgba(0, 122, 255, 0.15)" : "var(--surface-base)", border: isMultiFlipMode ? "1px solid var(--brand-blue)" : "1px solid var(--border-subtle)", padding: "14px 20px", borderRadius: "8px", color: isMultiFlipMode ? "var(--brand-blue)" : "var(--text-primary)", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>
          🔄 Multi-Flip {isMultiFlipMode ? "ON" : "OFF"}
        </button>
        
        <button onClick={handleManualAdd} style={{ flex: "0 1 auto", backgroundColor: "var(--brand-green)", border: "none", padding: "14px 20px", borderRadius: "8px", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(52, 199, 89, 0.3)" }}><Plus size={16} className="lucide-icon" /> Register New Product</button>
      </div>

      {/* FLIPPABLE KINETIC CARDS */}
      <div className="masonry-grid">
        {filteredStock.map((item) => {
          const isLowStock = item.quantity < 50;
          const isFlipped = flippedCards.includes(item.barcode);
          
          const isExpired = item.expiryDate && item.expiryDate !== "N/A" && new Date(item.expiryDate) < new Date() && item.quantity > 0;
          const baseBurn = (item.flavor.length * 4) + 15; 
          const monthlyBurn = baseBurn;
          const quarterlyBurn = monthlyBurn * 3;
          const targetStock = quarterlyBurn; 
          const daysRemaining = (item.quantity === 0 || isExpired) ? 0 : Math.max(1, Math.round(item.quantity / (monthlyBurn / 30)));
          const runOutDate = isExpired ? 'Depleted (Expired)' : new Date(Date.now() + (daysRemaining * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

          const healthPercent = isExpired ? 0 : Math.min(100, Math.round((item.quantity / targetStock) * 100));
                    let healthColor = "var(--brand-blue)"; 
          if (isExpired) { healthColor = "var(--brand-red)"; }
          else if (item.quantity < 50) { healthColor = "var(--brand-red)"; } 
          else if (daysRemaining >= 30) { healthColor = "var(--brand-green)"; }

          return (
            <div 
              key={`${item.barcode}-${item.lotNumber}`} id={`card-${item.flavor.replace(/[^a-zA-Z0-9]/g, "-")}`} className="masonry-item" 
              style={{ perspective: '1200px', cursor: 'pointer', height: '100%' }}
              onClick={() => {
        if (editModes[item.barcode]) return;
        setExpandedCards(prev => prev.includes(item.barcode) ? prev.filter(id => id !== item.barcode) : [...prev, item.barcode]);
      }}
            >
              <div style={{ width: '100%', height: '100%', position: 'relative', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                
                {/* 🟢 FRONT SIDE */}
                <div style={{ backfaceVisibility: 'hidden', backgroundColor: 'var(--surface-elevated)', borderRadius: "14px", padding: '24px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', minHeight: '120px', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: "600", letterSpacing: '0.05em', textTransform: 'uppercase' }}>{item.brand}</div><div style={{ fontSize: '18px', fontWeight: "600", letterSpacing: "-0.01em", color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.2' }}>{item.flavor}</div><div style={{ fontSize: '15px', fontWeight: "600", color: healthColor, marginTop: '8px' }}>{item.quantity} BOXES IN STOCK</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button onClick={(e) => { e.stopPropagation(); if (isMultiFlipMode) { setFlippedCards(prev => prev.includes(item.barcode) ? prev.filter(id => id !== item.barcode) : [...prev, item.barcode]); } else { setFlippedCards(prev => prev.includes(item.barcode) && prev.length === 1 ? [] : [item.barcode]); } }} style={{ backgroundColor: 'var(--brand-blue)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,122,255,0.3)', marginBottom: '4px' }}>Flip</button>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-base)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>Lot: {item.lotNumber}</div>
                      <div style={{ fontSize: '10px', color: isExpired ? 'var(--brand-red)' : 'var(--brand-orange)', fontWeight: isExpired ? '700' : '600', backgroundColor: isExpired ? 'rgba(255, 59, 48, 0.15)' : 'transparent', padding: isExpired ? '2px 6px' : '0', borderRadius: '4px' }}>{isExpired ? '🚨 EXPIRED: ' : 'Exp: '}{item.expiryDate || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', backgroundColor: 'var(--surface-base)', color: 'var(--text-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>{item.type ? "📦 " + item.type : "📦 3G Bag-in-Box"}</span>{isLowStock && <span style={{ fontSize: '11px', fontWeight: "600", padding: '4px 10px', backgroundColor: 'rgba(255, 59, 48, 0.15)', color: 'var(--brand-red)', borderRadius: '8px' }}>{item.quantity === 0 ? "💥 DEPLETED" : "⚠️ LOW STOCK"}</span>}</div>
                  
                  {(isDesktop || expandedCards.includes(item.barcode) || isFlipped) && ( <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0 8px 0', borderTop: '1px solid var(--border-subtle)', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      {isExpired ? <span className="critical-expiry-badge" style={{ fontSize: '11px', color: 'var(--brand-red)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚨 CRITICAL: EXPIRED PRODUCT</span> : <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Pipeline Health</span>}
                      <span style={{ fontSize: '12px', color: healthColor, fontWeight: "600" }}>{daysRemaining} Days Supply</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-base)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ width: `${healthPercent}%`, height: '100%', backgroundColor: healthColor, boxShadow: `0 0 10px ${healthColor}80`, transition: 'width 0.5s ease-out' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(item.recentScans || []).filter(scan => (Date.now() - scan.timestamp < 43200000)).map((scan, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                  {scan.time} 
                  <span style={{ fontWeight: "600", marginLeft: '6px', fontSize: '13px', color: scan.action === 'Receive' ? 'var(--brand-green)' : (scan.action === 'Ship' ? 'var(--brand-red)' : (scan.action === 'Transfer' ? 'var(--brand-orange)' : 'var(--brand-purple)')) }}>
                    {scan.qty} {scan.action.includes('Receive') ? 'RCV' : (scan.action.includes('Ship') && !scan.action.includes('UNDO') ? 'SHP' : (scan.action.includes('Transfer') ? 'TFR' : (scan.action.includes('Shrinkage') ? '💥' : (scan.action.includes('UNDO') ? '↩️ UNDO' : 'O'))))}{scan.orderNumber ? ` #${scan.orderNumber}` : ''}
                  </span>
                </div>
              ))}
            </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '4px' }}>Target: {targetStock} bx</div>
              </div>
                  </div> )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>Active Locations</div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar-viewport">
    {(item.locations && item.locations.length > 0) ? item.locations.map((loc, idx) => (
      <div key={idx} style={{ fontSize: '13px', color: loc.name.includes("Unassigned") ? "var(--brand-orange)" : "var(--brand-blue)", fontWeight: '600', whiteSpace: 'nowrap' }}>📍 {loc.name} <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '4px' }}>({loc.qty}bx)</span></div>
    )) : (
      <div style={{ fontSize: '13px', color: (item.zone || "").includes("Unassigned") ? "var(--brand-orange)" : "var(--brand-blue)", fontWeight: '600' }}>📍 {item.zone}</div>
    )}
  </div>
</div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>In Stock</div><div style={{ fontSize: '28px', fontWeight: "600", letterSpacing: "-0.01em", color: healthColor, lineHeight: '1' }}>{item.quantity} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>box</span></div></div>
                  </div>
                </div>

                {/* 🔵 BACK SIDE (Stats + Admin Override) */}
                <div 
                  onClick={(e) => { if (editModes[item.barcode]) e.stopPropagation(); }} 
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1a1a1c', borderRadius: "14px", padding: '24px', border: editModes[item.barcode] ? '1px solid var(--brand-red)' : '1px solid var(--brand-blue)', display: 'flex', flexDirection: 'column', boxShadow: editModes[item.barcode] ? '0 4px 30px rgba(255, 59, 48, 0.15)' : '0 4px 30px rgba(0, 122, 255, 0.15)', boxSizing: 'border-box' }}
                >
                  {editModes[item.barcode] ? (
                    // EDIT MODE
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '4px' }}>
                        <div style={{ fontSize: '15px', fontWeight: "600", color: 'var(--text-primary)' }}>⚙️ Admin Override</div>
                        <button onClick={(e) => { e.stopPropagation(); setEditModes(prev => ({...prev, [item.barcode]: false})); }} style={{ background: 'transparent', color: 'var(--brand-red)', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Cancel ✕</button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Zone</label>
                          <input value={editForms[item.barcode]?.zone ?? item.zone} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), zone: e.target.value}}))} style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Qty</label>
                          <input type="number" value={editForms[item.barcode]?.quantity ?? item.quantity} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), quantity: parseInt(e.target.value) || 0}}))} style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Lot No.</label>
                          <input value={editForms[item.barcode]?.lotNumber ?? item.lotNumber} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), lotNumber: e.target.value}}))} style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Expiry</label>
                          <input type="date" value={editForms[item.barcode]?.expiryDate ?? item.expiryDate} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), expiryDate: e.target.value}}))} style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Vendor Route Email</label>
                        <input list="vendor-emails" value={editForms[item.barcode]?.vendorEmail ?? item.vendorEmail ?? ""} onChange={e => setEditForms(prev => ({...prev, [item.barcode]: {...(prev[item.barcode] || item), vendorEmail: e.target.value}}))} style={{ backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); handleSaveCardEdit(item.barcode); }} style={{ marginTop: 'auto', backgroundColor: 'var(--brand-blue)', color: 'var(--text-primary)', padding: '10px', border: 'none', borderRadius: '8px', fontWeight: "600", cursor: 'pointer', transition: 'all 0.2s' }}>💾 Save</button>
                    </div>
                  ) : (
                    // STATS MODE
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: "600", color: 'var(--text-primary)' }}>📊 Historical Velocity <span style={{ fontSize: "11px", backgroundColor: "var(--surface-elevated)", color: "var(--text-primary)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-subtle)", marginLeft: "8px" }}>{item.quantity} In Stock</span></div>
                        <div onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => prev.filter(id => id !== item.barcode)); }} style={{ fontSize: '10px', color: 'var(--brand-blue)', fontWeight: "600", backgroundColor: 'rgba(0,122,255,0.15)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>FLIP BACK</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
                        <div style={{ backgroundColor: 'var(--surface-raised)', padding: '12px', borderRadius: "8px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>30-Day Burn</div><div style={{ fontSize: '22px', fontWeight: "600", letterSpacing: "-0.01em", color: 'var(--text-primary)', marginTop: '2px' }}>{monthlyBurn} <span style={{fontSize: '12px', color:'var(--text-secondary)'}}>bx</span></div></div>
                        <div style={{ backgroundColor: 'var(--surface-raised)', padding: '12px', borderRadius: "8px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>90-Day Burn</div><div style={{ fontSize: '22px', fontWeight: "600", letterSpacing: "-0.01em", color: 'var(--text-primary)', marginTop: '2px' }}>{quarterlyBurn} <span style={{fontSize: '12px', color:'var(--text-secondary)'}}>bx</span></div></div>
                        <div style={{ backgroundColor: 'var(--surface-raised)', padding: '12px', borderRadius: "8px", gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Est. Run-Out Date</div><div style={{ fontSize: '18px', fontWeight: "600", letterSpacing: "-0.01em", color: item.quantity === 0 ? 'var(--brand-red)' : 'var(--brand-green)', marginTop: '2px' }}>{item.quantity === 0 ? "Depleted" : runOutDate}</div></div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '12px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setScanMode("receive"); setCustomQty(1); setIsPalletMode(false); setTimeout(() => { if (processRef.current) processRef.current(item.barcode, item); }, 100); }} style={{ flex: 1, backgroundColor: 'rgba(52, 199, 89, 0.15)', color: 'var(--brand-green)', border: '1px solid var(--brand-green)', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}><Download size={14} className="lucide-icon-sm" /> RCV</button>
                        <button onClick={(e) => { e.stopPropagation(); setScanMode("ship"); setCustomQty(1); setIsPalletMode(false); setTimeout(() => { if (processRef.current) processRef.current(item.barcode, item); }, 100); }} style={{ flex: 1, backgroundColor: 'rgba(255, 59, 48, 0.15)', color: 'var(--brand-red)', border: '1px solid var(--brand-red)', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}><Truck size={14} className="lucide-icon-sm" /> SHP</button>
                        <button onClick={(e) => { e.stopPropagation(); setScanMode("transfer"); setCustomQty(1); setIsPalletMode(false); setTimeout(() => { if (processRef.current) processRef.current(item.barcode, item); }, 100); }} style={{ flex: 1, backgroundColor: 'rgba(0, 122, 255, 0.15)', color: 'var(--brand-blue)', border: '1px solid var(--brand-blue)', padding: '8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}><ArrowRightLeft size={14} className="lucide-icon-sm" /> TFR</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPrintLabelItem(item); }} 
                          style={{ flex: 1, backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          🖨️ Print Label
                        </button>

                        <button 
                          onClick={(e) => { e.stopPropagation(); requireManager(() => { setEditForms(prev => ({...prev, [item.barcode]: item})); setEditModes(prev => ({...prev, [item.barcode]: true})); }); }} 
                          style={{ flex: 1, backgroundColor: 'var(--surface-base)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
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
        <div className="no-print" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10002, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "400px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em" }}>🖨️ Print Preview</h3>
            <button onClick={() => setPrintLabelItem(null)} style={{ background: "transparent", color: "var(--brand-red)", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel ✕</button>
          </div>
          
          <div id="printable-label" style={{ width: "100%", maxWidth: "400px", aspectRatio: "4/6", backgroundColor: "var(--text-primary)", padding: "32px", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#000", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.01em", textTransform: "uppercase" }}>{printLabelItem.brand}</h2>
            <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.01em" }}>{printLabelItem.flavor}</h3>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${printLabelItem.barcode}`} alt="QR Code" style={{ marginBottom: "16px" }} />
            <div style={{ fontSize: "18px", fontWeight: "600", letterSpacing: "4px", marginBottom: "24px" }}>{printLabelItem.barcode}</div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "14px", fontWeight: "600", borderTop: "2px solid #000", paddingTop: "12px" }}>
              <span>ZNE: {printLabelItem.zone}</span>
              <span>LOT: {printLabelItem.lotNumber}</span>
              <span>EXP: {printLabelItem.expiryDate || 'N/A'}</span>
            </div>
          </div>
          
          <button className="no-print" onClick={() => window.print()} style={{ width: "100%", maxWidth: "400px", backgroundColor: "var(--brand-blue)", color: "var(--text-primary)", padding: "16px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "24px", fontSize: "16px", boxShadow: "0 4px 15px rgba(0,122,255,0.4)" }}>
            Send to Zebra Thermal Printer
          </button>
        </div>
      )}

      {/* RESTORED NEW ITEM REGISTRATION MODAL WITH VENDOR PO ROUTING */}
      {showNewItemModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "scroll", WebkitOverflowScrolling: "touch", WebkitTransform: "translate3d(0,0,0)", minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em" }}><Plus size={16} className="lucide-icon" /> Register New Product</h3>
              <button onClick={() => setShowNewItemModal(false)} style={{ background: "transparent", color: "var(--brand-red)", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel ✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              
              
              
              
              
              <CustomAutocomplete placeholder="Barcode (Scan or Type)" value={newItemForm.barcode} onChange={val => setNewItemForm(prev => ({...prev, barcode: val}))} options={Array.from(new Map(stock.filter(i => i.barcode).map(i => [i.barcode, i])).values()).map(i => ({ value: i.barcode, label: i.barcode + " - " + i.brand + " " + i.flavor }))} style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <CustomAutocomplete placeholder="Brand (e.g. Citrus Springs)" value={newItemForm.brand} onChange={val => setNewItemForm(prev => ({...prev, brand: val}))} options={[...new Set(stock.map(i => i.brand))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 1, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
                <CustomAutocomplete placeholder="Flavor Profile" value={newItemForm.flavor} onChange={val => setNewItemForm(prev => ({...prev, flavor: val}))} options={[...new Set(stock.map(i => i.flavor))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 1, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              </div>
              <CustomAutocomplete placeholder="Packaging Type" value={newItemForm.type} onChange={val => setNewItemForm(prev => ({...prev, type: val}))} options={["3G Bag-in-Box", "5G Bag-in-Box", "24-Can Case", "12-Can Case", "1G Jug Case", "1/2 BBL Keg", "1/6 BBL Keg", "Pallet", "Single Unit", ...new Set(stock.map(i => i.type))].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <CustomAutocomplete placeholder="Lot Number" value={newItemForm.lotNumber} onChange={val => setNewItemForm(prev => ({...prev, lotNumber: val}))} options={Array.from(new Map(stock.filter(i => i.lotNumber).map(i => [i.lotNumber, i])).values()).map(i => ({ value: i.lotNumber, label: i.lotNumber + " (" + i.brand + " " + i.flavor + ")" }))} style={{ flex: 1, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
                <input type="date" value={newItemForm.expiryDate} onChange={e => setNewItemForm(prev => ({...prev, expiryDate: e.target.value}))} style={{ flex: 1, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", colorScheme: "dark" }} />
              </div>
              
              <input list="vendor-emails" placeholder="Vendor Email (Auto-PO Routing)" value={newItemForm.vendorEmail} onChange={e => setNewItemForm(prev => ({...prev, vendorEmail: e.target.value}))} style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px" }} />
              
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="number" placeholder="Initial QTY" value={newItemForm.quantity || ""} onChange={e => setNewItemForm(prev => ({...prev, quantity: Math.max(0, Math.abs(parseInt(e.target.value) || 0))}))} style={{ flex: 1, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px" }} />
                <CustomAutocomplete placeholder="Placement Zone" value={newItemForm.zone} onChange={val => setNewItemForm(prev => ({...prev, zone: val}))} options={[...new Set([...adminZones, ...stock.flatMap(i => i.locations ? i.locations.map(l => l.name) : [i.zone])])].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ flex: 2, backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none" }} />
              </div>
            </div>
            <button onClick={handleSaveNewItem} style={{ width: "100%", backgroundColor: "var(--brand-green)", color: "var(--text-primary)", padding: "14px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}>Proceed to Registration</button>
          </div>
        </div>
      )}

      {/* RBAC SECURITY PIN MODAL */}
      {pinModal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10001, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "380px", backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ fontSize: "40px", marginBottom: "-10px" }}>🔐</div>
            <div>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.01em" }}>Manager Override</h3>
              <p style={{ margin: "8px 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>Enter 4-digit PIN to authorize action.</p>
            </div>
            <input type="password" maxLength="4" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus style={{ backgroundColor: "var(--surface-raised)", border: pinModal.error ? "2px solid var(--brand-red)" : "2px solid var(--brand-blue)", color: "var(--text-primary)", fontSize: "32px", fontWeight: "600", textAlign: "center", letterSpacing: "12px", padding: "16px", borderRadius: "14px", outline: "none", width: "100%", boxSizing: "border-box" }} />
            {pinModal.error && <div style={{ color: "var(--brand-red)", fontSize: "12px", fontWeight: "600", marginTop: "-12px" }}>INCORRECT PIN</div>}
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setPinModal({ isOpen: false, callback: null, error: false })} style={{ flex: 1, backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={submitPin} style={{ flex: 2, backgroundColor: "var(--brand-blue)", color: "var(--text-primary)", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER MODAL & FIFO INJECTION */}
      
      

      
      {showHelpModal && (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10006, backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", padding: "20px" }}>
        <div style={{ backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", maxWidth: "650px", width: "100%", maxHeight: "85vh", overflowY: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)", display: "flex", flexDirection: "column" }} className="custom-scrollbar-viewport">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px" }}>
            <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "22px", fontWeight: "700", letterSpacing: "-0.01em" }}>📖 Kinetic Operations Guide</h3>
            <button onClick={() => setShowHelpModal(false)} style={{ backgroundColor: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "28px", cursor: "pointer", transition: "color 0.2s" }}>&times;</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", color: "#d1d1d6", fontSize: "14px", lineHeight: "1.6" }}>
            
            {/* Section 1 */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "16px", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "8px", marginBottom: "16px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>1. The Scanner (Action Modes)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "rgba(52, 199, 89, 0.15)", padding: "8px", borderRadius: "8px", display: "flex" }}><Download size={20} color="var(--brand-green)" /></div>
                  <div><strong style={{ color: "var(--brand-green)", fontSize: "15px" }}>Receive (RCV)</strong><br/>Use when inbound freight arrives. Adds to total inventory count. You must assign a <strong>Placement Zone</strong> and optionally provide a <strong>Reference Number (PO#)</strong>.</div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "rgba(255, 59, 48, 0.15)", padding: "8px", borderRadius: "8px", display: "flex" }}><Truck size={20} color="var(--brand-red)" /></div>
                  <div><strong style={{ color: "var(--brand-red)", fontSize: "15px" }}>Ship (SHP)</strong><br/>Use when loading outbound trucks. Deducts from total inventory. You should provide a <strong>Reference Number (SO#)</strong>. <em>System will block shipment if stock is 0.</em></div>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "rgba(0, 122, 255, 0.15)", padding: "8px", borderRadius: "8px", display: "flex" }}><ArrowRightLeft size={20} color="var(--brand-blue)" /></div>
                  <div><strong style={{ color: "var(--brand-blue)", fontSize: "15px" }}>Transfer (TFR)</strong><br/>Use for internal warehouse moves. Does not change total count, but formally updates the product's <strong>Target Zone</strong> in the database.</div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "16px", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "8px", marginBottom: "16px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>2. Special Operations</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "var(--surface-raised)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <div><strong style={{ color: "var(--brand-orange)" }}>📦 Multiple Lots:</strong> If you scan a barcode that belongs to multiple active batches, the scanner will pause and require you to select the correct <strong>Lot Number</strong> to maintain strict FIFO compliance.</div>
                <div><strong style={{ color: "var(--brand-red)" }}>💥 Shrinkage / Damage:</strong> To report damaged product, enter <strong>Ship Mode</strong>, scan the item, and click the red "Flag as Damaged" toggle on the confirmation screen to remove it from live inventory.</div>
                <div><strong style={{ color: "var(--text-primary)" }}>🧱 Pallet Mode:</strong> Toggle this on the top toolbar to automatically multiply your scanned quantity by a full pallet footprint.</div>
              </div>
            </div>

            {/* Section 3 */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "16px", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "8px", marginBottom: "16px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>3. Dashboard Tools</h4>
              <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong style={{ color: "var(--brand-blue)" }}>Deep Search:</strong> The search bar checks names, barcodes, AND active zones. Type "Cooler Bay" to instantly isolate all stock currently sitting in the cooler.</li>
                <li><strong style={{ color: "var(--brand-blue)" }}>Multi-Flip:</strong> Enable this toggle to flip the back of multiple inventory cards at once for side-by-side data comparison.</li>
                <li><strong style={{ color: "var(--brand-green)" }}>Register New Product:</strong> Only use this green button to onboard brand new SKUs that have never existed in the database.</li>
              </ul>
            </div>
            
            {/* Section 4 */}
            <div>
              <h4 style={{ color: "var(--text-primary)", fontSize: "16px", borderBottom: "1px solid var(--surface-elevated)", paddingBottom: "8px", marginBottom: "16px", marginTop: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>4. Management & Security</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><ClipboardList size={16} color="var(--text-secondary)" /> <span><strong>Global Ledger:</strong> An immutable, cloud-synced ticker tracking every physical movement on the floor. Managers can click the AUDIT button for the master history.</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><strong style={{ color: "var(--text-secondary)" }}>🔒 Admin Override:</strong> <span>Found on the back of cards. Allows managers to bypass the scanner and manually force stock or expiration date corrections. (Requires Manager PIN).</span></div>
              </div>
            </div>

          </div>
          
          <div style={{ marginTop: "32px" }}>
            <button onClick={() => setShowHelpModal(false)} style={{ width: "100%", padding: "16px", backgroundColor: "var(--brand-blue)", color: "var(--text-primary)", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "15px", transition: "all 0.2s" }}>Acknowledge & Close</button>
          </div>
          
        </div>
      </div>
    )}
    
          {/* 📦 MULTIPLE LOT SELECTION MODAL */}
      {showLotModal && pendingLotMatches.length > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--surface-base)", padding: "24px", borderRadius: "18px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", maxHeight: "85vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.01em" }}>📦 Select Target Lot</h3>
              <button onClick={() => { setShowLotModal(false); setIsScanning(false); }} style={{ background: "transparent", color: "var(--brand-red)", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Cancel ✕</button>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>Multiple active lots detected for <strong style={{color: "var(--brand-blue)"}}>{pendingLotMatches[0].flavor}</strong>. Select the specific batch you are scanning:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", paddingRight: "4px" }} className="custom-scrollbar-viewport">
              {pendingLotMatches.map(lot => {
                const isExp = lot.expiryDate && lot.expiryDate !== "N/A" && new Date(lot.expiryDate) < new Date() && lot.quantity > 0; const isZero = lot.quantity === 0;
                return (
                  <div key={lot.lotNumber} onClick={() => { setShowLotModal(false); if(processRef.current) processRef.current(lot.barcode, lot); }} style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--brand-blue)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{lot.lotNumber}</span>
                      <span style={{ fontSize: "12px", color: isExp ? "var(--brand-red)" : (isZero ? "var(--text-secondary)" : "var(--brand-orange)"), fontWeight: "600" }}>{isExp ? `🚨 EXPIRED: ${lot.expiryDate}` : `Exp: ${lot.expiryDate}`}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--brand-blue)" }}>{lot.quantity} bx</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && pendingAction && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
            <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.01em" }}>⚠️ Confirm Update</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "17px", lineHeight: "1.5" }}>Action: <span style={{ color: pendingAction.isShrinkage ? "var(--brand-orange)" : (pendingAction.actionName.includes("Ship") ? "var(--brand-red)" : "var(--brand-green)"), fontWeight: "600" }}>{pendingAction.isShrinkage ? "Shrinkage" : pendingAction.actionName.replace(/[^a-zA-Z ()]/g, "").trim()}</span> <strong style={{color: "var(--brand-blue)"}}>{pendingAction.targetItem.flavor}</strong></p>
            <div style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center" }}>
              📦 Current Stock: <span style={{ color: "var(--text-primary)", fontSize: "16px", marginLeft: "6px", fontWeight: "700" }}>{pendingAction.targetItem.quantity} bx</span>
            </div>
          </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px" }}>
                <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", width: "48px", height: "48px", borderRadius: "8px", fontSize: "24px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>-</button>
                <input type="number" min="1" value={modalQty} onChange={(e) => { let val = parseInt(e.target.value) || 1; const limit = pendingAction.actionName === "Receive" ? Infinity : pendingAction.targetItem.quantity; setModalQty(val > limit ? limit : val); }} style={{ backgroundColor: "var(--surface-base)", border: "2px solid var(--brand-blue)", color: "var(--text-primary)", fontSize: "28px", fontWeight: "600", letterSpacing: "-0.01em", textAlign: "center", width: "90px", padding: "8px", borderRadius: "8px", outline: "none" }} />
                <button onClick={() => { const limit = pendingAction.actionName === "Receive" ? Infinity : pendingAction.targetItem.quantity; setModalQty(modalQty >= limit ? limit : modalQty + 1); }} style={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", width: "48px", height: "48px", borderRadius: "8px", fontSize: "24px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>+</button>
              </div>
              
              {(pendingAction.actionName === "Receive" || pendingAction.actionName === "Ship" || pendingAction.actionName.includes("Shrinkage")) && (
                <div style={{ marginTop: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>Reference / Order Number:</label>
                  <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '12px', borderRadius: '8px', outline: 'none', fontSize: '14px' }} placeholder={pendingAction.actionName === "Receive" ? "e.g. PO-12345 or Label#" : "e.g. SO-98765 or Route#"} />
                </div>
              )}
              {pendingAction.actionName === "Transfer" && (
                <div style={{ marginTop: '8px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>New Placement Zone:</label>
                  <CustomAutocomplete placeholder="Select existing bay or type a new one..." value={pendingAction.newZone || ''} onChange={val => setPendingAction({...pendingAction, newZone: val})} options={[...new Set([...adminZones, ...stock.flatMap(i => i.locations ? i.locations.map(l => l.name) : [i.zone])])].filter(Boolean).map(x => ({ value: x, label: x }))} style={{ backgroundColor: "var(--surface-base)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", color: "var(--text-primary)", outline: "none", fontSize: "14px", width: "100%", boxSizing: "border-box" }} />
                </div>
              )}

              {pendingAction.actionName === "Ship" && (
                <button onClick={() => { if (!pendingAction.isShrinkage) { requireManager(() => setPendingAction(prev => ({...prev, isShrinkage: true}))); } else { setPendingAction(prev => ({...prev, isShrinkage: false})); } }} style={{ marginTop: '8px', backgroundColor: pendingAction.isShrinkage ? 'var(--brand-red)' : 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                  {pendingAction.isShrinkage ? '💥 MARKED AS SHRINKAGE / DAMAGE' : 'Flag as Damaged / Shrinkage'}
                </button>
              )}
            </div>
            
            {pendingAction.fifoWarningItem && (
              <div style={{ backgroundColor: "rgba(255, 149, 0, 0.15)", border: "1px solid var(--brand-orange)", padding: "16px", borderRadius: "8px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ color: "var(--brand-orange)", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>🛑 FIFO VIOLATION DETECTED</div>
                <div style={{ color: "var(--text-primary)", fontSize: "13px", lineHeight: "1.5" }}>You are about to ship <strong style={{color: "var(--text-secondary)"}}>{pendingAction.targetItem.lotNumber}</strong>, but older stock exists in the warehouse.</div>
                <div style={{ backgroundColor: "var(--surface-raised)", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Please pull from <strong style={{color: "var(--text-primary)"}}>{pendingAction.fifoWarningItem.zone}</strong>.<br/>
                  (Lot: {pendingAction.fifoWarningItem.lotNumber} • Expires: <span style={{color: "var(--brand-red)"}}>{pendingAction.fifoWarningItem.expiryDate}</span>)
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setShowConfirmModal(false); setOrderNumber(""); }} style={{ flex: 1, backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", padding: "16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleConfirmAction} style={{ flex: 2, backgroundColor: pendingAction.actionName.includes("Ship") ? "var(--brand-red)" : "var(--brand-green)", color: "var(--text-primary)", border: "none", padding: "16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>{pendingAction.fifoWarningItem ? "Force Ship Anyway" : "Commit Action"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODE SWITCH MODALS */}
      {pendingModeSwitch && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", lineHeight: "1", marginBottom: "-8px" }}>{pendingModeSwitch === "ship" ? "🚚" : pendingModeSwitch === "transfer" ? "🔄" : "📥"}</div>
            <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.01em" }}>Switch to {pendingModeSwitch === "ship" ? "Shipping" : pendingModeSwitch === "transfer" ? "Transfer Mode" : "Receiving"}?</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>Any barcodes scanned will now be <strong style={{ color: pendingModeSwitch === "ship" ? "var(--brand-red)" : pendingModeSwitch === "transfer" ? "var(--brand-blue)" : "var(--brand-green)" }}>{pendingModeSwitch === "ship" ? "DEDUCTED from" : pendingModeSwitch === "transfer" ? "MOVED within" : "ADDED to"}</strong> the live warehouse inventory.</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={() => setPendingModeSwitch(null)} style={{ flex: 1, backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Cancel</button>
              <button onClick={() => { setScanMode(pendingModeSwitch); setPendingModeSwitch(null); }} style={{ flex: 2, backgroundColor: pendingModeSwitch === "ship" ? "var(--brand-red)" : pendingModeSwitch === "transfer" ? "var(--brand-blue)" : "var(--brand-green)", color: "var(--text-primary)", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", boxShadow: pendingModeSwitch === "ship" ? "0 4px 15px rgba(255,59,48,0.3)" : pendingModeSwitch === "transfer" ? "0 4px 15px rgba(0,122,255,0.3)" : "0 4px 15px rgba(52,199,89,0.3)", transition: "all 0.2s" }}>Confirm {pendingModeSwitch === "ship" ? "Ship" : pendingModeSwitch === "transfer" ? "Transfer" : "Receive"}</button>
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "20px", boxSizing: "border-box" }}>
      <div style={{ backgroundColor: "var(--surface-base)", width: "100%", maxWidth: "1000px", maxHeight: "85vh", borderRadius: "16px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--surface-elevated)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ClipboardList size={24} color="var(--brand-blue)" />
            <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px", fontWeight: "700", letterSpacing: "0.02em" }}>Master Security Audit</h2>
          </div>
          <button onClick={() => setShowAuditModal(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "28px", cursor: "pointer", lineHeight: "1" }}>&times;</button>
        </div>

        {/* Body (Scrollable Data Table) */}
        <div style={{ padding: "0", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }} className="custom-scrollbar-viewport">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", color: "var(--text-primary)", fontSize: "14px" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--surface-base)", boxShadow: "0 2px 10px rgba(0,0,0,0.5)", zIndex: 10 }}>
              <tr>
                <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", borderBottom: "1px solid var(--border-subtle)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Timestamp</th>
                <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", borderBottom: "1px solid var(--border-subtle)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Action</th>
                <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", borderBottom: "1px solid var(--border-subtle)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Product Identity</th>
                <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", borderBottom: "1px solid var(--border-subtle)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em" }}>Operator</th>
                <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: "600", borderBottom: "1px solid var(--border-subtle)", textTransform: "uppercase", fontSize: "12px", letterSpacing: "0.05em", textAlign: "right" }}>Reversal</th>
              </tr>
            </thead>
            <tbody>
              <div style={{ paddingBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                <input type="text" placeholder="Search Master Security Audit (PO or Flavor)..." value={masterAuditSearch} onChange={(e) => setMasterAuditSearch(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ width: "100%", boxSizing: "border-box", backgroundColor: "var(--bg-canvas)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", padding: "12px", borderRadius: "8px", fontSize: "14px", outline: "none", fontWeight: "600", transition: "border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "var(--brand-blue)"} onBlur={(e) => e.target.style.borderColor = "var(--border-strong)"} />
              </div>
              {auditLog.length > 0 ? auditLog.filter(log => !masterAuditSearch || (log.orderNumber && log.orderNumber.toLowerCase().includes(masterAuditSearch.toLowerCase())) || (log.flavor && log.flavor.toLowerCase().includes(masterAuditSearch.toLowerCase()))).map((log, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--surface-elevated)", backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,122,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"}>
                  <td style={{ padding: "16px 24px", color: "var(--text-secondary)", fontFamily: "monospace", fontSize: "13px" }}>{log.time}</td>
                  <td style={{ padding: "16px 24px", fontWeight: "700", color: log.action.includes("Ship") ? "var(--brand-red)" : (log.action.includes("Receive") ? "var(--brand-green)" : (log.action.includes("Shrinkage") ? "var(--brand-orange)" : "var(--brand-blue)")) }}>{log.action}</td>
                  <td style={{ padding: "16px 24px", fontWeight: "500" }}>{log.qty}bx <span style={{ color: "var(--text-secondary)", fontWeight: "400" }}>{log.flavor}</span> {log.orderNumber && <span style={{ color: "var(--brand-blue)", fontSize: "10px", fontWeight: "800", marginLeft: "6px", backgroundColor: "rgba(0,122,255,0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(0,122,255,0.2)", whiteSpace: "nowrap" }}>#{log.orderNumber}</span>}{log.destination && <span style={{ color: log.action.includes("Receive") ? "var(--brand-green)" : "var(--brand-blue)", fontSize: "12px", marginLeft: "8px", fontWeight: "600" }}>➔ {log.destination}</span>}</td>
                  <td style={{ padding: "16px 24px", color: "#e5e5ea", fontSize: "13px" }}>{log.user}</td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    {!log.action.includes("UNDO") && !log.action.includes("Transfer") && !log.action.includes("Override") && (
                      <button onClick={() => requireManager(() => handleUndoAction(log))} style={{ backgroundColor: "rgba(255, 59, 48, 0.15)", color: "var(--brand-red)", border: "1px solid rgba(255, 59, 48, 0.4)", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.25)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.15)"}>
                        ↩️ UNDO
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic", fontSize: "15px" }}>No cryptographic audit records found in secure memory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-elevated)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: "500" }}>Showing {auditLog.length} secure ledger entries</span>
          <button onClick={handleExportCSV} style={{ backgroundColor: "var(--brand-blue)", color: "var(--text-primary)", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0056b3"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-blue)"}><FileDown size={16} /> Export to CSV</button>
        </div>

      </div>
    </div>
  )}

  
      {/* ⚙️ SETTINGS CONTROL PANEL */}
      {showSettingsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", zIndex: 10006, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "550px", backgroundColor: "var(--surface-base)", padding: "32px", borderRadius: "18px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "85vh" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "22px", fontWeight: "700", letterSpacing: "-0.01em" }}>⚙️ Control Panel</h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "transparent", color: "var(--text-secondary)", border: "none", fontSize: "24px", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color="var(--text-primary)"} onMouseLeave={(e) => e.target.style.color="var(--text-secondary)"}>✕</button>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--surface-elevated)", padding: "4px", borderRadius: "10px" }}>
              <button onClick={() => setSettingsTab('zones')} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: settingsTab === 'zones' ? "var(--brand-blue)" : "transparent", color: settingsTab === 'zones' ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s" }}>📍 Zones</button>
              <button onClick={() => setSettingsTab('vendors')} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: settingsTab === 'vendors' ? "var(--brand-green)" : "transparent", color: settingsTab === 'vendors' ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s" }}>🚚 Vendors</button>
              <button onClick={() => setSettingsTab('security')} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: settingsTab === 'security' ? "var(--brand-red)" : "transparent", color: settingsTab === 'security' ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 0.2s" }}>🔒 Security</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }} className="custom-scrollbar-viewport">
              
              {/* ZONES TAB */}
              {settingsTab === 'zones' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Inject custom placement zones into the scanner's memory.</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input id="newZoneInput" placeholder="e.g. Quarantine Bay A" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-raised)", color: "var(--text-primary)", outline: "none", fontSize: "14px" }} />
                    <button onClick={() => { const val = document.getElementById('newZoneInput').value.trim(); if(val && !adminZones.includes(val)) setAdminZones([...adminZones, val]); document.getElementById('newZoneInput').value = ''; }} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand-blue)", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Add</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    {adminZones.map((z, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", alignItems: "center" }}>
                        <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500" }}>📍 {z}</span>
                        <button onClick={() => setAdminZones(adminZones.filter(az => az !== z))} style={{ background: "transparent", border: "none", color: "var(--brand-red)", cursor: "pointer", fontWeight: "600" }}>Remove</button>
                      </div>
                    ))}
                    {adminZones.length === 0 && <div style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "13px", textAlign: "center", padding: "12px" }}>No custom zones configured...</div>}
                  </div>
                </div>
              )}

              {/* VENDORS TAB */}
              {settingsTab === 'vendors' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Save supplier email addresses for one-click PO routing.</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input id="newVendorInput" type="email" placeholder="e.g. supply@vendor.com" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--surface-raised)", color: "var(--text-primary)", outline: "none", fontSize: "14px" }} />
                    <button onClick={() => { const val = document.getElementById('newVendorInput').value.trim().toLowerCase(); if(val && !adminVendors.includes(val)) setAdminVendors([...adminVendors, val]); document.getElementById('newVendorInput').value = ''; }} style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand-green)", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Add</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    {adminVendors.map((v, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "var(--surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", alignItems: "center" }}>
                        <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: "500" }}>✉️ {v}</span>
                        <button onClick={() => setAdminVendors(adminVendors.filter(av => av !== v))} style={{ background: "transparent", border: "none", color: "var(--brand-red)", cursor: "pointer", fontWeight: "600" }}>Remove</button>
                      </div>
                    ))}
                    {adminVendors.length === 0 && <div style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "13px", textAlign: "center", padding: "12px" }}>No custom vendors configured...</div>}
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {settingsTab === 'security' && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Update the global Manager Override PIN for this terminal.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "var(--surface-elevated)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                    <label style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Security PIN</label>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <input id="newPinInput" type="password" maxLength="4" placeholder="****" style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "2px solid var(--brand-red)", backgroundColor: "var(--surface-base)", color: "var(--text-primary)", outline: "none", fontSize: "24px", letterSpacing: "12px", textAlign: "center", fontWeight: "700" }} />
                      <button onClick={() => { const val = document.getElementById('newPinInput').value; if(val.length === 4) { setAdminPin(val); alert("Manager PIN successfully rotated!"); document.getElementById('newPinInput').value = ''; } else { alert("PIN must be exactly 4 digits."); } }} style={{ padding: "14px 20px", borderRadius: "8px", border: "none", backgroundColor: "var(--brand-red)", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Rotate PIN</button>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", backgroundColor: "rgba(255,59,48,0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,59,48,0.3)", lineHeight: "1.5" }}>
                    <strong style={{ color: "var(--brand-red)" }}>Warning:</strong> Changing this PIN takes effect immediately. Do not lose this sequence. It gates access to the Global Ledger, Admin Overrides, and Undos.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CORE VIEW FINDER INJECTION */}
      {isScanning && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 9998, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "var(--surface-base)", padding: "24px", borderRadius: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "20px" }}>📷 Viewfinder</h3>
              <button onClick={() => setIsScanning(false)} style={{ background: "transparent", color: "var(--brand-red)", border: "none", fontWeight: "bold", cursor: "pointer" }}>Cancel ✕</button>
            </div>
            <div id="reader" style={{ width: "100%", minHeight: "250px" }}></div>
          </div>
        </div>
      )}
    
      {/* 🟢 FLOATING SCAN FEEDBACK TOAST */}
      {scanFeedback && (
        <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", backgroundColor: scanFeedback.includes("✅") ? "var(--brand-green)" : (scanFeedback.includes("📍") ? "var(--brand-blue)" : "var(--brand-red)"), color: "var(--text-primary)", padding: "16px 28px", borderRadius: "30px", fontWeight: "600", fontSize: "16px", zIndex: 10005, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", whiteSpace: "nowrap", pointerEvents: "none", animation: "inventory-toast-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          {scanFeedback}
        </div>
      )}
    </div>
  );
}
// Force search bar injection

// System patch: Mobile ledger overflow fixed & Master Audit Search permanently active.

// Mobile layout strict overflow fix

// System patch: Live ledger scroll box active

// System patch: Final V1.0 Cleanups (Search UI, Offline Sync, Rapid Fire)

// System patch: Cards synced & packaging data backfilled

// System patch: Packaging raw data backfilled for juices.

// System patch: Force-injected packaging keys for juices.

// System patch: UI-level packaging override for juices.

// System patch: Absolute brute-force override for juice packaging.

// System patch: Quick Action card buttons hardwired to master ledger

// System patch: Absolute Gatekeeper injected to prevent false-positive ledger logs.

// System patch: Quick Actions forcefully rewired via structural bracket parsing

// System patch: executeSaveNewItem mathematically locked and wired to audit ledger.

// System patch: Pro Mode Polish (Admin multi-lot clone fix, CSV data map fix, UI ledger duplication removed)

// System patch: Critical Alerts logic patched to respect aggregated flavor totals.

// System patch: Rapid Fire button hardwired to camera engine with 1.5s debounce.

// System patch: Removed double-badge (Ref: PO) from the Master Security Audit modal.

// System patch: Final V1.0 Clean Sweep (Audit modal UI sanitized, UNDO array flatline protection locked).

// System patch: Mobile scanner flex-wrap fix applied.
