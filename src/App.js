import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { QueryCommand, UpdateCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from './dynamoClient';
import { useAuth } from "react-oidc-context";

// ... [Keep your helper functions: getDistanceInKm, getLocationInfo] ...

function App() {
  const auth = useAuth();
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagInputs, setTagInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [bulkGroupInput, setBulkGroupInput] = useState("");
  const [bulkNoteInput, setBulkNoteInput] = useState("");
  const [dbError, setDbError] = useState(null); 
  const [showFilters, setShowFilters] = useState(false);
  const [activeMapModalAsset, setActiveMapModalAsset] = useState(null);
  const [sharingAsset, setSharingAsset] = useState(null);
  
  const isAdmin = auth.user?.profile?.['cognito:groups']?.includes('Admins');

  // ... [Keep all your existing logic for fetchDevices, addNote, toggleServiceMode] ...

  // UI Fix: Clear All Logs Function
  const applyBulkClearLogs = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`PERMANENTLY delete all logs for ${selectedDevices.length} devices?`)) return;
    await Promise.all(selectedDevices.map(async (id) => {
        const dev = assets.find(a => a.deviceId === id);
        if (!dev) return;
        await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId: dev.deviceId, timestamp: dev.timestamp }, UpdateExpression: "REMOVE notesList, note, noteUser, noteTime" }));
    }));
    fetchDevices();
  };

  return (
    <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header and Search Panel */}
      <header style={{ background: '#1a1a1c', padding: '20px', color: '#fff', textAlign: 'center' }}>
        <img src="/CSGroup_Logo_Main_White.webp" alt="Logo" style={{ height: '50px' }} />
      </header>

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px' }} />
            <button onClick={() => setShowFilters(!showFilters)}>Filters</button>
        </div>

        {/* Device Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredAssets.map(item => (
            <div key={item.deviceId} style={{ background: '#fff', padding: '15px', borderRadius: '10px', border: '1px solid #ccc' }}>
              <div style={{ fontWeight: 'bold' }}>{item.tag || item.deviceId}</div>
              {/* Timeline with Timestamps */}
              <div style={{ height: '100px', overflowY: 'scroll', border: '1px solid #eee', margin: '10px 0' }}>
                {(item.deviceNotes || []).map((log, i) => (
                  <div key={i} style={{ fontSize: '12px', padding: '4px' }}>
                    {log.text} <span style={{ color: '#888' }}>• {log.time}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input placeholder="Note..." value={noteInputs[item.deviceId] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} />
                <button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId])}>Post</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Drawer */}
      {selectedDevices.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, width: '100%', background: '#fff', padding: '20px', borderTop: '2px solid #000' }}>
           <button onClick={applyBulkClearLogs} style={{ color: 'red' }}>Clear All Logs</button>
        </div>
      )}
    </div>
  );
}

export default App;
