import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';
import { createRequire } from 'module';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const httpMode = args.includes('--http') || args.includes('-h');
console.log(`Starting Sonic MCP Server in ${httpMode ? 'HTTP' : 'stdio'} mode...`);
const scriptPath = resolve(__dirname, '../build', httpMode ? 'http-server.js' : 'index.js');



try {
  require.resolve(scriptPath);
  const server = spawn('node', [scriptPath], {
    stdio: 'inherit',
    shell: false
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });


  const cleanup = () => {
    if (!server.killed) {
      server.kill();
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
} catch (error) {
  console.error('Error: Server files not found. The package may not be built correctly.');
  console.error('Please try reinstalling the package or contact the maintainers.');
  console.error(error);
  process.exit(1);
} 