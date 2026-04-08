/**
 * Post-build script for Vercel deployments.
 * Copies geo-tz binary data files into each serverless function bundle,
 * since the Vercel adapter's includeFiles option doesn't handle node_modules data files.
 */

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const functionsDir = join(root, '.vercel/output/functions');
const geoTzData = join(root, 'node_modules/geo-tz/data');

if (!existsSync(functionsDir)) {
  console.log('No .vercel/output/functions directory found, skipping.');
  process.exit(0);
}

function findFuncDirs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name.endsWith('.func')) {
      results.push(full);
    } else {
      results.push(...findFuncDirs(full));
    }
  }
  return results;
}

const funcDirs = findFuncDirs(functionsDir);
if (funcDirs.length === 0) {
  console.log('No .func directories found.');
  process.exit(0);
}

for (const funcDir of funcDirs) {
  const dest = join(funcDir, 'node_modules/geo-tz/data');
  mkdirSync(dest, { recursive: true });
  cpSync(geoTzData, dest, { recursive: true });
  console.log(`Copied geo-tz data → ${dest}`);
}
