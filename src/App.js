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
import Inventory from "./Inventory";
import Tools from "./Tools";

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
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    let cityStr = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown";
    
    // 🎰 Las Vegas Override Filter: Map local townships back to what clients actually call them
    const vegasTownships = ["winchester", "whitney", "paradise", "spring valley", "enterprise", "sunrise manor", "clark"];
    if (vegasTownships.includes(cityStr.toLowerCase())) {
        cityStr = "Las Vegas";
    }
    
    const result = { zip: data.address?.postcode || "Unknown", city: cityStr };
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


const forceSignOut = () => {
  localStorage.clear();
  sessionStorage.clear();
  const cognitoDomain = "auth.titanassets.dev";
  const clientId = "51fu0mfnpb0r0e319ftppvcbaf";
  const logoutUri = window.location.hostname === 'localhost' ? 'http://localhost:3000/' : 'https://titanassets.dev/';
  window.location.assign(`https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`);
};

function App() {
  const auth = useAuth();
  const [assets, setAssets] = useState([]);
  const [marineModes, setMarineModes] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [maintenanceInputs, setMaintenanceInputs] = useState({});

  const [showGuide, setShowGuide] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);


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

  const userGroups = auth.user?.profile?.["cognito:groups"] || [];
  const isClient = userGroups.includes("Client");
  const isWarehouseManager = userGroups.includes("Warehouse-Managers");
  const isFleetTracker = userGroups.includes("Fleet-Trackers");
  
  // Explicitly map the new Kinetic Tools groups
  const isToolsAdmin = userGroups.includes("KineticToolsAdmins") || userGroups.includes("Kinetic-Tools-Admins");
  const isToolsTech = userGroups.includes("KineticToolsTechs") || userGroups.includes("Kinetic-Tools-Techs");

  // Only global Admins get the app switcher
  const isSuperAdmin = userGroups.includes("Admins") || (!isWarehouseManager && !isFleetTracker && !isClient && !isToolsAdmin && !isToolsTech);
  
  // But a Tools Admin still gets all the local admin buttons inside the dashboard
  const isAdmin = isSuperAdmin || isToolsAdmin;

  // Force Tools Admins and Techs directly into the tools portal
  const [activePortal, setActivePortal] = useState(
    (isClient || isToolsAdmin || isToolsTech) ? "tools" : 
    (isWarehouseManager && !isSuperAdmin ? "inventory" : "gps")
  );

  // 🛡️ THE FIX: Auto-correct the view once Cognito finishes loading
  useEffect(() => {
    if (auth.isAuthenticated) {
      if (isClient || isToolsAdmin || isToolsTech) {
        setActivePortal("tools");
      }
    }
  }, [auth.isAuthenticated, isClient, isToolsAdmin, isToolsTech]);
  const [comingSoonModule, setComingSoonModule] = useState(null);

  // Design Tokens: High-Contrast Monochromatic System
  const appContainerStyle = { backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh', fontFamily: '"SF Pro Display", "SF Pro Text", "Helvetica Neue", "Inter", sans-serif', paddingBottom: "80px", fontSize: '15px', transition: 'padding-bottom 0.3s ease, background-color 0.5s ease-in-out', overflowX: 'clip' };
  
  const headerStyle = { 
    width: '100%',
    boxSizing: 'border-box',
    padding: '24px 24px', 
    background: 'linear-gradient(180deg, #0c0c0d 0%, #1a1a1c 100%)', borderRadius: '14px', 
    borderBottom: '1px solid #2d2d2f', 
    boxShadow: 'inset 0 -1px 0 rgba(255, 255, 255, 0.02), 0 4px 30px rgba(0, 0, 0, 0.15)',
    display: 'flex', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    gap: '12px',
    position: 'relative', overflow: 'visible'
  };
  
  const cardStyle = { backgroundColor: '#1c1c1e', borderRadius: '14px', padding: '28px', border: '1px solid #3a3a3c', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' };
  const deviceCardStyle = { backgroundColor: '#2c2c2e', borderRadius: '14px', padding: '16px', border: '1px solid #3a3a3c', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', alignItems: 'stretch' };
  const inputStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #3a3a3c', fontSize: '14px', backgroundColor: '#1c1c1e', color: '#ffffff', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { fontSize: '11px', color: '#ffffff', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  
  const buttonStyle = { padding: '10px 20px', borderRadius: '20px', border: '1px solid #ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#121212', color: '#ffffff' };
  const primaryButtonStyle = { ...buttonStyle, backgroundColor: '#ffffff', color: '#121212' };
  const secondaryButtonStyle = { ...buttonStyle, backgroundColor: "transparent",  border: "1px solid #ffffff" , color: "#ffffff", border: "1px solid #ffffff" };

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
      if (namingFilter === "unnamed_global" && !!a.tag) return false;
      if (namingFilter === "unnamed_local") {
        if (!!a.tag) return false;
        const todayStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric" });
        const isAddedToday = a.lastSeen && a.lastSeen.includes(todayStr);
        const isLocalArea = a.city && a.city.toLowerCase() === "las vegas";
        if (!isAddedToday || !isLocalArea) return false;
      }

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
          ExpressionAttributeValues: { ":id": targetId }
        }));

        if (!response.Items || response.Items.length === 0) {
          setShareError("Invalid tracking configuration signature or resource missing.");
          return;
        }

        const latestRow = response.Items.find(i => i.timestamp === "LATEST");
        if (!latestRow || latestRow.shareToken !== shareTokenParam) {
          setShareError("Invalid tracking configuration signature or resource missing.");
          return;
        }

        if (latestRow.shareExpires && Date.now() > latestRow.shareExpires) {
          setShareError("This secure tracking validation window has expired and self-terminated.");
          return;
        }

        const history = response.Items.filter(i => i.timestamp !== "LATEST").sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const activeNode = { ...(history[0] || {}), ...latestRow };

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
      // 💸 THE LIFESAVER: Query ONLY the LATEST rows via the new Index, completely ignoring historical data
      const queryResponse = await docClient.send(new QueryCommand({
        TableName: "AssetTrackerData",
        IndexName: "timestamp-index",
        KeyConditionExpression: "#ts = :val",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: { ":val": "LATEST" }
      }));
      const items = queryResponse.Items || [];

      if (items.length === 0) {
        setAssets([]);
        return;
      }
      
      const processed = await Promise.all(items.map(async (latestRow) => {
        const id = latestRow.deviceId;
        const latest = { ...latestRow };
        
        const stateKeys = ["latitude", "longitude", "batteryLevel", "deployedAt", "homeLat", "homeLon", "isServiceMode", "isMarineMode", "maintenanceInterval", "maintenanceDueDate", "shareToken", "shareExpires", "shareEmail", "isStolenFlag", "group", "tag"];
        
        for (const k of stateKeys) {
            if (latestRow[k] !== undefined) {
                latest[k] = latestRow[k] === "CLEARED" ? undefined : latestRow[k];
            }
        }
        
        latest.notesList = (latestRow.notesList || []).map(n => ({...n, rowTimestamp: 'LATEST'}));
        const loc = await getLocationInfo(latest.latitude, latest.longitude);
        
        // Breadcrumbs removed to save 99% on AWS read costs
        latest.path = []; 
        
        const currentBattery = latest.batteryLevel !== undefined ? Number(latest.batteryLevel) : 100;
        
        let estTimeRemaining = "18 mos";
        if (latest.deployedAt) {
            const deployDate = new Date(latest.deployedAt);
            const now = new Date();
            const monthsPassed = (now.getFullYear() - deployDate.getFullYear()) * 12 + (now.getMonth() - deployDate.getMonth());
            const monthsRemaining = Math.max(0, 18 - monthsPassed);
            estTimeRemaining = monthsRemaining === 0 ? "Replace unit" : `${monthsRemaining} mos`;
        }

        const lastSeen = latestRow.lastSeen 
          ? new Date(latestRow.lastSeen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', '') 
          : "Live";
          
        let isGeofenceViolation = false;
        if (latest.isServiceMode === false && !latest.isMarineMode && latest.homeLat && latest.homeLon && latest.latitude && latest.longitude) {
            const distKm = getDistanceInKm(Number(latest.homeLat), Number(latest.homeLon), Number(latest.latitude), Number(latest.longitude));
            if (distKm > 0.1) isGeofenceViolation = true;
        }
        
        const isLowBattery = currentBattery <= 20;
        const isOffline = latestRow.lastSeen ? (new Date().getTime() - new Date(latestRow.lastSeen).getTime()) > (12.5 * 60 * 60 * 1000) : false;
          
        return { ...latest, deviceId: id, tag: latest.tag || "", city: loc.city, estTimeRemaining, lastSeen, isGeofenceViolation, isLowBattery, isOffline };
      }));
      setAssets(processed);
    } catch (err) { setDbError(err.message); }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchDevices();
      const interval = setInterval(fetchDevices, 60000); // ⏱️ Throttled to 60s to prevent AWS scan billing spikes
      return () => clearInterval(interval);
    }
  }, [auth.isAuthenticated, fetchDevices]);

  const updateAttribute = async (deviceId, timestamp, field, value, attributeAlias, skipRefresh = false) => {
    console.log("DEBUG: Updating deviceId:", deviceId);
    await docClient.send(new UpdateCommand({
      TableName: "AssetTrackerData",
      Key: { deviceId, timestamp: "LATEST" },
      UpdateExpression: `set ${attributeAlias} = :val`,
      ExpressionAttributeNames: { [attributeAlias]: field },
      ExpressionAttributeValues: { ":val": value }
    }));
    if (!skipRefresh) fetchDevices();
  };

  const toggleServiceMode = async (deviceId, timestamp, currentState) => {
    const newState = !currentState;
    const user = auth.user?.profile?.email || "System";
    const time = `${new Date().toLocaleDateString('en-US')} - ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const logMsg = newState 
      ? `🛡️ Watchdog Disabled (Service Mode Engaged by ${user.split('@')[0]})` 
      : `Watchdog Activated (Monitoring Live Position by ${user.split('@')[0]})`;
    
    try {
      await Promise.all([
          updateAttribute(deviceId, "LATEST", 'isServiceMode', newState, '#sm'),
          updateAttribute(deviceId, "LATEST", 'lastServiceModeUser', user, '#lsu'),
          updateAttribute(deviceId, "LATEST", 'lastServiceModeTime', time, '#lst'),
          addNote(deviceId, "LATEST", logMsg)
      ]);
      alert(newState ? "Watchdog disabled!" : "Watchdog activated!");
    } catch (err) { console.error(err); }
  };

    const setMaintenanceInterval = async (deviceId, timestamp, actionOrMonths) => {
    const targetTimestamp = "LATEST";
    const assetRecord = assets.find(a => a.deviceId === deviceId);
    
    if (actionOrMonths === "OPT_OUT" || actionOrMonths === 0 || actionOrMonths === "0") {
      // PROPER FIX: Actually REMOVE the database attributes completely so React sees them as empty/falsy
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp: targetTimestamp },
        UpdateExpression: "SET maintenanceInterval = :c, maintenanceDueDate = :c",
        ExpressionAttributeValues: { ":c": "CLEARED" }
      }));
      await addNote(deviceId, targetTimestamp, "🗓️ Maintenance schedule cleared (Opted Out).");
    } else if (actionOrMonths === "LOG_RESET") {
      // Standard target advancement logic
      const currentInterval = parseInt(assetRecord?.maintenanceInterval, 10) || 1;
      let dueDate = new Date();
      if (assetRecord && assetRecord.maintenanceDueDate && assetRecord.maintenanceDueDate !== "CLEARED") {
          dueDate = new Date(assetRecord.maintenanceDueDate);
      }
      dueDate.setMonth(dueDate.getMonth() + currentInterval);
      
      await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp: targetTimestamp },
        UpdateExpression: "SET maintenanceDueDate = :md",
        ExpressionAttributeValues: { ":md": dueDate.toISOString() }
      }));
      await addNote(deviceId, targetTimestamp, `🔧 Service logged & timer set. Next due: ${dueDate.toLocaleDateString()}`);
    } else {
      // Initial schedule creation logic
      const numMonths = parseInt(actionOrMonths, 10);
      if (!isNaN(numMonths) && numMonths > 0) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + numMonths);
        
        await docClient.send(new UpdateCommand({
          TableName: "AssetTrackerData",
          Key: { deviceId, timestamp: targetTimestamp },
          UpdateExpression: "SET maintenanceInterval = :mi, maintenanceDueDate = :md",
          ExpressionAttributeValues: { ":mi": numMonths, ":md": dueDate.toISOString() }
        }));
        await addNote(deviceId, targetTimestamp, `📅 Service scheduled. Next due: ${dueDate.toLocaleDateString()}`);
      }
    }
    
    const shortId = deviceId.slice(-5);
    setMaintenanceInputs(prev => ({ ...prev, [shortId]: "0" }));
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
        Key: { deviceId, timestamp: "LATEST" },
        UpdateExpression: "SET #nl = list_append(if_not_exists(#nl, :empty_list), :new_note)",
        ExpressionAttributeNames: { "#nl": "notesList" },
        ExpressionAttributeValues: {
          ":new_note": [newNoteObj],
          ":empty_list": []
        }
      }));
      setNoteInputs(prev => ({...prev, [deviceId.slice(-5)]: ""}));
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

  const applySingleFactoryReset = async (deviceId) => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: Are you sure you want to clear the Name, Group, Home Anchor, and Service Schedule for this device?`)) return;
    try {
        await docClient.send(new UpdateCommand({
          TableName: "AssetTrackerData",
          Key: { deviceId, timestamp: "LATEST" },
          UpdateExpression: "SET tag = :c, #grp = :c, homeLat = :c, homeLon = :c, maintenanceInterval = :c, maintenanceDueDate = :c, isServiceMode = :sm",
          ExpressionAttributeNames: { "#grp": "group" },
          ExpressionAttributeValues: { 
            ":c": "CLEARED",
            ":sm": true
          }
        }));
        await addNote(deviceId, "LATEST", "🔄 Device profile soft-reset (Watchdog OFF).");
        alert(`Successfully reset profile for ${deviceId.slice(-5)}.`);
        fetchDevices();
    } catch (err) { 
        console.error("Soft Reset Error:", err);
        alert("Reset failed. Check console for details."); 
    }
  };

  // --- NEW FEATURE: Bulk Factory Reset (Wipe Devices) ---
  const applyBulkFactoryReset = async () => {
    if (!isAdmin) { alert("Security Violation."); return; }
    if (!window.confirm(`WARNING: Are you sure you want to clear the Name, Group, Home Anchor, and Service Schedule for all ${selectedDevices.length} selected devices?`)) return;
    try {
        await Promise.all(selectedDevices.map(async (id) => {
            const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
            if (!dev) return;
            await docClient.send(new UpdateCommand({
              TableName: "AssetTrackerData",
              Key: { deviceId: dev.deviceId, timestamp: "LATEST" },
              UpdateExpression: "SET tag = :c, #grp = :c, homeLat = :c, homeLon = :c, maintenanceInterval = :c, maintenanceDueDate = :c, isServiceMode = :sm",
              ExpressionAttributeNames: { "#grp": "group" },
              ExpressionAttributeValues: { 
                ":c": "CLEARED",
                ":sm": true
              }
            }));
            await addNote(dev.deviceId, "LATEST", "🔄 Device profile soft-reset (Watchdog OFF).");
        }));
        alert(`Successfully soft-reset profiles for ${selectedDevices.length} devices.`);
        setSelectedDevices([]);
        fetchDevices();
    } catch (err) { 
        console.error("Bulk Soft Reset Error:", err);
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
        Key: { deviceId: sharingAsset.deviceId, timestamp: "LATEST" },
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
  await docClient.send(new UpdateCommand({
    TableName: "AssetTrackerData",
    Key: { deviceId, timestamp: "LATEST" },
    UpdateExpression: "SET homeLat = :c, homeLon = :c",
    ExpressionAttributeValues: { ":c": "CLEARED" }
  }));
  await addNote(deviceId, "LATEST", `🚫 Home Anchor Cleared`);
  fetchDevices();
};

const setHomeLocation = async (deviceId, timestamp, lat, lon) => {
  const logMsg = `📍 Home Anchor Set: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  await docClient.send(new UpdateCommand({
    TableName: "AssetTrackerData",
    Key: { deviceId, timestamp: "LATEST" },
    UpdateExpression: "SET homeLat = :lat, homeLon = :lon",
    ExpressionAttributeValues: { ":lat": lat, ":lon": lon }
  }));
  await addNote(deviceId, "LATEST", logMsg);
  
  fetchDevices();
};

  const applyBulkGroup = async () => {
    if (!bulkGroupInput || !bulkGroupInput.trim()) return;
    const results = await Promise.all(selectedDevices.map(async (id) => {
      try {
        const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
        if (!dev) throw new Error("Device " + id + " not found");
        await updateAttribute(dev.deviceId, 'LATEST', 'group', bulkGroupInput.trim(), '#g', true);
        return { id, success: true };
      } catch (err) {
        console.error("Failed to update " + id + ":", err);
        return { id, success: false, error: err.message };
      }
    })); fetchDevices();
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
      const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
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
      const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
      return setHomeLocation(dev.deviceId, dev.timestamp, dev.latitude, dev.longitude);
    }));
    alert(`Saved home target geofence anchors for ${selectedDevices.length} devices.`);
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Are you sure you want to completely wipe out and clear the home location anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
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
        const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id);
        if (!dev) return;
        const sequentialName = `${baseName}-${startIndex + index}`;
        await updateAttribute(dev.deviceId, 'LATEST', 'tag', sequentialName, '#t', true);
      })); fetchDevices();
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
      Key: { deviceId, timestamp: "LATEST" },
      UpdateExpression: "SET shareToken = :c, shareExpires = :c, shareEmail = :c, isStolenFlag = :c", 
      ExpressionAttributeValues: { ":c": "CLEARED" }
    }));
    await addNote(deviceId, "LATEST", "🔒 Secure tracking link manually revoked.");
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
      bodyText += `Status: ${status} | Battery: ${a.batteryLevel !== undefined ? a.batteryLevel : 100}% (${a.estTimeRemaining || "Unknown"})\n`;
      bodyText += `Location: ${a.city || "Unknown"} [${a.latitude}, ${a.longitude}]\n`;
      bodyText += `--------------------------------------------------\n`;
    });
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

  };

  const handleSignOut = () => {
    // 1. Clear local session data synchronously (NO awaits!)
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Immediately force the browser to the Cognito logout URL before React can re-render
    const cognitoDomain = "auth.titanassets.dev";
    const clientId = "51fu0mfnpb0r0e319ftppvcbaf";
    const logoutUri = window.location.origin;
    window.location.assign(`https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`);
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
    border: '1px solid #ffffff',
    backgroundColor: isActive ? '#1d1d1f' : 'transparent',
    color: '#ffffff',
    transition: 'all 0.1s ease',
    whiteSpace: 'nowrap'
  });

  if (isSharePage) {
    if (isShareLoading) return <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff'}}>Establishing secure map tracking vector...</div>;
    if (shareError) {
      return (
        <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff', gap: '16px', padding: '0 24px', textAlign: 'center'}}>
          <div style={{fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em', color: '#ff3b30'}}>Authorization Link Revoked</div>
          <div style={{fontSize: '15px', color: '#86868b', maxWidth: '480px', lineHeight: '1.6', backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #3a3a3c'}}>{shareError}</div>
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
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Last telemetry lock recorded: <span style={{ color: '#ffffff', fontWeight: '500' }}>{new Date(sharedAsset.timestamp).toLocaleString()}</span></p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', backgroundColor: '#121212', padding: '20px', borderRadius: '10px', border: '1px solid #3a3a3c', marginBottom: '28px' }}>
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
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff', gap: '24px', padding: '0 24px', textAlign: 'center'}}>
        <div style={{fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em'}}>System Connection Mismatch</div>
        <div style={{fontSize: '15px', color: '#86868b', maxWidth: '540px', lineHeight: '1.6', backgroundColor: '#1c1c1e', padding: '24px', borderRadius: '18px', border: '1px solid #3a3a3c'}}>{auth.error.message}</div>
        <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = window.location.origin; }} style={primaryButtonStyle}>Reset Environment</button>
      </div>
    );
  }

  if (auth.isLoading || auth.activeNavigator) {
    return <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff', paddingLeft: '40px'}}>Loading dashboard systems...</div>;
  }

  if (!auth.isAuthenticated) {
    const isSigningOut = localStorage.getItem('isSigningOut') === 'true';
    return (
      <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff'}}>
        {isSigningOut ? (
          <div className="animate-in" style={{ textAlign: 'center', backgroundColor: '#1c1c1e', padding: '40px', borderRadius: '16px', border: '1px solid #3a3a3c', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700' }}>Signed Out Safely</h2>
            <p style={{ color: '#86868b', marginBottom: '24px' }}>Your session has been securely terminated.</p>
            <button 
              onClick={() => { localStorage.removeItem('isSigningOut'); auth.signinRedirect(); }} 
              style={{ padding: '12px 24px', borderRadius: '24px', border: 'none', backgroundcolor: '#ffffff', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Sign In Again
            </button>
          </div>
        ) : (
          <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"SF Pro Text", sans-serif', backgroundColor: '#121212', color: '#ffffff', paddingLeft: '40px'}}>Redirecting to secure gateway...</div>
        )}
      </div>
    );
  }

  return (
    <div style={appContainerStyle}>
<style>{`:root { overflow-y: scroll !important; scrollbar-gutter: stable; } button, .diagnostic-flip-btn, .responsive-pill-options-sub-block button { color: #ffffff !important; border: 1px solid #ffffff !important; background-color: #121212 !important; }`}</style>
      <style>{`
        .custom-scrollbar-viewport::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }
        .custom-scrollbar-viewport::-webkit-scrollbar-track {
          background: #2c2c2e !important;
          border-radius: 4px !important;
        }
        .custom-scrollbar-viewport::-webkit-scrollbar-thumb {
          background: #86868b !important;
          border-radius: 4px !important;
        }
        
        /* 🛡️ INVISIBLE MASK: Blocks cards from peeking through the 12px gap above the sticky search bar */
        .sticky-search-panel-container::before {
          content: "";
          position: absolute;
          top: -12px;
          left: -100vw;
          right: -100vw;
          height: 12px;
          background-color: #121212;
          z-index: -1;
          pointer-events: none;
        }
        .custom-scrollbar-viewport {
          scrollbar-width: thin !important;
          scrollbar-color: #86868b #2c2c2e !important;
        }
        @keyframes portalFade { 0% { opacity: 0; transform: translateY(12px) scale(0.995); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
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
        
        @keyframes flip-attention-pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.8); border-color: rgba(0, 122, 255, 0.8); }
          70% { box-shadow: 0 0 0 12px rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 1); }
          100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); border-color: rgba(0, 122, 255, 0.8); }
        }
        .diagnostic-flip-btn {
          animation: flip-attention-pulse 2s infinite ease-in-out !important;
          color: #007aff !important;
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
    display: block !important;
    visibility: visible !important;
    position: absolute !important;
    top: -60px !important;
    left: -60px !important;
    width: calc(100% + 120px) !important;
    height: calc(100% + 120px) !important;
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
        .card-perspective-wrapper { perspective: 1200px; height: 100%; display: flex; }
        .card-flipper { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; display: flex; flex-direction: column; flex: 1; }
        .card-flipper.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; width: 100%; flex: 1; box-sizing: border-box; }
        .card-front { transform: rotateY(0deg); z-index: 2; position: relative; }
        .card-back { transform: rotateY(180deg); position: absolute; top: 0; left: 0; height: 100%; background-color: #1c1c1e; color: #ffffff; border: 1px solid #3a3a3c; border-radius: 14px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
        
        @media (max-width: 768px) {
          .marine-home-group { flex-direction: column; width: 100%; gap: 12px; }
          .marine-home-group button { width: 100%; }
        }

      `}button, .diagnostic-flip-btn, .responsive-pill-options-sub-block button { color: #ffffff !important; border: 1px solid #ffffff !important; background-color: #121212 !important; }</style>
      
      {/* ---------------- DECOUPLED MASTER HEADER ---------------- */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '12px 12px 0 12px',
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <header style={{ 
          ...headerStyle, 
          borderBottomLeftRadius: '14px',
          borderBottomRightRadius: '14px',
          borderBottom: '1px solid #2d2d2f',
          boxShadow: headerStyle.boxShadow,
          marginBottom: 0
        }}>
          <div style={{ position: 'relative', height: '60px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flex: 1 }}>
          <img src="/CSGroup_Logo_Main_White.webp" alt="CS Group" style={{ position: 'absolute', height: '70px', objectFit: 'contain', transition: 'opacity 0.4s ease', opacity: activePortal === 'tools' ? 0 : 1, pointerEvents: activePortal === 'tools' ? 'none' : 'auto' }} />
          
          <div style={{ position: 'absolute', transition: 'all 0.4s ease', opacity: activePortal === 'tools' ? 1 : 0, transform: activePortal === 'tools' ? 'scale(1)' : 'scale(0.95)', pointerEvents: activePortal === 'tools' ? 'auto' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0px', userSelect: 'none' }}>
            
            {/* Native SVG Negative Space Cards */}
            <svg width="86" height="72" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>
              {/* Back Card (Dark Navy) */}
              <path d="M50 5 L95 25 L50 45 L5 25 Z" fill="#0052cc" />
              {/* Front Card (Electric Blue) */}
              <path d="M50 25 L95 45 L50 65 L5 45 Z" fill="#007aff" />
              {/* Negative Space Arrow (Bright White) */}
              <path d="M35 25 L60 25 L60 15 L85 35 L60 55 L60 45 L35 45 Z" fill="#ffffff" />
            </svg>
            
            {/* Native Typography */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontFamily: '"SF Pro Display", -apple-system, sans-serif', fontWeight: '900', fontSize: '24px', letterSpacing: '0.5px', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
              <style>{`@keyframes kineticShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }`}button, .diagnostic-flip-btn, .responsive-pill-options-sub-block button { color: #ffffff !important; border: 1px solid #ffffff !important; background-color: #121212 !important; }</style><span style={{ background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 40%, #4da3ff 50%, #ffffff 60%, #ffffff 100%)', backgroundSize: '200% auto', color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'kineticShimmer 8s linear infinite', display: 'inline-block' }}>KINETIC</span>
              <span style={{ color: '#ffcc00' }}>CARDS<span style={{ fontSize: '13px', verticalAlign: 'super', marginLeft: '2px' }}>™</span></span>
            </div>
            
          </div>
        </div>
          
          <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', padding: '6px 12px', borderRadius: '12px', transition: 'all 0.2s' }} 
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1c1c1e'; e.currentTarget.style.borderColor = '#3a3a3c'; }} 
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500', letterSpacing: '-0.01em', textAlign: 'right' }}>
              {auth.user?.profile.email}
              {isAdmin && <span style={{ color: '#86868b', fontSize: '10px', fontWeight: '700', marginLeft: '8px', border: '1px solid #3a3a3c', padding: '2px 6px', borderRadius: '6px', backgroundColor: '#121212', verticalAlign: 'middle' }}>ADMIN</span>}
            </div>
            <span style={{ color: '#86868b', fontSize: '10px', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▼</span>
          </button>
          
          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: '#1c1c1e', border: '1px solid #3a3a3c', borderRadius: '12px', padding: '6px', boxShadow: '0 14px 40px rgba(0,0,0,0.6)', zIndex: 100, minWidth: '180px' }}>
              <button 
                onClick={forceSignOut} 
                style={{ backgroundColor: 'transparent', color: '#ff3b30', border: 'none', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s' }} 
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 59, 48, 0.1)'} 
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <span style={{ fontSize: '16px' }}>⎋</span> Sign Out
              </button>
            </div>
          )}
        </div>
        </header>

        {isSuperAdmin && (
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            padding: "16px 12px 0 12px",
            borderBottom: "none"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", backgroundColor: "#2c2c2e", borderRadius: "12px", padding: "4px", boxShadow: "0 4px 14px rgba(0,0,0,0.4)", maxWidth: "100%" }}>
              <button onClick={() => setActivePortal("tools")} style={{ padding: "8px 24px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", backgroundColor: activePortal === "tools" ? "#007aff" : "transparent", color: activePortal === "tools" ? "#ffffff" : "#8e8e93", transition: "all 0.2s", whiteSpace: "nowrap" }}>Kinetic Assets</button>
              <button onClick={() => setActivePortal("gps")} style={{ padding: "8px 24px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", backgroundColor: activePortal === "gps" ? "#ffcc00" : "transparent", color: activePortal === "gps" ? "#121212" : "#8e8e93", transition: "all 0.2s", whiteSpace: "nowrap" }}>Kinetic Tracking</button>
              <button onClick={() => setActivePortal("inventory")} style={{ padding: "8px 24px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", backgroundColor: activePortal === "inventory" ? "#34c759" : "transparent", color: activePortal === "inventory" ? "#ffffff" : "#8e8e93", transition: "all 0.2s", whiteSpace: "nowrap" }}>Kinetic Inventory</button>
              <button onClick={() => setComingSoonModule("Kinetic Deployments")} style={{ padding: "8px 24px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", backgroundColor: "transparent", color: "#636366", transition: "all 0.2s", whiteSpace: "nowrap" }}>Kinetic Deployments</button>
            </div>
          </div>
        )}
      </div>
      {/* --------------------------------------------------------- */}

{/* 🔀 THE ROUTING INTERSECTION */}
      <div key={activePortal} style={{ animation: 'portalFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards', width: '100%' }}>
      {activePortal === "inventory" ? (
        <Inventory user={auth.user} />
      ) : activePortal === "tools" ? (
        <Tools user={auth.user} />
      ) : (
        <>
          {dbError && (
        <div style={{ backgroundColor: '#ff3b30', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: '600', textAlign: 'center', boxShadow: '0 4px 12px rgba(255,59,48,0.2)' }}>
          ⚠️ {dbError}
        </div>
      )}
      
      <div style={{ width: '100%', maxWidth: '1440px', margin: '16px auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
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
                color: showFilters ? '#ffffff' : '#ffffff'
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
            borderTop: '1px solid #2c2c2e',
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
                  <button key={grp} onClick={() => setActiveGroupFilter(grp)} style={getPillStyle(activeGroupFilter === grp)}>{grp}</button>
                ))}
              </div>
            </div>

            {/* Row C: Naming Conventions */}
            <div className="responsive-pill-container-row">
              <span style={{ ...labelStyle, width: '80px', margin: 0 }}>Naming</span>
              <div className="responsive-pill-options-sub-block">
                <button onClick={() => setNamingFilter("all")} style={getPillStyle(namingFilter === "all")}>All</button>
                <button onClick={() => setNamingFilter("named")} style={getPillStyle(namingFilter === "named")}>📝 Named</button>
                <button onClick={() => setNamingFilter("unnamed_global")} style={getPillStyle(namingFilter === "unnamed_global")}>🔎 UnNamed Global</button>
                <button onClick={() => setNamingFilter("unnamed_local")} style={getPillStyle(namingFilter === "unnamed_local")}>📍 UnNamed Local</button>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #2c2c2e', paddingTop: '10px' }}>
             <div style={{ marginRight: 'auto', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', fontWeight: '500', color: '#86868b', alignItems: 'center' }}>
                
                {/* Master Selective Toggle Checkbox Interface Vector */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', cursor: 'pointer', fontWeight: '600', userSelect: 'none' }}>
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
                    style={{ width: '15px', height: '15px', accentcolor: '#ffffff', cursor: 'pointer' }} 
                  />
                  Select All Visible ({filteredAssets.length})
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: alertCount > 0 ? '#ff3b30' : '#3a3a3c' }}></div> 
                  {alertCount} Alert
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34c759' }}></div> 
                  {healthyCount} Stable
                </div>
             </div>
             {isAdmin && (<><button onClick={() => window.location.href="mailto:kennethcurryjr@gmail.com?subject=Kinetic%20Cards%20Portal%20Feedback"} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", color: "#ffffff", border: "1px solid #ffffff", borderColor: "#ffffff" }}>✉️ Feedback</button> <button onClick={() => alert("Español localization is currently in development.")} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", color: "#ffffff", border: "1px solid #ffffff", borderColor: "#ffffff" }}>🌐 Español</button> <button onClick={emailReport} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: "#007aff", color: "#007aff" }}>✉️ Email Report</button></>)}
             <button onClick={() => { fetchDevices(); alert("Data successfully synced with live database."); }} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: "#34c759", color: "#34c759" }}>🔄 Sync Data</button>
             <button onClick={() => setShowGuide(true)} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", color: "#ffffff", border: "1px solid #ffffff", borderColor: "#ffffff" }}>📖 Operations Guide</button> <button onClick={resetAllInputs} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", color: "#ffffff", border: "1px solid #ffffff", borderColor: "#ffffff" }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
          {filteredAssets.map(item => {
              const historicalNotes = item.notesList || [];
              const batteryLevel = item.batteryLevel !== undefined ? Number(item.batteryLevel) : 100;
              const sparkColor = getBatteryStatusColor(batteryLevel);
              

              const isFlipped = !!flippedCards[item.deviceId];
              return (
                <div key={item.deviceId.slice(-5)} className="card-perspective-wrapper">
                  <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
                    <div className="card-face card-front" style={{ ...deviceCardStyle, backgroundColor: '#1c1c1e' }}>
                  
                  {/* Split Responsive Core Row */}
                  <div className="card-split-columns-view">
                    
                    {/* Left Hand Data Block */}
                    <div className="card-column-left-telemetry">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input type="checkbox" checked={selectedDevices.includes(item.deviceId.slice(-5))} onChange={() => setSelectedDevices(prev => prev.includes(item.deviceId.slice(-5)) ? prev.filter(i => i !== item.deviceId.slice(-5)) : [...prev, item.deviceId.slice(-5)])} style={{ width: '16px', height: '16px', accentcolor: '#ffffff', cursor: 'pointer' }} />
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                            {item.tag ? item.tag : 'UNNAMED'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {item.isOffline && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff3b30', borderRadius: '4px' }}>Offline</span>}
                          {item.isGeofenceViolation && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff9500', borderRadius: '4px' }}>Geofence</span>}
                          {item.isLowBattery && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#b7094c', borderRadius: '4px' }}>Low Batt</span>}
                          {item.isMarineMode && <span style={{  fontSize: "9px", fontWeight: "700", textTransform: "uppercase", padding: "2px 6px", backgroundColor: "#007aff", borderRadius: "4px" }}>⚓ Marine</span>}

                      </div>

                      <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: '500', color: '#ffffff' }}>{item.city || "Locating"}</div>
                        <div style={{ fontSize: '10px', color: '#86868b', marginTop: '2px' }}>Last seen: {item.lastSeen}</div>
                        <div style={{ fontSize: '11px' }}>ID: {item.deviceId.slice(-5)}</div>
                        {item.group && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{item.group}</div>}
                        {item.homeLat && (
                          <div style={{ fontSize: '10px', color: '#007aff', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#007aff'}}></span>
                            Anchor: {Number(item.homeLat).toFixed(4)}, {Number(item.homeLon).toFixed(4)}
                          </div>
                        )}
                      </div>

                      {/* Micro Battery Spark Gauge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', backgroundColor: '#121212', padding: '4px 8px', borderRadius: '6px', border: '1px solid #2c2c2e' }}>
                        <div style={{ width: '40px', height: '4px', backgroundColor: '#2c2c2e', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${batteryLevel}%`, height: '100%', backgroundColor: sparkColor }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: sparkColor }}>{batteryLevel}%</span>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#86868b', borderLeft: '1px solid #3a3a3c', paddingLeft: '8px', marginLeft: '2px' }}>{item.estTimeRemaining}</span>
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
                        border: '1px solid #3a3a3c', 
                        cursor: 'pointer',
                        backgroundColor: '#121212'
                      }}
                    >
                      <iframe loading="lazy" title="map-thumb" frameBorder="0" scrolling="no" src={item.latitude && !isNaN(Number(item.latitude)) ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(item.longitude)-0.02}%2C${Number(item.latitude)-0.02}%2C${Number(item.longitude)+0.02}%2C${Number(item.latitude)+0.02}&layer=mapnik&marker=${Number(item.latitude)}%2C${Number(item.longitude)}` : "about:blank"} style={{ pointerEvents: "none", border: "none", position: "absolute", top: "-60px", left: "-60px", width: "calc(100% + 120px)", height: "calc(100% + 120px)" }}></iframe>
                      
                    </div>
                    
                  </div>

                  {/* Crunched Operations Rows */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input placeholder="Rename Asset..." value={tagInputs[item.deviceId] || ""} onChange={(e) => setTagInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#121212' }} />
                      <button onClick={() => updateAttribute(item.deviceId, 'LATEST', 'tag', tagInputs[item.deviceId], '#t')} style={{ ...primaryButtonStyle, padding: "6px 12px", fontSize: "12px", borderRadius: "6px", color: "#ffffff", border: "1px solid #ffffff", backgroundColor: "#007aff" }}>Save</button>
                      <button className="diagnostic-flip-btn" onClick={() => setFlippedCards(prev => ({...prev, [item.deviceId]: !prev[item.deviceId]}))} style={{ background: "#121212", border: "1px solid #3a3a3c", cursor: "pointer", fontSize: "11px", color: '#ffffff', padding: "6px 10px", borderRadius: "6px", fontWeight: "600", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>Flip ⤹</button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap' }}>
                      {isAdmin && (item.shareToken ? <button onClick={() => revokeLiveShare(item.deviceId, item.timestamp)} style={{ ...secondaryButtonStyle, padding: "6px 10px", fontSize: "11px", borderRadius: "8px", flex: 1, borderColor: "#ff3b30", color: "#ff3b30" }}>Revoke</button> : <button onClick={() => setSharingAsset(item)} style={{ ...primaryButtonStyle, padding: "6px 10px", fontSize: "11px", borderRadius: "8px", flex: 1, color: "#1c1c1e", backgroundColor: "#ffffff" }}>Share</button>)}
                      
                      {/* Watchdog Status Button with Conditional Radar Light */}
        <button onClick={() => toggleServiceMode(item.deviceId, item.timestamp, item.isServiceMode)} style={{ ...buttonStyle, fontSize: '11px', borderRadius: '8px', flex: 1.5, padding: '6px 10px', backgroundColor: item.isServiceMode === false ? '#1d1d1f' : 'transparent', color: '#ffffff', border: '1px solid #ffffff' }}>
          {item.isServiceMode === false && <span className="live-pulse-indicator-dot"></span>}
          {item.isServiceMode === false ? 'Watchdog active' : 'Watchdog off'}
                      </button>
                      
                      {/* Secure Double-Validation Toggling Anchor Controls */}
                      <button 
                        onClick={() => {
                          if (item.homeLat) {
                            if (window.confirm(`Are you sure you want to permanently clear the home location geofence anchor for ${item.tag || item.deviceId.slice(-5)}?`)) {
                              clearHomeLocation(item.deviceId, item.timestamp).then(fetchDevices);
                            }
                          } else {
                            setHomeLocation(item.deviceId, item.timestamp, item.latitude, item.longitude);
                          }
                        }} 
                        style={{ ...buttonStyle, fontSize: "11px", borderRadius: "8px", flex: 1.2, padding: "6px 10px", backgroundColor: item.homeLat ? "transparent" : "#1d1d1f", color: "#ffffff", border: "1px solid #ffffff" }}
                      >
                        {item.homeLat ? "Clear Home" : "Set Home"}
                      </button>
                  </div>
                  
                      <div style={{ display: "flex", gap: "6px", width: "100%", marginTop: "12px", marginBottom: "8px", alignItems: "center", backgroundColor: "#121212", padding: "8px", borderRadius: "8px", border: "1px solid #2c2c2e", boxSizing: "border-box", flexWrap: "wrap" }}>
                        {!item.maintenanceInterval ? (
                          <>
                            <select value={maintenanceInputs[item.deviceId.slice(-5)] || "0"} onChange={(e) => setMaintenanceInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #3a3a3c", fontSize: "11px", backgroundColor: '#1c1c1e', color: '#ffffff', flex: 1, outline: "none" }}>
                              <option value="0">Off (Opt-Out)</option>
                              <option value="1">1 Month</option>
                              <option value="3">3 Months</option>
                              <option value="6">6 Months</option>
                              <option value="9">9 Months</option>
                              <option value="12">12 Months</option>
                            </select>
                            <button onClick={() => setMaintenanceInterval(item.deviceId, 'LATEST', maintenanceInputs[item.deviceId.slice(-5)] || "0")} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #ffffff", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "#ffffff", color: "#1c1c1e" }}>Schedule Service</button>
                          </>
                        ) : (
                          <>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                              <span style={{ width: "8px", height: "8px", backgroundColor: "#34c759", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 4px rgba(52, 199, 89, 0.6)" }}></span>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#34c759", textTransform: "uppercase" }}>Service Scheduled</span>
                            </div>
                            <button onClick={() => setMaintenanceInterval(item.deviceId, item.timestamp, "LOG_RESET")} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #34c759", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "#34c759" }}>Log & Reset</button>
                            <button onClick={() => setMaintenanceInterval(item.deviceId, item.timestamp, "OPT_OUT")} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ff3b30", fontSize: "11px", fontWeight: "600", cursor: "pointer", backgroundColor: "transparent", color: "#ff3b30" }}>Opt Out</button>
                          </>
                        )}
                      </div>

                  {/* Interactive Timeline Stepper for Logs */}
                  <div className="timeline-wrapper-panel" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#121212', borderRadius: '8px', border: '1px solid #3a3a3c' }}>
                    <div className="custom-scrollbar-viewport timeline-scroll-track-box" style={{ display: 'block', height: '110px', overflowY: 'scroll', overflowX: 'clip', marginBottom: '8px', paddingRight: '2px', boxSizing: 'border-box' }}>
                      {historicalNotes.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '12px', borderLeft: '2px solid #3a3a3c', marginLeft: '4px' }}>
                          {historicalNotes.map((logEntry, index) => {
                            const nodeColor = getTimelineMarkerColor(logEntry.text);
                            return (
                              <div key={index} style={{ position: 'relative', paddingBottom: index !== historicalNotes.length - 1 ? '12px' : '2px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                                <div style={{ position: 'absolute', left: '-19px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nodeColor, border: '2px solid #121212', boxShadow: '0 0 0 1px ' + nodeColor, zIndex: 2 }}></div>
                                <div style={{ flex: 1, minWidth: '0' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.3', wordBreak: 'break-word' }}>{logEntry.text}</div>
                                  <div style={{ color: '#86868b', fontSize: '10px', marginTop: '1px' }}>
                                    {logEntry.user.split('@')[0]} • <span style={{ fontSize: '9px', color: '#86868b' }}>{logEntry.time.includes('-') ? logEntry.time : `${logEntry.time} • 00:00 AM`}</span>
                                  </div>
                                </div>
                                {isAdmin && (
                                  <button 
                                    onClick={() => deleteNote(item.deviceId, logEntry)} 
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
                    
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #2c2c2e', paddingTop: '8px' }}>
                        <input placeholder="Add note..." value={noteInputs[item.deviceId.slice(-5)] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId.slice(-5)]: e.target.value}))} style={{ ...inputStyle, flex: 1, backgroundColor: '#1c1c1e', padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }} />
                        <button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId.slice(-5)])} style={{ ...primaryButtonStyle, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Post</button>
                    </div>
                  </div>
                </div>
                
                {/* ---------------- BACK FACE: DIAGNOSTICS ---------------- */}
                <div className="card-face card-back custom-scrollbar-viewport">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3c', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.01em', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#007aff' }}>⚙️</span> Diagnostics
                    </div>
                    <button onClick={() => setFlippedCards(prev => ({...prev, [item.deviceId]: !prev[item.deviceId]}))} style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', cursor: 'pointer', fontSize: '11px', color: '#ffffff', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' }}>⤶ Back</button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '12px', color: '#86868b', padding: '20px' }}>
                    {isAdmin && (
                      <button onClick={() => applySingleFactoryReset(item.deviceId)} style={{ ...secondaryButtonStyle, borderColor: '#ff3b30', color: '#ff3b30', width: '100%', marginBottom: '16px' }}>
                        ⚠️ Factory Reset Profile
                      </button>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#3a3a3c' }}>Expansion Slot Ready</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5', maxWidth: '200px' }}>Reserved for real-time BSSID anchors, signal strength, and manual TCP overrides.</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Full-Screen High-Contrast Interactive Map Overlay Modal Window */}
      {activeMapModalAsset && (
          <div style={{ backgroundColor: '#1c1c1e', borderRadius: '18px', width: '100%', maxWidth: '800px', height: '80vh', border: '1px solid #3a3a3c', boxShadow: '0 30px 70px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #2c2c2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em' }}>
                  {activeMapModalAsset.tag ? `${activeMapModalAsset.tag} — ${activeMapModalAsset.deviceId}` : activeMapModalAsset.deviceId}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#86868b' }}>Live Coordinates Matrix: <span style={{ color: '#ffffff', fontWeight: '500' }}>{activeMapModalAsset.latitude?.toFixed(5)}, {activeMapModalAsset.longitude?.toFixed(5)}</span></p>
              </div>
              <button onClick={() => setActiveMapModalAsset(null)} style={{ ...secondaryButtonStyle, padding: '8px 18px', fontSize: '13px', borderRadius: '14px', cursor: 'pointer' }}>Close Map</button>
            </div>
            <div style={{ flex: 1, width: '100%', backgroundColor: '#121212', position: 'relative' }}>
              <iframe loading="lazy" title="map-modal" width="100%" height="100%" frameBorder="0" scrolling="no" src={activeMapModalAsset?.latitude && !isNaN(Number(activeMapModalAsset.latitude)) ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(activeMapModalAsset.longitude)-0.02}%2C${Number(activeMapModalAsset.latitude)-0.02}%2C${Number(activeMapModalAsset.longitude)+0.02}%2C${Number(activeMapModalAsset.latitude)+0.02}&layer=mapnik&marker=${Number(activeMapModalAsset.latitude)}%2C${Number(activeMapModalAsset.longitude)}` : "about:blank"}></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Monochromatic High-Contrast Apple-style Modal Overlay for Token Management */}
      {sharingAsset && (
          <div style={{ backgroundColor: '#1c1c1e', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '440px', border: '1px solid #3a3a3c', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '600', letterSpacing: '-0.02em' }}>Escalate Live Tracking</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#86868b' }}>Generate a secure external reference view for Device ID: <span style={{ fontWeight: '600', color: '#ffffff' }}>{sharingAsset.deviceId}</span></p>
            
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
          <div style={{ backgroundColor: '#1c1c1e', borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "540px", maxHeight: "85vh", overflowY: "auto", border: "1px solid #3a3a3c", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600", letterSpacing: "-0.02em" }}>⚡ Quick Setup Guide</h3>
              <button onClick={() => setShowGuide(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#86868b" }}>✕</button>
            </div>
            <div style={{ fontSize: "14px", color: '#ffffff', lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><strong>📱 Section 1: Setting Up a Single Card</strong><br/>
            <span style={{ color: "#86868b" }}>• <strong>Step 1: Give it a Name</strong> Type a clear name into the <em>Rename Asset...</em> box on the device's card and click <strong>Save</strong>.<br/>
            • <strong>Step 2: Lock the Home Location</strong> When the Gps Device is magnetically locked into position , click <strong>Set Home</strong> to lock its home base position.<br/>
            • <strong>Step 3: Turn on the Watchdog Guard</strong> Flip the status switch to <strong>Watchdog Active</strong>. You will see a green light start pulsing to show the device is tracking and guarding that spot in real time.</span></div>
            
            <div style={{ borderTop: "1px dashed #3a3a3c", paddingTop: "10px" }}><strong>🛡️ Section 2: Scheduling Service and Opt-Out</strong><br/>
            <span style={{ color: "#86868b" }}>• <strong>Turn Off Tracking (Service/Transport Mode)</strong> If you need to move a card for a battery swap, maintenance, or shipping, click the switch to turn the <strong>Watchdog Off</strong>. This stops false alarms while it's in transit.<br/>
            • <strong>Set Up a Service Schedule</strong> Choose how often a card needs regular check-ups from the drop-down menu on the card and click <strong>Schedule Service</strong> to keep track of its upkeep timeline.<br/>
            • <strong>Choose Opt-Out to Cancel.</strong></span></div>
            
            <div style={{ borderTop: "1px dashed #3a3a3c", paddingTop: "10px" }}><strong>Section 3: Doing Actions in Bulk (Bottom Drawer)</strong><br/>
            <span style={{ color: "#86868b", fontStyle: "italic" }}>Note: To use these options, you must first check the selection boxes on more than one card. This will slide open the menu drawer at the bottom of your screen.</span><br/>
            <span style={{ color: "#86868b" }}>• <strong>Move Cards into Group Folders:</strong> Type a folder name into <em>Assign to Group...</em> and click <strong>Move</strong> to group your selected cards together.<br/>
            • <strong>Auto-Number a Batch of Cards:</strong> If you want to name a bunch of cards sequentially, type any name into the box (like Cosmo) and click <strong>Sequence Name</strong>. The system will automatically add a number to them (Cosmo-1, Cosmo-2, Cosmo-3, etc.).<br/>
            • <strong>Write a Note to a Whole Group:</strong> Type an installation or status update note into the group box and click <strong>Post log to Group</strong> to add that exact message to all selected card timelines at the same time.</span></div>
          </div>
          <button onClick={() => setShowGuide(false)} style={{ ...primaryButtonStyle, width: "100%", marginTop: "24px", padding: "14px" }}>Close Guide</button>
          </div>
        </div>
      )}

      {/* Sticky Sliding Bulk Actions Drawer Overlay Tray */}
      <div style={{
        left: 0,
        right: 0,
        backgroundColor: '#1c1c1e',
        borderTop: '1px solid #3a3a3c',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 9000, minHeight: "100px",
        display: selectedDevices.length > 0 ? 'flex' : 'none',
        padding: '20px 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
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
            <div className="marine-home-group"><button onClick={applyBulkSetHome} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#34c759", color: "#34c759" }}>Set Home Anchors</button><button onClick={async () => { if (!window.confirm("Are you sure you want to toggle Marine Mode for " + selectedDevices.length + " selected device(s)?")) return; await Promise.all(selectedDevices.map(id => { const dev = assets.find(a => a.deviceId.slice(-5) === id || a.deviceId === id); const currentVal = !!dev.isMarineMode; return updateAttribute(dev.deviceId, 'LATEST', 'isMarineMode', !currentVal, '#mm', true); })); setMarineModes(prev => { const res = {...prev}; selectedDevices.forEach(id => res[id] = !res[id]); return res; }); alert("Marine Mode permanently updated in database for " + selectedDevices.length + " device(s)."); fetchDevices(); setSelectedDevices([]); }} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#007aff", color: "#007aff" }}>⚓ Toggle Marine Mode</button></div>

            {/* Action 4: Dual Clear Home Anchors with Confirmation Prompt */}
            <button onClick={applyBulkClearHome} style={{ ...secondaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', borderColor: '#ff9500', color: '#ff9500' }}>Clear Home Anchors</button>
            
            {/* NEW ACTION: Factory Reset Devices */}
            <button onClick={applyBulkFactoryReset} style={{ ...secondaryButtonStyle, padding: "8px 16px", fontSize: "13px", borderRadius: "8px", borderColor: "#ff3b30", color: "#ff3b30" }}>Factory Reset</button>

          </div>
        </div>
      </div>

        </>
      )}

      
      </div>

      {/* V2.0 COMING SOON MODAL */}
      {comingSoonModule && (
          <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#1c1c1e", padding: "32px", borderRadius: "18px", border: "1px solid #3a3a3c", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: "48px", lineHeight: "1", marginBottom: "-8px" }}>🚧</div>
            <h3 style={{ margin: 0,  fontSize: "24px", fontWeight: "600", letterSpacing: "-0.01em" }}>Module Locked</h3>
            <p style={{ margin: 0, color: "#86868b", fontSize: "15px", lineHeight: "1.6" }}>The <strong style={{ color: "#ffffff", border: "1px solid #ffffff" }}>{comingSoonModule}</strong> architecture is currently in active development. It will be released in the Version 2.0 enterprise update.</p>
            <button onClick={() => setComingSoonModule(null)} style={{ backgroundColor: "#007aff",  border: "none", padding: "14px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "12px", width: "100%", fontSize: "15px", transition: "all 0.2s" }}>Acknowledge</button>
          </div>
        </div>
      )}

      {/* STANDARD LEGAL FOOTER */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "20px 32px", backgroundColor: "#121212", color: "#86868b", fontSize: "12px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: "24px", justifyContent: "flex-start", fontWeight: "500" }}>
            <span onClick={() => alert("Privacy Policy: Kinetic Tracking collects real-time geolocation data, network anchors, and operational telemetry to ensure asset security. All tracking logs are stored securely and never shared or sold.")} style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#86868b"}>Privacy Policy</span>
            <span onClick={() => alert("Terms of Service: By accessing the Kinetic Tracking system, you agree to use it solely for tracking authorized company hardware. Unauthorized location spoofing, watchdog manipulation, or tampering with device telemetry is strictly prohibited.")} style={{ cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#86868b"}>Terms of Service</span>
        </div>
        <div style={{ textAlign: "center" }}>
            Kinetic Cards v2.1
        </div>
        <div>{/* Empty block forces grid to keep the center column perfectly aligned */}</div>
        <style>{`html, body { overflow-x: clip !important; overflow-y: scroll !important; width: 100%; margin: 0; padding: 0; } #root, .App { background-color: #121212 !important; min-height: 100vh; overflow-x: clip !important; }`}button, .diagnostic-flip-btn, .responsive-pill-options-sub-block button { color: #ffffff !important; border: 1px solid #ffffff !important; background-color: #121212 !important; }</style>
      </div>
    </div>
  );
}

export default App;

// Forced cache-bust and pipeline sync for geofence logic
