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
  
  // Category Multi-Select Active Token States
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [activeGroupFilter, setActiveGroupFilter] = useState("all"); 
  const [namingFilter, setNamingFilter] = useState("all"); 
  
  // Mobile Filter Expansion Tray Toggle State
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
  
  const buttonStyle = { padding: '10px 20px', borderRadius: '20px', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' };
  const primaryButtonStyle = { ...buttonStyle, backgroundColor: '#1d1d1f', color: '#ffffff' };
  const secondaryButtonStyle = { ...buttonStyle, backgroundColor: 'transparent', color: '#1d1d1f', border: '1px solid #1d1d1f' };

  const stickySearchCardStyle = {
    ...cardStyle,
    position: 'sticky',
    top: '12px',
    zIndex: 100,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)'
  };

  const { alertCount, healthyCount } = useMemo(() => {
    const alerts = assets.filter(a => a.isOffline || a.isGeofenceViolation || a.isLowBattery).length;
    return { alertCount: alerts, healthyCount: assets.length - alerts };
  }, [assets]);

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
    try {
      const response = await docClient.send(new ScanCommand({
        TableName: "AssetTrackerData"
      }));
      
      const grouped = {};
      response.Items.forEach(item => {
        if (!grouped[item.deviceId]) grouped[item.deviceId] = [];
        grouped[item.deviceId].push(item);
      });

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
          deviceNotes, 
          tag: history.find(i => i.tag)?.tag || "",
          group: history.find(i => i.group)?.group || "",
          homeLat,
          homeLon,
          isServiceMode,
          lastServiceModeUser: history.find(i => i.lastServiceModeUser)?.lastServiceModeUser || "N/A",
          lastServiceModeTime: history.find(i => i.lastServiceModeTime)?.lastServiceModeTime || "N/A",
          isOffline,
          isGeofenceViolation,
          isLowBattery,
          zip: loc.zip,
          city: loc.city,
          latitude: latest.latitude,
          longitude: latest.longitude,
          battery: latest.battery
        };
      }));
      setAssets(processed);
    } catch (err) { console.error(err); }
  }, [auth.isAuthenticated]);

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
    const user = auth.user?.profile?.email || "Unknown User";
    const time = new Date().toLocaleString();
    try {
      await Promise.all([
          updateAttribute(deviceId, timestamp, 'isServiceMode', newState, '#sm'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeUser', user, '#lsu'),
          updateAttribute(deviceId, timestamp, 'lastServiceModeTime', time, '#lst')
      ]);
      alert(newState ? "Watchdog disabled! (Service Mode Activated)" : "Watchdog activated! (Monitoring Live Position)");
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

  const executeLiveShareEscalation = async () => {
    if (!isAdmin) {
      alert("Security Violation: Only administrator accounts are cleared to authorize external view vectors.");
      setSharingAsset(null);
      return;
    }
    if (!shareEmail || !shareEmail.trim() || !sharingAsset) return;
    
    const secureToken = crypto.randomUUID();
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
    await docClient.send(new UpdateCommand({
        TableName: "AssetTrackerData",
        Key: { deviceId, timestamp },
        UpdateExpression: "REMOVE homeLat, homeLon"
    }));
  };

  const setHomeLocation = async (deviceId, timestamp, lat, lon) => {
    await Promise.all([
        updateAttribute(deviceId, timestamp, 'homeLat', lat, '#hl'),
        updateAttribute(deviceId, timestamp, 'homeLon', lon, '#hlon')
    ]);
    alert("Home location saved!");
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
    await Promise.all(selectedDevices.map(id => {
      const dev = assets.find(a => a.deviceId === id);
      return addNote(dev.deviceId, dev.timestamp, bulkNoteInput.trim());
    }));
    alert(`Broadcast log note to ${selectedDevices.length} Kinetic Card timelines.`);
    setBulkNoteInput("");
    setSelectedDevices([]);
    fetchDevices();
  };

  const applyBulkClearHome = async () => {
    if (!window.confirm(`Are you sure you want to completely clear the home location anchors for all ${selectedDevices.length} selected Kinetic Cards?`)) return;
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
                <div style={labelStyle}>Approximate Region</div>
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
          0% { transform: scale(0.95); boxShadow: 0 0 0 0 rgba(52, 199, 89, 0.5); }
          70% { transform: scale(1); boxShadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { transform: scale(0.95); boxShadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .live-pulse-indicator-dot {
          width: 8px;
          height: 8px;
          background-color: #34c759;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
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
        .mobile-filter-drawer-expansion-tray {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
          border-top: '1px solid #e5e5ea';
          padding-top: 12px;
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
          .mobile-filter-drawer-expansion-tray {
            display: ${showMobileFilters ? 'flex' : 'none'} !important;
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
          
          /* Cryptographic micro-clip layer to filter out multi-line wrap text clutter on mobile cards */
          .card-column-right-mapping iframe {
            height: calc(100% + 22px) !important;
            margin-top: -11px !important;
            clip-path: inset(11px 0px 22px 0px);
          }
          
          .timeline-wrapper-panel {
            margin-top: 8px !important;
            padding: 10px 12px !important;
          }
          .timeline-scroll-track-box {
            height: 100px !important;
          }
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
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              style={{
                ...secondaryButtonStyle,
                display: window.innerWidth <= 768 ? 'block' : 'none',
                alignSelf: 'flex-end',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: showMobileFilters ? '#1d1d1f' : 'transparent',
                color: showMobileFilters ? '#ffffff' : '#1d1d1f'
              }}
            >
              {showMobileFilters ? '✕ Clear' : '🎛️ Filters'}
            </button>
          </div>
          
          <div className="mobile-filter-drawer-expansion-tray">
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
          
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid #e5e5ea', paddingTop: '10px' }}>
             <div style={{ marginRight: 'auto', display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '500', color: '#86868b', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: alertCount > 0 ? '#ff3b30' : '#d2d2d7' }}></div> 
                  {alertCount} Alert
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34c759' }}></div> 
                  {healthyCount} Stable
                </div>
             </div>
             <button onClick={resetAllInputs} style={{ ...secondaryButtonStyle, padding: '4px 12px', fontSize: '12px', borderRadius: '12px' }}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 0.33fr))', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
          {assets
            .filter(a => {
              const term = searchTerm.toLowerCase();
              const textMatches = (
                (a.deviceId || '').toLowerCase().includes(term) || 
                (a.city || '').toLowerCase().includes(term) || 
                (a.group || '').toLowerCase().includes(term)
              );
              if (!textMatches) return false;

              if (statusFilter === "offline" && !a.isOffline) return false;
              if (statusFilter === "geofence" && !a.isGeofenceViolation) return false;
              if (statusFilter === "low_battery" && !a.isLowBattery) return false;

              if (activeGroupFilter !== "all" && a.group !== activeGroupFilter) return false;

              if (namingFilter === "named" && !a.tag) return false;
              if (namingFilter === "unnamed" && !!a.tag) return false;

              return true;
            })
            .map(item => {
              const historicalNotes = item.deviceNotes || [];
              const batteryLevel = item.battery !== undefined ? Number(item.battery) : 100;
              const isBatteryLow = batteryLevel <= 20;
              const sparkColor = getBatteryStatusColor(batteryLevel);
              
              const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${item.longitude - 0.005}%2C${item.latitude - 0.003}%2C${item.longitude + 0.005}%2C${item.latitude + 0.003}&layer=mapnik&marker=${item.latitude}%2C${item.longitude}`;

              return (
                <div key={item.deviceId} style={{ ...deviceCardStyle, backgroundColor: '#ffffff' }}>
                  
                  {/* Split Responsive Core Row */}
                  <div className="card-split-columns-view">
                    
                    {/* Left Hand Data Block */}
                    <div className="card-column-left-telemetry">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input type="checkbox" checked={selectedDevices.includes(item.deviceId)} onChange={() => setSelectedDevices(prev => prev.includes(item.deviceId) ? prev.filter(i => i !== item.deviceId) : [...prev, item.deviceId])} style={{ width: '16px', height: '16px', accentColor: '#1d1d1f', cursor: 'pointer' }} />
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
                            {item.tag ? item.tag : item.deviceId}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {item.isOffline && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff3b30', borderRadius: '4px' }}>Offline</span>}
                          {item.isGeofenceViolation && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#ff9500', borderRadius: '4px' }}>Geofence</span>}
                          {item.isLowBattery && <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', backgroundColor: '#b7094c', borderRadius: '4px' }}>Low Batt</span>}
                      </div>

                      <div style={{ fontSize: '12px', color: '#86868b', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: '500', color: '#1d1d1f' }}>{item.city || "Locating"}</div>
                        <div style={{ fontSize: '11px' }}>ID: {item.deviceId}</div>
                        {item.group && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>📦 {item.group}</div>}
                      </div>

                      {/* Micro Battery Spark Gauge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', backgroundColor: '#f5f5f7', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e5ea' }}>
                        <div style={{ flex: 1, height: '4px', backgroundColor: '#e5e5ea', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${batteryLevel}%`, height: '100%', backgroundColor: sparkColor }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: sparkColor }}>{batteryLevel}%</span>
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
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, background: 'transparent' }}></div>
                      <iframe 
                        title={`inline-map-${item.deviceId}`}
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        src={mapUrl}
                        style={{ pointerEvents: 'none', border: 'none' }}
                      ></iframe>
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', zIndex: 20, backgroundColor: 'rgba(29, 29, 31, 0.85)', color: '#ffffff', fontSize: '9px', fontWeight: '600', padding: '2px 4px', borderRadius: '3px' }}>
                        ⛶ Expand
                      </div>
                    </div>
                    
                  </div>

                  {/* Crunched Operations Rows */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input placeholder="Rename Asset..." value={tagInputs[item.deviceId] || ""} onChange={(e) => setTagInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f5f5f7' }} />
                      <input type="hidden" />
                      <button onClick={() => updateAttribute(item.deviceId, item.timestamp, 'tag', tagInputs[item.deviceId], '#t')} style={{ ...primaryButtonStyle, padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>Save</button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', width: '100%', flexWrap: 'wrap' }}>
                      {isAdmin && <button onClick={() => setSharingAsset(item)} style={{ ...primaryButtonStyle, padding: '6px 10px', fontSize: '11px', borderRadius: '8px', flex: 1 }}>Share</button>}
                      <button onClick={() => toggleServiceMode(item.deviceId, item.timestamp, item.isServiceMode)} style={{ ...buttonStyle, fontSize: '11px', borderRadius: '8px', flex: 1.5, padding: '6px 10px', backgroundColor: item.isServiceMode ? 'transparent' : '#1d1d1f', color: item.isServiceMode ? '#1d1d1f' : '#ffffff', border: item.isServiceMode ? '1px solid #1d1d1f' : 'none' }}>
                        {item.isServiceMode ? 'Watchdog off' : 'Watchdog active'}
                      </button>
                      <button onClick={() => item.homeLat ? clearHomeLocation(item.deviceId, item.timestamp).then(fetchDevices) : setHomeLocation(item.deviceId, item.timestamp, item.latitude, item.longitude)} style={{ ...buttonStyle, fontSize: '11px', borderRadius: '8px', flex: 1.2, padding: '6px 10px', backgroundColor: item.homeLat ? 'transparent' : '#1d1d1f', color: item.homeLat ? '#1d1d1f' : '#ffffff', border: item.homeLat ? '1px solid #1d1d1f' : 'none' }}>
                        {item.homeLat ? 'Clear Anchor' : 'Anchor'}
                      </button>
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
                                    {logEntry.user.split('@')[0]} • {logEntry.time.split(' - ')[0]}
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
                    
                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #e5e5ea', paddingTop: '8px' }}>
                        <input placeholder="Add note..." value={noteInputs[item.deviceId] || ""} onChange={(e) => setNoteInputs(prev => ({...prev, [item.deviceId]: e.target.value}))} style={{ ...inputStyle, flex: 1, backgroundColor: '#ffffff', padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }} />
                        <button onClick={() => addNote(item.deviceId, item.timestamp, noteInputs[item.deviceId])} style={{ ...primaryButtonStyle, padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Post</button>
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
              <iframe 
                title="fullscreen-interactive-tracker"
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeMapModalAsset.longitude - 0.01}%2C${activeMapModalAsset.latitude - 0.006}%2C${activeMapModalAsset.longitude + 0.01}%2C${activeMapModalAsset.latitude + 0.006}&layer=mapnik&marker=${activeMapModalAsset.latitude}%2C${activeMapModalAsset.longitude}`}
                style={{ border: 'none' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Monochromatic High-Contrast Apple-style Modal Overlay for Token Management */}
      {sharingAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', zIndex: 5000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', width: '440px', border: '1px solid #d2d2d7', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
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
            <div style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>{selectedDevices.length} Kinetic Cards Selected</div>
            <div style={{ fontSize: '12px', color: '#86868b', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelectedDevices([])}>Deselect all records</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            
            {/* Action 1: Bulk Group Assignment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                list="group-suggestions-list"
                placeholder="Assign folder..." 
                value={bulkGroupInput}
                onChange={(e) => setBulkGroupInput(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '150px' }}
              />
              <button onClick={applyBulkGroup} disabled={!bulkGroupInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkGroupInput.trim() ? 1 : 0.4 }}>Move</button>
            </div>

            {/* Action 2: Bulk Timeline Log Broadcast */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                placeholder="Broadcast event log note..." 
                value={bulkNoteInput}
                onChange={(e) => setBulkNoteInput(e.target.value)}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px', width: '240px' }}
              />
              <button onClick={applyBulkNote} disabled={!bulkNoteInput.trim()} style={{ ...primaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', opacity: bulkNoteInput.trim() ? 1 : 0.4 }}>Post Log</button>
            </div>

            {/* Action 3: Bulk Clear Anchors */}
            <button onClick={applyBulkClearHome} style={{ ...secondaryButtonStyle, padding: '8px 16px', fontSize: '13px', borderRadius: '8px', borderColor: '#ff3b30', color: '#ff3b30' }}>Clear Home Anchors</button>

          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
