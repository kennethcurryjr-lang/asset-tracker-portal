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
        @keyframes bluePulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.8); border-color: rgba(0, 122, 255, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 1); }
          100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 0.8); }
        }
        .checkout-pulse-btn {
          animation: yellowPulse 2s infinite ease-in-out;
        }
        .flip-pulse-btn {
          animation: bluePulse 2s infinite ease-in-out;
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
            <button 
              className="flip-pulse-btn"
              onClick={() => setIsFlipped(true)} 
              style={{ 
                padding: '10px 16px', 
                borderRadius: '8px', 
                backgroundColor: 'transparent', 
                color: '#007aff', 
                border: '1px solid #007aff', 
                fontWeight: '700', 
                fontSize: '12px', 
                cursor: 'pointer' 
              }}
            >
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



function DemoInventoryCard() {
  const [invFlipped, setInvFlipped] = React.useState(false);
  const [stockCnt, setStockCnt] = React.useState(420);
  const [selZone, setSelZone] = React.useState('Cooler Bay-01');

  return (
    <div className="card-perspective-wrapper" style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
      <style>{`
        @keyframes bluePulseInv {
          0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.8); border-color: rgba(0, 122, 255, 0.8); }
          70% { box-shadow: 0 0 0 10px rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 1); }
          100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 0.8); }
        }
        .flip-pulse-btn {
          animation: bluePulseInv 2s infinite ease-in-out !important;
        }
      `}</style>
      <div className={invFlipped ? "card-flipper flipped" : "card-flipper"}>
        
        {/* FRONT FACE */}
        <div className="card-face card-front" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: '#0a1b35', boxSizing: 'border-box' }}>
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
              <button key={zone} onClick={() => setSelZone(zone)} style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: selZone === zone ? '1px solid #0052cc' : '1px solid #d1d5db', backgroundColor: selZone === zone ? 'rgba(0,82,204,0.1)' : '#f3f4f6', color: selZone === zone ? '#0052cc' : '#6b7280', cursor: 'pointer' }}>
                📍 {zone}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0a1b35', margin: '10px 0' }}>
            {stockCnt} <span style={{ fontSize: '14px', color: '#6b7280' }}>Boxes</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button onClick={() => setStockCnt(stockCnt + 10)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>+ Receive</button>
            <button onClick={() => setStockCnt(Math.max(0, stockCnt - 10))} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0a1b35', color: '#fff', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>- Ship</button>
            <button className="flip-pulse-btn" onClick={() => setInvFlipped(true)} style={{ padding: '12px 14px', borderRadius: '8px', border: '2px solid #007aff', backgroundColor: 'transparent', color: '#007aff', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>Flip ⤹</button>
          </div>
        </div>

        {/* BACK FACE */}
        <div className="card-face card-back" style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', color: '#0a1b35', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0052cc' }}>📊 Historical Velocity</span>
            <button onClick={() => setInvFlipped(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>30-DAY BURN</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35' }}>115 bx</div>
            </div>
            <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>90-DAY BURN</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a1b35' }}>345 bx</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#f3f4f6', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700' }}>EST. RUN-OUT DATE</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>Jul 23, 2026</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <button style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #10b981', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>RCV</button>
            <button style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>SHP</button>
            <button style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #0052cc', backgroundColor: 'rgba(0,82,204,0.1)', color: '#0052cc', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>TFR</button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>🖨️ Print Label</button>
            <button style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #374151', backgroundColor: '#f3f4f6', color: '#374151', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>🔒 Edit Details</button>
          </div>
        </div>

      </div>
    </div>
  );
}




export default function LandingPage({ onLoginClick }) {
  const handleDemoClick = () => {
    window.location.href = "mailto:sale@titanassets.dev?subject=Kinetic%20Cards%20Enterprise%20Demo";
  };

  return (
    <div style={{ 
      backgroundColor: "#050508", 
      color: "#ffffff", 
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif', 
      minHeight: "100vh", 
      overflowX: "hidden",
      position: "relative"
    }}>
      
      {/* 1. AMBIENT GLOWING ORBS (The Digital Panda Signature) */}
      <div style={{ position: 'fixed', top: '-15%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, rgba(0,0,0,0) 60%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', top: '30%', right: '-15%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(0,0,0,0) 60%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-20%', left: '10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(52, 199, 89, 0.08) 0%, rgba(0,0,0,0) 60%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* 2. FLOATING GLASS NAVIGATION PILL */}
      <nav style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '100px', zIndex: 100, boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ fontWeight: "900", fontSize: "22px", letterSpacing: "0.5px", display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={22} color="#a87ffb" />
          <span>KINETIC<span style={{ color: "#a87ffb" }}>CARDS</span></span>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: 'center' }}>
          <button onClick={onLoginClick} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '15px', letterSpacing: '0.5px' }}>Sign In</button>
          <button onClick={handleDemoClick} style={{ background: '#ffffff', color: '#000000', border: 'none', padding: '12px 28px', borderRadius: '100px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}>Let's Talk</button>
        </div>
      </nav>

      {/* 3. MASSIVE IMMERSIVE HERO */}
      <section style={{ position: 'relative', zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 5vw" }}>
        <div style={{ padding: '10px 24px', background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.25)', borderRadius: '100px', color: '#d4b3ff', fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '40px', boxShadow: '0 0 30px rgba(138,43,226,0.15)' }}>
          Living. Breathing. Operations.
        </div>
        <h1 style={{ fontSize: "clamp(60px, 10vw, 130px)", fontWeight: "900", lineHeight: "1", letterSpacing: "-0.04em", margin: "0 0 32px 0", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          Total visibility.<br/>
          <span style={{ background: 'linear-gradient(135deg, #a87ffb, #007aff, #00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zero blind spots.</span>
        </h1>
        <p style={{ fontSize: "clamp(18px, 2.5vw, 26px)", maxWidth: "800px", color: "#a1a1a6", fontWeight: "500", lineHeight: "1.5", margin: "0 0 60px 0" }}>
          We design for humans. Track equipment, manage dynamic stock, and schedule preventative maintenance through seamless digital experiences.
        </p>
      </section>

      {/* 4. SCROLLING STORY SECTIONS (FROSTED GLASS PANELS) */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '150px', padding: '0 20px' }}>
        
        {/* MODULE 01: TRACKING */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center', background: 'rgba(20, 20, 25, 0.4)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderRadius: '48px', padding: '80px 60px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ flex: '1 1 400px' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#007aff', marginBottom: '24px' }}>
               <Navigation size={18} /> 01 / TRACKING
             </div>
             <h2 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.02em", marginBottom: "24px" }}>Watchdog Guard</h2>
             <p style={{ fontSize: '20px', color: '#888', lineHeight: '1.6', fontWeight: '500' }}>
               Continuous telemetry with instantaneous geofence breach alerts. Arm devices with localized digital anchors and monitor predictive battery analytics in real-time.
             </p>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
             <DemoKineticCard />
          </div>
        </div>

        {/* MODULE 02: ASSETS (Reversed Layout) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center', flexDirection: 'row-reverse', background: 'rgba(20, 20, 25, 0.4)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderRadius: '48px', padding: '80px 60px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ flex: '1 1 400px' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#ffcc00', marginBottom: '24px' }}>
               <Wrench size={18} /> 02 / ASSETS
             </div>
             <h2 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.02em", marginBottom: "24px" }}>Chain of Custody</h2>
             <p style={{ fontSize: '20px', color: '#888', lineHeight: '1.6', fontWeight: '500' }}>
               Automated PM checklists and immutable digital handoffs. Lock overdue tools from field checkout until certified maintenance is logged.
             </p>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
             <DemoAssetCard />
          </div>
        </div>

        {/* MODULE 03: INVENTORY */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center', background: 'rgba(20, 20, 25, 0.4)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderRadius: '48px', padding: '80px 60px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)', marginBottom: '80px' }}>
          <div style={{ flex: '1 1 400px' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', letterSpacing: '2px', color: '#34c759', marginBottom: '24px' }}>
               <Boxes size={18} /> 03 / INVENTORY
             </div>
             <h2 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-0.02em", marginBottom: "24px" }}>Smart Rotation</h2>
             <p style={{ fontSize: '20px', color: '#888', lineHeight: '1.6', fontWeight: '500' }}>
               Multi-bin warehouse distribution with automated rotation badges, thermal label printing, and offline scanning capabilities.
             </p>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
             <DemoInventoryCard />
          </div>
        </div>

      </div>
    </div>
  );
}
