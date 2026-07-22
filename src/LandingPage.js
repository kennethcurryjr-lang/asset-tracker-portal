import React, { useState } from "react";
import { 
  Navigation, Cpu, WifiOff, ShieldCheck, 
  Wrench, Boxes, ArrowRight, CheckCircle2, 
  Zap, Mail, Printer, AlertTriangle, RotateCw, FileText, Plus
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

  // --- EXACT TRACKING CARD STATE ---
  const [trackingFlipped, setTrackingFlipped] = useState(false);
  const [watchdogActive, setWatchdogActive] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([
    { user: "kennethcurryjr@gmail.com", text: "GPS Installed", time: "7/8/2026 - 7:40 PM" },
    { user: "kennethcurryjr@gmail.com", text: "Repaired C02 Line Leak", time: "7/8/2026 - 7:40 PM" }
  ]);
  const [newLogText, setNewLogText] = useState("");

  // --- EXACT TOOLS CARD STATE ---
  const [toolsFlipped, setToolsFlipped] = useState(false);
  const [toolHours, setToolHours] = useState(254);
  const [toolChecklist, setToolChecklist] = useState({ step1: false, step2: false, step3: false });
  const [toolStatus, setToolStatus] = useState("SERVICE_REQUIRED");

  // --- EXACT INVENTORY CARD STATE ---
  const [inventoryFlipped, setInventoryFlipped] = useState(false);
  const [stockQty, setStockQty] = useState(420);
  const [selectedZone, setSelectedZone] = useState("Cooler Bay-01");
  const [showZebraPreview, setShowZebraPreview] = useState(false);

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
        .exact-card-wrapper { perspective: 1200px; width: 100%; max-width: 480px; margin: 0 auto; display: flex; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; box-sizing: border-box; border-radius: 16px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #161618; border: 1px solid #3a3a3c; display: flex; flex-direction: column; padding: 28px; overflow-y: auto; }
        
        @keyframes radar-pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-dot {
          width: 9px; height: 9px; background-color: #34c759; border-radius: 50%; display: inline-block; animation: radar-pulse-glow 2s infinite ease-in-out;
        }
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
            style={{
              backgroundColor: "transparent", color: "#ffffff",
              border: "1px solid #3a3a3c", padding: "10px 20px",
              borderRadius: "20px", fontWeight: "600", cursor: "pointer"
            }}
          >
            Sign In
          </button>
          <button 
            onClick={handleDemoClick}
            style={{
              backgroundColor: "#ffffff", color: "#000000",
              border: "none", padding: "10px 22px",
              borderRadius: "20px", fontWeight: "700", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", gap: "6px"
            }}
          >
            <Mail size={16} /> Request Demo
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        textAlign: "center", padding: "70px 20px 40px 20px",
        maxWidth: "960px", margin: "0 auto"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
          padding: "6px 16px", borderRadius: "20px", fontSize: "13px",
          color: "#007aff", fontWeight: "600", marginBottom: "24px"
        }}>
          <Cpu size={16} /> AWS Bedrock AI-Powered Operations Platform
        </div>

        <h1 style={{
          fontSize: "52px", fontWeight: "800", lineHeight: "1.15",
          letterSpacing: "-0.03em", marginBottom: "24px",
          background: "linear-gradient(180deg, #ffffff 0%, #a1a1a6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Total Operations Command.<br />
          GPS, Assets, and Stock in One Deck.<br />
          <span style={{ color: "#ffcc00", WebkitTextFillColor: "#ffcc00", fontSize: "44px" }}>Or A LA CARTE!</span>
        </h1>
      </section>

      {/* MODULE SELECTOR TABS */}
      <section style={{ maxWidth: "1280px", margin: "10px auto 100px auto", padding: "0 20px" }}>
        <div style={{
          display: "flex", justifyContent: "center", gap: "12px",
          marginBottom: "40px", flexWrap: "wrap"
        }}>
          <button 
            onClick={() => setActiveTab("tracking")}
            style={{
              padding: "16px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tracking" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: activeTab === "tracking" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Navigation size={18} /> 1. Kinetic Tracking Card
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            style={{
              padding: "16px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: activeTab === "tools" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Wrench size={18} /> 2. Kinetic Tools Card
          </button>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{
              padding: "16px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
              boxShadow: activeTab === "inventory" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Boxes size={18} /> 3. Kinetic Inventory Card
          </button>
        </div>

        {/* TAB 1: EXACT TRACKING CARD WITH LIVE LOGS DRAWER */}
        {activeTab === "tracking" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start"
          }}>
            <div>
              <div style={{ color: "#ffcc00", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 01</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Live Geofence Watchdog & Expandable Logs</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Inspect real-time telemetry, geographic anchor locks, and full immutable maintenance logs directly inside the vertical card view.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Interactive Logs Drawer:</strong> Click to expand timestamps, user signatures, and service notes logged directly against the device ID.</div>
                </li>
              </ul>
            </div>

            {/* EXACT PROPORTION TRACKING CARD */}
            <div className="exact-card-wrapper">
              <div className={`card-flipper ${trackingFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#202022', border: '1px solid #3a3a3c', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
                  
                  {/* Header */}
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

                  {/* Map & Coordinates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.5' }}>
                      <div>Lat: <strong style={{ color: '#fff' }}>36.078802</strong></div>
                      <div>Lon: <strong style={{ color: '#fff' }}>-115.191695</strong></div>
                      <div style={{ color: '#34c759', marginTop: '4px' }}>⚡ Battery: 99%</div>
                      <div style={{ fontSize: '10px', color: '#a1a1a6', marginTop: '2px' }}>Last Seen: Just now</div>
                    </div>
                    <div style={{ position: 'relative', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3a3a3c', backgroundColor: '#121212' }}>
                      <iframe title="tracking-map" width="100%" height="100%" frameBorder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=-115.21%2C36.06%2C-115.17%2C36.09&layer=mapnik&marker=36.0788%2C-115.1917" style={{ pointerEvents: 'none', border: 'none', opacity: 0.85 }}></iframe>
                    </div>
                  </div>

                  {/* Expandable Logs Section */}
                  <div style={{ backgroundColor: '#161618', borderRadius: '8px', border: '1px solid #2d2d2f', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setShowLogs(!showLogs)}
                      style={{ width: '100%', padding: '10px 12px', backgroundColor: 'transparent', border: 'none', color: '#007aff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>📋 Device Logs ({logs.length})</span>
                      <span>{showLogs ? '▲ Hide' : '▼ View'}</span>
                    </button>

                    {showLogs && (
                      <div style={{ padding: '10px 12px', borderTop: '1px solid #2d2d2f', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '130px', overflowY: 'auto' }}>
                        {logs.map((l, i) => (
                          <div key={i} style={{ fontSize: '11px', borderBottom: '1px solid #222', paddingBottom: '4px' }}>
                            <div style={{ color: '#fff', fontWeight: '600' }}>{l.text}</div>
                            <div style={{ color: '#86868b', fontSize: '10px' }}>{l.time} • {l.user}</div>
                          </div>
                        ))}
                        
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          <input 
                            type="text" 
                            placeholder="Add note..." 
                            value={newLogText}
                            onChange={e => setNewLogText(e.target.value)}
                            style={{ flex: 1, padding: '4px 8px', fontSize: '11px', backgroundColor: '#0a0a0c', border: '1px solid #3a3a3c', color: '#fff', borderRadius: '4px', outline: 'none' }}
                          />
                          <button 
                            onClick={() => {
                              if (newLogText) {
                                setLogs([...logs, { user: "sales.demo@titanassets.dev", text: newLogText, time: "Just now" }]);
                                setNewLogText("");
                              }
                            }}
                            style={{ padding: '4px 8px', backgroundColor: '#007aff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button 
                      onClick={() => setWatchdogActive(!watchdogActive)} 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #fff', backgroundColor: watchdogActive ? '#1a1a1c' : 'transparent', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {watchdogActive ? 'Watchdog On' : 'Watchdog Off'}
                    </button>
                    <button 
                      onClick={() => setTrackingFlipped(true)} 
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #007aff', backgroundColor: '#007aff', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCw size={12} /> Share Link
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#007aff' }}>⚙️ Cryptographic Recovery Share</span>
                    <button onClick={() => setTrackingFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '12px' }}>⤶ Back</button>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '16px' }}>
                    Dispatch a secure, self-terminating 24-hour map tracking link for law enforcement or asset recovery teams.
                  </div>

                  <input type="email" placeholder="investigator@agency.gov" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#0a0a0c', color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '16px', width: '100%', boxSizing: 'border-box' }} />

                  <button onClick={() => alert("Secure tracking link generated and copied to clipboard!")} style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#007aff', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                    Generate Secure Dispatch Link
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXACT TOOLS CARD */}
        {activeTab === "tools" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start"
          }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Chain-of-Custody & Overdue PM Lock</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Heavy machinery and high-value tools require rigorous maintenance tracking. When hours exceed limits, checkout is locked until AI service steps are completed.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Automated Checkout Lock:</strong> Prevents field dispatch on overdue equipment until maintenance checklists are cleared.</div>
                </li>
              </ul>
            </div>

            {/* EXACT PROPORTION TOOLS CARD */}
            <div className="exact-card-wrapper">
              <div className={`card-flipper ${toolsFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#202022', border: '1px solid #3a3a3c', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: toolStatus === "SERVICE_REQUIRED" ? '#ff3b30' : '#34c759', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? 'rgba(255,59,48,0.15)' : 'rgba(52,199,89,0.15)', padding: '4px 10px', borderRadius: '6px' }}>
                      {toolStatus === "SERVICE_REQUIRED" ? '⚠️ SERVICE OVERDUE' : '🟢 OPERATIONAL'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#86868b', fontWeight: '700' }}>[ CAT-259D3 ]</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Caterpillar Track Loader</div>
                    <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>Replacement Value: $65,000</div>
                  </div>

                  <div style={{ backgroundColor: '#161618', padding: '14px', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                    <div style={{ fontSize: '10px', color: '#86868b', fontWeight: '700' }}>HOURS METER INTERVAL</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: toolHours >= 250 ? '#ff3b30' : '#34c759', marginTop: '2px' }}>
                      {toolHours} / 250 <span style={{ fontSize: '12px', color: '#86868b' }}>HOURS</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button 
                      disabled={toolStatus === "SERVICE_REQUIRED"}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? '#3a3a3c' : '#007aff', color: toolStatus === "SERVICE_REQUIRED" ? '#86868b' : '#fff', fontSize: '12px', fontWeight: '800', cursor: toolStatus === "SERVICE_REQUIRED" ? 'not-allowed' : 'pointer' }}
                    >
                      {toolStatus === "SERVICE_REQUIRED" ? 'CHECKOUT LOCKED' : 'CHECK OUT'}
                    </button>
                    <button 
                      onClick={() => setToolsFlipped(true)} 
                      style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #007aff', backgroundColor: 'transparent', color: '#007aff', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCw size={12} /> Flip & Service
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#007aff' }}>🤖 AWS Bedrock AI PM Checklist</span>
                    <button onClick={() => setToolsFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '12px' }}>⤶ Back</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#121212', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolChecklist.step1} onChange={e => setToolChecklist({...toolChecklist, step1: e.target.checked})} />
                      Verify hydraulic line pressure
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolChecklist.step2} onChange={e => setToolChecklist({...toolChecklist, step2: e.target.checked})} />
                      Inspect and repack grease points
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolChecklist.step3} onChange={e => setToolChecklist({...toolChecklist, step3: e.target.checked})} />
                      Test emergency stop switch
                    </label>
                  </div>

                  <button 
                    disabled={!toolChecklist.step1 || !toolChecklist.step2 || !toolChecklist.step3}
                    onClick={() => {
                      setToolHours(120);
                      setToolStatus("OPERATIONAL");
                      setToolsFlipped(false);
                    }}
                    style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: (toolChecklist.step1 && toolChecklist.step2 && toolChecklist.step3) ? '#34c759' : '#3a3a3c', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Log Service & Unlock Tool
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXACT INVENTORY CARD */}
        {activeTab === "inventory" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start"
          }}>
            <div>
              <div style={{ color: "#34c759", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 03</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>FIFO Rotation & Multi-Zone Bin Allocation</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Manage perishable stock and multi-bin warehouse distribution with automated "PICK FIRST" badges and Zebra thermal label printing previews.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Multi-Zone Bin Tracking:</strong> Switch between Cooler Bays and Dry Aisles to manage split product lots with real quantity deductions.</div>
                </li>
              </ul>
            </div>

            {/* EXACT PROPORTION INVENTORY CARD */}
            <div className="exact-card-wrapper">
              <div className={`card-flipper ${inventoryFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#202022', border: '1px solid #3a3a3c', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#86868b', textTransform: 'uppercase', fontWeight: '800' }}>Citrus Springs</span>
                    <span style={{ backgroundColor: 'rgba(52,199,89,0.2)', border: '1px solid #34c759', color: '#34c759', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '900' }}>🟢 PICK FIRST</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>100% Orange Juice Concentrate</div>
                    <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
                  </div>

                  {/* Bin Selector */}
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

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button onClick={() => setStockQty(stockQty + 10)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #34c759', backgroundColor: 'rgba(52,199,89,0.15)', color: '#34c759', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>+10 Receive</button>
                    <button onClick={() => setStockQty(Math.max(0, stockQty - 10))} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ff3b30', backgroundColor: 'rgba(255,59,48,0.15)', color: '#ff3b30', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>-10 Ship</button>
                    <button onClick={() => setInventoryFlipped(true)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #007aff', backgroundColor: '#007aff', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCw size={12} /> Flip
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#007aff' }}>📊 Velocity & Zebra Label Engine</span>
                    <button onClick={() => setInventoryFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '12px' }}>⤶ Back</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#86868b' }}>30-DAY BURN</div>
                      <div style={{ fontSize: '16px', fontWeight: '800' }}>75 bx</div>
                    </div>
                    <div style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#86868b' }}>90-DAY BURN</div>
                      <div style={{ fontSize: '16px', fontWeight: '800' }}>225 bx</div>
                    </div>
                  </div>

                  {showZebraPreview && (
                    <div style={{ backgroundColor: '#fff', color: '#000', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '800' }}>CITRUS SPRINGS — ORANGE JUICE</div>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace' }}>UPC: 082123456781 • ZONE: {selectedZone}</div>
                    </div>
                  )}

                  <button onClick={() => setShowZebraPreview(!showZebraPreview)} style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#161618', border: '1px solid #3a3a3c', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Printer size={14} /> {showZebraPreview ? 'Hide Thermal Preview' : 'Preview Zebra 4x6 Thermal Label'}
                  </button>
                </div>

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
          style={{
            backgroundColor: "#ffffff", color: "#000000", border: "none",
            padding: "16px 40px", borderRadius: "30px", fontSize: "16px",
            fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 30px rgba(255,255,255,0.2)",
            display: "inline-flex", alignItems: "center", gap: "8px"
          }}
        >
          <Mail size={18} /> Request Enterprise Demo
        </button>
      </section>
    </div>
  );
}
