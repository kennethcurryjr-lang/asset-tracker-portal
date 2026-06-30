import "leaflet/dist/leaflet.css";
/* eslint-disable no-unused-vars */
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { QueryCommand, UpdateCommand, ScanCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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

// Helper: Location Name (Cached)
const locationCache = new Map();
async function getLocationInfo(lat, lon) {
  if (!lat || !lon) return { zip: "N/A", city: "Unknown" };
  const cacheKey = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
  if (locationCache.has(cacheKey)) return locationCache.get(cacheKey);
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = await response.json();
    const result = { zip: data.postcode || "Unknown", city: data.city || data.locality || "Unknown" };
    locationCache.set(cacheKey, result);
    return result;
  } catch (err) { return { zip: "Error", city: "Error" }; }
}

function MapUpdater({ center }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

const customIcon = new L.Icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

function App() {
  const auth = useAuth();
  const [assets, setAssets] = useState([]);
  const [marineModes, setMarineModes] = useState({});
  const [maintenanceInputs, setMaintenanceInputs] = useState({});

  const [showGuide, setShowGuide] = useState(false);


  const [searchTerm, setSearchTerm] = useState("");
  const [tagInputs, setTagInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [bulkGroupInput, setBulkGroupInput] = useState("");
  const [bulkNoteInput, setBulkNoteInput] = useState("");
  const [bulkNameInput, setBulkNameInput] = useState("");
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
    background: 'linear-gradient(180deg, #0c0c0d 0%, #1a1a1c 100%)', borderRadius: '14px', 
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

  // Centralized Filter Memo Pool Matrix
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

  // Extract dynamic auto-suggest keywords from our live device collection state
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

  // Unauthenticated Public Sharing Viewport Data Fetch Loop
  useEffect(() => {
    if (!isSharePage || !shareTokenParam) return;

    async function processPublicEscalationFetch() {
      setIsShareLoading(true);
      try {
        const targetId = shareTokenParam.split("_")[0];
        const response = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          KeyConditionExpression: "deviceId = :id",
          FilterExpression: "shareToken = :tok",
          ExpressionAttributeValues: { ":id": targetId, ":tok": shareTokenParam }
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

  // Auto-Scrub Circuit: Breaks state mismatch loops by stripping parameters out of the address bar
  useEffect(() => {
    if (auth.error && (window.location.search.includes('code=') || window.location.search.includes('state='))) {
      console.warn("State mismatch detected with parameters active. Executing safety URL rewrite.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin;
    }
  }, [auth.error]);

  // Secure Gateway Gate Hook Loop: Fully parameterized callback verification matrix
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
      const scanResponse = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData" }));
      const items = scanResponse.Items || [];

      if (items.length === 0) {
        setAssets([]);
        return;
      }
      
      const grouped = {};
      items.forEach(item => {
        if (item.deviceId) {
          const id = item.deviceId.slice(-5);
          if (!grouped[id]) grouped[id] = [];
          grouped[id].push(item);
        }
      });

      const processed = await Promise.all(Object.keys(grouped).map(async (id) => {
        const history = grouped[id].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const latest = history[0];
        const loc = await getLocationInfo(latest.latitude, latest.longitude);
        latest.path = history.slice(0, 10).filter(p => p.latitude && p.longitude).map(p => [Number(p.latitude), Number(p.longitude)]);
        
        let estTimeRemaining = "Calculating...";
        const currentBattery = Number(latest.battery) || 100;

        if (currentBattery <= 0) {
          estTimeRemaining = "Depleted";
        } else if (history.length > 1) {
          const pastPing = history.find(ping => (Number(ping.battery) || 100) > currentBattery);
          
          if (pastPing) {
            const timeDiffMs = new Date(latest.timestamp) - new Date(pastPing.timestamp);
            const hoursDiff = timeDiffMs / (1000 * 60 * 60);
            const batteryDrop = Number(pastPing.battery) - currentBattery;
            
            if (hoursDiff > 0 && batteryDrop > 0) {
              const dropPerHour = batteryDrop / hoursDiff;
              const hoursRemaining = currentBattery / dropPerHour;
              
              if (hoursRemaining > 48) {
                estTimeRemaining = `${Math.floor(hoursRemaining / 24)} days`;
              } else if (hoursRemaining > 1) {
                estTimeRemaining = `${Math.floor(hoursRemaining)} hrs`;
              } else {
                estTimeRemaining = `${Math.floor(hoursRemaining * 60)} mins`;
              }
            }
          }
        }

        // Failsafe: Align with 12-month IoT hardware baseline (365 days)
        if (estTimeRemaining === "Calculating...") {
           const fallbackDays = (currentBattery / 100) * 365;
           if (fallbackDays >= 60) {
               estTimeRemaining = `${Math.floor(fallbackDays / 30)} months`;
           } else if (fallbackDays > 2) {
               estTimeRemaining = `${Math.floor(fallbackDays)} days`;
           } else {
               estTimeRemaining = `${Math.floor(fallbackDays * 24)} hrs`;
           }
        }

        return { ...latest, deviceId: id, tag: history.find(i => i.tag)?.tag || "", city: loc.city, estTimeRemaining };
      }));
      setAssets(processed);
    } catch (err) { setDbError(err.message); }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchDevices();
      const interval = setInterval(fetchDevices, 60000);
      return () => clearInterval(interval);
    }
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

  const setMaintenanceInterval = async (deviceId, timestamp, months) => {
    const numMonths = parseInt(months, 10);
    if (numMonths === 0 || isNaN(numMonths)) {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "REMOVE maintenanceInterval, maintenanceDueDate"
      }));
      addNote(deviceId, timestamp, "🗓️ Maintenance schedule cleared (Opted Out).");
    } else {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + numMonths);
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "SET maintenanceInterval = :mi, maintenanceDueDate = :md",
        ExpressionAttributeValues: { ":mi": numMonths, ":md": dueDate.toISOString() }
      }));
      addNote(deviceId, timestamp, `🔧 Service logged & timer set. Next due: ${dueDate.toLocaleDateString()}`);
    }
    fetchDevices();
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
          n => !(n.text === targetNote.text && n.time === targetNote.time)
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

  const applySingleFactoryReset = async (id, batteryLevel, lat, lon) => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: PERMANENTLY wipe ALL historical logs, tracking data, and names for device ${id}? This cannot be undone.`)) return;
    try {
        const queryResponse = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          KeyConditionExpression: "deviceId = :id",
          ExpressionAttributeValues: { ":id": id }
        }));
        const items = queryResponse.Items || [];
        await Promise.all(items.map(item => 
          docClient.send(new DeleteCommand({
            TableName: "AssetTrackerData",
            Key: { deviceId: id, timestamp: item.timestamp }
          }))
        ));
        const cleanTimestamp = new Date().toISOString();
        await docClient.send(new UpdateCommand({
          TableName: "AssetTrackerData",
          Key: { deviceId: id, timestamp: cleanTimestamp },
          UpdateExpression: "SET isServiceMode = :sm, battery = :bat, latitude = :lat, longitude = :lon",
          ExpressionAttributeValues: { 
            ":sm": true,
            ":bat": batteryLevel || 100,
            ":lat": lat || 0,
            ":lon": lon || 0
          }
        }));
        await addNote(id, cleanTimestamp, "🛡️ Factory Reset: Device Wiped and Re-initialized");
        alert(`Successfully purged and reset device ${id}.`);
        fetchDevices();
    } catch (err) { 
        console.error("Deep Purge Error:", err);
        alert("Reset failed. Check console for details."); 
    }
  };

  // --- NEW FEATURE: Bulk Factory Reset (Wipe Devices) ---
  const applyBulkFactoryReset = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: PERMANENTLY wipe ALL historical logs, tracking data, and names for ${selectedDevices.length} selected devices? This cannot be undone.`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId === id);
            if (!dev) return;
            const queryResponse = await docClient.send(new QueryCommand({
              TableName: "AssetTrackerData",
              KeyConditionExpression: "deviceId = :id",
              ExpressionAttributeValues: { ":id": id }
            }));
            const items = queryResponse.Items || [];
            await Promise.all(items.map(item => 
              docClient.send(new DeleteCommand({
                TableName: "AssetTrackerData",
                Key: { deviceId: id, timestamp: item.timestamp }
              }))
            ));
            const cleanTimestamp = new Date().toISOString();
            await docClient.send(new UpdateCommand({
              TableName: "AssetTrackerData",
              Key: { deviceId: id, timestamp: cleanTimestamp },
              UpdateExpression: "SET isServiceMode = :sm, battery = :bat, latitude = :lat, longitude = :lon",
              ExpressionAttributeValues: { 
                ":sm": true,
                ":bat": dev.battery || 100,
                ":lat": dev.latitude || 0,
                ":lon": dev.longitude || 0
              }
            }));
            await addNote(id, cleanTimestamp, "🛡️ Factory Reset: Device Wiped and Re-initialized");
        }));
        alert(`Successfully purged and reset ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { 
        console.error("Deep Purge Error:", err);
        alert("Bulk reset failed. Check console for details."); 
    }
  };

  const executeLiveShareEscalation = async () => {
    if (!isAdmin) {
      alert("Security Violation: Only administrator accounts are cleared to authorize external view vectors.");
      setSharingAsset(null);
      return;
    }
    if (!shareEmail || !shareEmail.trim() || !sharingAsset) return;
    
    const secureToken = sharingAsset.deviceId + "_" + crypto.randomUUID();
    const durationMs = parseInt(shareDuration, 10) * 60 * 60 * 1000;
    const expirationTimestamp = Date.now() + durationMs;

    try {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId: sharingAsset.deviceId, timestamp: sharingAsset.timestamp },
        UpdateExpression: "SET shareToken = :tok, shareExpires = :exp, shareEmail = :em, isStolenFlag = :st",
        ExpressionAttributeValues: {
          ":tok": secureToken,
          ":exp": expirationTimestamp,
          ":em": shareEmail.trim().toLowerCase(),
          ":st": true
        }
      }));
      
      alert(`Secure Track link dispatched to ${shareEmail} for the next ${shareDuration} hours.`);
      setSharingAsset(null);
      setShareEmail("");
      fetchDevices();
    } catch (err) {
      console.error("Failed writing escalation token to data node:", err);
      alert("System update failure. Verify database permissions.");
    }
  };

  const clearHomeLocation = async (deviceId, timestamp) => {
    await Promise.all([
      docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "REMOVE homeLat, homeLon"
      })),
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
    const results = await Promise.all(selectedDevices.map(async (id) => {
      try {
        const dev = assets.find(a => a.deviceId === id);
        if (!dev) throw new Error("Device " + id + " not found");
        await updateAttribute(dev.deviceId, dev.timestamp, 'group', bulkGroupInput.trim(), '#g');
        return { id, success: true };
      } catch (err) {
        console.error("Failed to update " + id + ":", err);
        return { id, success: false, error: err.message };
      }
    }));
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      alert(`Bulk group update partial failure: ${failures.map(f => f.id).join(", ")}`);
    } else {
      alert(`Assigned group folder "${bulkGroupInput.trim()}" to ${selectedDevices.length} Kinetic Cards.`);
    }
    resetAllInputs();
    fetchDevices();
  };

  const applyBulkNote = async () => {
    if (!bulkNoteInput || !bulkNoteInput.trim()) return;
    if (!window.confirm(`Are you sure you want to broadcast this timeline log entry to all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return addNote(dev.deviceId, dev.timestamp, bulkNoteInput.trim());
    }));
    alert(`Broadcast log note to ${selectedDevices.length} Kinetic Card timelines.`);
    setBulkNoteInput("");
    setBulkNameInput("");
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkSetHome = async () => {
    if (!window.confirm(`Are you sure you want to set the current lock position as the home location anchor for all ${selectedDevices.length} selected devices?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return setHomeLocation(dev.deviceId, dev.timestamp, dev.latitude, dev.longitude);
    }));
    alert(`Saved home target geofence anchors for ${selectedDevices.length} devices.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Are you sure you want to completely wipe out and clear the home location anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return clearHomeLocation(dev.deviceId, dev.timestamp);
    }));
    alert(`Cleared home target anchors for ${selectedDevices.length} Kinetic Cards.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkSequentialNaming = async (inputString) => {
    if (!inputString || !inputString.trim()) return;
    const match = inputString.trim().match(/^(.*?)-(\d+)$/);
    let baseName = inputString.trim();
    let startIndex = 1;
    if (match) {
      baseName = match[1];
      startIndex = parseInt(match[2], 10);
    }
    try {
      await Promise.all(selectedDevices.map(async (id, index) => {
        const dev = assets.find(a => a.deviceId === id);
        if (!dev) return;
        const sequentialName = `${baseName}-${startIndex + index}`;
        await updateAttribute(dev.deviceId, dev.timestamp, 'tag', sequentialName, '#t');
      }));
      alert(`Successfully generated sequential tags for ${selectedDevices.length} assets!`);
      resetAllInputs();
      fetchDevices();
    } catch (err) {
      console.error("Sequential naming fault:", err);
    }
  };

  const resetAllInputs = () => {
    setSearchTerm("");
    setBulkGroupInput("");
    setBulkNoteInput("");
    setBulkNameInput("");
    setTagInputs({});
    setNoteInputs({});
    setSelectedDevices([]);
    setStatusFilter("all");
    setActiveGroupFilter("all");
    setNamingFilter("all");
  };

  const revokeLiveShare = async (deviceId, timestamp) => {
    if (!isAdmin) return;
    if (!window.confirm("Immediately terminate the active tracking link and revoke access?")) return;
    try {
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "REMOVE shareToken, shareExpires, shareEmail, isStolenFlag"
      }));
      alert("Tracking link revoked successfully.");
      fetchDevices();
    } catch (err) {
      console.error("Failed to revoke link:", err);
      alert("System update failure.");
    }
  };

  const emailReport = () => {
    if (!isAdmin) return;
    if (filteredAssets.length === 0) { alert("No data to email."); return; }
    const subject = encodeURIComponent(`Kinetic Cards Status Report - ${new Date().toLocaleDateString()}`);
    let bodyText = "KINETIC CARDS - SYSTEM REPORT\n\n";
    filteredAssets.forEach(a => {
      const status = a.isOffline ? "Offline" : a.isGeofenceViolation ? "Geofence Alert" : a.isLowBattery ? "Low Battery" : "Active";
      bodyText += `ID: ${a.deviceId} | Tag: ${a.tag || "UNNAMED"} | Group: ${a.group || "N/A"}\n`;
      bodyText += `Status: ${status} | Battery: ${a.battery || 100}% (${a.estTimeRemaining || "Unknown"})\n`;
      bodyText += `Location: ${a.city || "Unknown"} [${a.latitude}, ${a.longitude}]\n`;
      bodyText += `--------------------------------------------------\n`;
    });
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

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
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{sharedAsset?.latitude?.toFixed(5)}, {sharedAsset?.longitude?.toFixed(5)}</div>
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
              href={`https://www.openstreetmap.org/?mlat=${sharedAsset?.latitude}&mlon=${sharedAsset?.longitude}#map=15/${sharedAsset?.latitude}/${sharedAsset?.longitude}`}
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
        .custom-scrollbar-viewport::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
          display: block !important;
        }
        .custom-scrollbar-viewport::-webkit-scrollbar-track {
          background: #e5e5ea !important;
          border-radius: 4px !important;
        }
        .custom-scrollbar-viewport::-webkit-scrollbar-thumb {
          background: #86868b !important;
          border-radius: 4px !important;
        }
        .custom-scrollbar-viewport {
          scrollbar-width: thin !important;
          scrollbar-color: #86868b #e5e5ea !important;
        }
        @keyframes radar-pulse-glow {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-indicator-dot {
          width: 8px;
          height: 8px;
          background-color: #34c759;
          border-radius: 50%;
          display: inline-block;
          animation: radar-pulse-glow 2s infinite ease-in-out;
        }
        @keyframes emergency-battery-flash {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        .critical-battery-pulse-animation {
          animation: emergency-battery-flash 1.5s infinite ease-in-out;
        }
        
        .responsive-pill-container-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .responsive-pill-options-sub-block {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .search-row-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .card-split-columns-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .sticky-search-panel-container {
            padding: 12px 14px !important;
            top: 4px !important;
          }
          .responsive-pill-container-row {
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
          }
          .responsive-pill-options-sub-block {
            justify-content: flex-start;
            gap: 6px;
          }
          .responsive-pill-options-sub-block button {
            flex: 1 1 auto;
            padding: 5px 10px !important;
            font-size: 11px !important;
          }
          .responsive-panel-footer-action-deck {
            margin-top: 8px !important;
            padding-top: 8px !important;
          }
          
          .card-split-columns-view {
            flex-direction: row !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .card-column-left-telemetry {
            flex: 1.1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .card-column-right-mapping {
            flex: 0.9;
            min-width: 0;
            height: 120px !important;
            margin-top: 0 !important;
          }
          
          .card-column-right-mapping iframe {
            width: 300% !important;
            height: calc(100% + 40px) !important;
            margin-left: -100% !important;
            margin-top: -10px !important;
            border: none !important;
          }
          
          .timeline-wrapper-panel {
            margin-top: 8px !important;
            padding: 10px 12px !important;
          }
          .timeline-scroll-track-box {
            height: 100px !important;
          }
        }
        .marine-home-group { display: flex; gap: 20px; flex-direction: row-reverse; }
        @media (max-width: 768px) {
          .marine-home-group { flex-direction: column; width: 100%; gap: 12px; }
          .marine-home-group button { width: 100%; }
        }

      `}</style>

      <header style={headerStyle}>
        <img src="/CSGroup_Logo_Main_White.webp" alt="Client Logo" style={{ height: '70px', objectFit: 'contain', maxWidth: '100%' }} />
        
        <div style={{ 
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: '500',
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
            {auth.user?.profile.email} 
            {isAdmin && <span style={{ color: '#86868b', fontSize: '12px', fontWeight: '400', marginLeft: '6px' }}>/ ADMIN</span>}
        </div>
        
        <button onClick={handleSignOut} style={{ 
          backgroundColor: '#ffffff', 
          color: '#000000', 
          border: 'none', 
          padding: '6px 18px', 
          fontSize: '12px', 
          borderRadius: '14px', 
          cursor: 'pointer', 
          fontWeight: '600',
          transition: 'all 0.2s'
        }}>Sign Out</button>
      </header>

      {dbError && (
        <div style={{ backgroundColor: '#ff3b30', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: '600', textAlign: 'center', boxShadow: '0 4px 12px rgba(255,59,48,0.2)' }}>
          ⚠️ {dbError}
        </div>
      )}
      
      <div style={{ maxWidth: '1140px', margin: '20px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Compressed Real-Estate Search Panel Deck */}
        <div className="sticky-search-panel-container" style={stickySearchCardStyle}>
          <div className="search-row-input-wrapper">
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={labelStyle}>Search Inventory</div>
                <input 
                  list="inventory-suggestions-list"
                  placeholder="Filter by ID, region, folder..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} 
                />
                <datalist id="inventory-suggestions-list">
                  {inventorySuggestions.map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                ...secondaryButtonStyle,
                alignSelf: 'flex-end',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: showFilters ? '#1d1d1f' : 'transparent',
                color: showFilters ? '#ffffff' : '#1d1d1f'
              }}
            >
              {showFilters ? '✕ Close Filter' : '🎛️ Select Groups'}
            </button>
          </div>
          
          {/* Reactive Inline App Slider Tray Component */}
          <div style={{
            display: showFilters ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '12px',
            borderTop: '1px solid #e5e5ea',
            paddingTop: '12px'
          }}>
            {/* Row A: Hardware Core Alerts */}
            <div className="responsive-pill-container-row">
              <span style={{ ...labelStyle, width: '80px', margin: 0 }}>Status</span>
              <div className="responsive-pill-options-sub-block">
                <button onClick={() => setStatusFilter("all")} style={getPillStyle(statusFilter === "all")}>All</button>
                <button onClick={() => setStatusFilter("offline")} style={getPillStyle(statusFilter === "offline")}>🔴 Offline</button>
                <button onClick={() => setStatusFilter("geofence")} style={getPillStyle(statusFilter === "geofence")}>🟠 Geofence</button>
                <button onClick={() => setStatusFilter("low_battery")} style={getPillStyle(statusFilter === "low_battery")}>🪫 Low Batt</button>
              </div>
            </div>

            {/* Row B: Operational Group Folders */}
            <div className="responsive-pill-container-row">
              <span style={{ ...labelStyle, width: '80px', margin: 0 }}>Groups</span>
              <div className="responsive-pill-options-sub-block">
                <button onClick={() => setActiveGroupFilter("all")} style={getPillStyle(activeGroupFilter === "all")}>All</button>
                {distinctGroups.map(grp => (
                  <button key={grp} onClick={() => setActiveGroupFilter(grp)} style={getPillStyle(activeGroupFilter === grp)}>📦 {grp}</button>
                ))}
              </div>
            </div>

            {/* Row C: Naming Conventions */}
            <div className="responsive-pill-container-row">
              <span style={{ ...labelStyle, width: '80px', margin: 0 }}>Naming</span>
              <div className="responsive-pill-options-sub-block">
                <button onClick={() => setNamingFilter("all")} style={getPillStyle(namingFilter === "all")}>All</button>
                <button onClick={() => setNamingFilter("named")} style={getPillStyle(namingFilter === "named")}>📝 Named</button>
                <button onClick={() => setNamingFilter("unnamed")} style={getPillStyle(namingFilter === "unnamed")}>🔎 Unnamed</button>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #e5e5ea', paddingTop: '10px' }}>
             <div style={{ marginRight: 'auto', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', fontWeight: '500', color: '#86868b', alignItems: 'center' }}>
                
                {/* Master Selective Toggle Checkbox Interface Vector */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d1d1f', cursor: 'pointer', fontWeight: '600', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredAssets.length > 0 && filteredAssets.every(a => selectedDevices.includes(a.deviceId))} 
                    onChange={() => {
                      const visibleIds = filteredAssets.map(a => a.deviceId);
                      const isAllSelected = filteredAssets.every(a => selectedDevices.includes(a.deviceId));
                      if (isAllSelected) {
                        setSelectedDevices(prev => prev.filter(id => !visibleIds.includes(id)));
                      } else {
                        setSelectedDevices(prev => Array.from(new Set([...prev, ...visibleIds])));
                      }
                    }}
                    style={{ width: '15px', height: '15px', accentColor: '#1d1d1f', cursor: 'pointer' }} 
                  />
                  Select All Visible ({filteredAssets.length})
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: alertCount > 0 ? '#ff3b30' : '#d2d2d7' }}></div> 
                  {alertCount} Alert
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34c759' }}></div> 
                  {healthyCount} Stable
                </div>
             </div>
             {isAdmin && (<><button onClick={() => window.location.href="mailto:kennethcurryjr@gmail.com?subject=Kinetic%20Cards%20Portal%20Feedback"} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px" }}>✉️ Feedback</button> <button onClick={() => alert("Español localization is currently in development.")} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px" }}>🌐 Español</button> <button onClick={emailReport} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: "#007aff", color: "#007aff" }}>✉️ Email Report</button></>)}
             <button onClick={() => { fetchDevices(); alert("Data successfully synced with live database."); }} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: "#34c759", color: "#34c759" }}>🔄 Sync Data</button>
             <button onClick={() => setShowGuide(true)} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px" }}>📖 Quick Guide</button> <button onClick={resetAllInputs} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px" }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 0.33fr))', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
          {filteredAssets.map(item => {
              const historicalNotes = item.notesList || [];
              const batteryLevel = item.battery !== undefined ? Number(item.battery) : 100;
              const sparkColor = getBatteryStatusColor(batteryLevel);
              

              return (
                <div key={item.deviceId.slice(-5)} style={{ ...deviceCardStyle, backgroundColor: '#ffffff' }}>
                  
                  {/* Split Responsive Core Row */}
                  <div className="card-split-columns-view">
                    
                    {/* Left Hand Data Block */}
                    <div className="card-column-left-telemetry">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input type="checkbox" checked={selectedDevices.includes(item.deviceId.slice(-5))} onChange={() => setSelectedDevices(prev => prev.includes(item.deviceId.slice(-5)) ? prev.filter(i => i !== item.deviceId.slice(-5)) : [...prev, item.deviceId.slice(-5)])} style={{ width: '16px', height: '16px', accentColor: '#1d1d1f', cursor: 'pointer' }} />
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                            {item.tag ? item.tag : 'UNNAMED'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {item.isOffline && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff3b30', borderRadius: '4px' }}>Offline</span>}
                          {item.isGeofenceViolation && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff9500', borderRadius: '4px' }}>Geofence</span>}
                          {item.isLowBattery && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#b7094c', borderRadius: '4px' }}>Low Batt</span>}
                          {marineModes?.[item.deviceId.slice(-5)] && <span style={{ color: "#ffffff", fontSize: "9px", fontWeight: "700", textTransform: "uppercase", padding: "2px 6px", backgroundColor: "#007aff", borderRadius: "4px" }}>⚓ Marine</span>}

                      </div>

                      <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: '500', color: '#1d1d1f' }}>{item.city || "Locating"}</div>
                        <div style={{ fontSize: '11px' }}>ID: {item.deviceId.slice(-5)}</div>
                        {item.group && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>📦 {item.group}</div>}
                      </div>

                      {/* Micro Battery Spark Gauge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', backgroundColor: '#f5f5f7', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e5ea' }}>
                        <div style={{ width: '40px', height: '4px', backgroundColor: '#e5e5ea', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${batteryLevel}%`, height: '100%', backgroundColor: sparkColor }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: sparkColor }}>{batteryLevel}%</span>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#86868b', borderLeft: '1px solid #d2d2d7', paddingLeft: '8px', marginLeft: '2px' }}>{item.estTimeRemaining}</span>
                      </div>
                    </div>
                    
                    {/* Right Hand Inline Micro Map Box */}
                    <div 
                      className="card-column-right-mapping"
                      onClick={() => setActiveMapModalAsset(item)}
                      style={{ 
                        position: 'relative', 
                        height: '100px', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: '1px solid #d2d2d7', 
                        cursor: 'pointer',
                        backgroundColor: '#f5f5f7'
                      }}
                    >
                      <iframe title="map-thumb" width="100%" height="100%" frameBorder="0" scrolling="no" src={item.latitude && !isNaN(Number(item.latitude)) ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(item.longitude)-0.02}%2C${Number(item.latitude)-0.02}%2C${Number(item.longitude)+0.02}%2C${Number(item.latitude)+0.02}&layer=mapnik&marker=${Number(item.latitude)}%2C${Number(item.longitude)}` : "about:blank"} style={{ pointerEvents: "none", border: "none" }}></iframe>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, background: 'transparent' }}></div>
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', zIndex: 20, backgroundColor: 'rgba(29, 29, 31, 0.85)', color: '#ffffff', fontSize: '9px', fontWeight: '600', padding: '2px 4px', borderRadius: '3px' }}>
                        ⛶ Expand
                      </div>
                    </div>
                    
                  </div>

                  {/* Crunched Operations Rows */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input placeholder="Rename Asset..." value={tagInputs[item.deviceId.slice(-5)] || ""} onChange={(e) => setTagInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f5f5f7' }} />
                      <button onClick={() => updateAttribute(item.deviceId.slice(-5), item.timestamp, 'tag', tagInputs[item.deviceId.slice(-5)], '#t')} style={{ ...primaryButtonStyle, padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>Save</button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap' }}>
                      {isAdmin && (item.shareToken ? <button onClick={() => revokeLiveShare(item.deviceId.slice(-5), item.timestamp)} style={{ ...secondaryButtonStyle, padding: "6px 10px", fontSize: "11px", borderRadius: "8px", flex: 1, borderColor: "#ff3b30", color: "#ff3b30" }}>Revoke</button> : <button onClick={() => setSharingAsset(item)} style={{ ...primaryButtonStyle, padding: "6px 10px", fontSize: "11px", borderRadius: "8px", flex: 1 }}>Share</button>)}
                      
                      {/* Watchdog Status Button with Conditional Radar Light */}
        <button onClick={() => toggleServiceMode(item.deviceId.slice(-5), item.timestamp, item.isServiceMode)} style={{ ...buttonStyle, fontSize: '11px', borderRadius: '8px', flex: 1.5, padding: '6px 10px', backgroundColor: item.isServiceMode === false ? '#1d1d1f' : 'transparent', color: item.isServiceMode === false ? '#ffffff' : '#1d1d1f', border: '1px solid #1d1d1f' }}>
          {item.isServiceMode === false && <span className="live-pulse-indicator-dot"></span>}
          {item.isServiceMode === false ? 'Watchdog active' : 'Watchdog off'}
                      </button>
                      
                      {/* Secure Double-Validation Toggling Anchor Controls */}
                      <button 
                        onClick={() => {
                          if (item.homeLat) {
                            if (window.confirm(`Are you sure you want to permanently clear the home location geofence anchor for ${item.tag || item.deviceId.slice(-5)}?`)) {
                              clearHomeLocation(item.deviceId.slice(-5), item.timestamp).then(fetchDevices);
                            }
                          } else {
                            setHomeLocation(item.deviceId.slice(-5), item.timestamp, item.latitude, item.longitude);
                          }
                        }} 
                        style={{ ...buttonStyle, fontSize: "11px", borderRadius: "8px", flex: 1.2, padding: "6px 10px", backgroundColor: item.homeLat ? "transparent" : "#1d1d1f", color: item.homeLat ? "#1d1d1f" : "#ffffff", border: item.homeLat ? "1px solid #1d1d1f" : "none" }}
                      >
                        {item.homeLat ? "Clear Home" : "Set Home"}
                      </button>
                  </div>
                  
                      <div style={{ display: "flex", gap: "6px", width: "100%", marginTop: "12px", marginBottom: "8px", alignItems: "center", backgroundColor: "#f5f5f7", padding: "8px", borderRadius: "8px", border: "1px solid #e5e5ea", boxSizing: "border-box", flexWrap: "wrap" }}>
                        {!item.maintenanceInterval ? (
                          <>
                            <select value={maintenanceInputs[item.deviceId.slice(-5)] || "0"} onChange={(e) => setMaintenanceInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #d2d2d7", fontSize: "11px", backgroundColor: "#ffffff", color: "#1d1d1f", flex: 1, outline: "none" }}>
                              <option value="0">Off (Opt-Out)</option>
                              <option value="1">1 Month</option>
                              <option value="3">3 Months</option>
                              <option value="6">6 Months</option>
                              <option value="9">9 Months</option>
                              <option value="12">12 Months</option>
                            </select>
                            <button onClick={() => setMaintenanceInterval(item.deviceId.slice(-5), item.timestamp, maintenanceInputs[item.deviceId.slice(-5)] || "0")} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #1d1d1f", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "#1d1d1f", color: "#ffffff" }}>Schedule Service</button>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                              <span style={{ width: "8px", height: "8px", backgroundColor: "#34c759", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 4px rgba(52, 199, 89, 0.6)" }}></span>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#34c759", textTransform: "uppercase" }}>Service Scheduled</span>
                            </div>
                            <button onClick={() => setMaintenanceInterval(item.deviceId.slice(-5), item.timestamp, item.maintenanceInterval)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #34c759", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "transparent", color: "#34c759" }}>✅ Log & Reset</button>
                            <button onClick={() => setMaintenanceInterval(item.deviceId.slice(-5), item.timestamp, "0")} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ff3b30", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "transparent", color: "#ff3b30" }}>Opt Out</button>
                          </>
                        )}
                      </div>

                  {/* Interactive Timeline Stepper for Logs */}
                  <div className="timeline-wrapper-panel" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#f5f5f7', borderRadius: '8px', border: '1px solid #d2d2d7' }}>
                    <div className="custom-scrollbar-viewport timeline-scroll-track-box" style={{ display: 'block', height: '110px', overflowY: 'scroll', overflowX: 'hidden', marginBottom: '8px', paddingRight: '2px', boxSizing: 'border-box' }}>
                      {historicalNotes.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '12px', borderLeft: '2px solid #d2d2d7', marginLeft: '4px' }}>
                          {historicalNotes.map((logEntry, index) => {
                            const nodeColor = getTimelineMarkerColor(logEntry.text);
                            return (
                              <div key={index} style={{ position: 'relative', paddingBottom: index !== historicalNotes.length - 1 ? '12px' : '2px', color: '#1d1d1f', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                                <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nodeColor, border: '2px solid #f5f5f7', boxShadow: '0 0 0 1px ' + nodeColor, zIndex: 2 }}></div>
                                <div style={{ flex: 1, minWidth: '0' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.3', wordBreak: 'break-word' }}>{logEntry.text}</div>
                                  <div style={{ color: '#86868b', fontSize: '10px', marginTop: '1px' }}>
                                    {logEntry.user.split('@')[0]} • <span style={{ fontSize: '9px', color: '#86868b' }}>{logEntry.time.includes('-') ? logEntry.time : `${logEntry.time} • 00:00 AM`}</span>
                                  </div>
                                </div>
                                {isAdmin && (
                                  <button 
                                    onClick={() => deleteNote(item.deviceId.slice(-5), logEntry)} 
                                    style={{ color: '#ff3b30', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(255, 59, 48, 0.05)', borderRadius: '4px', flexShrink: 0 }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#86868b', fontStyle: 'italic' }}>No timeline logs.</div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e5e5ea', paddingTop: '8px' }}>
                        <input placeholder="Add note..." value={noteInputs[item.deviceId.slice(-5)] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ ...inputStyle, flex: 1, backgroundColor: '#ffffff', padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }} />
                        <button onClick={() => addNote(item.deviceId.slice(-5), item.timestamp, noteInputs[item.deviceId.slice(-5)])} style={{ ...primaryButtonStyle, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Post</button>
                    </div>
                  </div>
                  
                </div>
              );
            })}
        </div>
      </div>

      {/* Full-Screen High-Contrast Interactive Map Overlay Modal Window */}
      {activeMapModalAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 6000, padding: '24px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '800px', height: '80vh', border: '1px solid #d2d2d7', boxShadow: '0 30px 70px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em' }}>
                  {activeMapModalAsset.tag ? `${activeMapModalAsset.tag} — ${activeMapModalAsset.deviceId}` : activeMapModalAsset.deviceId}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#86868b' }}>Live Coordinates Matrix: <span style={{ color: '#1d1d1f', fontWeight: '500' }}>{activeMapModalAsset.latitude?.toFixed(5)}, {activeMapModalAsset.longitude?.toFixed(5)}</span></p>
              </div>
              <button onClick={() => setActiveMapModalAsset(null)} style={{ ...secondaryButtonStyle, padding: '8px 18px', fontSize: '13px', borderRadius: '14px', cursor: 'pointer' }}>Close Map</button>
            </div>
            <div style={{ flex: 1, width: '100%', backgroundColor: '#f5f5f7', position: 'relative' }}>
              <iframe title="map-modal" width="100%" height="100%" frameBorder="0" scrolling="no" src={activeMapModalAsset?.latitude && !isNaN(Number(activeMapModalAsset.latitude)) ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(activeMapModalAsset.longitude)-0.02}%2C${Number(activeMapModalAsset.latitude)-0.02}%2C${Number(activeMapModalAsset.longitude)+0.02}%2C${Number(activeMapModalAsset.latitude)+0.02}&layer=mapnik&marker=${Number(activeMapModalAsset.latitude)}%2C${Number(activeMapModalAsset.longitude)}` : "about:blank"}></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Monochromatic High-Contrast Apple-style Modal Overlay for Token Management */}
      {sharingAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '440px', border: '1px solid #d2d2d7', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '600', letterSpacing: '-0.02em' }}>Escalate Live Tracking</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Generate a secure external reference view for Device ID: <span style={{ fontWeight: '600', color: '#1d1d1f' }}>{sharingAsset.deviceId}</span></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Recipient Email Address</label>
                <input type="email" placeholder="e.g. investigator@agency.gov" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} style={inputStyle} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle}>Link Authorization Expiry</label>
                <select value={shareDuration} onChange={(e) => setShareDuration(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="12">12 Hours (Short Term Search)</option>
                  <option value="24">24 Hours (Standard Window)</option>
                  <option value="72">72 Hours (Extended Watch)</option>
                  <option value="168">7 Days (Full Recovery Span)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setSharingAsset(null); setShareEmail(""); }} style={secondaryButtonStyle}>Cancel</button>
              <button onClick={executeLiveShareEscalation} disabled={!shareEmail.trim()} style={{ ...primaryButtonStyle, opacity: !shareEmail.trim() ? 0.3 : 1 }}>Generate & Dispatch</button>
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 7000, padding: "24px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "540px", maxHeight: "85vh", overflowY: "auto", border: "1px solid #d2d2d7", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600", letterSpacing: "-0.02em" }}>Kinetic Cards v2.1 - Quick Guide</h3>
              <button onClick={() => setShowGuide(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#86868b" }}>✕</button>
            </div>
            <div style={{ fontSize: "14px", color: "#1d1d1f", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div><strong style={{ fontSize: "15px" }}>1. Finding & Filtering:</strong><br/>Use the search bar or 🎛️ Filter Drawer to locate units by ID, status (Offline, Geofence), or Group.</div>
              <div><strong style={{ fontSize: "15px" }}>2. Geofence & Watchdog:</strong><br/>Click "Set Home" to drop a GPS anchor. Activate "Watchdog" to trigger alerts if the unit moves from that anchor.</div>
              <div style={{ backgroundColor: "#f5f5f7", padding: "12px", borderRadius: "8px", borderLeft: "3px solid #007aff" }}><strong style={{ fontSize: "15px", color: "#007aff" }}>3. Marine Mode ⚓:</strong><br/>For cruise ships, <strong>DO NOT</strong> Set Home. Activate Watchdog, open the bottom bulk drawer, and toggle "Marine Mode" ON. This relies strictly on Wi-Fi drops and tamper sensors.</div>
              <div><strong style={{ fontSize: "15px" }}>4. Bulk Actions:</strong><br/>Check boxes on multiple cards to open the bottom drawer. Mass-assign groups, post logs, or toggle Marine Mode.</div>
              <div><strong style={{ fontSize: "15px" }}>5. Secure Live Sharing:</strong><br/>Click "Share" on any device to email a secure, self-destructing tracking link to law enforcement.</div>
              <div><strong style={{ fontSize: "15px" }}>6. Proactive Maintenance:</strong><br/>Select a 1-12 month interval to schedule service. Once completed, click "✅ Log & Reset" to automatically update the timeline and reset the timer.</div>
            </div>
            <button onClick={() => setShowGuide(false)} style={{ ...primaryButtonStyle, width: "100%", marginTop: "24px", padding: "14px" }}>Close Guide</button>
          </div>
        </div>
      )}

      {/* Sticky Sliding Bulk Actions Drawer Overlay Tray */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #d2d2d7',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 4000,
        transform: selectedDevices.length > 0 ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '20px 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em' }}>{selectedDevices.length} Kinetic Card{selectedDevices.length === 1 ? '' : 's'} Selected</div>
            <div style={{ fontSize: '14px', color: '#86868b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedDevices([])}>Deselect all records</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            
            {/* Action 1: Bulk Group Assignment Refactored Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                list="group-suggestions-list"
                placeholder="Assign to Group..." 
                value={bulkGroupInput}
                onChange={(e) => setBulkGroupInput(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '150px' }}
              />
              <button onClick={applyBulkGroup} disabled={!bulkGroupInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkGroupInput.trim() ? 1 : 0.4 }}>Move</button>
            </div>

            {/* Action 1.5: Sequential Auto-Naming Engine Vector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                placeholder="e.g. Cosmo-1"
                value={bulkNameInput}
                onChange={(e) => setBulkNameInput(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '140px' }}
              />
              <button onClick={() => applyBulkSequentialNaming(bulkNameInput)} disabled={!bulkNameInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkNameInput.trim() ? 1 : 0.4 }}>Sequence Name</button>
            </div>

            {/* Action 2: Bulk Timeline Log Broadcast with Phrasing and Safe Confirmation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                placeholder="Post log to Group..." 
                value={bulkNoteInput}
                onChange={(e) => setBulkNoteInput(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '240px' }}
              />
              <button onClick={applyBulkNote} disabled={!bulkNoteInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkNoteInput.trim() ? 1 : 0.4 }}>Post log to Group</button>
            </div>

            {/* Action 3: Dual Set Home Anchors with Confirmation Prompt */}
            <div className="marine-home-group"><button onClick={applyBulkSetHome} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#34c759", color: "#34c759" }}>Set Home Anchors</button><button onClick={() => { if (!window.confirm("Are you sure you want to toggle Marine Mode for " + selectedDevices.length + " selected device(s)?")) return; setMarineModes(prev => { const res = {...prev}; selectedDevices.forEach(id => res[id] = !res[id]); return res; }); alert("Marine Mode toggled for " + selectedDevices.length + " device(s)."); setSelectedDevices([]); }} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#007aff", color: "#007aff" }}>⚓ Toggle Marine Mode</button></div>

            {/* Action 4: Dual Clear Home Anchors with Confirmation Prompt */}
            <button onClick={applyBulkClearHome} style={{ ...secondaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', borderColor: '#ff9500', color: '#ff9500' }}>Clear Home Anchors</button>
            
            {/* NEW ACTION: Factory Reset Devices */}
            <button onClick={applyBulkFactoryReset} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#ff3b30", color: "#ff3b30" }}>Factory Reset</button>

          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "20px", color: "#86868b", fontSize: "12px" }}>
        Kinetic Cards v2.1
      </div>
    </div>
  );
}

export default App;
