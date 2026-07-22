import React, { useState } from "react";
import { 
  Navigation, Cpu, 
  Wrench, Boxes,  
  Zap, Mail
} from "lucide-react";

// --- MOCK DATA FOR TRACKING DEMO ---
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

// --- MODULE 01: DEMO KINETIC TRACKING CARD ---
function DemoKineticCard() {
  const [asset, setAsset] = React.useState({
    deviceId: "862605278000314",
    tag: "LAS-9",
    city: "Las Vegas",
    group: "LV-DEMO-81",
    latitude: 36.078802,
    longitude: -115.191695,
    batteryLevel: 99,
    estTimeRemaining: "18 mos",
    lastSeen: "Jul 21 12:30 PM",
    isServiceMode: true,
    homeLat: 36.0787,
    homeLon: -115.1915,
    notesList: [
      { text: "replaced strawberry bib", user: "kennethcurryjr", time: "7/7/2026 - 9:28 PM" },
      { text: "Installed Gps", user: "kennethcurryjr", time: "7/8/2026 - 7:48 PM" },
      { text: "📍 Home Anchor Set: 36.0787, -115.1915", user: "kennethcurryjr", time: "7/8/2026 - 7:51 PM" },
      { text: "🛡️ Watchdog Disabled (Service Mode Engaged by kennethcurryjr)", user: "kennethcurryjr", time: "7/8/2026 - 7:52 PM" }
    ]
  });

  const [tagInput, setTagInput] = React.useState("");
  const [noteInput, setNoteInput] = React.useState("");
  const [serviceOption, setServiceOption] = React.useState("0");

  const toggleWatchdog = () => {
    const newMode = !asset.isServiceMode;
    const logMsg = newMode 
      ? "🛡️ Watchdog Disabled (Service Mode Engaged by demo_user)" 
      : "Watchdog Activated (Monitoring Live Position by demo_user)";
    
    setAsset(prev => ({
      ...prev,
      isServiceMode: newMode,
      notesList: [{ text: logMsg, user: "demo_user", time: "Just now" }, ...prev.notesList]
    }));
  };

  const handleSaveName = () => {
    if (!tagInput.trim()) return;
    setAsset(prev => ({ ...prev, tag: tagInput.trim() }));
    setTagInput("");
  };

  const handlePostNote = () => {
    if (!noteInput.trim()) return;
    setAsset(prev => ({
      ...prev,
      notesList: [{ text: noteInput.trim(), user: "demo_user", time: "Just now" }, ...prev.notesList]
    }));
    setNoteInput("");
  };

  const toggleHome = () => {
    if (asset.homeLat) {
      setAsset(prev => ({
        ...prev,
        homeLat: null,
        homeLon: null,
        notesList: [{ text: "🚫 Home Anchor Cleared", user: "demo_user", time: "Just now" }, ...prev.notesList]
      }));
    } else {
      setAsset(prev => ({
        ...prev,
        homeLat: asset.latitude,
        homeLon: asset.longitude,
        notesList: [{ text: "📍 Home Anchor Set: " + asset.latitude.toFixed(4) + ", " + asset.longitude.toFixed(4), user: "demo_user", time: "Just now" }, ...prev.notesList]
      }));
    }
  };

  return (
    <div style={{
      backgroundColor: '#1c1c1e',
      borderRadius: '14px',
      padding: '16px',
      border: '1px solid #3a3a3c',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      width: '100%',
      maxWidth: '480px',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#ffffff' }} />
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
                {asset.tag}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff3b30', borderRadius: '4px' }}>
                OFFLINE
              </span>
            </div>

            <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.4' }}>
              <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '13px' }}>{asset.city}</div>
              <div style={{ fontSize: '10px', color: '#86868b', marginTop: '2px' }}>Last seen: {asset.lastSeen}</div>
              <div style={{ fontSize: '11px' }}>ID: {asset.deviceId}</div>
              <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{asset.group}</div>
              {asset.homeLat && (
                <div style={{ fontSize: '10px', color: '#007aff', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#007aff' }}></span>
                  Anchor: {Number(asset.homeLat).toFixed(4)}, {Number(asset.homeLon).toFixed(4)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', backgroundColor: '#121212', padding: '4px 8px', borderRadius: '6px', border: '1px solid #2c2c2e' }}>
            <div style={{ width: '40px', height: '4px', backgroundColor: '#2c2c2e', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: asset.batteryLevel + "%", height: '100%', backgroundColor: '#34c759' }} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#34c759' }}>{asset.batteryLevel}%</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#86868b', borderLeft: '1px solid #3a3a3c', paddingLeft: '8px', marginLeft: '2px' }}>{asset.estTimeRemaining}</span>
          </div>
        </div>

        <div style={{ flex: 0.9, position: 'relative', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3a3a3c', backgroundColor: '#121212' }}>
          <iframe 
            title="demo-map"
            frameBorder="0" 
            scrolling="no" 
            src="https://www.openstreetmap.org/export/embed.html?bbox=-115.211695%2C36.058802%2C-115.171695%2C36.098802&layer=mapnik&marker=36.078802%2C-115.191695"
            style={{ pointerEvents: 'none', position: 'absolute', top: '-60px', left: '-60px', width: 'calc(100% + 120px)', height: 'calc(100% + 120px)', border: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        <input 
          placeholder="Rename Asset..." 
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#121212', border: '1px solid #3a3a3c', color: '#ffffff', outline: 'none' }}
        />
        <button onClick={handleSaveName} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', color: '#ffffff', border: '1px solid #ffffff', backgroundColor: '#007aff', fontWeight: '600', cursor: 'pointer' }}>Save</button>
        <button style={{ background: '#121212', border: '1px solid #3a3a3c', cursor: 'pointer', fontSize: '11px', color: '#ffffff', padding: '6px 10px', borderRadius: '6px', fontWeight: '600' }}>Flip ⤹</button>
      </div>

      <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
        <button style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '8px', flex: 1, color: '#1c1c1e', backgroundColor: '#ffffff', border: '1px solid #ffffff', fontWeight: '700', cursor: 'pointer' }}>Share</button>
        
        <button onClick={toggleWatchdog} style={{ fontSize: '11px', borderRadius: '8px', flex: 1.5, padding: '6px 10px', backgroundColor: asset.isServiceMode ? 'transparent' : '#1d1d1f', color: '#ffffff', border: '1px solid #ffffff', cursor: 'pointer', fontWeight: '600' }}>
          {!asset.isServiceMode && <span className="live-pulse-dot" style={{ marginRight: '4px' }}></span>}
          {asset.isServiceMode ? 'Watchdog off' : 'Watchdog active'}
        </button>

        <button onClick={toggleHome} style={{ fontSize: '11px', borderRadius: '8px', flex: 1.2, padding: '6px 10px', backgroundColor: asset.homeLat ? 'transparent' : '#1d1d1f', color: '#ffffff', border: '1px solid #ffffff', cursor: 'pointer', fontWeight: '600' }}>
          {asset.homeLat ? "Clear Home" : "Set Home"}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', width: '100%', alignItems: 'center', backgroundColor: '#121212', padding: '8px', borderRadius: '8px', border: '1px solid #2c2c2e', boxSizing: 'border-box' }}>
        <select value={serviceOption} onChange={(e) => setServiceOption(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #3a3a3c', fontSize: '11px', backgroundColor: '#1c1c1e', color: '#ffffff', flex: 1, outline: 'none' }}>
          <option value="0">Off (Opt-Out)</option>
          <option value="1">1 Month</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="9">9 Months</option>
          <option value="12">12 Months</option>
        </select>
        <button style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #ffffff', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff', color: '#1c1c1e' }}>Schedule Service</button>
      </div>

      <div style={{ padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
        <div style={{ display: 'block', height: '110px', overflowY: 'auto', marginBottom: '8px', paddingRight: '2px' }}>
          <div style={{ position: 'relative', paddingLeft: '12px', borderLeft: '2px solid #3a3a3c', marginLeft: '4px' }}>
            {asset.notesList.map((logEntry, index) => (
              <div key={index} style={{ position: 'relative', paddingBottom: index !== asset.notesList.length - 1 ? '12px' : '2px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9500', border: '2px solid #121212', zIndex: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.3', wordBreak: 'break-word' }}>{logEntry.text}</div>
                  <div style={{ color: '#86868b', fontSize: '10px', marginTop: '1px' }}>
                    {logEntry.user} • <span style={{ fontSize: '9px', color: '#86868b' }}>{logEntry.time}</span>
                  </div>
                </div>
                <button style={{ color: '#ff3b30', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(255, 59, 48, 0.05)', borderRadius: '4px' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #2c2c2e', paddingTop: '8px' }}>
          <input 
            placeholder="Add note..." 
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePostNote()}
            style={{ flex: 1, backgroundColor: '#1c1c1e', padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #3a3a3c', color: '#ffffff', outline: 'none' }} 
          />
          <button onClick={handlePostNote} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#ffffff', color: '#121212', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Post</button>
        </div>
      </div>
    </div>
  );
}

// --- MODULE 02: DEMO KINETIC ASSET CARD (1:1 PM HUB) ---

// --- MAIN LANDING PAGE COMPONENT ---







function DemoAssetCard() {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('service');
  const [hours, setHours] = React.useState(254);
  const [checklist, setChecklist] = React.useState([
    { id: 1, text: "Drain water separator & replace fuel filters", checked: false },
    { id: 2, text: "Inspect hydraulic return filter & pull S·O·S fluid", checked: false },
    { id: 3, text: "Check and adjust track tension limits", checked: false }
  ]);

  const toggleStep = (id) => {
    setChecklist(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const handleLogService = () => {
    setHours(0);
    setChecklist(prev => prev.map(s => ({ ...s, checked: false })));
    setIsFlipped(false);
  };

  const allChecked = checklist.length > 0 && checklist.every(s => s.checked);

  return (
    <div className="card-perspective-wrapper" style={{ width: '100%', maxWidth: '380px', height: '340px', margin: '0 auto' }}>
      <style>{`
        @keyframes yellowPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(255, 204, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 204, 0, 0); }
        }
        .checkout-pulse-btn {
          animation: yellowPulse 2s infinite ease-in-out;
        }
      `}</style>
      <div className={isFlipped ? "card-flipper flipped" : "card-flipper"} style={{ height: '100%' }}>
        
        {/* FRONT FACE */}
        <div className="card-face card-front" style={{ 
          height: '100%',
          padding: '20px', 
          border: '1px solid #d1d5db', 
          borderRadius: '16px', 
          backgroundColor: '#ffffff',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          display: 'flex', 
          flexDirection: 'column', 
          justify: 'space-between',
          color: '#0a1b35',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              backgroundColor: 'rgba(16,185,129,0.15)', 
              color: '#10b981', 
              letterSpacing: '0.05em' 
            }}>
              <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', marginRight: '6px', backgroundColor: '#10b981' }}></span>
              IN-STOCK
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>[ CAT-00482 ]</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.2', color: '#0a1b35' }}>Caterpillar Track Loader</div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              Heavy Machinery • <strong style={{ color: '#0052cc' }}>$65,000</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#86868b' }}>Assigned: Field Operations</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="checkout-pulse-btn"
              onClick={() => setIsFlipped(true)}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '8px', 
                backgroundColor: '#ffcc00', 
                color: '#0a1b35', 
                border: 'none', 
                fontWeight: '800', 
                fontSize: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              CHECK OUT
            </button>
            <button onClick={() => setIsFlipped(true)} style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#0052cc', border: '1px solid #0052cc', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
              Flip ⤹
            </button>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="card-face card-back" style={{ 
          height: '100%',
          padding: '16px', 
          borderRadius: '16px', 
          border: '1px solid #d1d5db', 
          backgroundColor: '#ffffff', 
          color: '#0a1b35', 
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '8px' }}>
              <button className={activeTab === 'service' ? 'tab-btn tab-active' : 'tab-btn tab-inactive'} onClick={() => setActiveTab('service')}>PM</button>
              <button className={activeTab === 'manifest' ? 'tab-btn tab-active' : 'tab-btn tab-inactive'} onClick={() => setActiveTab('manifest')}>MANIFEST</button>
              <button className={activeTab === 'qr' ? 'tab-btn tab-active' : 'tab-btn tab-inactive'} onClick={() => setActiveTab('qr')}>QR</button>
              <button className={activeTab === 'specs' ? 'tab-btn tab-active' : 'tab-btn tab-inactive'} onClick={() => setActiveTab('specs')}>INFO</button>
            </div>
            <button onClick={() => setIsFlipped(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>✕</button>
          </div>

          {activeTab === 'service' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '800' }}>HOURS INTERVAL</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: hours >= 250 ? '#dc2626' : '#0a1b35' }}>
                  {hours} / 250 <span style={{ fontSize: '10px', color: '#6b7280' }}>HRS</span>
                </span>
              </div>

              <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '8px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {checklist.map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleStep(item.id)} style={{ width: '13px', height: '13px', marginTop: '1px', accentColor: '#0052cc' }} />
                    <span style={{ textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.6 : 1 }}>{item.text}</span>
                  </label>
                ))}
              </div>

              <button 
                disabled={!allChecked}
                onClick={handleLogService}
                style={{ 
                  marginTop: 'auto', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  backgroundColor: allChecked ? '#0a1b35' : '#9ca3af', 
                  color: '#ffffff', 
                  fontWeight: '800', 
                  fontSize: '12px', 
                  cursor: allChecked ? 'pointer' : 'not-allowed'
                }}
              >
                LOG SERVICE & RESET
              </button>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0a1b35' }}>Custody Manifest</div>
              <label style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#4b5563' }}><input type="checkbox" defaultChecked /> Ignition Keys / Fob</label>
              <label style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#4b5563' }}><input type="checkbox" defaultChecked /> Registration & Insurance Card</label>
              <label style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#4b5563' }}><input type="checkbox" defaultChecked /> Clean Interior / Exterior</label>
            </div>
          )}

          {activeTab === 'qr' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=CAT-00482" alt="Asset QR" style={{ width: '80px', height: '80px', margin: '0 auto', display: 'block' }} />
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', fontWeight: '700' }}>SCAN FOR CUSTODY HANDOFF</div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0' }}>
              <div><strong style={{ color: '#0a1b35' }}>Value:</strong> $65,000</div>
              <div><strong style={{ color: '#0a1b35' }}>Category:</strong> Heavy Machinery</div>
              <div><strong style={{ color: '#0a1b35' }}>Serial:</strong> SN-9948-2026-X</div>
              <div><strong style={{ color: '#0a1b35' }}>Location:</strong> Field Operations</div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}


export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");
  const [inventoryFlipped, setInventoryFlipped] = useState(false);
  const [stockQty, setStockQty] = useState(420);
  const [selectedZone, setSelectedZone] = useState("Cooler Bay-01");

  const handleDemoClick = () => {
    window.location.href = "mailto:admin@titanassets.dev?subject=Kinetic%20Cards%20Demo%20Request&body=Hi%20Kinetic%20Team,%20I'd%20like%20to%20schedule%20a%20demo%20of%20Kinetic%20Cards.";
  };

  return (
    <div style={{ backgroundColor: "#0a0a0c", color: "#ffffff", fontFamily: '"SF Pro Display", -apple-system, sans-serif', minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        .card-perspective-wrapper { perspective: 1200px; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; box-sizing: border-box; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; }
        .tab-btn { flex: 1; padding: 6px; font-size: 11px; font-weight: 800; border-radius: 6px; border: none; cursor: pointer; }
        .tab-active { background-color: #0052cc; color: #ffffff; }
        .tab-inactive { background-color: #f3f4f6; color: #6b7280; }
        @keyframes radar-pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-dot { width: 8px; height: 8px; background-color: #34c759; border-radius: 50%; display: inline-block; animation: radar-pulse-glow 2s infinite ease-in-out; }
      `}</style>

      {/* NAVIGATION HEADER */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: "1280px", margin: "0 auto", borderBottom: "1px solid #1c1c1e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "linear-gradient(135deg, #0052cc 0%, #007aff 100%)", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color="#ffffff" />
          </div>
          <span style={{ fontWeight: "900", fontSize: "22px", letterSpacing: "0.5px" }}>
            KINETIC<span style={{ color: "#ffcc00" }}>CARDS™</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button onClick={onLoginClick} style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid #3a3a3c", padding: "10px 20px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Sign In</button>
          <button onClick={handleDemoClick} style={{ backgroundColor: "#ffffff", color: "#000000", border: "none", padding: "10px 22px", borderRadius: "20px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
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
          <button onClick={() => setActiveTab("tracking")} style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "tracking" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
            <Navigation size={18} /> 1. Kinetic Tracking
          </button>
          <button onClick={() => setActiveTab("tools")} style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
            <Wrench size={18} /> 2. Kinetic Assets
          </button>
          <button onClick={() => setActiveTab("inventory")} style={{ padding: "16px 28px", borderRadius: "16px", border: "none", backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e", color: "#ffffff", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
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
              <DemoKineticCard />
            </div>
          </div>
        )}

        {/* TAB 2: ASSETS */}
        {activeTab === "tools" && (
          <div style={{ backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "24px", padding: "48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "34px", fontWeight: "800", marginBottom: "16px", lineHeight: "1.2" }}>Kinetic Assets & Chain-of-Custody</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "16px", fontSize: "15px" }}>
                Complete high-value equipment management and field liability tracking. Kinetic Assets combines AI-generated servicing protocols with immutable digital handoffs.
              </p>
              <ul style={{ color: "#86868b", lineHeight: "1.8", marginBottom: "24px", fontSize: "14px", paddingLeft: "20px", margin: "0 0 24px 0" }}>
                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#ffffff" }}>Chain-of-Custody E-Signatures:</strong> Require field technicians to draw e-signatures, verify custom manifests, and upload condition photos prior to tool dispatch.</li>
                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#ffffff" }}>AI-Generated PM Checklists:</strong> AWS Bedrock automatically builds custom preventative maintenance checklists based on asset make, model, and category.</li>
                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#ffffff" }}>Preventative Maintenance Locks:</strong> Automatically lock overdue tools from field checkout until certified maintenance is logged and timers are reset.</li>
                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#ffffff" }}>Instant QR Code Scanning:</strong> Print and scan unique asset QR codes for rapid touchless custody transfers and inventory audits.</li>
                <li style={{ marginBottom: "8px" }}><strong style={{ color: "#ffffff" }}>Immutable Master Ledger:</strong> Maintain a complete, audit-ready history of all checkouts, returns, repairs, and financial valuations across the entire fleet.</li>
              </ul>
            </div>

            <div style={{ flex: "1 1 350px", maxWidth: "380px", width: "100%", margin: "0 auto" }}>
              <DemoAssetCard />
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

            <div className="card-perspective-wrapper" style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
              <div className={inventoryFlipped ? "card-flipper flipped" : "card-flipper"}>
                <div className="card-face card-front" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
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

                <div className="card-face card-back" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
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
        <button onClick={handleDemoClick} style={{ backgroundColor: "#ffffff", color: "#000000", border: "none", padding: "16px 40px", borderRadius: "30px", fontSize: "16px", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Mail size={18} /> Request Enterprise Demo
        </button>
      </section>
    </div>
  );
}
