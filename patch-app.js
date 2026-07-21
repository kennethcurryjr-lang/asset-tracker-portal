const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.js');

if (!fs.existsSync(appPath)) {
  console.error("Error: Could not locate src/App.js from the root directory.");
  process.exit(1);
}

let content = fs.readFileSync(appPath, 'utf8');

const targetBlock = `      const queryResponse = await docClient.send(new QueryCommand({
        TableName: "AssetTrackerData",
        IndexName: "clientId-index",
        KeyConditionExpression: "clientId = :cid AND #ts = :ts",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: { 
          ":cid": userTenant,
          ":ts": "LATEST" 
        }
      }));
      setDevices(queryResponse.Items || []);`;

const safeWrappedBlock = `      try {
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
        setDevices(queryResponse.Items || []);
      } catch (err) {
        console.warn("Connection hiccup detected, holding current state:", err.message);
      }`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, safeWrappedBlock);
  fs.writeFileSync(appPath, content, 'utf8');
  console.log("Successfully patched src/App.js with connection error boundaries.");
} else {
  console.log("Target block not found or already patched.");
}
