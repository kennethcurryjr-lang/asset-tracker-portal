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

      
      {/* COMPREHENSIVE MODULES */}
      <section style={{ padding: '0 48px', maxWidth: '1200px', margin: '0 auto 120px auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* MODULE 1: TRACKING */}
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crosshair size={28} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '4px' }}>MODULE 01</div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: 0 }}>Kinetic Tracking & Telemetry</h2>
            </div>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '16px', marginBottom: '40px', maxWidth: '800px' }}>
            Continuous live telemetry with predictive analytics. Engineered for remote deployments with multi-carrier cellular fallback and localized geofencing.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Live Watchdog Anchors</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Arm devices with localized digital perimeters. Instant wake-and-broadcast if an asset breaches the geofence.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Law Enforcement Live Share</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Instantly generate secure, time-limited tracking links for rapid asset recovery coordination.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Predictive Battery Diagnostics</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Machine learning models analyze ping frequency and signal strength to forecast exact battery depletion dates.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Cellular Triangulation (LBS)</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Fallback location tracking using cell tower triangulation when GPS satellites are obscured.</p>
            </div>
          </div>
        </div>

        {/* MODULE 2: ASSETS */}
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '4px' }}>MODULE 02</div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: 0 }}>Chain of Custody & Assets</h2>
            </div>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '16px', marginBottom: '40px', maxWidth: '800px' }}>
            Complete high-value equipment management. Combines AI-generated servicing protocols with immutable digital handoffs and field liability tracking.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>E-Signature Manifests</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Require technicians to draw signatures and verify custom condition manifests before tool dispatch.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>AI-Generated PM Checklists</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>AWS Bedrock automatically builds custom preventative maintenance checklists based on asset make and model.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Maintenance Hard-Locks</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Automatically lock overdue tools from checkout until certified service is logged and timers are reset.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Immutable Master Ledger</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Audit-ready history of all checkouts, returns, repairs, and financial valuations across the entire fleet.</p>
            </div>
          </div>
        </div>

        {/* MODULE 3: INVENTORY */}
        <div className="glass-panel" style={{ padding: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={28} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '4px' }}>MODULE 03</div>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: 0 }}>Velocity Inventory Engine</h2>
            </div>
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '16px', marginBottom: '40px', maxWidth: '800px' }}>
            Comprehensive perishable stock management. Automated rotation badges, thermal label printing, and multi-bin warehouse distribution.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Smart FIFO Rotation</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Flashing badges automatically highlight the oldest valid lot to eliminate waste and prevent inventory trapping.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Offline "Dead Zone" Sync</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Queue barcode scans locally in low-connectivity zones and automatically flush payloads to AWS upon reconnect.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Thermal Label Generation</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Print-ready 4x6 Zebra thermal label previews alongside rapid-fire camera barcode scanning.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Automated PO Compliance</h4>
              <p style={{ color: '#71717a', fontSize: '14px' }}>Route one-click PO requests to vendor emails via AWS SES and enforce hard compliance stops on expired stock.</p>
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
