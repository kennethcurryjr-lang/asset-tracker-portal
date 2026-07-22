const fs = require('fs');
const path = require('path');

// The precise SVG structure matching your Kinetic header icon
const kineticSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100" fill="none">
  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0052FF" />
  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M12 8l4 4-4 4M8 12h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

const filePath = path.join(__dirname, 'kinetic-logo.svg');
fs.writeFileSync(filePath, kineticSvg, 'utf8');
console.log("Exported accurate kinetic-logo.svg to your root folder!");
