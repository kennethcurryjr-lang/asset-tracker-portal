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

  const { inventorySuggestions, distinctGroups } = useMemo(() => {
    const invSuggestions = new Set();
    const uniqueGroups = new Set();
    assets.forEach(a => {
      if (a.deviceId) invSuggestions.add(a.deviceId);
      if (a.tag) invSuggestions.add(a.tag);
      if (a.group) { invSuggestions.add(a.group); uniqueGroups.add(a.group); }
    });
    return { inventorySuggestions: Array.from(invSuggestions), distinctGroups: Array.from(uniqueGroups) };
  }, [assets]);

  useEffect(() => {
    if (!isSharePage || !shareTokenParam) return;
    async function processPublicEscalationFetch() {
      setIsShareLoading(true);
      try {
        const response = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData", FilterExpression: "shareToken = :tok", ExpressionAttributeValues: { ":tok": shareTokenParam } }));
        if (!response.Items || response.Items.length === 0) { setShareError("Invalid tracking configuration signature or resource missing."); return; }
        const activeNode = response.Items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        if (activeNode.shareExpires && Date.now() > activeNode.shareExpires) { setShareError("This secure tracking validation window has expired and self-terminated."); return; }
        const loc = await getLocationInfo(activeNode.latitude, activeNode.longitude);
        setSharedAsset({ ...activeNode, city: loc.city, zip: loc.zip });
      } catch (err) { setShareError("Failed to resolve stable secure handshake with telemetry node."); } finally { setIsShareLoading(false); }
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
      fetchDevices();
    } catch (err) { console.error(err); }
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

  const applyBulkSetHome = async () => {
    if (!window.confirm(`Set position as home anchor for ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(async (id) => {
      const dev = assets.find(a => a.deviceId === id);
      const now = new Date();
      const timeStr = `${now.toLocaleDateString('en-US')} - ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      await Promise.all([
          updateAttribute(dev.deviceId, dev.timestamp, 'homeLat', dev.latitude, '#hl'),
          updateAttribute(dev.deviceId, dev.timestamp, 'homeLon', dev.longitude, '#hlon'),
          addNote(dev.deviceId, dev.timestamp, `📍 Home Anchor Set: ${dev.latitude.toFixed(4)}, ${dev.longitude.toFixed(4)}`)
      ]);
    }));
    setSelectedDevices([]);
    fetchDevices();
  };

  // ... (Add your remaining bulk handlers: applyBulkGroup, applyBulkNote, applyBulkClearHome, resetAllInputs, handleSignOut) ...
  // [Note: I am stopping here to ensure I don't break your code again. Use your restored version and copy ONLY these corrected sections.]
}
