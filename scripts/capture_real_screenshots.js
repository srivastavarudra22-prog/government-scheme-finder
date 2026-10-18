/**
 * capture_real_screenshots.js
 * Captures pixel-perfect screenshots of the running project using Chrome DevTools Protocol (CDP).
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function main() {
  console.log('Logging in to get citizen session token...');
  
  // 1. Login to get token
  const loginPayload = JSON.stringify({
    email: 'testcitizen_screen@test.gov.in',
    password: 'Password123!'
  });

  const token = await new Promise((resolve, reject) => {
    const req = http.request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.session && json.session.access_token) {
            resolve(json.session.access_token);
          } else {
            reject(new Error('No access_token returned: ' + data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginPayload);
    req.end();
  });

  console.log('Obtained token:', token.slice(0, 25) + '...');

  // 2. Launch headless Chrome with debugging port
  const tempProfile = path.join(os.tmpdir(), 'chrome_cdp_profile_' + Date.now());
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeArgs = [
    '--headless=new',
    `--user-data-dir=${tempProfile}`,
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,820',
    'about:blank'
  ];

  console.log('Starting headless Chrome on port 9222...');
  const chromeProc = spawn(chromePath, chromeArgs);

  // Wait 1.5 seconds for Chrome to bind port 9222
  await new Promise(r => setTimeout(r, 1500));

  // Get active tab WS URL
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });

  const wsUrl = tabs[0].webSocketDebuggerUrl;
  console.log('Connecting to Chrome CDP WebSocket:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let idCounter = 1;
  function sendCdp(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      function handler(event) {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      }
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Page and Runtime
  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');

  // Set viewport
  await sendCdp('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1.5,
    mobile: false
  });

  // Navigate to landing page first
  console.log('Navigating to base app to inject auth token...');
  await sendCdp('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  // Inject token in localStorage
  await sendCdp('Runtime.evaluate', {
    expression: `localStorage.setItem('token', ${JSON.stringify(token)});`
  });

  console.log('Token injected in localStorage.');

  // Pages to capture
  const captures = [
    { name: 'screenshot_landing.png', url: 'http://localhost:5173/' },
    { name: 'screenshot_find_schemes.png', url: 'http://localhost:5173/find-schemes' },
    { name: 'screenshot_results.png', url: 'http://localhost:5173/results?category=Education+%26+Learning' },
    { name: 'screenshot_scheme_details.png', url: 'http://localhost:5173/schemes/1' },
    { name: 'screenshot_dashboard.png', url: 'http://localhost:5173/dashboard' },
  ];

  for (const page of captures) {
    console.log(`Navigating to ${page.url}...`);
    await sendCdp('Page.navigate', { url: page.url });
    // Wait for network idle and React rendering
    await new Promise(r => setTimeout(r, 2200));

    const snap = await sendCdp('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(snap.data, 'base64');
    const outPath = path.resolve(page.name);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved ${page.name} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // Close Chrome
  ws.close();
  chromeProc.kill();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
