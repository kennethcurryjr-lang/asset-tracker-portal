import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { QueryCommand, UpdateCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from './dynamoClient';
import { useAuth } from "react-oidc-context";

// Helper: Distance calculation (Earth Radius 6371km)
function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Location Name
async function getLocationInfo(lat, lon) {
  if (!lat || !lon) return { zip: "N/A", city: "Unknown" };
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = await response.json();
    return { zip: data.postcode || "Unknown", city: data.city || data.locality || "Unknown" };
  } catch (err) { return { zip: "Error", city: "Error" }; }
}

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
  
  // Category Multi-Select Active Token States
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [activeGroupFilter, setActiveGroupFilter] = useState("all"); 
  const [namingFilter, setNamingFilter] = useState("all"); 
  
  // Dynamic Filter Expansion Drawer State
  const [showFilters, setShowFilters] = useState(false);

  // Micro-Mapping Active Interactive Modal Viewport State
  const [activeMapModalAsset, setActiveMapModalAsset] = useState(null);

  const [sharingAsset, setSharingAsset] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareDuration, setShareDuration] = useState("24");

  // Unauthenticated Public Sharing Viewport State Matrix
  const [sharedAsset, setSharedAsset] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [isShareLoading, setIsShareLoading] = useState(false);

  // Parse token vectors from query context string
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const shareTokenParam = useMemo(() => queryParams.get('token'), [queryParams]);
  const isSharePage = useMemo(() => window.location.pathname.includes('/share') || !!shareTokenParam, [shareTokenParam]);

  const isAdmin = auth.user?.profile?.['cognito:groups']?.includes('Admins');

  // Design Tokens: High-Contrast Monochromatic System
  const appContainerStyle = { backgroundColor: '#f5f5f7', color: '#1d1d1f', minHeight: '100vh', fontFamily: '"SF Pro Display", "SF Pro Text", "Helvetica Neue", "Inter", sans-serif', paddingBottom: selectedDevices.length > 0 ? '140px' : '60px', fontSize: '15px', transition: 'padding-bottom 0.3s ease' };
  
  const headerStyle = { 
    width: '100%',
    boxSizing: 'border-box',
    padding: '24px 24px', 
    background: 'linear-gradient(180deg, #0c0c0d 0%, #1a1a1c 100%)', 
    borderBottom: '1px solid #2d2d2f', 
    boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.02), 0 4px 30px rgba(0, 0, 0, 0.15)',
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '12px',
    position: 'relative',
    overflow: 'hidden'
  };
  
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px', border: '1px solid #d2d2d7', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' };
  const deviceCardStyle = { backgroundColor: '#e5e5ea', borderRadius: '12px', padding: '16px', border: '1px solid #d2d2d7', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' };
  const inputStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px', backgroundColor: '#ffffff', color: '#1d1d1f', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: '11px', color: '#1d1d1f', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  
  const buttonStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
  const primaryButtonStyle = { ...buttonStyle, backgroundColor: '#1d1d1f', color: '#ffffff' };
  const secondaryButtonStyle = { ...buttonStyle, backgroundColor: 'transparent', color: '#1d1d1f', border: '1px solid #1d1d1f' };

  const stickySearchCardStyle = {
    ...cardStyle,
    position: 'sticky',
    top: '12px',
    zIndex: 100,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)'
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const term = searchTerm.toLowerCase();
      const textMatches = (
        (a.deviceId || '').toLowerCase().includes(term) || 
        (a.city || '').toLowerCase().includes(term) || 
        (a.group || '').toLowerCase().includes(term) ||
        (a.tag || '').toLowerCase().includes(term)
      );
      if (!textMatches) return false;

      if (statusFilter === "offline" && !a.isOffline) return false;
      if (statusFilter === "geofence" && !a.isGeofenceViolation) return false;
      if (statusFilter === "low_battery" && !a.isLowBattery) return false;

      if (activeGroupFilter !== "all" && a.group !== activeGroupFilter) return false;

      if (namingFilter === "named" && !a.tag) return false;
      if (namingFilter === "unnamed" && !!a.tag) return false;

      return true;
    });
  }, [assets, searchTerm, statusFilter, activeGroupFilter, namingFilter]);

  const { alertCount, healthyCount } = useMemo(() => {
    const alerts = filteredAssets.filter(a => a.isOffline || a.isGeofenceViolation || a.isLowBattery).length;
    return { alertCount: alerts, healthyCount: filteredAssets.length - alerts };
  }, [filteredAssets]);

  const { inventorySuggestions, groupSuggestions, distinctGroups } = useMemo(() => {
    const invSuggestions = new Set();
    const grpSuggestions = new Set();
    const uniqueGroups = new Set();
    
    assets.forEach(a => {
      if (a.deviceId) invSuggestions.add(a.deviceId);
      if (a.tag) invSuggestions.add(a.tag);
      if (a.city && a.city !== "Unknown" && a.city !== "Locating") invSuggestions.add(a.city);
      if (a.group) {
        invSuggestions.add(a.group);
        grpSuggestions.add(a.group);
        uniqueGroups.add(a.group);
      }
    });

    return {
      inventorySuggestions: Array.from(invSuggestions),
      groupSuggestions: Array.from(grpSuggestions),
      distinctGroups: Array.from(uniqueGroups)
    };
  }, [assets]);

  useEffect(() => {
    if (!isSharePage || !shareTokenParam) return;

    async function processPublicEscalationFetch() {
      setIsShareLoading(true);
      try {
        const response = await docClient.send(new ScanCommand({
          TableName: "AssetTrackerData",
          FilterExpression: "shareToken = :tok",
          ExpressionAttributeValues: { ":tok": shareTokenParam }
        }));

        if (!response.Items || response.Items.length === 0) {
          setShareError("Invalid tracking configuration signature or resource missing.");
          return;
        }

        const activeNode = response.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (activeNode.shareExpires && Date.now() > activeNode.shareExpires) {
          setShareError("This secure tracking validation window has expired and self-terminated.");
          return;
        }

        const loc = await getLocationInfo(activeNode.latitude, activeNode.longitude);
        setSharedAsset({
          ...activeNode,
          city: loc.city,
          zip: loc.zip
        });
      } catch (err) {
        console.error("Public share payload map exception:", err);
        setShareError("Failed to resolve stable secure handshake with telemetry node.");
      } finally {
        setIsShareLoading(false);
      }
    }

    processPublicEscalationFetch();
  }, [isSharePage, shareTokenParam]);

  useEffect(() => {
    if (auth.error && (window.location.search.includes('code=') || window.location.search.includes('state='))) {
      console.warn("State mismatch detected with parameters active. Executing safety URL rewrite.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin;
    }
  }, [auth.error]);

  useEffect(() => {
    if (isSharePage) return; 
    
    const isSigningOut = localStorage.getItem('isSigningOut') === 'true';
    const hasAuthParams = window.location.search.includes('code=') || 
                          window.location.search.includes('state=') || 
                          window.location.search.includes('error=') ||
                          window.location.search.includes('session_state=');
    
    if (isSigningOut) return;

    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !hasAuthParams) {
        auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth, isSharePage]);

  const fetchDevices = useCallback(async () => {
    if (!auth.isAuthenticated) return;
    setDbError(null);
    try {
      let items = [];
      const userSub = auth.user?.profile?.sub;

      try {
        const queryResponse = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          IndexName: "clientId-index", 
          KeyConditionExpression: "clientId = :cid",
          ExpressionAttributeValues: { ":cid": userSub || "" }
        }));
        items = queryResponse.Items || [];
      } catch (queryErr) {
        console.warn("GSI Query Vector unaligned, dropping back to direct table scanner...", queryErr);
        const scanResponse = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData" }));
        items = scanResponse.Items || [];
      }

      if (items.length === 0) {
        setAssets([]);
        return;
      }
      
      const grouped = {};
      items.forEach(item => {
        if (item.deviceId) {
          if (!grouped[item.deviceId]) grouped[item.deviceId] = [];
          grouped[item.deviceId].push(item);
        }
      });

      const processed = await Promise.all(Object.keys(grouped).map(async (id) => {
        const history = grouped[id].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latest = history[0];
        const isOffline = (Date.now() - new Date(latest.timestamp).getTime()) > (24 * 60 * 60 * 1000); 
        const loc = await getLocationInfo(latest.latitude, latest.longitude);
        
        // --- Predictive Battery Analytics ---
        let estTimeRemaining = null;
        if (history.length >= 2 && latest.battery !== undefined && latest.battery !== null) {
          const prevRecord = history[1]; 
          if (prevRecord.battery !== undefined && prevRecord.battery !== null && latest.battery < prevRecord.battery) {
            const timeDiffMs = new Date(latest.timestamp).getTime() - new Date(prevRecord.timestamp).getTime();
            const drainPerMs = (prevRecord.battery - latest.battery) / timeDiffMs;
            if (drainPerMs > 0) {
              const remainingMs = latest.battery / drainPerMs;
              const hours = Math.floor(remainingMs / 3600000);
              const mins = Math.floor((remainingMs % 3600000) / 60000);
              estTimeRemaining = `Est. ${hours}h ${mins}m left`;
            }
          }
        }

        const isServiceMode = history.find(i => i.isServiceMode)?.isServiceMode || false;
        const isLowBattery = latest.battery !== undefined && Number(latest.battery) <= 20;

        let deviceNotes = [];
        history.forEach(row => {
          if (row.notesList && Array.isArray(row.notesList)) {
            const withTimestamps = row.notesList.map(n => ({ ...n, rowTimestamp: row.timestamp }));
            deviceNotes = [...deviceNotes, ...withTimestamps];
          }
          if (row.note) {
            deviceNotes.push({
              text: row.note,
              user: row.noteUser || "Unknown User",
              time: row.noteTime || "Prior Log",
              rowTimestamp: row.timestamp
            });
          }
        });

        deviceNotes.sort((a, b) => {
          const parseTimestampString = (timeStr) => {
            if (!timeStr || timeStr === "Prior Log") return 0;
            const normalized = timeStr.replace(/\s*-\s*/, ' ').trim();
            const parsedDate = new Date(normalized);
            return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
          };
          return parseTimestampString(b.time) - parseTimestampString(a.time);
        });

        return {
          ...latest,
          deviceId: id,
          deviceNotes, 
          tag: history.find(i => i.tag)?.tag || "",
          group: history.find(i => i.group)?.group || "",
          isServiceMode,
          isOffline,
          isLowBattery,
          estTimeRemaining,
          zip: loc.zip,
          city: loc.city,
          latitude: latest.latitude,
          longitude: latest.longitude,
          battery: latest.battery
        };
      }));
      setAssets(processed);
    } catch (err) { 
      console.error(err); 
      setDbError(`AWS DynamoDB Database Transaction Fault: ${err.message || err}`);
    }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => {
    if (auth.isAuthenticated) fetchDevices();
  }, [auth.isAuthenticated, fetchDevices]);

  const updateAttribute = async (deviceId, timestamp, field, value, attributeAlias) => {
    await docClient.send(new UpdateCommand({
      TableName: "AssetTrackerData",
      Key: { deviceId, timestamp },
      UpdateExpression: `set ${attributeAlias} = :val`,
      ExpressionAttributeNames: { [attributeAlias]: field },
      ExpressionAttributeValues: { ":val": value }
    }));
    fetchDevices();
  };

  const toggleServiceMode = async (deviceId, timestamp, currentState) => {
    const newState = !currentState;
    const user = auth.user?.profile?.email || "System";
    const time = `${new Date().toLocaleDateString('en-US')} - ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const logMsg = newState 
      ? `🛡️ Watchdog Disabled (Service Mode Engaged by ${user.split('@')[0]})` 
      : `📡 Watchdog Activated (Monitoring Live Position by ${user.split('@')[0]})`;
    
    try {
      await Promise.all([
          updateAttribute(deviceId, timestamp, 'isServiceMode', newState, '#sm'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeUser', user, '#lsu'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeTime', time, '#lst'),
          addNote(deviceId, timestamp, logMsg)
      ]);
      alert(newState ? "Watchdog disabled!" : "Watchdog activated!");
    } catch (err) { console.error(err); }
  };

  const addNote = async (deviceId, timestamp, noteText) => {
    if (!noteText || !noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US');
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const timestampNow = `${dateStr} - ${timeStr}`;
    const user = auth.user?.profile.email || "Unknown User";

    const newNoteObj = {
      text: noteText.trim(),
      user: user,
      time: timestampNow
    };

    try {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "SET #nl = list_append(if_not_exists(#nl, :empty_list), :new_note)",
        ExpressionAttributeNames: { "#nl": "notesList" },
        ExpressionAttributeValues: {
          ":new_note": [newNoteObj],
          ":empty_list": []
        }
      }));
      setNoteInputs(prev => ({...prev, [deviceId]: ""}));
      fetchDevices();
    } catch (err) { console.error("Database note array error:", err); }
  };

  const deleteNote = async (deviceId, targetNote) => {
    if (!isAdmin) {
      alert("Security Violation: Action cleared strictly for Administrative roles.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this log entry from the database?")) return;

    await addNote(deviceId, targetNote.rowTimestamp, `🗑️ Log entry "${targetNote.text.substring(0,15)}..." was deleted by ${auth.user?.profile?.email.split('@')[0]}`);

    try {
      const response = await docClient.send(new GetCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp: targetNote.rowTimestamp }
      }));

      if (!response.Item) {
        alert("Target record reference missing or already removed.");
        return;
      }

      const dbItem = response.Item;

      if (dbItem.notesList && Array.isArray(dbItem.notesList)) {
        const updatedList = dbItem.notesList.filter(
          n => !(n.text === targetNote.text && n.time.replace(/\s+/g, '') === targetNote.time.replace(/\s+/g, ''))
        );
        
        await docClient.send(new UpdateCommand({
          TableName: "AssetTrackerData",
          Key: { deviceId, timestamp: targetNote.rowTimestamp },
          UpdateExpression: "SET notesList = :updatedList",
          ExpressionAttributeValues: { ":updatedList": updatedList }
        }));
      }
      
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp: targetNote.rowTimestamp },
        UpdateExpression: "REMOVE note, noteUser, noteTime"
      }));

      alert("Log entry permanently expunged.");
      fetchDevices();
    } catch (err) {
      console.error("Database transaction fault:", err);
      alert("Failed to modify cluster files.");
    }
  };

  const applyBulkClearLogs = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: PERMANENTLY delete all logs for all ${selectedDevices.length} selected devices?`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId === id);
            if (!dev) return;
            await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId: dev.deviceId, timestamp: dev.timestamp }, UpdateExpression: "REMOVE notesList, note, noteUser, noteTime" }));
        }));
        alert(`Successfully purged all logs.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { alert("Bulk log deletion failed."); }
  };

  const applyBulkFactoryReset = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: PERMANENTLY wipe all data and logs for ${selectedDevices.length} selected devices?`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId === id);
            if (!dev) return;
            await docClient.send(new UpdateCommand({ 
                TableName: "AssetTrackerData", 
                Key: { deviceId: dev.deviceId, timestamp: dev.timestamp }, 
                UpdateExpression: "REMOVE notesList, note, noteUser, noteTime, tag, homeLat, homeLon, isServiceMode, lastServiceModeUser, lastServiceModeTime" 
            }));
        }));
        alert(`Successfully reset ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { alert("Bulk reset failed."); }
  };

  const applyBulkGroup = async () => {
    if (!bulkGroupInput || !bulkGroupInput.trim()) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return updateAttribute(dev.deviceId, dev.timestamp, 'group', bulkGroupInput.trim(), '#g');
    }));
    alert(`Assigned group folder "${bulkGroupInput.trim()}" to ${selectedDevices.length} Kinetic Cards.`);
    resetAllInputs();
    fetchDevices();
  };

  const applyBulkNote = async () => {
    if (!bulkNoteInput || !bulkNoteInput.trim()) return;
    if (!window.confirm(`Are you sure you want to broadcast this log entry to all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return addNote(dev.deviceId, dev.timestamp, bulkNoteInput.trim());
    }));
    alert(`Broadcast log note to ${selectedDevices.length} Kinetic Card timelines.`);
    setBulkNoteInput("");
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkSetHome = async () => {
    if (!window.confirm(`Set position as home anchor for ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return setHomeLocation(dev.deviceId, dev.timestamp, dev.latitude, dev.longitude);
    }));
    alert(`Saved home target geofence anchors for ${selectedDevices.length} devices.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Clear home location anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return clearHomeLocation(dev.deviceId, dev.timestamp);
    }));
    alert(`Cleared home target anchors for ${selectedDevices.length} Kinetic Cards.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const resetAllInputs = () => {
    setSearchTerm("");
    setBulkGroupInput("");
    setBulkNoteInput("");
    setTagInputs({});
    setNoteInputs({});
    setSelectedDevices([]);
    setStatusFilter("all");
    setActiveGroupFilter("all");
    setNamingFilter("all");
  };

  const handleSignOut = () => {
    localStorage.clear(); sessionStorage.clear(); auth.removeUser();
    const cognitoDomain = "us-east-2ck94skjac.auth.us-east-2.amazoncognito.com";
    const clientId = "51fu0mfnpb0r0e319ftppvcbaf";
    const logoutUri = "https://main.d1qrq5npo0cqdy.amplifyapp.com/";
    window.location.href = `https://` + cognitoDomain + `/logout?client_id=` + clientId + `&logout_uri=` + encodeURIComponent(logoutUri);
  };

  const getTimelineMarkerColor = (text = "") => text.toLowerCase().includes('fail') ? '#ff3b30' : '#86868b';
  const getBatteryStatusColor = (p = 100) => p <= 20 ? '#ff3b30' : p <= 50 ? '#ff9500' : '#34c759';
  const getPillStyle = (isActive) => ({ padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #1d1d1f', backgroundColor: isActive ? '#1d1d1f' : 'transparent', color: isActive ? '#ffffff' : '#1d1d1f' });

  return (
    <div style={appContainerStyle}>
      <header style={headerStyle}>
        <img src="/CSGroup_Logo_Main_White.webp" alt="Logo" style={{ height: '70px', objectFit: 'contain' }} />
        <button onClick={handleSignOut} style={secondaryButtonStyle}>Sign Out</button>
      </header>

      <div style={{ maxWidth: '1140px', margin: '20px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={stickySearchCardStyle}>
           <input placeholder="Search Inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredAssets.map(item => (
            <div key={item.deviceId} style={{ ...deviceCardStyle, backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" checked={selectedDevices.includes(item.deviceId)} onChange={() => setSelectedDevices(p => p.includes(item.deviceId) ? p.filter(i => i !== item.deviceId) : [...p, item.deviceId])} />
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{item.tag || item.deviceId}</div>
              </div>
              <div style={{ fontSize: '11px', color: getBatteryStatusColor(item.battery), fontWeight: '700' }}>
                 {item.battery}% Battery {item.estTimeRemaining && `• ${item.estTimeRemaining}`}
              </div>
              <div className="timeline-wrapper-panel" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
                <div style={{ height: '110px', overflowY: 'scroll' }}>
                  {item.deviceNotes?.map((log, i) => (
                    <div key={i} style={{ fontSize: '11px', marginBottom: '4px' }}>{log.text} <span style={{ color: '#86868b' }}>• {log.time.includes('-') ? log.time : `${log.time} • 00:00 AM`}</span></div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input placeholder="Add note..." value={noteInputs[item.deviceId] || ""} onChange={(e) => setNoteInputs(p => ({...p, [item.deviceId]: e.target.value}))} style={inputStyle} />
                  <button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId])} style={primaryButtonStyle}>Post</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #d2d2d7', padding: '20px 40px', transform: selectedDevices.length > 0 ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={applyBulkClearLogs} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30' }}>Clear Logs</button>
            <button onClick={applyBulkFactoryReset} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30' }}>Factory Reset</button>
        </div>
      </div>
    </div>
  );
}

export default App;
