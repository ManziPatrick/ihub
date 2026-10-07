/**
 * End-to-end Google Sign-In test against the LIVE site.
 * Launches headless Chrome via CDP (chrome-remote-interface style, using raw
 * WebSocket from the backend's `ws` dependency to avoid installing anything),
 * opens bootskills.com/auth, waits for the GSI button iframe, clicks it, then
 * captures what happens next:
 *   - a popup/window.open to accounts.google.com (success path up to login)
 *   - a FedCM account-chooser dialog (success path, Chrome >=120)
 *   - a navigation to accounts.google.com/signin/oauth/error (the old bug)
 *   - GSI console errors
 *
 * Run: node scratch/e2e-google-login.cjs
 */

const { spawn } = require('child_process');
const WebSocket = require('../backend/node_modules/ws');
const http = require('http');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sendCdp(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const onMsg = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', onMsg);
        if (msg.error) reject(new Error(method + ': ' + msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

(async () => {
  console.log('1. Launching headless Chrome...');
  // --disable-features=FedCm: forces GSI to use the classic POPUP flow instead
  // of the browser-native FedCM dialog (which headless Chrome can't render or
  // observe). With FedCM off, a successful click opens a capturable popup to
  // accounts.google.com — giving a decisive end-to-end signal.
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=FedCm,FedCmWithThirdPartySupport',
    '--user-data-dir=' + process.env.TEMP + '/gsi-test-profile-' + Date.now(),
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore' });
  chrome.on('error', (e) => { console.error('Chrome launch failed:', e.message); process.exit(1); });
  await sleep(2500);

  // Get the page target's websocket URL
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:' + PORT + '/json/list', (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => resolve(JSON.parse(buf)));
    }).on('error', reject);
  });
  const page = targets.find((t) => t.type === 'page');
  if (!page) { console.error('No page target found'); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  await new Promise((r) => ws.on('open', r));
  let idc = 0;

  console.log('2. Opening https://bootskills.com/auth ...');
  await sendCdp(ws, ++idc, 'Page.enable');
  await sendCdp(ws, ++idc, 'Runtime.enable');
  // FedCM domain: lets us observe the browser-native "Sign in with Google"
  // account-chooser dialog (the modern GSI flow — no popup, no navigation).
  try { await sendCdp(ws, ++idc, 'FedCm.enable', { disableRejectionDelay: true }); }
  catch (e) { console.log('   (FedCm domain unavailable: ' + e.message.slice(0, 60) + ')'); }
  await sendCdp(ws, ++idc, 'Page.navigate', { url: 'https://bootskills.com/auth' });

  // Track popups via target attachment: ask browser-side is overkill; instead
  // hook window.open results + watch frame navigations to accounts.google.com.
  let popupUrl = null;
  let errorNav = null;
  let gsiErrorLogs = [];
  let fedcmDialog = null; // { title, accounts, dialogId }

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.method === 'Page.frameNavigated' && msg.frame && msg.frame.url.includes('accounts.google.com')) {
      if (msg.frame.url.includes('/signin/oauth/error')) errorNav = msg.frame.url;
      else popupUrl = msg.frame.url;
    }
    if (msg.method === 'FedCm.dialogShowing') {
      fedcmDialog = {
        title: msg.params?.title || '(no title)',
        subtitle: msg.params?.subtitle || '',
        accounts: (msg.params?.accounts || []).map((a) => a.displayName || a.email || '?'),
        dialogId: msg.params?.dialogId,
      };
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params?.exceptionDetails;
      const txt = d?.exception?.description || d?.text || '';
      if (txt.includes('gsi') || txt.includes('accounts.google')) gsiErrorLogs.push(txt.slice(0, 200));
    }
  });

  console.log('3. Waiting for page + GSI button to render...');
  let iframeFound = false;
  let clientInIframe = null;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const r = await sendCdp(ws, ++idc, 'Runtime.evaluate', {
      expression: `(() => {
        const f = document.querySelector('iframe[src*="accounts.google.com/gsi/button"]');
        if (!f) return JSON.stringify({ found: false });
        return JSON.stringify({ found: true, src: f.src, empty: /client_id&|client_id=$/.test(f.src) });
      })()`,
      returnByValue: true,
    });
    const state = JSON.parse(r.result.value);
    if (state.found) {
      iframeFound = true;
      clientInIframe = state.empty ? 'EMPTY (bug!)' : 'PRESENT (ok)';
      console.log('   GSI button iframe found at t=' + (i + 1) + 's, client_id: ' + clientInIframe);
      break;
    }
  }
  if (!iframeFound) { console.log('   GSI iframe never rendered'); }

  if (iframeFound) {
    console.log('4. Clicking the Google Sign-In button with TRUSTED mouse events...');
    // The GSI button lives inside a cross-origin iframe; a DOM .click() on the
    // wrapper never reaches it. Use CDP input events (trusted, browser-level)
    // at the iframe's center coordinates — identical to a real user click.
    const rectRes = await sendCdp(ws, ++idc, 'Runtime.evaluate', {
      expression: `(() => {
        const f = document.querySelector('iframe[src*="accounts.google.com/gsi/button"]');
        const r = f.getBoundingClientRect();
        return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
      })()`,
      returnByValue: true,
    });
    const { x, y } = JSON.parse(rectRes.result.value);
    await sendCdp(ws, ++idc, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sendCdp(ws, ++idc, 'Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await sendCdp(ws, ++idc, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    console.log(`   clicked at (${Math.round(x)}, ${Math.round(y)})`);

    console.log('5. Watching for 15s: FedCM dialog / popup navigation / error page...');
    // Popups from window.open create NEW targets — poll /json/list for any
    // accounts.google.com target appearing after the click.
    const listTargets = () => new Promise((resolve) => {
      http.get('http://127.0.0.1:' + PORT + '/json/list', (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve([]); } });
      }).on('error', () => resolve([]));
    });
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (fedcmDialog) break;
      if (errorNav) break;
      if (popupUrl) break;
      const targets = await listTargets();
      const popup = targets.find((t) => t.type === 'page' && /accounts\.google\.com/.test(t.url));
      if (popup) {
        popupUrl = popup.url;
        break;
      }
    }
    if (fedcmDialog) {
      console.log('   ✅ FedCM dialog shown!');
      console.log('      title   : ' + fedcmDialog.title);
      if (fedcmDialog.subtitle) console.log('      subtitle: ' + fedcmDialog.subtitle);
      console.log('      accounts: ' + (fedcmDialog.accounts.join(', ') || '(none listed — headless profile has no Google session)'));
    } else if (errorNav) {
      console.log('   ❌ ERROR PAGE reached: ' + errorNav.slice(0, 90));
    } else if (popupUrl) {
      console.log('   ✅ Popup/flow navigated to: ' + popupUrl.slice(0, 90));
    }
    if (!fedcmDialog && !errorNav && !popupUrl) {
      const r = await sendCdp(ws, ++idc, 'Runtime.evaluate', {
        expression: 'JSON.stringify({ url: location.href })',
        returnByValue: true,
      });
      console.log('   No FedCM dialog/popup captured. Page still at: ' + JSON.parse(r.result.value).url);
    }
  }

  console.log('\n════════ RESULT ════════');
  console.log('GSI client_id in iframe : ' + clientInIframe);
  console.log('Clicked button          : ' + iframeFound);
  if (errorNav) console.log('Flow outcome            : ❌ Google error page (invalid_request) — BUG STILL PRESENT');
  else if (fedcmDialog) console.log('Flow outcome            : ✅ FedCM "' + fedcmDialog.title + '" dialog appeared — client_id VALID, flow advances to account chooser');
  else if (popupUrl) console.log('Flow outcome            : ✅ Reached account chooser / login flow — WORKING');
  else console.log('Flow outcome            : ⚠️  no dialog captured (headless FedCM limitation) — client_id check above is the decisive signal');
  if (gsiErrorLogs.length) console.log('GSI console errors      : ' + gsiErrorLogs.slice(0, 3).join(' | '));

  ws.close();
  chrome.kill();
  process.exit(0);
})().catch((e) => { console.error('TEST ERROR:', e.message); process.exit(1); });
