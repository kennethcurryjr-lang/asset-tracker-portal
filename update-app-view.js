const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src', 'App.js');

if (!fs.existsSync(appJsPath)) {
    console.error(`❌ Could not find App.js at ${appJsPath}`);
    process.exit(1);
}

let content = fs.readFileSync(appJsPath, 'utf8');

// 1. CLEAN UP: Strip any previous injections or broken loops to prevent build loops
content = content.replace(/const \[showAllCompanyFleets,[\s\S]*?\/\/ 🔍 Admin toggle hatch/g, '');
content = content.replace(/\{isGlobalAdmin && \(\s*<button[\s\S]*?<\/button>\s*\)\}/g, '');
content = content.replace(/\{isSuperAdmin && \(\s*<button[\s\S]*?<\/button>\s*\)\}/g, '');

// Reset fetch block back to pristine condition if it was modified
if (content.includes('showAllCompanyFleets && isGlobalAdmin') || content.includes('isGlobalAdmin && showAllCompanyFleets')) {
    const corruptedFetchBlockStart = "if (isGlobalAdmin && showAllCompanyFleets) {";
    const corruptedFetchBlockEnd = "items = queryResponse.Items || [];\n      }";
    
    const startIndex = content.indexOf(corruptedFetchBlockStart);
    const endIndex = content.indexOf(corruptedFetchBlockEnd);
    
    if (startIndex !== -1 && endIndex !== -1) {
        const standardFetchBlock = `if (isGlobalAdmin) {
        const scanResponse = await docClient.send(new ScanCommand({
          TableName: "AssetTrackerData"
        }));
        items = (scanResponse.Items || []).filter(i => i.timestamp === "LATEST");
      } else {
        const queryResponse = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          IndexName: "clientId-index",
          KeyConditionExpression: "clientId = :cid AND #ts = :ts",
          ExpressionAttributeNames: { "#ts": "timestamp" },
          ExpressionAttributeValues: { 
            ":cid": userTenant,
            ":ts": "LATEST" 
          }
        }));
        items = queryResponse.Items || [];
      }`;
        content = content.substring(0, startIndex) + standardFetchBlock + content.substring(endIndex + corruptedFetchBlockEnd.length);
    }
}

// 2. STATE INJECTION: Add the dynamic toggle tracking variable cleanly
const stateHook = "const [comingSoonModule, setComingSoonModule] = useState(null);";
if (content.includes(stateHook)) {
    content = content.replace(stateHook, `${stateHook}\n  const [showAllCompanyFleets, setShowAllCompanyFleets] = useState(false); // 🔍 Admin toggle hatch`);
    console.log('✅ Fresh state tracking hook registered.');
}

// 3. FETCH REFACTOR: Target only dev sandbox space items by default
const legacyFetchBlock = `      if (isGlobalAdmin) {
        const scanResponse = await docClient.send(new ScanCommand({
          TableName: "AssetTrackerData"
        }));
        items = (scanResponse.Items || []).filter(i => i.timestamp === "LATEST");
      } else {
        const queryResponse = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          IndexName: "clientId-index",
          KeyConditionExpression: "clientId = :cid AND #ts = :ts",
          ExpressionAttributeNames: { "#ts": "timestamp" },
          ExpressionAttributeValues: { 
            ":cid": userTenant,
            ":ts": "LATEST" 
          }
        }));
        items = queryResponse.Items || [];
      }`;

const sandboxedFetchBlock = `      if (isGlobalAdmin && showAllCompanyFleets) {
        // 🔓 EMERGENCY BACKDOOR: Run full database sweep only when toggle is explicitly flipped active
        const scanResponse = await docClient.send(new ScanCommand({ TableName: "AssetTrackerData" }));
        items = (scanResponse.Items || []).filter(i => i.timestamp === "LATEST");
      } else {
        // 🔒 DEFAULT DEV & CLIENT WORKSPACE: Targeted index queries keep data completely isolated
        const queryResponse = await docClient.send(new QueryCommand({
          TableName: "AssetTrackerData",
          IndexName: "clientId-index",
          KeyConditionExpression: "clientId = :cid AND #ts = :ts",
          ExpressionAttributeNames: { "#ts": "timestamp" },
          ExpressionAttributeValues: { ":cid": userTenant, ":ts": "LATEST" }
        }));
        items = queryResponse.Items || [];
      }`;

if (content.includes(legacyFetchBlock)) {
    content = content.replace(legacyFetchBlock, sandboxedFetchBlock);
    console.log('✅ Sandboxed data query boundaries successfully written.');
}

// 4. UI MOUNT: Render button using verified 'isSuperAdmin' context to guarantee build success
const syncButtonText = `<button onClick={() => { fetchDevices(); alert("Data successfully synced with live database."); }} style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: "#34c759", color: "#34c759" }}>🔄 Sync Data</button>`;

if (content.includes(syncButtonText)) {
    const uiInjection = `${syncButtonText}
             {isSuperAdmin && (
               <button 
                 onClick={() => {
                   const targetMode = !showAllCompanyFleets;
                   setShowAllCompanyFleets(targetMode);
                   alert(targetMode ? "🔓 Global Fleet Visibility Enabled (Heavy Scan Mode)" : "🔒 Dev Workspace Engaged (Targeted Filter Mode)");
                 }} 
                 style={{ ...secondaryButtonStyle, padding: "4px 12px", fontSize: "12px", borderRadius: "12px", borderColor: showAllCompanyFleets ? "#ff3b30" : "#007aff", color: showAllCompanyFleets ? "#ff3b30" : "#007aff", marginLeft: "8px" }}
               >
                 {showAllCompanyFleets ? "👁️ Hide Company Fleets" : "👁️ Show All Fleets"}
               </button>
             )}`;
    content = content.replace(syncButtonText, uiInjection);
    console.log('✅ Admin interface toggle element successfully mounted.');
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('🎉 Clean overwrite complete! Ready for build deployment.');
