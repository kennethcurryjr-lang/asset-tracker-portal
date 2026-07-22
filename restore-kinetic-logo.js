const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'Login.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("❌ src/Login.jsx not found!");
  process.exit(1);
}

let code = fs.readFileSync(targetPath, 'utf8');

// Replace the image tag or svg with the full native Kinetic Cards logo block
const logoSectionRegex = /\{\/\* LOGO HEADER \*\/\}[\s\S]*?<\/div>\s*<\/div>/;

const properKineticLogo = `{/* LOGO HEADER */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', userSelect: 'none' }}>
          {/* Native SVG Stacked Negative Space Cards */}
          <svg width="86" height="72" viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))' }}>
            {/* Back Card (Dark Navy) */}
            <path d="M50 5 L95 25 L50 45 L5 25 Z" fill="#0052cc" />
            {/* Front Card (Electric Blue) */}
            <path d="M50 25 L95 45 L50 65 L5 45 Z" fill="#007aff" />
            {/* Negative Space Arrow (Bright White) */}
            <path d="M35 25 L60 25 L60 15 L85 35 L60 55 L60 45 L35 45 Z" fill="#ffffff" />
          </svg>
          
          {/* Shimmer Typography */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', fontFamily: '"SF Pro Display", -apple-system, sans-serif', fontWeight: '900', fontSize: '24px', letterSpacing: '0.5px', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
            <style>{\`@keyframes kineticShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }\`}</style>
            <span style={{ background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 40%, #4da3ff 50%, #ffffff 60%, #ffffff 100%)', backgroundSize: '200% auto', color: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', animation: 'kineticShimmer 8s linear infinite', display: 'inline-block' }}>KINETIC</span>
            <span style={{ color: '#ffcc00' }}>CARDS<span style={{ fontSize: '13px', verticalAlign: 'super', marginLeft: '2px' }}>™</span></span>
          </div>
        </div>`;

if (logoSectionRegex.test(code)) {
  code = code.replace(logoSectionRegex, properKineticLogo);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Successfully restored exact Kinetic Cards logo!");
} else {
  // Direct replace fallback
  code = code.replace(/<img[\s\S]*?\/>/, properKineticLogo);
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log("✅ Restored Kinetic logo via fallback!");
}
