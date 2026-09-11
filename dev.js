import { spawn } from 'child_process';
import path from 'path';

const isWin = process.platform === 'win32';

console.log('🌟 Menjalankan Sistem Administrasi IPNU IPPNU Ranting Desa...\n');

const server = spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' });

const client = spawn(isWin ? 'cmd.exe' : 'npm', isWin ? ['/c', 'npm run dev'] : ['run', 'dev'], {
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
