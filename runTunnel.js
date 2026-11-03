const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

const STATUS_FILE = path.join(__dirname, 'tunnel-status.json');

async function startTunnel() {
  try {
    console.log('Connecting localtunnel...');
    const tunnel = await localtunnel({ port: 5050 });
    console.log('PUBLIC_WANJA_URL:' + tunnel.url);
    
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
      url: tunnel.url,
      timestamp: new Date().toISOString()
    }, null, 2));

    tunnel.on('close', () => {
      console.log('Tunnel closed, auto-reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to create tunnel, retrying in 3s...', err);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();
