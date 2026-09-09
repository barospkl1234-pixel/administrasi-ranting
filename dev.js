import { spawn } from 'child_process';
import path from 'path';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🌟 Menjalankan Sistem Administrasi IPNU IPPNU Ranting Desa...\n');

// Start backend
const server = spawn('node', ['server/index.js'], { stdio: 'inherit' });

// Start frontend
const client = spawn(npmCmd, ['run', 'dev', '--prefix', 'client'], { stdio: 'inherit' });

function cleanup() {
  console.log('\n🛑 Menghentikan server...');
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

