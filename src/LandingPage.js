import React, { useState } from "react";
import { 
  Navigation, Cpu, 
  Wrench, Boxes,  
  Zap, Mail
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

  // --- 1. TRACKING CARD STATE ---
  const [watchdogActive, setWatchdogActive] = useState(true);
  const [logs, setLogs] = useState([
    { user: "kennethcurryjr@gmail.com", text: "GPS Installed", time: "7/8/2026 - 7:40 PM" },
    { user: "kennethcurryjr@gmail.com", text: "Repaired C02 Line Leak", time: "7/8/2026 - 7:40 PM" }
  ]);
  const [newLogText, setNewLogText] = useState("");

  // --- 2. TRUE KINETIC TOOLS CARD STATE ---
  const [toolHours, setToolHours] = useState(254);
  const [toolChecklist, setToolChecklist] = useState({ step1: false, step2: false, step3: false });
  const [toolStatus, setToolStatus] = useState("SERVICE_REQUIRED");
  

  // --- 3. KINETIC INVENTORY CARD STATE ---
  const [stockQty, setStockQty] = useState(420);
  const [selectedZone, setSelectedZone] = useState("Cooler Bay-01");
  

  const handleDemoClick = () => {
    window.location.href = "mailto:admin@titanassets.dev?subject=Kinetic%20Cards%20Demo%20Request&body=Hi%20Kinetic%20Team,%20I'd%20like%20to%20schedule%20a%20demo%20of%20Kinetic%20Cards.";
  };

  const pageStyle = {
    backgroundColor: "#0a0a0c",
    color: "#ffffff",
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    minHeight: "100vh",
    overflowX: "hidden"
  };

  return (
    <div style={pageStyle}>
      <style>{`
        .full-feature-card { width: 100%; max-width: 520px; margin: 0 auto; background-color: #202022; border: 1px solid #3a3a3c; border-radius: 18px; padding: 28px; display: flex; flex-direction: column; gap: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
        @keyframes radar-pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-dot { width: 9px; height: 9px; background-color: #34c759; border-radius: 50%; display: inline-block; animation: radar-pulse-glow 2s infinite ease-in-out; }
      `}</style>

      {/* NAVIGATION HEADER */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", maxWidth: "1280px", margin: "0 auto",
        borderBottom: "1px solid #1c1c1e"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0052cc 0%, #007aff 100%)",
            width: "36px", height: "36px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Zap size={20} color="#ffffff" />
          </div>
          <span style={{ fontWeight: "900", fontSize: "22px", letterSpacing: "0.5px" }}>
            KINETIC<span style={{ color: "#ffcc00" }}>CARDS™</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button 
            onClick={onLoginClick}
            style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "10px 20px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}
          >
            Sign In
          </button>
          <button 
            onClick={handleDemoClick}
            style={{ backgroundColor: "#ffffff", color: "#000000", border: "none", padding: "10px 22px", borderRadius: "20px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Mail size={16} /> Request Demo
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ textAlign: "center", padding: "70px 20px 40px 20px", maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", color: "#007aff", fontWeight: "600", marginBottom: "24px" }}>
          <Cpu size={16} /> AWS Bedrock AI-Powered Operations Platform
        </div>
        <h1 style={{ fontSize: "52px", fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.03em", marginBottom: "24px", background: "linear-gradient(180deg, #ffffff 0%, #a1a1a6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Total Operations Command.<br />
          GPS, Assets, and Stock in One Deck.<br />
          <span style={{ color: "#ffcc00", WebkitTextFillColor: "#ffcc00", fontSize: "44px" }}>Or A LA CARTE!</span>
        </h1>
      </section>

      {/* MODULE SELECTOR TABS */}
      <section style={{ maxWidth: "1280px", margin: "10px auto 100px auto", padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
          <button 
            onClick={() => setActiveTab("tracking")}
            style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "tracking" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Navigation size={18} /> 1. Kinetic Tracking Card
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Wrench size={18} /> 2. Kinetic Tools Card
          </button>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Boxes size={18} /> 3. Kinetic Inventory Card
          </button>
        </div>

        {/* TAB 1: TRACKING CARD (FULL DISPLAY - NO COLLAPSING) */}
        {activeTab === "tracking" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#ffcc00", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 01</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Live Geofence Watchdog & Always-Open Logs</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Real-time hardware telemetry and full immutable maintenance logs displayed directly on the card face.
              </p>
            </div>

            <div className="full-feature-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '18px' }}>GPS-1 <span style={{ fontSize: '13px', color: '#86868b', fontWeight: 'normal' }}>(862605278000318)</span></div>
                  <div style={{ fontSize: '11px', color: '#007aff', marginTop: '2px' }}>Group: LV-DEMO-77</div>
                </div>
                <span style={{ backgroundColor: watchdogActive ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)', color: watchdogActive ? '#34c759' : '#ff3b30', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {watchdogActive && <span className="live-pulse-dot"></span>}
                  {watchdogActive ? 'WATCHDOG ACTIVE' : 'WATCHDOG OFF'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.5' }}>
                  <div>Lat: <strong style={{ color: '#fff' }}>36.078802</strong></div>
                  <div>Lon: <strong style={{ color: '#fff' }}>-115.191695</strong></div>
                  <div style={{ color: '#34c759', marginTop: '4px' }}>⚡ Battery: 99%</div>
                </div>
                <div style={{ position: 'relative', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3a3a3c', backgroundColor: '#121212' }}>
                  <iframe title="tracking-map" width="100%" height="100%" frameBorder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=-115.21%2C36.06%2C-115.17%2C36.09&layer=mapnik&marker=36.0788%2C-115.1917" style={{ pointerEvents: 'none', border: 'none', opacity: 0.85 }}></iframe>
                </div>
              </div>

              {/* ALWAYS-OPEN LOGS FEED */}
              <div style={{ backgroundColor: '#161618', borderRadius: '8px', border: '1px solid #2d2d2f', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: '#007aff', fontWeight: '700', marginBottom: '8px' }}>📋 Device Audit Logs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ fontSize: '11px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{l.text}</div>
                      <div style={{ color: '#86868b', fontSize: '10px' }}>{l.time} • {l.user}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Add operational note..." 
                    value={newLogText}
                    onChange={e => setNewLogText(e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '11px', backgroundColor: '#0a0a0c', border: '1px solid #3a3a3c', color: '#fff', borderRadius: '4px', outline: 'none' }}
                  />
                  <button 
                    onClick={() => {
                      if (newLogText) {
                        setLogs([...logs, { user: "sales.demo@titanassets.dev", text: newLogText, time: "Just now" }]);
                        setNewLogText("");
                      }
                    }}
                    style={{ padding: '6px 12px', backgroundColor: '#007aff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Post
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setWatchdogActive(!watchdogActive)} 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fff', backgroundColor: watchdogActive ? '#1a1a1c' : 'transparent', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                {watchdogActive ? 'Toggle Watchdog: Active' : 'Toggle Watchdog: Offline'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TRUE KINETIC TOOLS CARD (FULL APP CARD LAYOUT) */}
        {activeTab === "tools" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Kinetic Assets & Chain-of-Custody</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Complete asset matrix with multi-metric preventative maintenance tracking, smart checklists, manifests, and secure deployment logs.
              </p>
            </div>

            <div className="full-feature-card" style={{ backgroundColor: '#ffffff', color: '#0a1b35', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: toolStatus === "SERVICE_REQUIRED" ? '#ef4444' : '#10b981' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? '#ef4444' : '#10b981' }}></span>
                  {toolStatus === "SERVICE_REQUIRED" ? 'SERVICE DUE' : 'OPERATIONAL'}
                </span>
                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>[ CAT-259D3 ]</span>
              </div>
              
              {/* Asset Title & Subtitle */}
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a1b35' }}>Caterpillar Track Loader</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>Assigned: Field Operations</div>
              </div>

              {/* Interactive Tabs inside the Card (PM, MANIFEST, QR, INFO) */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
                <button style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: '#0052cc', color: '#ffffff', cursor: 'pointer' }}>PM</button>
                <button style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer' }}>MANIFEST</button>
                <button style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer' }}>QR</button>
                <button style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer' }}>INFO</button>
              </div>

              {/* Hours Meter & Interval */}
              <div style={{ backgroundColor: '#f3f4f6', padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>HOURS INTERVAL</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: toolHours >= 250 ? '#ef4444' : '#0a1b35', marginTop: '2px' }}>
                  {toolHours} / 250 <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>HOURS</span>
                </div>
              </div>

              {/* Interactive PM Checklist */}
              <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#0052cc' }}>🤖 AWS Bedrock AI Checklist</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                  <input type="checkbox" checked={toolChecklist.step1} onChange={e => setToolChecklist({...toolChecklist, step1: e.target.checked})} style={{ width: '14px', height: '14px', accentColor: '#374151' }} />
                  Hydraulic line pressure check
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                  <input type="checkbox" checked={toolChecklist.step2} onChange={e => setToolChecklist({...toolChecklist, step2: e.target.checked})} style={{ width: '14px', height: '14px', accentColor: '#374151' }} />
                  Inspect and repack grease points
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                  <input type="checkbox" checked={toolChecklist.step3} onChange={e => setToolChecklist({...toolChecklist, step3: e.target.checked})} style={{ width: '14px', height: '14px', accentColor: '#374151' }} />
                  Test emergency stop switch
                </label>
              </div>

              {/* Action Button */}
              <button 
                disabled={!toolChecklist.step1 || !toolChecklist.step2 || !toolChecklist.step3}
                onClick={() => {
                  setToolHours(120);
                  setToolStatus("OPERATIONAL");
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: (toolChecklist.step1 && toolChecklist.step2 && toolChecklist.step3) ? '#10b981' : '#9ca3af', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {(toolChecklist.step1 && toolChecklist.step2 && toolChecklist.step3) ? 'Log PM Service & Reset Hours' : 'Complete Checklist to Unlock Service'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY CARD (FULL DISPLAY - NO COLLAPSING) */}
        {activeTab === "inventory" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#34c759", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 03</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>FIFO Rotation & Zebra Thermal Preview</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Manage perishable stock and multi-bin warehouse distribution with automated "PICK FIRST" badges and 4x6 thermal label previews.
              </p>
            </div>

            <div className="full-feature-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#86868b', textTransform: 'uppercase', fontWeight: '800' }}>Citrus Springs</span>
                <span style={{ backgroundColor: 'rgba(52,199,89,0.2)', border: '1px solid #34c759', color: '#34c759', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' }}>🟢 PICK FIRST</span>
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>100% Orange Juice Concentrate</div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {["Cooler Bay-01", "Dry Aisle-03"].map(zone => (
                  <button 
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: selectedZone === zone ? '1px solid #007aff' : '1px solid #3a3a3c', backgroundColor: selectedZone === zone ? 'rgba(0,122,255,0.15)' : '#161618', color: selectedZone === zone ? '#007aff' : '#86868b', cursor: 'pointer' }}
                  >
                    📍 {zone}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '30px', fontWeight: '800', color: '#34c759' }}>
                {stockQty} <span style={{ fontSize: '14px', color: '#86868b' }}>Boxes in Stock</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setStockQty(stockQty + 10)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #34c759', backgroundColor: 'rgba(52,199,89,0.15)', color: '#34c759', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>+10 Receive</button>
                <button onClick={() => setStockQty(Math.max(0, stockQty - 10))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'rgba(255,59,48,0.15)', color: '#ff3b30', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>-10 Ship</button>
              </div>

              {/* ALWAYS-VISIBLE ZEBRA LABEL PREVIEW */}
              <div style={{ backgroundColor: '#fff', color: '#000', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '800' }}>ZEBRA 4x6 THERMAL LABEL PREVIEW</div>
                <div style={{ fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>CITRUS SPRINGS — ORANGE JUICE</div>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', marginTop: '2px' }}>UPC: 082123456781 • ZONE: {selectedZone}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <section style={{ textAlign: "center", padding: "100px 20px", borderTop: "1px solid #1c1c1e" }}>
        <h2 style={{ fontSize: "38px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Ready to Modernize Your Fleet?</h2>
        <p style={{ color: "#86868b", fontSize: "16px", marginBottom: "32px" }}>Experience seamless asset tracking in under 5 minutes.</p>
        <button 
          onClick={handleDemoClick}
          style={{ backgroundColor: "#ffffff", color: "#000000", border: "none", padding: "16px 40px", borderRadius: "30px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 30px rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Mail size={18} /> Request Enterprise Demo
        </button>
      </section>
    </div>
  );
}
