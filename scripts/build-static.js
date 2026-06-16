#!/usr/bin/env node
// Build script for Tauri static export
// Temporarily removes API routes (not needed in Tauri), builds, then restores them.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const backupDir = path.join(__dirname, '..', '.api-backup');

try {
  // Move API routes out of the way
  if (fs.existsSync(apiDir)) {
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true });
    }
    fs.renameSync(apiDir, backupDir);
    console.log('Temporarily moved API routes out of the way.');
  }

  // Build with static export
  execSync('cross-env NEXT_STATIC=1 next build', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  console.log('Static build complete.');
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
} finally {
  // Restore API routes
  if (fs.existsSync(backupDir)) {
    if (fs.existsSync(apiDir)) {
      fs.rmSync(apiDir, { recursive: true });
    }
    fs.renameSync(backupDir, apiDir);
    console.log('Restored API routes.');
  }
}
