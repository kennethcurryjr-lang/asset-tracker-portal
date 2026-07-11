import React, { useState } from 'react';

function Tools({ user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tools, setTools] = useState([
    // Dummy data so we can see the layout immediately
    { toolId: "DEWALT-001", name: "20V Max Hammer Drill", status: "AVAILABLE", condition: "GOOD", assignedUser: null },
    { toolId: "FLIR-042", name: "Thermal Imaging Camera", status: "CHECKED_OUT", condition: "GOOD", assignedUser: "mario2diaz87" }
  ]);

  // Design Tokens (Matching your dark mode Kinetic theme)
  const containerStyle = { backgroundColor: '#121212', minHeight: '100vh', padding: '24px', color: '#ffffff', fontFamily: '"SF Pro Display", sans-serif' };
  const cardStyle = { backgroundColor: '#1c1c1e', borderRadius: '14px', padding: '24px', border: '1px solid #3a3a3c', display: 'flex', flexDirection: 'column', gap: '16px' };
  const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3a3a3c', backgroundColor: '#2c2c2e', color: '#ffffff', width: '100%', boxSizing: 'border-box' };
  const btnPrimary = { backgroundColor: '#007aff', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1 };
  const btnReturn = { backgroundColor: '#34c759', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', flex: 1 };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' }}>🔧 Kinetic Tools</h2>
      
      <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="Search by Tool ID or Name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {tools.map(tool => (
          <div key={tool.toolId} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em' }}>{tool.name}</div>
                <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>ID: {tool.toolId}</div>
              </div>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                padding: '4px 8px', 
                borderRadius: '6px', 
                backgroundColor: tool.status === 'AVAILABLE' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                color: tool.status === 'AVAILABLE' ? '#34c759' : '#ff9500'
              }}>
                {tool.status.replace('_', ' ')}
              </span>
            </div>

            {tool.status === 'CHECKED_OUT' && (
              <div style={{ backgroundColor: '#2c2c2e', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#d2d2d7', border: '1px solid #3a3a3c' }}>
                Checked out to: <strong style={{ color: '#ffffff' }}>{tool.assignedUser}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
              {tool.status === 'AVAILABLE' ? (
                <button style={btnPrimary}>Check Out</button>
              ) : (
                <button style={btnReturn}>Return to Crib</button>
              )}
              <button style={{ backgroundColor: 'transparent', color: '#ff3b30', border: '1px solid #ff3b30', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Flag Damaged
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tools;
