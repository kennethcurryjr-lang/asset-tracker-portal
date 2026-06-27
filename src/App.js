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
      if (a.group) { invSuggestions.add(a.group); grpSuggestions.add(a.group); uniqueGroups.add(a.group); }
    });
    return { inventorySuggestions: Array.from(invSuggestions), groupSuggestions: Array.from(grpSuggestions), distinctGroups: Array.from(uniqueGroups) };
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
        if (!response.Items || response.Items.length === 0) { setShareError("Invalid tracking configuration signature or resource missing."); return; }
        const activeNode = response.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (activeNode.shareExpires && Date.now() > activeNode.shareExpires) { setShareError("This secure tracking validation window has expired and self-terminated."); return; }
        const loc = await getLocationInfo(activeNode.latitude, activeNode.longitude);
        setSharedAsset({ ...activeNode, city: loc.city, zip: loc.zip });
      } catch (err) { console.error("Public share payload map exception:", err); setShareError("Failed to resolve stable secure handshake with telemetry node."); } finally { setIsShareLoading(false); }
    }
    processPublicEscalationFetch();
  }, [isSharePage, shareTokenParam]);

  useEffect(() => {
    if (auth.error && (window.location.search.includes('code=') || window.location.search.includes('state='))) {
      localStorage.clear(); sessionStorage.clear(); window.location.href = window.location.origin;
    }
  }, [auth.error]);

  useEffect(() => {
    if (isSharePage) return; 
    const isSigningOut = localStorage.getItem('isSigningOut') === 'true';
    const hasAuthParams = window.location.search.includes('code=') || window.location.search.includes('state=') || window.location.search.includes('error=') || window.location.search.includes('session_state=');
    if (isSigningOut) return;
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !hasAuthParams) { auth.signinRedirect(); }
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
          if (row.notesList && Array.isArray(row.notesList)) {
            const withTimestamps = row.notesList.map(n => ({ ...n, rowTimestamp: row.timestamp }));
            deviceNotes = [...deviceNotes, ...withTimestamps];
          }
          if (row.note) {
            deviceNotes.push({ text: row.note, user: row.noteUser || "Unknown User", time: row.noteTime || "Prior Log", rowTimestamp: row.timestamp });
          }
        });
        deviceNotes.sort((a, b) => {
          const parseTimestampString = (timeStr) => { if (!timeStr || timeStr === "Prior Log") return 0; const normalized = timeStr.replace(/\s*-\s*/, ' ').trim(); const parsedDate = new Date(normalized); return isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime(); };
          return parseTimestampString(b.time) - parseTimestampString(a.time);
        });
        return { ...latest, deviceId: id, deviceNotes, tag: history.find(i => i.tag)?.tag || "", group: history.find(i => i.group)?.group || "", homeLat, homeLon, isServiceMode, lastServiceModeUser: history.find(i => i.lastServiceModeUser)?.lastServiceModeUser || "N/A", lastServiceModeTime: history.find(i => i.lastServiceModeTime)?.lastServiceModeTime || "N/A", isOffline, isGeofenceViolation, isLowBattery, zip: loc.zip, city: loc.city, latitude: latest.latitude, longitude: latest.longitude, battery: latest.battery };
      }));
      setAssets(processed);
    } catch (err) { console.error(err); setDbError(`AWS DynamoDB Database Transaction Fault: ${err.message || err}`); }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => { if (auth.isAuthenticated) fetchDevices(); }, [auth.isAuthenticated, fetchDevices]);

  const updateAttribute = async (deviceId, timestamp, field, value, attributeAlias) => {
    await docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp }, UpdateExpression: `set ${attributeAlias} = :val`, ExpressionAttributeNames: { [attributeAlias]: field }, ExpressionAttributeValues: { ":val": value } }));
    fetchDevices();
  };

  const toggleServiceMode = async (deviceId, timestamp, currentState) => {
    const newState = !currentState;
    const user = auth.user?.profile?.email || "System";
    const time = new Date().toLocaleString();
    const logMsg = newState ? `🛡️ Watchdog Disabled (Service Mode Engaged by ${user.split('@')[0]})` : `📡 Watchdog Activated (Monitoring Live Position by ${user.split('@')[0]})`;
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

  // --- FEATURE: High-Precision Timestamped addNote ---
  const addNote = async (deviceId, timestamp, noteText) => {
    if (!noteText || !noteText.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US');
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const timestampNow = `${dateStr} - ${timeStr}`;
    const user = auth.user?.profile.email || "Unknown User";

    const newNoteObj = { text: noteText.trim(), user: user, time: timestampNow };

    try {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "SET #nl = list_append(if_not_exists(#nl, :empty_list), :new_note)",
        ExpressionAttributeNames: { "#nl": "notesList" },
        ExpressionAttributeValues: { ":new_note": [newNoteObj], ":empty_list": [] }
      }));
      setNoteInputs(prev => ({...prev, [deviceId]: ""}));
      fetchDevices();
    } catch (err) { console.error("Database note array error:", err); }
  };

  const deleteNote = async (deviceId, targetNote) => {
    if (!isAdmin) { alert("Security Violation: Action cleared strictly for Administrative roles."); return; }
    if (!window.confirm("Are you sure you want to permanently delete this log entry from the database?")) return;
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
      alert("Log entry permanently expunged.");
      fetchDevices();
    } catch (err) { console.error("Database transaction fault:", err); }
  };

  // --- FEATURE: Bulk Clear Logs ---
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

  const executeLiveShareEscalation = async () => {
    if (!isAdmin) { alert("Security Violation: Only administrator accounts are cleared to authorize external view vectors."); setSharingAsset(null); return; }
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
    } catch (err) { alert("System update failure. Verify database permissions."); }
  };

  const clearHomeLocation = async (deviceId, timestamp) => {
    await Promise.all([
      docClient.send(new UpdateCommand({ TableName: "AssetTrackerData", Key: { deviceId, timestamp }, UpdateExpression: "REMOVE homeLat, homeLon" })),
      addNote(deviceId, timestamp, `🚫 Home Anchor Cleared`)
    ]);
  };

  const setHomeLocation = async (deviceId, timestamp, lat, lon) => {
    const logMsg = `📍 Home Anchor Set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    await Promise.all([
        updateAttribute(deviceId, timestamp, 'homeLat', lat, '#hl'),
        updateAttribute(deviceId, timestamp, 'homeLon', lon, '#hlon'),
        addNote(deviceId, timestamp, logMsg)
    ]);
    alert("Home location saved and logged!");
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
    if (!window.confirm(`Are you sure you want to broadcast this timeline log entry to all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return addNote(dev.deviceId, dev.timestamp, bulkNoteInput.trim()); }));
    alert(`Broadcast log note to ${selectedDevices.length} Kinetic Card timelines.`);
    setBulkNoteInput("");
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkSetHome = async () => {
    if (!window.confirm(`Are you sure you want to set the current lock position as the home location anchor for all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return setHomeLocation(dev.deviceId, dev.timestamp, dev.latitude, dev.longitude); }));
    alert(`Saved home target geofence anchors for ${selectedDevices.length} devices.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Are you sure you want to completely wipe out and clear the home location anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
    await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId === id); return clearHomeLocation(dev.deviceId, dev.timestamp); }));
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
    localStorage.clear();
    sessionStorage.clear();
    auth.removeUser();
    const cognitoDomain = "us-east-2ck94skjac.auth.us-east-2.amazoncognito.com";
    const clientId = "51fu0mfnpb0r0e319ftppvcbaf";
    const logoutUri = "https://main.d1qrq5npo0cqdy.amplifyapp.com/";
    window.location.href = `https://` + cognitoDomain + `/logout?client_id=` + clientId + `&logout_uri=` + encodeURIComponent(logoutUri);
  };

  const getTimelineMarkerColor = (text = "") => {
    const logText = text.toLowerCase();
    if (logText.includes('overheat') || logText.includes('fail') || logText.includes('error') || logText.includes('broken')) {
      return '#ff3b30'; 
    }
    if (logText.includes('install') || logText.includes('repair') || logText.includes('fix') || logText.includes('replace')) {
      return '#ff9500'; 
    }
    if (logText.includes('fill') || logText.includes('load') || logText.includes('complete')) {
      return '#34c759'; 
    }
    return '#86868b'; 
  };

  const getBatteryStatusColor = (percentage = 100) => {
    if (percentage <= 20) return '#ff3b30'; 
    if (percentage <= 50) return '#ff9500'; 
    return '#34c759'; 
  };

  const getPillStyle = (isActive) => ({
    padding: '6px 12px',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid #1d1d1f',
    backgroundColor: isActive ? '#1d1d1f' : 'transparent',
    color: isActive ? '#ffffff' : '#1d1d1f',
    transition: 'all 0.1s ease',
    whiteSpace: 'nowrap'
  });

  if (isSharePage) {
    if (isShareLoading) return <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#f5f5f7', color: '#1d1d1f'}}>Establishing secure map tracking vector...</div>;
    if (shareError) {
      return (
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#f5f5f7', color: '#1d1d1f', gap: '16px', padding: '0 24px', textAlign: 'center'}}>
          <div style={{fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', color: '#ff3b30'}}>Authorization Link Revoked</div>
          <div style={{fontSize: '15px', color: '#86868b', maxWidth: '480px', lineHeight: '1.6', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #d2d2d7'}}>{shareError}</div>
        </div>
      );
    }
    if (sharedAsset) {
      return (
        <div style={{...appContainerStyle, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '640px', border: '1px solid #ff3b30' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff3b30' }}></div>
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#ff3b30', letterSpacing: '0.05em' }}>Active Law Enforcement Tracking Stream</span>
            </div>
            
            <h2 style={{ margin: '0 0 4px 0', fontSize: '26px', fontWeight: '600', letterSpacing: '-0.02em' }}>
              {sharedAsset.tag ? `${sharedAsset.tag} — ${sharedAsset.deviceId}` : sharedAsset.deviceId}
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Last telemetry lock recorded: <span style={{ color: '#1d1d1f', fontWeight: '500' }}>{new Date(sharedAsset.timestamp).toLocaleString()}</span></p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', backgroundColor: '#f5f5f7', padding: '20px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '28px' }}>
              <div>
                <div style={labelStyle}>Coordinates Vector</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{sharedAsset.latitude?.toFixed(5)}, {sharedAsset.longitude?.toFixed(5)}</div>
              </div>
              <div>
                <div style={{ ...labelStyle }}>Approximate Region</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{sharedAsset.city || "Locating Node..."}</div>
              </div>
              <div>
                <div style={labelStyle}>Battery Life</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{sharedAsset.battery}%</div>
              </div>
              <div>
                <div style={labelStyle}>Operational Target Group</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{sharedAsset.group || "Default File"}</div>
              </div>
            </div>

            <a 
              href={`https://www.openstreetmap.org/?mlat=${sharedAsset.latitude}&mlon=${sharedAsset.longitude}#map=15/${sharedAsset.latitude}/${sharedAsset.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...primaryButtonStyle, display: 'block', textAlign: 'center', textDecoration: 'none', padding: '14px', borderRadius: '24px', fontSize: '15px', fontWeight: '600' }}
            >
              Open Live Route in OpenStreetMap
            </a>
          </div>
          <p style={{ marginTop: '24px', fontSize: '11px', color: '#86868b', maxWidth: '440px', textAlign: 'center', lineHeight: '1.4' }}>This transmission viewport is heavily tokenized, cryptographically secure, and completely unindexed. It will drop offline immediately upon token expiration.</p>
        </div>
      );
    }
    return null;
  }

  if (auth.error && !window.location.search.includes('code=')) {
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#f5f5f7', color: '#1d1d1f', gap: '24px', padding: '0 24px', textAlign: 'center'}}>
        <div style={{fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em'}}>System Connection Mismatch</div>
        <div style={{fontSize: '15px', color: '#86868b', maxWidth: '540px', lineHeight: '1.6', backgroundColor: '#ffffff', padding: '24px', borderRadius: '18px', border: '1px solid #d2d2d7'}}>{auth.error.message}</div>
        <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = window.location.origin; }} style={primaryButtonStyle}>Reset Environment</button>
      </div>
    );
  }

  if (auth.isLoading || auth.activeNavigator) {
    return <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#f5f5f7', color: '#1d1d1f', paddingLeft: '40px'}}>Loading dashboard systems...</div>;
  }

  if (!auth.isAuthenticated) {
    return <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#f5f5f7', color: '#1d1d1f', paddingLeft: '40px'}}>Redirecting to secure gateway...</div>;
  }

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
        
        <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: '500', textAlign: 'center' }}>
            {auth.user?.profile.email} 
            {isAdmin && <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '400', marginLeft: '6px' }}>/ ADMIN</span>}
        </div>
        
        <button onClick={handleSignOut} style={{ backgroundColor: '#ffffff', color: '#000000', border: 'none', padding: '6px 18px', fontSize: '12px', borderRadius: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>Sign Out</button>
      </header>

      {dbError && (
        <div style={{ backgroundColor: '#ff3b30', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: '600', textAlign: 'center', boxShadow: '0 4px 12px rgba(255,59,48,0.2)' }}>⚠️ {dbError}</div>
      )}
      
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
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 0.33fr))', gap: '24px' }}>
          {filteredAssets.map(item => {
            const historicalNotes = item.deviceNotes || [];
            return (
              <div key={item.deviceId} style={{ ...deviceCardStyle, backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={selectedDevices.includes(item.deviceId)} onChange={() => setSelectedDevices(prev => prev.includes(item.deviceId) ? prev.filter(i => i !== item.deviceId) : [...prev, item.deviceId])} />
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{item.tag || item.deviceId}</div>
                </div>
                <div className="timeline-wrapper-panel" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
                  <div className="custom-scrollbar-viewport" style={{ height: '110px', overflowY: 'scroll', marginBottom: '8px' }}>
                    {historicalNotes.map((log, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTimelineMarkerColor(log.text) }}></div>
                        <div style={{ fontSize: '11px', fontWeight: '500' }}>
                          {log.text} <span style={{ fontSize: '9px', color: '#86868b' }}>• {log.time.includes('-') ? log.time : `${log.time} • 00:00 AM`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input placeholder="Add note..." value={noteInputs[item.deviceId] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId])} style={primaryButtonStyle}>Post</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #d2d2d7', padding: '20px 40px', transform: selectedDevices.length > 0 ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
            <input placeholder="Assign group..." value={bulkGroupInput} onChange={(e) => setBulkGroupInput(e.target.value)} style={inputStyle} />
            <button onClick={applyBulkGroup} style={primaryButtonStyle}>Move</button>
            <input placeholder="Broadcast log..." value={bulkNoteInput} onChange={(e) => setBulkNoteInput(e.target.value)} style={inputStyle} />
            <button onClick={applyBulkNote} style={primaryButtonStyle}>Post</button>
            <button onClick={applyBulkSetHome} style={secondaryButtonStyle}>Set Home</button>
            <button onClick={applyBulkClearHome} style={secondaryButtonStyle}>Clear Home</button>
            <button onClick={applyBulkClearLogs} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30' }}>Clear Logs</button>
        </div>
      </div>
    </div>
  );
}

export default App;
