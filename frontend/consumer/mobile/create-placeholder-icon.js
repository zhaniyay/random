// Simple script to create a placeholder icon for Expo
const fs = require('fs');
const path = require('path');

// Create a minimal 1x1 transparent PNG (Base64 encoded)
// This is a valid PNG that Expo will accept
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create placeholder files
const files = [
  { name: 'icon.png', size: 1024 },
  { name: 'splash.png', size: 1242 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'favicon.png', size: 48 },
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file.name);
  // For now, just create a minimal valid PNG
  // In production, replace with actual icons
  fs.writeFileSync(filePath, minimalPNG);
  console.log(`✅ Created ${file.name}`);
});

console.log('\n⚠️  Note: These are placeholder icons. Replace with actual icons before production.');
console.log('   Recommended sizes:');
console.log('   - icon.png: 1024x1024');
console.log('   - splash.png: 1242x2436');
console.log('   - adaptive-icon.png: 1024x1024');
console.log('   - favicon.png: 48x48');

