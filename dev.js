import { spawn } from 'child_process';
import path from 'path';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🌟 Menjalankan Sistem Administrasi IPNU IPPNU Ranting Desa...\n');

// Start backend (API + uploads on http://localhost:5000)
const server = spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' });

// Start frontend (Vite dev server on http://localhost:5173, proxy /api -> :5000)
const client = spawn(isWin ? 'cmd.exe' : npmCmd, isWin ? ['/c', 'npm run dev'] : ['run', 'dev'], {
  stdio: 'inherit',
  cwd: path.resolve('client'),
});

function cleanup() {
  console.log('\n🛑 Menghentikan server...');
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);