import React, { useState } from "react";
import { 
  Navigation, ShieldCheck, Cpu, WifiOff, MapPin, 
  Wrench, Boxes, ArrowRight, CheckCircle2, QrCode, 
  BarChart3, Zap, Lock, Mail, Printer, FileText, AlertTriangle
} from "lucide-react";

export default function LandingPage({ onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

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
        textAlign: "center", padding: "80px 20px 60px 20px",
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
          Deploy all three integrated suites or select strictly the module your enterprise needs. Kinetic Cards™ delivers <strong>live GPS telemetry</strong>, <strong>AI-assisted tool custody</strong>, and <strong>barcode warehouse rotation</strong> inside a responsive, card-driven control plane.
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
      <section style={{ maxWidth: "1240px", margin: "40px auto 100px auto", padding: "0 20px" }}>
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
            borderRadius: "24px", padding: "44px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
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
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Reverse-Geocoding Engine:</strong> Converts raw GPS nodes into municipal locations with specialized Las Vegas township override maps.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Batch Toolbar Operations:</strong> Bulk sequence-numbering (e.g. Node-1, Node-2), group folder assignment, and soft profile factory resets.</div>
                </li>
              </ul>
            </div>
            <div style={{
              backgroundColor: "#121212", borderRadius: "16px", border: "1px solid #2d2d2f",
              padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>LAS-01 — Field Tracker</span>
                <span style={{ backgroundColor: "#34c75920", color: "#34c759", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>● WATCHDOG ACTIVE</span>
              </div>
              <div style={{ backgroundColor: "#1c1c1e", padding: "16px", borderRadius: "10px", border: "1px solid #3a3a3c", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#86868b" }}>Current Region</div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginTop: "2px" }}>Las Vegas, NV</div>
                <div style={{ fontSize: "11px", color: "#007aff", marginTop: "6px" }}>Anchor Lock: 36.0788, -115.1917</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#86868b", marginBottom: "16px" }}>
                <span>Battery: <strong style={{ color: "#34c759" }}>99%</strong> (18 mos remaining)</span>
                <span>Group: <strong>Fleet A</strong></span>
              </div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#007aff", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Generate Escalation Link</button>
            </div>
          </div>
        )}

        {/* TAB 2: KINETIC TOOLS */}
        {activeTab === "tools" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "44px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
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
                  <div><strong>Sign-and-Snap Dispatch:</strong> Requires digital touch-signatures, outbound condition photos, IP address logs, and device fingerprints for checkout.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Multi-Metric PM Kanban:</strong> Tracks Days, Miles, Hours, and Crimps/Cycles. Automatically locks overdue tools from field dispatch.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Global Audit Ledger & SES Export:</strong> Immutable record of every tool transfer with one-click email dispatch via AWS SES.</div>
                </li>
              </ul>
            </div>
            <div style={{
              backgroundColor: "#121212", borderRadius: "16px", border: "1px solid #2d2d2f",
              padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ fontSize: "12px", color: "#ff3b30", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} /> SERVICE OVERDUE — CHECKOUT LOCKED
              </div>
              <div style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>CAT-259D3 Compact Loader</div>
              <div style={{ fontSize: "13px", color: "#86868b", marginBottom: "16px" }}>Valued at $65,000 • 254 / 250 Hours</div>
              <div style={{ backgroundColor: "#1c1c1e", padding: "12px", borderRadius: "8px", border: "1px dashed #ff3b30", fontSize: "12px", color: "#e5e5ea", marginBottom: "16px" }}>
                🤖 <strong>AWS Bedrock Checklist:</strong> Verify hydraulic line pressure, check grease points, and test emergency stop.
              </div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#34c759", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Log Service & Reset Timer</button>
            </div>
          </div>
        )}

        {/* TAB 3: KINETIC INVENTORY */}
        {activeTab === "inventory" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "44px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
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
                  <div><strong>Multi-Zone Bin Allocation:</strong> Track single products split across Cooler Bays and Dry Aisles with cascading quantity deductions.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Offline Dead-Zone Queue:</strong> Caches scans locally in concrete warehouses and auto-flushes to DynamoDB when signal returns.</div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px" }}>
                  <CheckCircle2 color="#34c759" size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div><strong>Zebra Label Preview & Manager PIN:</strong> One-click 4x6 label print engine and 4-digit PIN gatekeeper for stock overrides.</div>
                </li>
              </ul>
            </div>
            <div style={{
              backgroundColor: "#121212", borderRadius: "16px", border: "1px solid #2d2d2f",
              padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>100% Orange Juice</span>
                <span style={{ backgroundColor: "#34c75930", border: "1px solid #34c759", color: "#34c759", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "900" }}>🟢 PICK FIRST</span>
              </div>
              <div style={{ fontSize: "13px", color: "#86868b", marginBottom: "8px" }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
              <div style={{ fontSize: "12px", color: "#007aff", marginBottom: "16px" }}>📍 Cooler Bay-01 (420bx)</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#34c759", marginBottom: "16px" }}>420 <span style={{ fontSize: "14px", color: "#86868b" }}>Boxes in Stock</span></div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Printer size={16} /> Print Zebra Thermal Label
              </button>
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
