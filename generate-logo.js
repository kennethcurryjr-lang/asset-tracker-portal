const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Blue background/cube frame -->
  <polygon points="50,10 90,30 50,50 10,30" fill="#2563eb" />
  <polygon points="10,40 50,60 50,90 10,70" fill="#1d4ed8" />
  <polygon points="90,40 50,60 50,90 90,70" fill="#3b82f6" />
  <!-- White arrow overlay -->
  <polygon points="35,45 55,45 55,38 70,50 55,62 55,55 35,55" fill="#ffffff" />
</svg>`;

const filePath = path.join(__dirname, 'kinetic-logo.svg');
fs.writeFileSync(filePath, svgContent, 'utf8');
console.log("Successfully generated kinetic-logo.svg in your root folder!");
