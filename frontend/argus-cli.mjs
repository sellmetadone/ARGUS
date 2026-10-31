#!/usr/bin/env node
/**
 * Argus CLI — launcher (browser + console search)
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, 'argus.config.json');

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { port: 3030, host: '127.0.0.1', openBrowser: true, lang: 'ru', fallbackHost: '127.0.0.1' };
  }
}

const cfg = loadConfig();
const PORT = cfg.port || 3030;
const HOST = cfg.fallbackHost || '127.0.0.1';

async function startWeb() {
  console.log(`\n  ARGUS Web UI → http://${HOST}:${PORT}\n`);
  const child = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', String(PORT)], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

async function consoleSearch() {
  let runSearch, formatSearchResult;
  try {
    const mod = await import('./cli-lib/search.mjs');
    runSearch = mod.runSearch;
    formatSearchResult = mod.formatSearchResult;
  } catch (e) {
    console.error('cli-lib/search.mjs missing:', e.message);
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));
  console.log('\n  ARGUS Console — domain / IP / email / phone');
  console.log('  Commands: help | exit\n');
  while (true) {
    const line = (await ask('argus> ')).trim();
    if (!line) continue;
    if (line === 'exit' || line === 'quit' || line === '0') break;
    if (line === 'help') {
      console.log('  Enter a domain, IP, email or phone. Type exit to quit.');
      continue;
    }
    try {
      const result = await runSearch(line);
      console.log(formatSearchResult(result));
    } catch (e) {
      console.error('Search error:', e.message);
    }
  }
  rl.close();
  console.log('Bye.');
}

async function menu() {
  console.log(`
  ╔══════════════════════════════════════╗
  ║           A R G U S                  ║
  ║   Cyber Investigation Graph          ║
  ╚══════════════════════════════════════╝

  1. Browser Argus   — open web UI
  2. Console         — terminal search
  0. Exit
`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));
  const choice = (await ask('Select [1/2/0]: ')).trim();
  rl.close();
  if (choice === '1') return startWeb();
  if (choice === '2') return consoleSearch();
  console.log('Bye.');
}

const arg = process.argv[2];
if (arg === 'cli' || arg === 'search') consoleSearch();
else if (arg === 'both' || arg === 'web') startWeb();
else if (arg === 'config') console.log(JSON.stringify(cfg, null, 2));
else menu();
