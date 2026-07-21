import React, { useState } from "react";
import { 
  Navigation, ShieldCheck, Cpu, WifiOff, MapPin, 
  Wrench, Boxes, ArrowRight, CheckCircle2, QrCode, 
  BarChart3, Zap, Lock
} from "lucide-react";

export default function LandingPage({ onLoginClick, onDemoClick }) {
  const [activeTab, setActiveTab] = useState("tracking");

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
            onClick={onDemoClick}
            style={{
              backgroundColor: "#ffffff", color: "#000000",
              border: "none", padding: "10px 22px",
              borderRadius: "20px", fontWeight: "700", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,255,255,0.2)"
            }}
          >
            Request Demo
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        textAlign: "center", padding: "80px 20px 60px 20px",
        maxWidth: "900px", margin: "0 auto"
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
          padding: "6px 16px", borderRadius: "20px", fontSize: "13px",
          color: "#007aff", fontWeight: "600", marginBottom: "24px"
        }}>
          <Cpu size={16} /> AWS Bedrock AI-Powered Asset Intelligence
        </div>

        <h1 style={{
          fontSize: "56px", fontWeight: "800", lineHeight: "1.1",
          letterSpacing: "-0.03em", marginBottom: "24px",
          background: "linear-gradient(180deg, #ffffff 0%, #a1a1a6 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Total Operations Command.<br />GPS, Assets, and Stock in One Deck.
        </h1>

        <p style={{
          fontSize: "18px", color: "#86868b", lineHeight: "1.6",
          marginBottom: "40px", maxWidth: "720px", margin: "0 auto 40px auto"
        }}>
          Stop juggling three different software subscriptions. Kinetic Cards™ unifies <strong>live GPS telemetry</strong>, <strong>high-value tool dispatch</strong>, and <strong>warehouse inventory rotation</strong> into an immutable, card-based interface.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={onDemoClick}
            style={{
              backgroundColor: "#007aff", color: "#ffffff", border: "none",
              padding: "16px 36px", borderRadius: "30px", fontSize: "16px",
              fontWeight: "700", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "10px", boxShadow: "0 10px 30px rgba(0, 122, 255, 0.4)"
            }}
          >
            Launch Interactive Portal <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* THREE PILLARS TABS */}
      <section style={{ maxWidth: "1200px", margin: "40px auto 100px auto", padding: "0 20px" }}>
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
            <Wrench size={18} /> 2. Kinetic Assets & Tools
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

        {/* TAB 1: TRACKING */}
        {activeTab === "tracking" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#ffcc00", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 01</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Live Geofence Watchdog & Recovery</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                Protect high-risk, remote hardware. Lock devices to precise home coordinates with live radar indicators, battery health monitoring, and instant alerts upon boundary drift.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Tokenized Share Links:</strong> Dispatch 24-hour self-terminating map links for law enforcement recovery.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Reverse Geocoding:</strong> Auto-resolves raw lat/lon to exact municipal townships.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Batch Management:</strong> Sequential re-tagging and group folder organization.</li>
              </ul>
            </div>
            <div style={{
              backgroundColor: "#121212", borderRadius: "16px", border: "1px solid #2d2d2f",
              padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontWeight: "700", fontSize: "16px" }}>LAS-01 — Mobile Node</span>
                <span style={{ backgroundColor: "#34c75920", color: "#34c759", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800" }}>● WATCHDOG ACTIVE</span>
              </div>
              <div style={{ backgroundColor: "#1c1c1e", padding: "16px", borderRadius: "10px", border: "1px solid #3a3a3c", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#86868b" }}>Current Region</div>
                <div style={{ fontSize: "18px", fontWeight: "700", marginTop: "2px" }}>Las Vegas, NV</div>
                <div style={{ fontSize: "11px", color: "#007aff", marginTop: "6px" }}>Anchor: 36.0788, -115.1917</div>
              </div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#007aff", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Generate Recovery Link</button>
            </div>
          </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === "tools" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#007aff", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 02</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Chain-of-Custody & Bedrock AI</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                Never lose a heavy tool or fleet vehicle again. Transfer field liability through required e-signatures, digital condition photos, and multi-unit PM service locks.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>AWS Bedrock Integration:</strong> AI auto-generates PM inspection steps upon asset creation.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Preventative Maintenance Board:</strong> Locks overdue tools from checkout until serviced.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Immutable Ledger:</strong> Complete audit log with automated export to AWS SES.</li>
              </ul>
            </div>
            <div style={{
              backgroundColor: "#121212", borderRadius: "16px", border: "1px solid #2d2d2f",
              padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
            }}>
              <div style={{ fontSize: "12px", color: "#ff3b30", fontWeight: "800", marginBottom: "8px" }}>⚠️ SERVICE OVERDUE — CHECKOUT LOCKED</div>
              <div style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>CAT-259D3 Compact Loader</div>
              <div style={{ fontSize: "13px", color: "#86868b", marginBottom: "16px" }}>Valued at $65,000 • 254 / 250 Hours</div>
              <div style={{ backgroundColor: "#1c1c1e", padding: "12px", borderRadius: "8px", border: "1px dashed #ff3b30", fontSize: "12px", color: "#e5e5ea", marginBottom: "16px" }}>
                🤖 <strong>AI PM Step:</strong> Verify hydraulic line pressure and repack grease points.
              </div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#34c759", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Log Service & Unlock</button>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === "inventory" && (
          <div style={{
            backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c",
            borderRadius: "24px", padding: "48px", display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#34c759", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Module 03</div>
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "16px" }}>Camera Barcode Engine & FIFO Enforcement</h2>
              <p style={{ color: "#86868b", lineHeight: "1.6", marginBottom: "24px" }}>
                High-speed warehouse inventory rotation. Features rapid-fire camera barcode scanning, multi-zone bin tracking, and automated FIFO warnings.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: 0, listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>"PICK FIRST" Indicators:</strong> Automatically flags oldest batches to prevent stock spoilage.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Zebra Label Integration:</strong> One-click thermal barcode label printing preview.</li>
                <li style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}><CheckCircle2 color="#34c759" size={18} /> <strong>Offline Dead-Zone Queue:</strong> Caches scans locally when cell coverage drops in deep warehouses.</li>
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
              <div style={{ fontSize: "13px", color: "#86868b", marginBottom: "12px" }}>Lot: LOT-2026-01 • Exp: Oct 15, 2026</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#34c759", marginBottom: "16px" }}>420 <span style={{ fontSize: "14px", color: "#86868b" }}>Boxes in Stock</span></div>
              <button style={{ width: "100%", padding: "12px", backgroundColor: "#1c1c1e", border: "1px solid #3a3a3c", borderRadius: "8px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>𖤂 Print Zebra Label</button>
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
          onClick={onDemoClick}
          style={{
            backgroundColor: "#ffffff", color: "#000000", border: "none",
            padding: "16px 40px", borderRadius: "30px", fontSize: "16px",
            fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 30px rgba(255,255,255,0.2)"
          }}
        >
          Get Started Today
        </button>
      </section>
    </div>
  );
}
