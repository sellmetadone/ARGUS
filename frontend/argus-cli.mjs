#!/usr/bin/env node
/**
 * Argus CLI — launcher (browser + console search)
 * Author: sellmetadone · https://t.me/sofia_white_death · https://t.me/argus_platform
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, 'argus.config.json');

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {
    /* defaults */
  }
  return {
    port: 3030,
    host: 'argus.local',
    openBrowser: true,
    lang: 'ru',
    fallbackHost: '127.0.0.1',
  };
}

const cfg = loadConfig();
const PORT = cfg.port || 3030;
const HOST = cfg.fallbackHost || '127.0.0.1';

function banner() {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║              A R G U S                    ║
  ║     Cyber Investigation Graph             ║
  ╠══════════════════════════════════════════╣
  ║  sellmetadone                             ║
  ║  @sofia_white_death                       ║
  ║  t.me/argus_platform                      ║
  ╚══════════════════════════════════════════╝
`);
}

async function startWeb() {
  console.log(`\n  Starting Vite…`);
  console.log(`  Prefer:  http://${HOST}:${PORT}/`);
  console.log(`  If the port is busy, Vite will print another Local: URL — use that one.\n`);
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
  banner();
  console.log(`  1. Browser Argus   — open web UI`);
  console.log(`  2. Console         — terminal search`);
  console.log(`  0. Exit\n`);
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
