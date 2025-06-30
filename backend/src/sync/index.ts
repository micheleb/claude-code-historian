#!/usr/bin/env bun

import { SyncService } from './sync-service';

async function main() {
  console.log('Claude Log Sync Service');
  console.log('======================');
  
  const syncService = new SyncService();
  
  try {
    await syncService.syncAll();
    console.log('\\nSync completed successfully!');
  } catch (error) {
    console.error('\\nSync failed:', error);
    process.exit(1);
  }
}

main();