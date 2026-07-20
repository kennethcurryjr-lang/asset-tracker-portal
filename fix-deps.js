const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Find the fetchDevices dependency array and insert the missing variable tracking state
content = content.replace(
  /}, \[isGlobalAdmin, userTenant\]\);/g,
  '}, [isGlobalAdmin, userTenant, showAllCompanyFleets]);'
);

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('🎉 React Hook dependency arrays updated cleanly!');
