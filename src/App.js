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
  
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [activeGroupFilter, setActiveGroupFilter] = useState("all"); 
  const [namingFilter, setNamingFilter] = useState("all"); 
  const [showFilters, setShowFilters] = useState(false);
  const [activeMapModalAsset, setActiveMapModalAsset] = useState(null);
  const [sharingAsset, setSharingAsset] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareDuration, setShareDuration] = useState("24");
  const [sharedAsset, setSharedAsset] = useState(null);
  const [shareError, setShareError] = useState(null);
  const [isShareLoading, setIsShareLoading] = useState(false);

  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const shareTokenParam = useMemo(() => queryParams.get('token'), [queryParams]);
  const isSharePage = useMemo(() => window.location.pathname.includes('/share') || !!shareTokenParam, [shareTokenParam]);
  const isAdmin = auth.user?.profile?.['cognito:groups']?.includes('Admins');

  const appContainerStyle = { backgroundColor: '#f5f5f7', color: '#1d1d1f', minHeight: '100vh', fontFamily: '"SF Pro Display", "SF Pro Text", "Helvetica Neue", "Inter", sans-serif', paddingBottom: selectedDevices.length > 0 ? '140px' : '60px', fontSize: '15px', transition: 'padding-bottom 0.3s ease' };
  const headerStyle = { width: '100%', boxSizing: 'border-box', padding: '24px 24px', background: 'linear-gradient(180deg, #0c0c0d 0%, #1a1a1c 100%)', borderBottom: '1px solid #2d2d2f', boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.02), 0 4px 30px rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' };
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '14px', padding: '28px', border: '1px solid #d2d2d7', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' };
  const deviceCardStyle = { backgroundColor: '#e5e5ea', borderRadius: '12px', padding: '16px', border: '1px solid #d2d2d7', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' };
  const inputStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px', backgroundColor: '#ffffff', color: '#1d1d1f', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: '11px', color: '#1d1d1f', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const buttonStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' };
  const primaryButtonStyle = { ...buttonStyle, backgroundColor: '#1d1d1f', color: '#ffffff' };
  const secondaryButtonStyle = { ...buttonStyle, backgroundColor: 'transparent', color: '#1d1d1f', border: '1px solid #1d1d1f' };
  const stickySearchCardStyle = { ...cardStyle, position: 'sticky', top: '12px', zIndex: 100, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)' };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const term = searchTerm.toLowerCase();
      const textMatches = ((a.deviceId || '').toLowerCase().includes(term) || (a.city || '').toLowerCase().includes(term) || (a.group || '').toLowerCase().includes(term) || (a.tag || '').toLowerCase().includes(term));
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
      if (a.group) { invSuggestions.add(a.group); grpSuggestions.add(a.group); uniqueGroups.add(a.group); }
    });
    return { inventorySuggestions: Array.from(invSuggestions), groupSuggestions: Array.from(grpSuggestions), distinctGroups: Array.from(uniqueGroups) };
  }, [assets]);

  useEffect(() => {
    if (!isSharePage || !shareTokenParam) return;
    async function processPublicEscalationFetch() {
      setIsShareLoading(true);
      try {
        const response = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData", FilterExpression: "shareToken = :tok", ExpressionAttributeValues: { ":tok": shareTokenParam } }));
        if (!response.Items || response.Items.length === 0) { setShareError("Invalid tracking configuration signature."); return; }
        const activeNode = response.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (activeNode.shareExpires && Date.now() > activeNode.shareExpires) { setShareError("Token expired."); return; }
        const loc = await getLocationInfo(activeNode.latitude, activeNode.longitude);
        setSharedAsset({ ...activeNode, city: loc.city, zip: loc.zip });
      } catch (err) { setShareError("Failed to resolve stable secure handshake."); } finally { setIsShareLoading(false); }
    }
    processPublicEscalationFetch();
  }, [isSharePage, shareTokenParam]);

  const fetchDevices = useCallback(async () => {
    if (!auth.isAuthenticated) return;
    setDbError(null);
    try {
      let items = [];
      const userSub = auth.user?.profile?.sub;
      try {
        const queryResponse = await docClient.send(new QueryCommand({ TableName: "AssetTrackerData", IndexName: "clientId-index", KeyConditionExpression: "clientId = :cid", ExpressionAttributeValues: { ":cid": userSub || "" } }));
        items = queryResponse.Items || [];
      } catch (queryErr) {
        const scanResponse = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData" }));
        items = scanResponse.Items || [];
      }
      if (items.length === 0) { setAssets([]); return; }
      const grouped = {};
      items.forEach(item => { if (item.deviceId) { if (!grouped[item.deviceId]) grouped[item.deviceId] = []; grouped[item.deviceId].push(item); } });
      const processed = await Promise.all(Object.keys(grouped).map(async (id) => {
        const history = grouped[id].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latest = history[0];
        const isOffline = (Date.now() - new Date(latest.timestamp).getTime()) > (24 * 60 * 60 * 1000); 
        const loc = await getLocationInfo(latest.latitude, latest.longitude);
        const homeLat = history.find(i => i.homeLat)?.homeLat;
        const homeLon = history.find(i => i.homeLon)?.homeLon;
        const isServiceMode = history.find(i => i.isServiceMode)?.isServiceMode || false;
        const distance = (homeLat && homeLon) ? getDistanceInKm(latest.latitude, latest.longitude, homeLat, homeLon) : 0;
        const isGeofenceViolation = !isServiceMode && homeLat && distance > 0.5;
        const isLowBattery = latest.battery !== undefined && Number(latest.battery) <= 20;
        let deviceNotes = [];
        history.forEach(row => {
          if (row.notesList && Array.isArray(row.notesList)) { const withTimestamps = row.notesList.map(n => ({ ...n, rowTimestamp: row.timestamp })); deviceNotes = [...deviceNotes, ...withTimestamps]; }
          if (row.note) { deviceNotes.push({ text: row.note, user: row.noteUser || "Unknown User", time: row.noteTime || "Prior Log", rowTimestamp: row.timestamp }); }
        });
        deviceNotes.sort((a, b) => {
          const parseTimestampString = (timeStr) => { if (!timeStr || timeStr === "Prior Log") return 0; const normalized = timeStr.replace(/\s*-\s*/, ' ').trim(); const parsedDate = new Date(normalized); return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime(); };
          return parseTimestampString(b.time) - parseTimestampString(a.time);
        });
        return { ...latest, deviceId: id, deviceNotes, tag: history.find(i => i.tag)?.tag || "", group: history.find(i => i.group)?.group || "", homeLat, homeLon, isServiceMode, lastServiceModeUser: history.find(i => i.lastServiceModeUser)?.lastServiceModeUser || "N/A", lastServiceModeTime: history.find(i => i.lastServiceModeTime)?.lastServiceModeTime || "N/A", isOffline, isGeofenceViolation, isLowBattery, zip: loc.zip, city: loc.city, latitude: latest.latitude, longitude: latest.longitude, battery: latest.battery };
      }));
      setAssets(processed);
    } catch (err) { console.error(err); setDbError(`Database Transaction Fault: ${err.message}`); }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => { if (auth.isAuthenticated) fetchDevices(); }, [auth.isAuthenticated, fetchDevices]);

  const updateAttribute = async (deviceId, timestamp, field, value, attributeAlias) => {
    await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp }, UpdateExpression: `set ${attributeAlias} = :val`, ExpressionAttributeNames: { [attributeAlias]: field }, ExpressionAttributeValues: { ":val": value } }));
    fetchDevices();
  };

  const toggleServiceMode = async (deviceId, timestamp, currentState) => {
    const newState = !currentState;
    const user = auth.user?.profile?.email || "System";
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-US')} - ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const logMsg = newState ? `🛡️ Watchdog Disabled (Service Mode Engaged by ${user.split('@')[0]})` : `📡 Watchdog Activated (Monitoring Live Position by ${user.split('@')[0]})`;
    try {
      await Promise.all([
          updateAttribute(deviceId, timestamp, 'isServiceMode', newState, '#sm'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeUser', user, '#lsu'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeTime', timeStr, '#lst'),
          addNote(deviceId, timestamp, logMsg)
      ]);
      alert(newState ? "Watchdog disabled!" : "Watchdog activated!");
    } catch (err) { console.error(err); }
  };

  const addNote = async (deviceId, timestamp, noteText) => {
    if (!noteText || !noteText.trim()) return;
    const now = new Date();
    const timestampNow = `${now.toLocaleDateString('en-US')} - ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const user = auth.user?.profile.email || "Unknown User";
    const newNoteObj = { text: noteText.trim(), user: user, time: timestampNow };
    try {
      await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp }, UpdateExpression: "SET #nl = list_append(if_not_exists(#nl, :empty_list), :new_note)", ExpressionAttributeNames: { "#nl": "notesList" }, ExpressionAttributeValues: { ":new_note": [newNoteObj], ":empty_list": [] } }));
      setNoteInputs(prev => ({...prev, [deviceId]: ""}));
      fetchDevices();
    } catch (err) { console.error("Database note array error:", err); }
  };

  const deleteNote = async (deviceId, targetNote) => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm("Permanently delete this log entry?")) return;
    await addNote(deviceId, targetNote.rowTimestamp, `🗑️ Log entry "${targetNote.text.substring(0,15)}..." was deleted by ${auth.user?.profile?.email.split('@')[0]}`);
    try {
      const response = await docClient.send(new GetCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp: targetNote.rowTimestamp } }));
      if (!response.Item) return;
      const dbItem = response.Item;
      if (dbItem.notesList && Array.isArray(dbItem.notesList)) {
        const updatedList = dbItem.notesList.filter(n => !(n.text === targetNote.text && n.time.replace(/\s+/g, '') === targetNote.time.replace(/\s+/g, '')));
        await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp: targetNote.rowTimestamp }, UpdateExpression: "SET notesList = :updatedList", ExpressionAttributeValues: { ":updatedList": updatedList } }));
      }
      await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp: targetNote.rowTimestamp }, UpdateExpression: "REMOVE note, noteUser, noteTime" }));
      fetchDevices();
    } catch (err) { console.error(err); }
  };

  const executeLiveShareEscalation = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!shareEmail || !shareEmail.trim() || !sharingAsset) return;
    const secureToken = crypto.randomUUID();
    const durationMs = parseInt(shareDuration, 10) * 60 * 60 * 1000;
    const expirationTimestamp = Date.now() + durationMs;
    try {
      await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId: sharingAsset.deviceId, timestamp: sharingAsset.timestamp }, UpdateExpression: "SET shareToken = :tok, shareExpires = :exp, shareEmail = :em, isStolenFlag = :st", ExpressionAttributeValues: { ":tok": secureToken, ":exp": expirationTimestamp, ":em": shareEmail.trim().toLowerCase(), ":st": true } }));
      alert(`Secure Track link dispatched to ${shareEmail} for the next ${shareDuration} hours.`);
      setSharingAsset(null);
      setShareEmail("");
      fetchDevices();
    } catch (err) { alert("System update failure."); }
  };

  const clearHomeLocation = async (deviceId, timestamp) => {
    await Promise.all([
      docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp }, UpdateExpression: "REMOVE homeLat, homeLon" })),
      addNote(deviceId, timestamp, `🚫 Home Anchor Cleared`)
    ]);
  };

  const setHomeLocation = async (deviceId, timestamp, lat, lon) => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-US')} - ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const logMsg = `📍 Home Anchor Set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    await Promise.all([
        updateAttribute(deviceId, timestamp, 'homeLat', lat, '#hl'),
        updateAttribute(deviceId, timestamp, 'homeLon', lon, '#hlon'),
        addNote(deviceId, timestamp, logMsg)
    ]);
  };

  const applyBulkGroup = async () => {
    if (!bulkGroupInput || !bulkGroupInput.trim()) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return updateAttribute(dev.deviceId, dev.timestamp, 'group', bulkGroupInput.trim(), '#g'); }));
    alert(`Assigned group folder "${bulkGroupInput.trim()}" to ${selectedDevices.length} Kinetic Cards.`);
    resetAllInputs();
    fetchDevices();
  };

  const applyBulkNote = async () => {
    if (!bulkNoteInput || !bulkNoteInput.trim()) return;
    if (!window.confirm(`Broadcast log note to all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return addNote(dev.deviceId, dev.timestamp, bulkNoteInput.trim()); }));
    alert(`Broadcast log note to ${selectedDevices.length} timelines.`);
    setBulkNoteInput("");
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkSetHome = async () => {
    if (!window.confirm(`Set current position as home anchor for all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return setHomeLocation(dev.deviceId, dev.timestamp, dev.latitude, dev.longitude); }));
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Clear home anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return clearHomeLocation(dev.deviceId, dev.timestamp); }));
    setSelectedDevices([]);
    fetchDevices();
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
        alert(`Successfully purged all logs for ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { alert("Bulk log deletion failed."); }
  };

  const resetAllInputs = () => { setSearchTerm(""); setBulkGroupInput(""); setBulkNoteInput(""); setTagInputs({}); setNoteInputs({}); setSelectedDevices([]); setStatusFilter("all"); setActiveGroupFilter("all"); setNamingFilter("all"); };
  const handleSignOut = () => { localStorage.clear(); sessionStorage.clear(); auth.removeUser(); const cognitoDomain = "us-east-2ck94skjac.auth.us-east-2.amazoncognito.com"; const clientId = "51fu0mfnpb0r0e319ftppvcbaf"; const logoutUri = "https://main.d1qrq5npo0cqdy.amplifyapp.com/"; window.location.href = `https://` + cognitoDomain + `/logout?client_id=` + clientId + `&logout_uri=` + encodeURIComponent(logoutUri); };
  const getTimelineMarkerColor = (text = "") => { const logText = text.toLowerCase(); if (logText.includes('overheat') || logText.includes('fail') || logText.includes('error') || logText.includes('broken')) return '#ff3b30'; if (logText.includes('install') || logText.includes('repair') || logText.includes('fix') || logText.includes('replace')) return '#ff9500'; if (logText.includes('fill') || logText.includes('load') || logText.includes('complete')) return '#34c759'; return '#86868b'; };
  const getBatteryStatusColor = (percentage = 100) => { if (percentage <= 20) return '#ff3b30'; if (percentage <= 50) return '#ff9500'; return '#34c759'; };
  const getPillStyle = (isActive) => ({ padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: '1px solid #1d1d1f', backgroundColor: isActive ? '#1d1d1f' : 'transparent', color: isActive ? '#ffffff' : '#1d1d1f', transition: 'all 0.1s ease', whiteSpace: 'nowrap' });

  return (
    <div style={appContainerStyle}>
      <style>{`
        .custom-scrollbar-viewport::-webkit-scrollbar { width: 6px !important; height: 6px !important; display: block !important; }
        .custom-scrollbar-viewport::-webkit-scrollbar-track { background: #e5e5ea !important; border-radius: 4px !important; }
        .custom-scrollbar-viewport::-webkit-scrollbar-thumb { background: #86868b !important; border-radius: 4px !important; }
        .custom-scrollbar-viewport { scrollbar-width: thin !important; scrollbar-color: #86868b #e5e5ea !important; }
        @keyframes radar-pulse-glow { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); } }
        .live-pulse-indicator-dot { width: 8px; height: 8px; background-color: #34c759; border-radius: 50%; display: inline-block; animation: radar-pulse-glow 2s infinite ease-in-out; }
        .responsive-pill-container-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .responsive-pill-options-sub-block { display: flex; gap: 8px; flex-wrap: wrap; }
        .search-row-input-wrapper { display: flex; align-items: center; gap: 12px; width: 100%; }
        .card-split-columns-view { display: flex; flex-direction: column; gap: 12px; }
        @media (max-width: 768px) { .sticky-search-panel-container { padding: 12px 14px !important; top: 4px !important; } .card-split-columns-view { flex-direction: row !important; align-items: stretch !important; gap: 10px !important; } .card-column-right-mapping iframe { width: 300% !important; height: calc(100% + 40px) !important; margin-left: -100% !important; margin-top: -10px !important; border: none !important; } }
      `}</style>
      <header style={headerStyle}>
        <img src="/CSGroup_Logo_Main_White.webp" alt="Client Logo" style={{ height: '70px', objectFit: 'contain', maxWidth: '100%' }} />
        <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: '500', textAlign: 'center' }}>{auth.user?.profile.email} {isAdmin && <span style={{ color: '#86868b', fontSize: '12px' }}>/ ADMIN</span>}</div>
        <button onClick={handleSignOut} style={{ backgroundColor: '#ffffff', color: '#000000', border: 'none', padding: '6px 18px', fontSize: '12px', borderRadius: '14px', cursor: 'pointer', fontWeight: '600' }}>Sign Out</button>
      </header>
      <div style={{ maxWidth: '1140px', margin: '20px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="sticky-search-panel-container" style={stickySearchCardStyle}>
          <div className="search-row-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={labelStyle}>Search Inventory</div>
                <input list="inventory-suggestions-list" placeholder="Filter by ID, region, folder..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                <datalist id="inventory-suggestions-list">{inventorySuggestions.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{ ...secondaryButtonStyle, flexShrink: 0, padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>{showFilters ? '✕ Clear Filters' : '🎛️ Filter Drawer'}</button>
          </div>
          <div style={{ marginTop: '12px', display: showFilters ? 'flex' : 'none', flexDirection: 'column', gap: '12px', borderTop: '1px solid #e5e5ea', paddingTop: '12px' }}>
            <div className="responsive-pill-container-row"><span style={{ ...labelStyle, width: '80px', margin: 0 }}>Status</span><div className="responsive-pill-options-sub-block"><button onClick={() => setStatusFilter("all")} style={getPillStyle(statusFilter === "all")}>All</button><button onClick={() => setStatusFilter("offline")} style={getPillStyle(statusFilter === "offline")}>🔴 Offline</button><button onClick={() => setStatusFilter("geofence")} style={getPillStyle(statusFilter === "geofence")}>🟠 Geofence</button><button onClick={() => setStatusFilter("low_battery")} style={getPillStyle(statusFilter === "low_battery")}>🪫 Low Batt</button></div></div>
            <div className="responsive-pill-container-row"><span style={{ ...labelStyle, width: '80px', margin: 0 }}>Groups</span><div className="responsive-pill-options-sub-block">{distinctGroups.map(grp => <button key={grp} onClick={() => setActiveGroupFilter(grp)} style={getPillStyle(activeGroupFilter === grp)}>📦 {grp}</button>)}</div></div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #e5e5ea', paddingTop: '10px' }}>
             <div style={{ marginRight: 'auto', display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '500', color: '#86868b', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d1d1f', cursor: 'pointer', fontWeight: '600' }}><input type="checkbox" checked={filteredAssets.length > 0 && filteredAssets.every(a => selectedDevices.includes(a.deviceId))} onChange={() => { const visibleIds = filteredAssets.map(a => a.deviceId); if (filteredAssets.every(a => selectedDevices.includes(a.deviceId))) setSelectedDevices(prev => prev.filter(id => !visibleIds.includes(id))); else setSelectedDevices(prev => Array.from(new Set([...prev, ...visibleIds]))); }} style={{ width: '15px', height: '15px' }} /> Select All Visible ({filteredAssets.length})</label>
             </div>
             <button onClick={resetAllInputs} style={{ ...secondaryButtonStyle, padding: '4px 12px', fontSize: '12px', borderRadius: '12px' }}>Reset</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 0.33fr))', gap: '24px' }}>
          {filteredAssets.map(item => {
            const historicalNotes = item.deviceNotes || [];
            const batteryLevel = item.battery !== undefined ? Number(item.battery) : 100;
            const sparkColor = getBatteryStatusColor(batteryLevel);
            const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${item.longitude - 0.005}%2C${item.latitude - 0.003}%2C${item.longitude + 0.005}%2C${item.latitude + 0.003}&layer=mapnik&marker=${item.latitude}%2C${item.longitude}`;
            return (
                <div key={item.deviceId} style={{ ...deviceCardStyle, backgroundColor: '#ffffff' }}>
                  <div className="card-split-columns-view">
                    <div className="card-column-left-telemetry">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><input type="checkbox" checked={selectedDevices.includes(item.deviceId)} onChange={() => setSelectedDevices(prev => prev.includes(item.deviceId) ? prev.filter(i => i !== item.deviceId) : [...prev, item.deviceId])} style={{ width: '16px', height: '16px' }} /><div style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f' }}>{item.tag ? item.tag : item.deviceId}</div></div>
                      <div style={{ fontSize: '12px', color: '#86868b' }}>{item.city || "Locating"}</div>
                    </div>
                    <div className="card-column-right-mapping" style={{ position: 'relative', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d2d2d7', cursor: 'pointer' }} onClick={() => setActiveMapModalAsset(item)}>
                      <iframe title={`map-${item.deviceId}`} width="100%" height="100%" src={mapUrl} style={{ pointerEvents: 'none', border: 'none' }}></iframe>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}><input placeholder="Rename..." value={tagInputs[item.deviceId] || ""} onChange={(e) => setTagInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1 }} /><button onClick={() => updateAttribute(item.deviceId, item.timestamp, 'tag', tagInputs[item.deviceId], '#t')} style={primaryButtonStyle}>Save</button></div>
                  <div style={{ display: 'flex', gap: '4px', width: '100%' }}>{isAdmin && <button onClick={() => setSharingAsset(item)} style={{ ...primaryButtonStyle, flex: 1 }}>Share</button>}<button onClick={() => toggleServiceMode(item.deviceId, item.timestamp, item.isServiceMode)} style={{ ...buttonStyle, flex: 1.5, backgroundColor: item.isServiceMode ? 'transparent' : '#1d1d1f' }}>{!item.isServiceMode && <span className="live-pulse-indicator-dot"></span>} {item.isServiceMode ? 'Watchdog off' : 'Watchdog active'}</button></div>
                  <div className="timeline-wrapper-panel" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
                    <div className="custom-scrollbar-viewport" style={{ height: '110px', overflowY: 'scroll', marginBottom: '8px' }}>
                      {historicalNotes.map((log, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTimelineMarkerColor(log.text) }}></div><div style={{ fontSize: '11px', fontWeight: '500' }}>{log.text} <span style={{ fontSize: '9px', color: '#86868b' }}>• {log.time.includes('-') ? log.time : `${log.time} • 00:00 AM`}</span></div></div>)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}><input placeholder="Add note..." value={noteInputs[item.deviceId] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1 }} /><button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId])} style={primaryButtonStyle}>Post</button></div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #d2d2d7', padding: '20px 40px', transform: selectedDevices.length > 0 ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
            <input placeholder="Assign to Group..." value={bulkGroupInput} onChange={(e) => setBulkGroupInput(e.target.value)} style={inputStyle} /><button onClick={applyBulkGroup} style={primaryButtonStyle}>Move</button>
            <input placeholder="Post log to Group..." value={bulkNoteInput} onChange={(e) => setBulkNoteInput(e.target.value)} style={inputStyle} /><button onClick={applyBulkNote} style={primaryButtonStyle}>Post</button>
            <button onClick={applyBulkSetHome} style={secondaryButtonStyle}>Set Home</button>
            <button onClick={applyBulkClearHome} style={secondaryButtonStyle}>Clear Home</button>
            <button onClick={applyBulkClearLogs} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30' }}>Clear Logs</button>
        </div>
      </div>
    </div>
  );
}

export default App;
