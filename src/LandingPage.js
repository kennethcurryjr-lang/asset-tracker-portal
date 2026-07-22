import React, { useState } from "react";
import { 
  Navigation, Cpu, 
  Wrench, Boxes,  
  Zap, Mail, RotateCw, Printer
} from "lucide-react";


// --- DEMO CARD COMPONENT & MOCK DATA ---
const deviceCardStyle = { backgroundColor: '#2c2c2e', borderRadius: '14px', padding: '16px', border: '1px solid #3a3a3c', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' };
const inputStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #3a3a3c', fontSize: '14px', backgroundColor: '#1c1c1e', color: '#ffffff', outline: 'none', transition: 'all 0.2s' };
const buttonStyle = { padding: '10px 20px', borderRadius: '20px', border: '1px solid #ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#121212', color: '#ffffff' };
const primaryButtonStyle = { ...buttonStyle, backgroundColor: '#ffffff', color: '#121212' };

const getTimelineMarkerColor = (text = "") => {
  const logText = text.toLowerCase();
  if (logText.includes('overheat') || logText.includes('fail') || logText.includes('error')) return '#ff3b30'; 
  if (logText.includes('install') || logText.includes('repair') || logText.includes('fix')) return '#ff9500'; 
  if (logText.includes('activated') || logText.includes('claimed') || logText.includes('set')) return '#34c759'; 
  return '#86868b'; 
};

const trackingDemoAsset = {
  deviceId: "862605278000318", tag: "GPS-1", city: "Las Vegas", group: "LV-DEMO-77",
  latitude: 36.078802, longitude: -115.191695, batteryLevel: 99, isServiceMode: false, lastSeen: "Just Now",
  logs: [
    { text: "🔧 Preventative Maintenance: Replaced worn seals & tested voltage", user: "tech_ops", time: "Today - 10:30 AM" },
    { text: "📅 Service scheduled. Next due: 6 Months", user: "admin_user", time: "Today - 9:15 AM" },
    { text: "📍 Home Anchor Set: 36.0788, -115.1916", user: "demo_user", time: "Today - 8:05 AM" },
    { text: "✅ Asset activated and claimed", user: "demo_user", time: "Today - 8:00 AM" }
  ]
};



// --- DEMO ASSET CARD & MOCK DATA ---
const assetDemoData = {
  id: "FORD-681",
  model: "F-150",
  value: "$75,000",
  status: "IN-STOCK",
  serial: "SN-9948-2026-X",
  hourLimit: "500 hrs / 85% used",
  custody: "Verified • Handoff #402",
  logs: [
    { text: "[Admin] Tool Ingested to Database", time: "Jul 21, 2026, 6:19 PM" },
    { text: "[Chain-of-Custody] Signed off by Field Ops", time: "Jul 21, 2026, 7:00 PM" }
  ],
  steps: [
    { id: 1, text: "Drain water separator & replace fuel filters", checked: true },
    { id: 2, text: "Inspect hydraulic return filter & pull S·O·S fluid", checked: false },
    { id: 3, text: "Check and adjust track tension limits", checked: false }
  ]
};

function DemoAssetCard() {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [steps, setSteps] = React.useState(assetDemoData.steps);
  const [logs, setLogs] = React.useState(assetDemoData.logs);
  const [serviceNote, setServiceNote] = React.useState("");

  // Auto-flip timer unless hovered or manually interacted
  React.useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const toggleStep = (id) => {
    setSteps(steps.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const logService = () => {
    const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const noteText = serviceNote.trim() ? serviceNote.trim() : "Performed scheduled preventative maintenance.";
    setLogs([{ text: `[Tech] ${noteText}`, time: timestamp }, ...logs]);
    setServiceNote("");
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ height: '620px', perspective: '1200px', display: 'flex', width: '100%', maxWidth: '420px', margin: '0 auto' }}
    >
      <div style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        
        {/* FRONT FACE */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1c1c1e', borderRadius: '16px', padding: '24px', border: '1px solid #3a3a3c', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', backfaceVisibility: 'hidden', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module 02 • Asset Card</div>
              <div style={{ fontSize: '22px', fontWeight: '800' }}>{assetDemoData.id}</div>
              <div style={{ fontSize: '13px', color: '#86868b' }}>{assetDemoData.model} • <strong style={{ color: '#34c759' }}>{assetDemoData.value}</strong></div>
            </div>
            <button onClick={() => setIsFlipped(true)} style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Flip ⤹</button>
          </div>

          <div style={{ backgroundColor: '#2c2c2e', borderRadius: '12px', padding: '14px', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffcc00', display: 'flex', justifyContent: 'space-between' }}>
              <span>Preventative Maintenance</span>
              <span style={{ fontSize: '10px', color: '#34c759', backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: '4px' }}>{assetDemoData.status}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {steps.map(step => (
                <label key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#d1d5db', cursor: 'pointer' }}>
                  <input type="checkbox" checked={step.checked} onChange={() => toggleStep(step.id)} style={{ marginTop: '2px', accentColor: '#007aff' }} />
                  <span style={{ textDecoration: step.checked ? 'line-through' : 'none', opacity: step.checked ? 0.6 : 1 }}>{step.text}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
              <input placeholder="Add service note..." value={serviceNote} onChange={(e) => setServiceNote(e.target.value)} style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#121212', border: '1px solid #3a3a3c', color: '#ffffff', fontSize: '12px', outline: 'none', flex: 1 }} />
              <button onClick={logService} style={{ backgroundColor: '#007aff', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>Log</button>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: '#86868b', textAlign: 'center' }}>
            Hover to pause auto-flip • Auto-flipping every 4.5s
          </div>
        </div>

        {/* BACK FACE */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#1c1c1e', borderRadius: '16px', padding: '24px', border: '1px solid #3a3a3c', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '12px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#007aff' }}>⚙️ Chain-of-Custody & Serial Data</div>
            <button onClick={() => setIsFlipped(false)} style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>⤶ Back</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', backgroundColor: '#2c2c2e', padding: '14px', borderRadius: '12px', border: '1px solid #3a3a3c' }}>
            <div><span style={{ color: '#86868b' }}>Serial Number:</span> <strong style={{ color: '#ffffff' }}>{assetDemoData.serial}</strong></div>
            <div><span style={{ color: '#86868b' }}>Hour Meter Limit:</span> <strong style={{ color: '#ffcc00' }}>{assetDemoData.hourLimit}</strong></div>
            <div><span style={{ color: '#86868b' }}>Custody Handoff:</span> <strong style={{ color: '#34c759' }}>{assetDemoData.custody}</strong></div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '700', color: '#86868b' }}>Immutable Audit Trail</div>
          <div style={{ backgroundColor: '#121212', borderRadius: '8px', padding: '10px', flex: 1, overflowY: 'auto', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ fontSize: '11px', borderBottom: idx < logs.length - 1 ? '1px solid #2c2c2e' : 'none', paddingBottom: '6px' }}>
                <div style={{ color: '#ffffff', fontWeight: '600' }}>{log.text}</div>
                <div style={{ color: '#86868b', fontSize: '9px' }}>{log.time}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '10px', color: '#86868b', textAlign: 'center' }}>
            AWS Bedrock AI Verified Record
          </div>
        </div>

      </div>
    </div>
  );
}
// --- END DEMO ASSET CARD ---
-

function DemoKineticCard({ initialAsset }) {
  const [tag, setTag] = React.useState(initialAsset.tag);
  const [tagInput, setTagInput] = React.useState("");
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isServiceMode, setIsServiceMode] = React.useState(initialAsset.isServiceMode);
  const [homeLat, setHomeLat] = React.useState(initialAsset.latitude);
  const [logs, setLogs] = React.useState(initialAsset.logs || []);
  const [noteInput, setNoteInput] = React.useState("");
  
  const sparkColor = initialAsset.batteryLevel <= 20 ? '#ff3b30' : initialAsset.batteryLevel <= 50 ? '#ff9500' : '#34c759';

  const handleSaveTag = () => { if (tagInput) setTag(tagInput); setTagInput(""); };
  const toggleWatchdog = () => {
    const newState = !isServiceMode;
    setIsServiceMode(newState);
    setLogs([{ text: newState ? "🛡️ Watchdog Disabled" : "Watchdog Activated", user: "demo_user", time: "Just now" }, ...logs]);
  };
  const toggleHome = () => {
    if (homeLat) { setHomeLat(null); setLogs([{ text: "🚫 Home Anchor Cleared", user: "demo_user", time: "Just now" }, ...logs]); } 
    else { setHomeLat(initialAsset.latitude); setLogs([{ text: `📍 Home Anchor Set: ${initialAsset.latitude.toFixed(4)}`, user: "demo_user", time: "Just now" }, ...logs]); }
  };
  const handlePostNote = () => { if (!noteInput) return; setLogs([{ text: noteInput, user: "demo_user", time: "Just now" }, ...logs]); setNoteInput(""); };

  return (
    <div className="card-perspective-wrapper" style={{ height: '620px', perspective: '1200px', display: 'flex', width: '100%' }}>
      <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`} style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d', position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="card-face card-front" style={{ ...deviceCardStyle, backgroundColor: '#1c1c1e', backfaceVisibility: 'hidden', zIndex: 2, position: 'relative', height: '100%' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input type="checkbox" readOnly checked style={{ width: '16px', height: '16px', accentColor: '#ffffff' }} />
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>{tag}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '500', color: '#ffffff' }}>{initialAsset.city}</div>
                <div style={{ fontSize: '10px', color: '#86868b' }}>Last seen: {initialAsset.lastSeen}</div>
                <div style={{ fontSize: '11px' }}>ID: {initialAsset.deviceId}</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{initialAsset.group}</div>
                {homeLat && (
                  <div style={{ fontSize: '10px', color: '#007aff', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#007aff'}}></span>
                    Anchor: {Number(homeLat).toFixed(4)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#121212', padding: '4px 8px', borderRadius: '6px', border: '1px solid #2c2c2e' }}>
                <div style={{ width: '40px', height: '4px', backgroundColor: '#2c2c2e', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${initialAsset.batteryLevel}%`, height: '100%', backgroundColor: sparkColor }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: sparkColor }}>{initialAsset.batteryLevel}%</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: '120px', flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid #3a3a3c', backgroundColor: '#121212' }}>
               <iframe title="demo-map" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${initialAsset.longitude-0.01}%2C${initialAsset.latitude-0.01}%2C${initialAsset.longitude+0.01}%2C${initialAsset.latitude+0.01}&layer=mapnik&marker=${initialAsset.latitude}%2C${initialAsset.longitude}`} style={{ pointerEvents: "none", border: "none", position: "absolute", top: "-60px", left: "-60px", width: "calc(100% + 120px)", height: "calc(100% + 120px)" }}></iframe>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            <input placeholder="Rename Asset..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#121212' }} />
            <button onClick={handleSaveTag} style={{ ...primaryButtonStyle, padding: "6px 12px", fontSize: "12px", borderRadius: "6px", backgroundColor: "#007aff", color: '#ffffff', border: 'none' }}>Save</button>
            <button onClick={() => setIsFlipped(true)} style={{ background: "#121212", border: "1px solid #3a3a3c", cursor: "pointer", fontSize: "11px", color: '#ffffff', padding: "6px 10px", borderRadius: "6px", fontWeight: "600" }}>Flip ⤹</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap', marginTop: '6px' }}>
            <button onClick={toggleWatchdog} style={{ ...buttonStyle, fontSize: '11px', borderRadius: '8px', flex: 1.5, padding: '8px 10px', backgroundColor: isServiceMode === false ? '#1d1d1f' : 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}>
              {isServiceMode === false && <span style={{ width: '8px', height: '8px', backgroundColor: '#34c759', borderRadius: '50%', display: 'inline-block' }}></span>}
              {isServiceMode === false ? 'Watchdog active' : 'Watchdog off'}
            </button>
            <button onClick={toggleHome} style={{ ...buttonStyle, fontSize: "11px", borderRadius: "8px", flex: 1.2, padding: "8px 10px", backgroundColor: homeLat ? "transparent" : "#1d1d1f", color: "#ffffff", border: "1px solid #ffffff" }}>
              {homeLat ? "Clear Home" : "Set Home"}
            </button>
          </div>
          
          <div style={{ display: "flex", gap: "6px", width: "100%", marginTop: "12px", marginBottom: "8px", alignItems: "center", backgroundColor: "#121212", padding: "8px", borderRadius: "8px", border: "1px solid #2c2c2e", boxSizing: "border-box" }}>
            <select style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #3a3a3c", fontSize: "11px", backgroundColor: '#1c1c1e', color: '#ffffff', flex: 1, outline: "none" }}>
              <option value="0">Off (Opt-Out)</option>
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="9">9 Months</option>
              <option value="12">12 Months</option>
            </select>
            <button onClick={(e) => { e.preventDefault(); setLogs([{ text: "📅 Service scheduled.", user: "demo_user", time: "Just now" }, ...logs]); }} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #ffffff", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "#ffffff", color: "#1c1c1e" }}>Schedule Service</button>
          </div>
          <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '150px' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '8px', paddingRight: '2px' }}>
              <div style={{ position: 'relative', paddingLeft: '12px', borderLeft: '2px solid #3a3a3c', marginLeft: '4px' }}>
                {logs.map((logEntry, index) => {
                  const nodeColor = getTimelineMarkerColor(logEntry.text);
                  return (
                    <div key={index} style={{ position: 'relative', paddingBottom: index !== logs.length - 1 ? '12px' : '2px', color: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nodeColor, border: '2px solid #121212', zIndex: 2 }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.3' }}>{logEntry.text}</div>
                        <div style={{ color: '#86868b', fontSize: '10px', marginTop: '1px' }}>{logEntry.user} • <span style={{ fontSize: '9px' }}>{logEntry.time}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #2c2c2e', paddingTop: '8px' }}>
              <input placeholder="Add note..." value={noteInput} onChange={(e) => setNoteInput(e.target.value)} style={{ ...inputStyle, flex: 1, backgroundColor: '#1c1c1e', padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }} />
              <button onClick={handlePostNote} style={{ ...primaryButtonStyle, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Post</button>
            </div>
          </div>
        </div>
        <div className="card-face card-back" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', backgroundColor: '#1c1c1e', borderRadius: '14px', border: '1px solid #3a3a3c', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}><span style={{ color: '#007aff' }}>⚙️</span> Diagnostics</div>
            <button onClick={() => setIsFlipped(false)} style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', cursor: 'pointer', fontSize: '11px', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>⤶ Back</button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px', color: '#86868b' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#3a3a3c' }}>Expansion Slot Ready</div>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>Interactive demo mode. Real-time BSSID anchors require account authorization.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END DEMO CARD ---

export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

  // --- 1. TRACKING CARD STATE ---
  const [trackingFlipped, setTrackingFlipped] = useState(false);
  const [watchdogActive, setWatchdogActive] = useState(true);
  const [logs, setLogs] = useState([
    { user: "kennethcurryjr@gmail.com", text: "GPS Installed", time: "7/8/2026 - 7:40 PM" },
    { user: "kennethcurryjr@gmail.com", text: "Repaired C02 Line Leak", time: "7/8/2026 - 7:40 PM" }
  ]);
  const [newLogText, setNewLogText] = useState("");

  // --- 2. TRUE KINETIC TOOLS CARD STATE ---
  const [toolsFlipped, setToolsFlipped] = useState(false);
  const [cardTabs, setCardTabs] = useState("service");
  const [toolHours, setToolHours] = useState(254);
  const [toolChecklist, setToolChecklist] = useState({ step1: false, step2: false, step3: false });
  const [toolStatus, setToolStatus] = useState("SERVICE_REQUIRED");
  

  // --- 3. KINETIC INVENTORY CARD STATE ---
  const [inventoryFlipped, setInventoryFlipped] = useState(false);
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
        .exact-card-wrapper { perspective: 1200px; width: 100%; max-width: 500px; margin: 0 auto; display: flex; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; box-sizing: border-box; border-radius: 18px; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #161618; border: 1px solid #3a3a3c; display: flex; flex-direction: column; padding: 28px; overflow-y: auto; }

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
            <Navigation size={18} /> 1. Kinetic Tracking
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Wrench size={18} /> 2. Kinetic Assets
          </button>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Boxes size={18} /> 3. Kinetic Inventory
          </button>
        </div>

        {/* TAB 1: TRACKING */}
        {activeTab === "tracking" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Live Geofence Watchdog & Recovery</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "16px", fontSize: "15px" }}>
                Go beyond basic dots on a map. Kinetic Tracking delivers continuous telemetry with instantaneous geofence breach alerts and predictive battery analytics directly inside the unified card interface.
              </p>
              <ul style={{ color: "#86868b", lineHeight: "1.8", marginBottom: "24px", fontSize: "14px", paddingLeft: "20px", margin: "0 0 24px 0" }}>
                <li style={{ marginBottom: '8px' }}><strong style={{color: '#ffffff'}}>Law Enforcement Live Share:</strong> Instantly generate secure, time-limited tracking links for rapid asset recovery.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{color: '#ffffff'}}>Watchdog Guard:</strong> Arm devices with localized digital anchors and get notified the second an asset leaves its perimeter.</li>
                <li style={{ marginBottom: '8px' }}><strong style={{color: '#ffffff'}}>PM & Service Logs:</strong> The integrated timeline doubles as a preventative maintenance tracker. Schedule service intervals, log repairs, and maintain an immutable history for every asset.</li>
                <li><strong style={{color: '#ffffff'}}>Extended Battery Life:</strong> Engineered for remote deployments with an operational lifespan of up to 5 years on a single charge.</li>
              
                <li style={{ marginBottom: '8px' }}><strong style={{color: '#ffffff'}}>Enterprise AWS Infrastructure:</strong> Built on a secure, scalable serverless AWS architecture featuring real-time DynamoDB synchronization and high-performance cloud operations.</li>
              </ul>
            </div>

            <div style={{ flex: '1 1 350px', maxWidth: '380px', width: '100%', margin: '0 auto' }}>
              <DemoKineticCard initialAsset={trackingDemoAsset} />
            </div>
          </div>
        )}

        {/* TAB 2: ASSETS */}
        {activeTab === "tools" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Kinetic Assets & Chain-of-Custody</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Complete asset records with tag numbers, serial tracking, preventative maintenance hour limits, and e-signature custody handoff workflows.
              </p>
            </div>

            <div className="exact-card-wrapper">
              <div className={`card-flipper ${toolsFlipped ? 'flipped' : ''}`}>
                
                {/* FRONT FACE (1:1 with Tools.js Matrix Card) */}
                <div className="card-face card-front" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: toolStatus === "SERVICE_REQUIRED" ? '#ef4444' : '#10b981', letterSpacing: '0.05em' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? '#ef4444' : '#10b981' }}></span>
                      {toolStatus === "SERVICE_REQUIRED" ? 'SERVICE DUE' : 'OPERATIONAL'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>[ CAT-00482 ]</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', lineHeight: '1.3', color: '#0a1b35' }}>Caterpillar Track Loader</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: '600' }}>Assigned: Field Operations</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
                    <button disabled={toolStatus === "SERVICE_REQUIRED"} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: toolStatus === "SERVICE_REQUIRED" ? '#f3f4f6' : 'transparent', color: toolStatus === "SERVICE_REQUIRED" ? '#9ca3af' : '#374151', border: toolStatus === "SERVICE_REQUIRED" ? 'none' : '1px solid #3f3f46', fontWeight: '800', fontSize: '12px', cursor: toolStatus === "SERVICE_REQUIRED" ? 'not-allowed' : 'pointer' }}>
                      {toolStatus === "SERVICE_REQUIRED" ? 'LOCKED' : 'CHECK OUT'}
                    </button>
                    <button onClick={() => setToolsFlipped(true)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', color: '#4b5563', border: '1px solid #d1d5db', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Flip ⤹
                    </button>
                  </div>
                </div>

                {/* BACK FACE (1:1 with Tools.js Flipped Card) */}
                <div className="card-face card-back" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '8px' }}>
                      <button onClick={() => setCardTabs('service')} style={{ flex: 1, padding: '6px', fontSize: '10px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: cardTabs === 'service' ? '#0052cc' : '#f3f4f6', color: cardTabs === 'service' ? '#fff' : '#6b7280', cursor: 'pointer' }}>PM</button>
                      <button onClick={() => setCardTabs('manifest')} style={{ flex: 1, padding: '6px', fontSize: '10px', fontWeight: '700', borderRadius: '6px', border: 'none', backgroundColor: cardTabs === 'manifest' ? '#0052cc' : '#f3f4f6', color: cardTabs === 'manifest' ? '#fff' : '#6b7280', cursor: 'pointer' }}>MANIFEST</button>
                    </div>
                    <button onClick={() => setToolsFlipped(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {cardTabs === 'service' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', letterSpacing: '0.05em' }}>HOURS INTERVAL</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: toolHours >= 250 ? '#ef4444' : '#0a1b35' }}>
                            {toolHours} / 250 <span style={{fontSize: '11px', color: '#6b7280'}}>HRS</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f3f4f6', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#374151', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                            <input type="checkbox" checked={toolChecklist.step1} onChange={e => setToolChecklist({...toolChecklist, step1: e.target.checked})} style={{ width: '14px', height: '14px' }} /> Verify hydraulic line pressure
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#374151', cursor: 'pointer', fontWeight: '600', margin: 0 }}>
                            <input type="checkbox" checked={toolChecklist.step2} onChange={e => setToolChecklist({...toolChecklist, step2: e.target.checked})} style={{ width: '14px', height: '14px' }} /> Inspect grease points
                          </label>
                        </div>
                        <button disabled={!toolChecklist.step1 || !toolChecklist.step2} onClick={() => { setToolHours(120); setToolStatus("OPERATIONAL"); setToolsFlipped(false); }} style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', backgroundColor: (toolChecklist.step1 && toolChecklist.step2) ? '#0a1b35' : '#9ca3af', color: '#ffffff', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>LOG SERVICE & RESET</button>
                      </div>
                    )}
                    {cardTabs === 'manifest' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151' }}>Required Items:</div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#4b5563' }}><input type="checkbox" defaultChecked /> Ignition Keys / Fob</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#4b5563' }}><input type="checkbox" defaultChecked /> Clean Interior</label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === "inventory" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#34c759", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 03</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>FIFO Rotation & Label Engines</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px", fontSize: "15px" }}>
                Manage perishable stock and multi-bin warehouse distribution with automated badges and thermal label previews.
              </p>
            </div>

            <div className="exact-card-wrapper">
              <div className={`card-flipper ${inventoryFlipped ? 'flipped' : ''}`}>
                <div className="card-face card-front" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '800' }}>Citrus Springs</span>
                    <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>🟢 PICK FIRST</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35' }}>100% Orange Juice Concentrate</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {["Cooler Bay-01", "Dry Aisle-03"].map(zone => (
                      <button key={zone} onClick={() => setSelectedZone(zone)} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: selectedZone === zone ? '1px solid #0052cc' : '1px solid #d1d5db', backgroundColor: selectedZone === zone ? 'rgba(0,82,204,0.1)' : '#f3f4f6', color: selectedZone === zone ? '#0052cc' : '#6b7280', cursor: 'pointer' }}>
                        📍 {zone}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#0a1b35', margin: '10px 0' }}>
                    {stockQty} <span style={{ fontSize: '14px', color: '#6b7280' }}>Boxes</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button onClick={() => setStockQty(stockQty + 10)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>+ Receive</button>
                    <button onClick={() => setStockQty(Math.max(0, stockQty - 10))} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#fff', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>- Ship</button>
                    <button onClick={() => setInventoryFlipped(true)} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#4b5563', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>Flip ⤹</button>
                  </div>
                </div>

                <div className="card-face card-back" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0052cc' }}>📊 Velocity & Labels</span>
                    <button onClick={() => setInventoryFlipped(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>30-DAY BURN</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35' }}>75 bx</div>
                    </div>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>90-DAY BURN</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35' }}>225 bx</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', color: '#000', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '2px dashed #d1d5db', marginTop: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>CITRUS SPRINGS — ORANGE JUICE</div>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4b5563' }}>UPC: 082123456781 • ZONE: {selectedZone}</div>
                    <button style={{ marginTop: '12px', padding: '8px', width: '100%', backgroundColor: '#0a1b35', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Print 4x6 Label</button>
                  </div>
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
          style={{ backgroundColor: "#ffffff", color: "#000000", border: "none", padding: "16px 40px", borderRadius: "30px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 30px rgba(255,255,255,0.2)", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Mail size={18} /> Request Enterprise Demo
        </button>
      </section>
    </div>
  );
}
