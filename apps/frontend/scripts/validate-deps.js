
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating dependencies...\n');

const criticalDeps = [
  'react',
  'react-dom',
  'next',
  '@magajico/shared'
];

let hasErrors = false;

criticalDeps.forEach(dep => {
  try {
    const resolved = require.resolve(dep);
    console.log(`✅ ${dep}: ${resolved}`);
  } catch (err) {
    console.error(`❌ ${dep}: NOT FOUND`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('\n❌ Dependency validation failed!');
  process.exit(1);
}

console.log('\n✅ All critical dependencies validated!');
