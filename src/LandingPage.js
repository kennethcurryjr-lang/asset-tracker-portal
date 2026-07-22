import React, { useState } from "react";
import { 
  Navigation, ShieldCheck, Cpu, WifiOff, MapPin, 
  Wrench, Boxes, ArrowRight, CheckCircle2, QrCode, 
  Zap, Lock, Mail, Printer, AlertTriangle, RotateCw
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

  // --- STANDALONE CARD 1: TRACKING INTERACTIVE STATE ---
  const [trackingFlipped, setTrackingFlipped] = useState(false);
  const [watchdogActive, setWatchdogActive] = useState(true);
  const [hasAnchor, setHasAnchor] = useState(true);
  const [shareSimulated, setShareSimulated] = useState(false);

  // --- STANDALONE CARD 2: TOOLS INTERACTIVE STATE ---
  const [toolsFlipped, setToolsFlipped] = useState(false);
  const [toolHours, setToolHours] = useState(254);
  const [toolChecklist, setToolChecklist] = useState({ step1: false, step2: false, step3: false });
  const [toolStatus, setToolStatus] = useState("SERVICE_REQUIRED");

  // --- STANDALONE CARD 3: INVENTORY INTERACTIVE STATE ---
  const [inventoryFlipped, setInventoryFlipped] = useState(false);
  const [stockQty, setStockQty] = useState(420);
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
        .card-perspective-wrapper { perspective: 1200px; width: 100%; max-width: 340px; margin: 0 auto; display: flex; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; border-radius: 14px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #1a1a1c; border: 1px solid #3a3a3c; display: flex; flex-direction: column; padding: 16px; overflow-y: auto; }
        
        @keyframes radar-pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-dot {
          width: 8px; height: 8px; background-color: #34c759; border-radius: 50%; display: inline-block; animation: radar-pulse-glow 2s infinite ease-in-out;
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
              borderRadius: "20px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.2s"
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
        textAlign: "center", padding: "70px 20px 50px 20px",
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

        <p style={{
          fontSize: "18px", color: "#86868b", lineHeight: "1.6",
          marginBottom: "40px", maxWidth: "780px", margin: "0 auto 40px auto"
        }}>
          Test drive our standalone demo micro-cards below! Deploy all three integrated suites or select strictly the module your enterprise needs.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={onLoginClick}
            style={{
              backgroundColor: "#007aff", color: "#ffffff", border: "none",
              padding: "16px 36px", borderRadius: "30px", fontSize: "16px",
              fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "10px", boxShadow: "0 10px 30px rgba(0, 122, 255, 0.4)"
            }}
          >
            Launch Interactive Portal <ArrowRight size={18} />
          </button>
          <button 
            onClick={handleDemoClick}
            style={{
              backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c",
              padding: "16px 32px", borderRadius: "30px", fontSize: "16px",
              fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "8px"
            }}
          >
            <Mail size={18} /> Contact Sales
          </button>
        </div>
      </section>

      {/* THREE PILLARS TABS */}
      <section style={{ maxWidth: "1240px", margin: "20px auto 100px auto", padding: "0 20px" }}>
        <div style={{
          display: "flex", justifyContent: "center", gap: "12px",
          marginBottom: "32px", flexWrap: "wrap"
        }}>
          <button 
            onClick={() => setActiveTab("tracking")}
            style={{
              padding: "14px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tracking" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Navigation size={18} /> 1. Kinetic Tracking
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            style={{
              padding: "14px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Wrench size={18} /> 2. Kinetic Tools
          </button>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{
              padding: "14px 28px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "15px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
            }}
          >
            <Boxes size={18} /> 3. Kinetic Inventory
          </button>
        </div>

        {/* TAB 1: KINETIC TRACKING */}
        {activeTab === "tracking" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "40px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#ffcc00", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 01</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Live Geofence Watchdog & Recovery</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                Continuous, real-time hardware telemetry and geofence monitoring. Prevent asset drift with hard-coded home location anchors, live radar indicators, and automatic regional township resolution.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Automated Geofence Watchdog:</strong> Anchor hardware to precise lat/lon coordinates with visual radar status and boundary breach alarms.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Cryptographic Law Enforcement Share Links:</strong> Dispatch 12-hour to 7-day self-terminating, unindexed tracking links to external recovery teams.</div>
                </li>
              </ul>
            </div>

            {/* STANDALONE INTERACTIVE TRACKING CARD */}
            <div className="card-perspective-wrapper">
              <div className={`card-flipper ${trackingFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#2c2c2e', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>LAS-01 — Mobile Node</span>
                    <span style={{ backgroundColor: watchdogActive ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)', color: watchdogActive ? '#34c759' : '#ff3b30', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {watchdogActive && <span className="live-pulse-dot"></span>}
                      {watchdogActive ? 'WATCHDOG ACTIVE' : 'WATCHDOG OFF'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#86868b', lineHeight: '1.4' }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>Las Vegas, NV</div>
                      <div>ID: 862605278000318</div>
                      <div>Group: Fleet Alpha</div>
                      {hasAnchor && <div style={{ color: '#007aff', fontSize: '10px', fontWeight: '700', marginTop: '3px' }}>📍 Anchor: 36.0788, -115.1917</div>}
                    </div>
                    
                    <div style={{ position: 'relative', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #3a3a3c', backgroundColor: '#121212' }}>
                      <iframe title="tracking-demo-map" width="100%" height="100%" frameBorder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=-115.21%2C36.06%2C-115.17%2C36.09&layer=mapnik&marker=36.0788%2C-115.1917" style={{ pointerEvents: 'none', border: 'none', opacity: 0.8 }}></iframe>
                    </div>
                  </div>

                  {/* Battery Spark Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#121212', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3a3a3c' }}>
                    <div style={{ width: '36px', height: '4px', backgroundColor: '#2c2c2e', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: '99%', height: '100%', backgroundColor: '#34c759' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#34c759' }}>99%</span>
                    <span style={{ fontSize: '10px', color: '#86868b' }}>18 mos</span>
                  </div>

                  {/* Interactive Action Deck */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button 
                      onClick={() => setWatchdogActive(!watchdogActive)} 
                      style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: '1px solid #fff', backgroundColor: watchdogActive ? '#1d1d1f' : 'transparent', color: '#fff', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {watchdogActive ? 'Watchdog On' : 'Watchdog Off'}
                    </button>

                    <button 
                      onClick={() => setHasAnchor(!hasAnchor)} 
                      style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', border: '1px solid #fff', backgroundColor: 'transparent', color: '#fff', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {hasAnchor ? 'Clear Home' : 'Set Home'}
                    </button>

                    <button 
                      onClick={() => setTrackingFlipped(true)} 
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #007aff', backgroundColor: '#007aff', color: '#fff', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <RotateCw size={10} /> Flip
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#007aff' }}>⚙️ Escalate Live Tracking</span>
                    <button onClick={() => setTrackingFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '11px' }}>⤶ Back</button>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '10px' }}>
                    Generate a secure, unindexed 24-hour tracking link for recovery teams.
                  </div>

                  <input type="email" placeholder="investigator@agency.gov" style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #3a3a3c', backgroundColor: '#121212', color: '#fff', fontSize: '11px', outline: 'none', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                  {shareSimulated && (
                    <div style={{ backgroundColor: 'rgba(52,199,89,0.15)', border: '1px solid #34c759', padding: '6px', borderRadius: '6px', fontSize: '10px', color: '#34c759', marginBottom: '10px' }}>
                      ✅ Token Generated! Expiration set for 24 Hours.
                    </div>
                  )}

                  <button onClick={() => setShareSimulated(!shareSimulated)} style={{ marginTop: 'auto', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#007aff', color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    {shareSimulated ? 'Revoke Link' : 'Generate Dispatch Link'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KINETIC TOOLS */}
        {activeTab === "tools" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "40px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Chain-of-Custody & Bedrock AI</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                Complete liability protection and preventative maintenance for heavy equipment, vehicles, and high-value tools. Includes AI-generated service steps and e-signature handoffs.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>AWS Bedrock AI Ingestion:</strong> Automatically drafts brand-specific PM checklists and equipment manifests during asset creation.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Multi-Metric PM Kanban:</strong> Tracks Days, Miles, Hours, and Crimps/Cycles. Automatically locks overdue tools from field dispatch.</div>
                </li>
              </ul>
            </div>

            {/* STANDALONE INTERACTIVE TOOLS CARD */}
            <div className="card-perspective-wrapper">
              <div className={`card-flipper ${toolsFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#2c2c2e', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: toolStatus === "SERVICE_REQUIRED" ? '#ff3b30' : '#34c759', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? 'rgba(255,59,48,0.15)' : 'rgba(52,199,89,0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                      {toolStatus === "SERVICE_REQUIRED" ? '⚠️ SERVICE OVERDUE' : '🟢 OPERATIONAL'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#86868b' }}>[ CAT-259D3 ]</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Caterpillar Track Loader</div>
                    <div style={{ fontSize: '11px', color: '#86868b' }}>Valued at $65,000</div>
                  </div>

                  <div style={{ backgroundColor: '#121212', padding: '8px 10px', borderRadius: '6px', border: '1px solid #3a3a3c' }}>
                    <div style={{ fontSize: '9px', color: '#86868b', fontWeight: '700' }}>HOURS INTERVAL</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: toolHours >= 250 ? '#ff3b30' : '#34c759' }}>
                      {toolHours} / 250 <span style={{ fontSize: '10px', color: '#86868b' }}>HOURS</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button 
                      disabled={toolStatus === "SERVICE_REQUIRED"}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? '#3a3a3c' : '#007aff', color: toolStatus === "SERVICE_REQUIRED" ? '#86868b' : '#fff', fontSize: '10px', fontWeight: '800', cursor: toolStatus === "SERVICE_REQUIRED" ? 'not-allowed' : 'pointer' }}
                    >
                      {toolStatus === "SERVICE_REQUIRED" ? 'CHECKOUT LOCKED' : 'CHECK OUT'}
                    </button>
                    <button 
                      onClick={() => setToolsFlipped(true)} 
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #007aff', backgroundColor: 'transparent', color: '#007aff', fontSize: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <RotateCw size={10} /> Flip & Service
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#007aff' }}>🤖 AWS Bedrock AI Checklist</span>
                    <button onClick={() => setToolsFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '11px' }}>⤶ Back</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#121212', padding: '8px', borderRadius: '6px', marginBottom: '10px', fontSize: '11px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolChecklist.step1} onChange={e => setToolChecklist({...toolChecklist, step1: e.target.checked})} />
                      Hydraulic line pressure check
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolChecklist.step2} onChange={e => setToolChecklist({...toolChecklist, step2: e.target.checked})} />
                      Repack grease points
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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
                    style={{ marginTop: 'auto', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: (toolChecklist.step1 && toolChecklist.step2 && toolChecklist.step3) ? '#34c759' : '#3a3a3c', color: '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Log Service & Reset Hours
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KINETIC INVENTORY */}
        {activeTab === "inventory" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "40px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#34c759", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 03</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Camera Barcode Engine & FIFO Enforcement</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                High-speed warehouse inventory rotation. Integrates camera barcode scanning, multi-zone bin tracking, expiration enforcement, and offline queueing.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Flashing "PICK FIRST" FIFO Badges:</strong> Identifies the oldest valid lot in real-time to prevent stock spoilage and expired shipments.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Offline Dead-Zone Queue:</strong> Caches scans locally in concrete warehouses and auto-flushes to DynamoDB when signal returns.</div>
                </li>
              </ul>
            </div>

            {/* STANDALONE INTERACTIVE INVENTORY CARD */}
            <div className="card-perspective-wrapper">
              <div className={`card-flipper ${inventoryFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE */}
                <div className="card-face card-front" style={{ backgroundColor: '#2c2c2e', border: '1px solid #3a3a3c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#86868b', textTransform: 'uppercase', fontWeight: '700' }}>Citrus Springs</span>
                    <span style={{ backgroundColor: 'rgba(52,199,89,0.2)', border: '1px solid #34c759', color: '#34c759', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: '900' }}>🟢 PICK FIRST</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>100% Orange Juice Concentrate</div>
                    <div style={{ fontSize: '11px', color: '#86868b' }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
                  </div>

                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#34c759' }}>
                    {stockQty} <span style={{ fontSize: '12px', color: '#86868b' }}>Boxes in Stock</span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#007aff' }}>📍 Cooler Bay-01 ({stockQty}bx)</div>

                  {/* Interactive Action Deck */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    <button onClick={() => setStockQty(stockQty + 10)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #34c759', backgroundColor: 'rgba(52,199,89,0.15)', color: '#34c759', fontWeight: '800', fontSize: '10px', cursor: 'pointer' }}>+10 RCV</button>
                    <button onClick={() => setStockQty(Math.max(0, stockQty - 10))} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #ff3b30', backgroundColor: 'rgba(255,59,48,0.15)', color: '#ff3b30', fontWeight: '800', fontSize: '10px', cursor: 'pointer' }}>-10 SHP</button>
                    <button onClick={() => setInventoryFlipped(true)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #007aff', backgroundColor: '#007aff', color: '#fff', fontWeight: '800', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <RotateCw size={10} /> Flip
                    </button>
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="card-face card-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#007aff' }}>📊 Velocity & Zebra Label Engine</span>
                    <button onClick={() => setInventoryFlipped(false)} style={{ background: 'none', border: 'none', color: '#86868b', cursor: 'pointer', fontSize: '11px' }}>⤶ Back</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ backgroundColor: '#121212', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#86868b' }}>30-DAY BURN</div>
                      <div style={{ fontSize: '15px', fontWeight: '800' }}>75 bx</div>
                    </div>
                    <div style={{ backgroundColor: '#121212', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '9px', color: '#86868b' }}>90-DAY BURN</div>
                      <div style={{ fontSize: '15px', fontWeight: '800' }}>225 bx</div>
                    </div>
                  </div>

                  {showZebraPreview && (
                    <div style={{ backgroundColor: '#fff', color: '#000', padding: '8px', borderRadius: '6px', textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800' }}>CITRUS SPRINGS — ORANGE JUICE</div>
                      <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>UPC: 082123456781</div>
                    </div>
                  )}

                  <button onClick={() => setShowZebraPreview(!showZebraPreview)} style={{ marginTop: 'auto', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', color: '#fff', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Printer size={12} /> {showZebraPreview ? 'Hide Zebra Label' : 'Preview Zebra Thermal Label'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </section>

      {/* WHY WE ARE DIFFERENT */}
      <section style={{
        backgroundColor: "#121212", borderTop: "1px solid #1c1c1e",
        borderBottom: "1px solid #1c1c1e", padding: "80px 20px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "12px" }}>Built for the Real World</h2>
            <p style={{ color: "#86868b", fontSize: "16px" }}>Why modern field operations choose Kinetic Cards over legacy software.</p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px"
          }}>
            <div style={{ backgroundColor: "#1c1c1e", padding: "28px", borderRadius: "16px", border: "1px solid #2d2d2f" }}>
              <WifiOff size={28} color="#ff9500" style={{ marginBottom: "16px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Offline Dead-Zone Queue</h3>
              <p style={{ color: "#86868b", fontSize: "14px", lineHeight: "1.5" }}>
                Thick concrete warehouses or remote job sites don't stop work. Scans cache to local storage and sync to AWS DynamoDB the second connection returns.
              </p>
            </div>

            <div style={{ backgroundColor: "#1c1c1e", padding: "28px", borderRadius: "16px", border: "1px solid #2d2d2f" }}>
              <Lock size={28} color="#007aff" style={{ marginBottom: "16px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Multi-Tenant Workspaces</h3>
              <p style={{ color: "#86868b", fontSize: "14px", lineHeight: "1.5" }}>
                Strict tenant isolation guarantees clients, techs, and warehouse managers see only their authorized assets with role-based manager PIN overrides.
              </p>
            </div>

            <div style={{ backgroundColor: "#1c1c1e", padding: "28px", borderRadius: "16px", border: "1px solid #2d2d2f" }}>
              <ShieldCheck size={28} color="#34c759" style={{ marginBottom: "16px" }} />
              <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Legal-Grade Custody Transfer</h3>
              <p style={{ color: "#86868b", fontSize: "14px", lineHeight: "1.5" }}>
                Capture touch signatures, pre-dispatch condition photos, IP logs, and device fingerprints to protect against damage disputes and loss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section style={{ textAlign: "center", padding: "100px 20px" }}>
        <h2 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Ready to Modernize Your Fleet?</h2>
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
