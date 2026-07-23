import React from "react";
import { 
  Crosshair, ShieldCheck, Layers, 
  Activity, Cpu, Battery, 
  ArrowRight, MapPin, CheckCircle2
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  const handleDemoClick = () => {
    window.location.href = "mailto:sale@titanassets.dev?subject=Kinetic%20Cards%20Enterprise";
  };

  return (
    <div style={{ 
      backgroundColor: "#09090b", // Deep industrial matte black
      backgroundImage: "radial-gradient(circle at 50% 0%, #1a1a24 0%, transparent 70%)",
      color: "#ededed", 
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      minHeight: "100vh", 
      overflowX: "hidden",
      lineHeight: "1.5"
    }}>
      <style>{`
        .glass-panel {
          background: rgba(24, 24, 27, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          backdrop-filter: blur(12px);
          transition: border-color 0.3s ease;
        }
        .glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .mono-text {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          letter-spacing: -0.02em;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .status-dot {
          width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;
          animation: pulse-ring 2s infinite;
        }
      `}</style>

      {/* TOP NAVIGATION */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#ededed', color: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
            <Layers size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>KINETIC CARDS</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button onClick={onLoginClick} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>System Login</button>
          <button onClick={handleDemoClick} style={{ background: '#ededed', color: '#09090b', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Deploy Now <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={{ padding: '120px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)', color: '#10b981', borderRadius: '4px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '32px', textTransform: 'uppercase' }}>
          <div className="status-dot"></div> AWS IoT Core Integration Active
        </div>
        <h1 style={{ fontSize: 'clamp(48px, 7vw, 88px)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-0.03em', margin: '0 0 24px 0', color: '#ffffff' }}>
          Hardware-level precision.<br />
          <span style={{ color: '#71717a' }}>Enterprise-scale operations.</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#a1a1aa', maxWidth: '640px', fontWeight: '400', margin: '0 0 48px 0' }}>
          Kinetic is the unified command center for physical operations. Track high-value equipment, enforce chain-of-custody, and automate inventory velocity in a single platform.
        </p>
      </header>

      {/* CORE MODULES GRID */}
      <section style={{ padding: '0 48px', maxWidth: '1400px', margin: '0 auto 120px auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* MODULE 1: TRACKING */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Crosshair size={24} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Watchdog Tracking</h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '32px', flex: 1 }}>
              Arm localized digital anchors. If an asset breaches the geofence perimeter, the hardware instantly wakes from deep sleep to broadcast continuous LBS/GPS telemetry.
            </p>
            {/* Minimal Data Viz */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#71717a' }}>
                <span className="mono-text">LAT: 36.0788° N</span>
                <span className="mono-text">LON: 115.1916° W</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
                <MapPin size={14} /> LIVE GEOFENCE ACTIVE
              </div>
            </div>
          </div>

          {/* MODULE 2: ASSETS */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Chain of Custody</h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '32px', flex: 1 }}>
              Generate automated preventative maintenance checklists based on asset class. Hard-lock overdue tools from field dispatch until certified service is logged.
            </p>
            {/* Minimal Data Viz */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#d4d4d8' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Hydraulic pressure tested
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#d4d4d8' }}>
                  <CheckCircle2 size={16} color="#10b981" /> Return filter replaced
                </div>
              </div>
            </div>
          </div>

          {/* MODULE 3: INVENTORY */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Velocity Inventory</h3>
            <p style={{ color: '#a1a1aa', fontSize: '15px', marginBottom: '32px', flex: 1 }}>
              Execute strict FIFO rotation with automated batch tracking. Queue barcode scans offline in warehouse dead-zones and auto-flush to AWS upon reconnection.
            </p>
            {/* Minimal Data Viz */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
                <span>Bin Capacity (Zone A)</span>
                <span className="mono-text">84%</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '84%', height: '100%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* TECHNICAL SPECS (Hardware & Architecture) */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#000000', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <Activity size={24} color="#71717a" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Serverless Architecture</h4>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6' }}>Built entirely on AWS Lambda and DynamoDB for infinite horizontal scaling and sub-second query resolution across millions of active nodes.</p>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <Cpu size={24} color="#71717a" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>OTA Firmware Engine</h4>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6' }}>Deploy customized modem AT-command logic, adjust heartbeat intervals, and patch vulnerabilities over-the-air without field technician dispatch.</p>
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <Battery size={24} color="#71717a" style={{ marginBottom: '16px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>5-Year Deployment Cycle</h4>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6' }}>Aggressive sleep-state protocols and cellular triangulation fallbacks ensure operational hardware lifespans of up to 5 years on a single charge.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '100px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>Ready for deployment.</h2>
        <button onClick={handleDemoClick} style={{ background: '#ededed', color: '#09090b', border: 'none', padding: '16px 32px', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
          Request Architecture Demo
        </button>
      </footer>
    </div>
  );
}
