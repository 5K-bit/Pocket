'use strict';

const STORAGE_KEY = 'obeos-pocket-links-v1';
const DEFAULTS = [
  { id: 'site', name: 'OBEOS Website', initials: 'O', category: 'PUBLIC WEB', url: 'https://obeos-company-website.netlify.app/', hint: 'Company website' },
  { id: 'pocket', name: 'Pocket Source', initials: 'P', category: 'SOURCE', url: 'https://github.com/5K-bit/Pocket', hint: 'This app on GitHub' },
  { id: 'repo', name: 'OBEOS Repository', initials: '</>', category: 'SOURCE', url: 'https://github.com/5K-bit/O.B.E.O.S', hint: 'OS development' },
  { id: 'github', name: 'GitHub Projects', initials: 'GH', category: 'SOURCE', url: 'https://github.com/5K-bit?tab=repositories', hint: 'All repositories' },
  { id: 'netlify', name: 'Netlify', initials: 'N', category: 'DEPLOYMENTS', url: 'https://app.netlify.com/', hint: 'Manage web deployments' },
  { id: 'chatgpt', name: 'ChatGPT', initials: 'AI', category: 'LEARNING', url: 'https://chatgpt.com/', hint: 'Scheduled conversations' },
  { id: 'legion', name: 'Legion / DAISE', initials: 'D', category: 'YOUR ENDPOINT', url: '', hint: 'Add your secure dashboard URL' }
];

function validURL(value) {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password; }
  catch { return false; }
}

function readLinks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
    return Object.fromEntries(DEFAULTS.map(({id}) => [id, (typeof stored[id] === 'string' && validURL(stored[id])) ? stored[id] : undefined]));
  } catch { return {}; }
}
let customLinks = readLinks();
const grid = document.querySelector('#tool-grid');
const editor = document.querySelector('#editor');
const fields = document.querySelector('#editor-fields');
const form = document.querySelector('#editor-form');
const error = document.querySelector('#form-error');
const currentURL = item => Object.prototype.hasOwnProperty.call(customLinks, item.id) && customLinks[item.id] !== undefined ? customLinks[item.id] : item.url;

function makeTile(item) {
  const url = currentURL(item);
  const tile = document.createElement(url ? 'a' : 'button');
  tile.className = `tile${url ? '' : ' unconfigured'}`;
  if (url) {
    tile.href = url;
    tile.target = '_blank';
    tile.rel = 'noopener noreferrer';
    tile.setAttribute('aria-label', `Open ${item.name}`);
  } else {
    tile.type = 'button';
    tile.addEventListener('click', showEditor);
    tile.setAttribute('aria-label', `Configure ${item.name} URL`);
  }
  const top = document.createElement('div'); top.className = 'tile-top';
  const symbol = document.createElement('span'); symbol.className = 'tile-icon'; symbol.textContent = item.initials;
  const arrow = document.createElement('span'); arrow.className = 'tile-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = url ? '↗' : '+';
  top.append(symbol, arrow);
  const bottom = document.createElement('div'); bottom.className = 'tile-bottom';
  const category = document.createElement('div'); category.className = 'tile-category'; category.textContent = item.category;
  const name = document.createElement('div'); name.className = 'tile-name'; name.textContent = item.name;
  const hint = document.createElement('div'); hint.className = 'tile-sub'; hint.textContent = url ? item.hint : 'Tap to configure HTTPS link';
  bottom.append(category, name, hint);
  tile.append(top, bottom);
  return tile;
}
function render() { grid.replaceChildren(...DEFAULTS.map(makeTile)); }

function showEditor() {
  fields.replaceChildren(); error.hidden = true;
  for (const item of DEFAULTS) {
    const label = document.createElement('label'); label.className = 'edit-field';
    const title = document.createElement('span'); title.textContent = item.name;
    const input = document.createElement('input'); input.name = item.id; input.type = 'url'; input.inputMode = 'url'; input.autocapitalize = 'off'; input.autocomplete = 'off'; input.spellcheck = false; input.placeholder = 'https://example.com'; input.value = currentURL(item);
    const hint = document.createElement('small'); hint.textContent = 'HTTPS only. Leave blank to mark unconfigured.';
    label.append(title, input, hint); fields.append(label);
  }
  if (!editor.open) editor.showModal();
}
document.querySelector('#edit-links').addEventListener('click', showEditor);
document.querySelector('#close-editor').addEventListener('click', () => editor.close());
form.addEventListener('submit', event => {
  event.preventDefault();
  const next = {};
  for (const item of DEFAULTS) {
    const value = String(new FormData(form).get(item.id) || '').trim();
    if (!validURL(value)) {
      error.textContent = `Use an HTTPS URL without embedded credentials for ${item.name}.`;
      error.hidden = false;
      return;
    }
    next[item.id] = value;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  catch { error.textContent = 'Browser storage is unavailable. Changes cannot be saved on this device.'; error.hidden = false; return; }
  customLinks = next; render(); editor.close();
});
document.querySelector('#reset-links').addEventListener('click', () => {
  if (!window.confirm('Restore every destination to its original link?')) return;
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { error.textContent = 'Cannot clear browser storage.'; error.hidden = false; return; }
  customLinks = {}; render(); editor.close();
});
function updateClock() {
  document.querySelector('#local-clock').textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());
}
function updateNetwork() {
  const label = document.querySelector('#network-label');
  label.textContent = navigator.onLine ? 'DEVICE REPORTS CONNECTED' : 'DEVICE REPORTS OFFLINE';
}
render(); updateClock(); updateNetwork(); setInterval(updateClock, 30_000);
window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
