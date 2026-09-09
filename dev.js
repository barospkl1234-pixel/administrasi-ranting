import { spawn } from 'child_process';
import path from 'path';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🌟 Menjalankan Sistem Administrasi IPNU IPPNU Ranting Desa...\n');

// Start backend
const server = spawn('node', ['server/index.js'], { stdio: 'inherit', shell: true });
const server = spawn('node', ['server/index.js'], { stdio: 'inherit', shell: isWin });

// Start frontend
const client = spawn(npmCmd, ['run', 'dev', '--prefix', 'client'], { stdio: 'inherit', shell: true });
// Start frontend (use npm.cmd on Windows)
const client = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: path.resolve('client')
});

function cleanup() {
  console.log('\n🛑 Menghentikan server...');
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

