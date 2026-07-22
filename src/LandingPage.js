import React, { useState } from "react";
import { 
  Navigation, Wrench, Boxes, ArrowRight, Zap, Mail, ChevronRight
} from "lucide-react";

// Import your actual production modules
import App from "./App"; // Or TrackerMap if separated
import Tools from "./Tools";
import Inventory from "./Inventory";

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
        textAlign: "center", padding: "70px 20px 40px 20px",
        maxWidth: "960px", margin: "0 auto"
      }}>
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
          Explore the exact full-size production modules below. Every card, table, audit ledger, and scanner engine is fully interactive.
        </p>
      </section>

      {/* LIVE MODULE SELECTOR TABS */}
      <section style={{ maxWidth: "1340px", margin: "0 auto 60px auto", padding: "0 20px" }}>
        <div style={{
          display: "flex", justifyContent: "center", gap: "12px",
          marginBottom: "32px", flexWrap: "wrap"
        }}>
          <button 
            onClick={() => setActiveTab("tracking")}
            style={{
              padding: "16px 32px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tracking" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "16px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: activeTab === "tracking" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Navigation size={20} /> 1. Kinetic Tracking View
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            style={{
              padding: "16px 32px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "tools" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "16px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: activeTab === "tools" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Wrench size={20} /> 2. Kinetic Tools View
          </button>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{
              padding: "16px 32px", borderRadius: "16px", border: "none",
              backgroundColor: activeTab === "inventory" ? "#007aff" : "#1c1c1e",
              color: "#ffffff", fontWeight: "700", fontSize: "16px",
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px",
              boxShadow: activeTab === "inventory" ? "0 8px 25px rgba(0,122,255,0.4)" : "none"
            }}
          >
            <Boxes size={20} /> 3. Kinetic Inventory View
          </button>
        </div>

        {/* FULL-SIZE CONTAINER RENDER */}
        <div style={{
          backgroundColor: "#121212", border: "2px solid #2d2d2f",
          borderRadius: "24px", padding: "16px", boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
          overflow: "hidden", minHeight: "800px"
        }}>
          {activeTab === "tracking" && (
            <div style={{ pointerEvents: "auto" }}>
              {/* Renders your full tracking application view */}
              <App />
            </div>
          )}

          {activeTab === "tools" && (
            <div style={{ pointerEvents: "auto" }}>
              <Tools user={{ attributes: { "custom:clientId": "GLOBAL_CRIB" } }} />
            </div>
          )}

          {activeTab === "inventory" && (
            <div style={{ pointerEvents: "auto" }}>
              <Inventory user={{ email: "demo@titanassets.dev", profile: { "custom:tenant_id": "GLOBAL_ADMIN" } }} />
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <section style={{ textAlign: "center", padding: "80px 20px", borderTop: "1px solid #1c1c1e" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-0.02em", marginBottom: "16px" }}>Ready for Full Production Access?</h2>
        <p style={{ color: "#86868b", fontSize: "16px", marginBottom: "32px" }}>Sign in to manage your live organization workspace.</p>
        <button 
          onClick={onLoginClick}
          style={{
            backgroundColor: "#007aff", color: "#ffffff", border: "none",
            padding: "16px 40px", borderRadius: "30px", fontSize: "16px",
            fontWeight: "800", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,122,255,0.4)",
            display: "inline-flex", alignItems: "center", gap: "8px"
          }}
        >
          Sign In to Portal <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
