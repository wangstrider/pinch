#!/usr/bin/env node

/**
 * 🦐 Pinch Web Server
 * 
 * Simple HTTP server that serves the world state and provides a live display.
 * 
 * Usage:
 *   node web/server.js              # Start on port 8877
 *   node web/server.js --port 3000  # Custom port
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const WORLD_PATH = path.join(__dirname, '..', 'data', 'world.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = process.argv.includes('--port') 
  ? parseInt(process.argv[process.argv.indexOf('--port') + 1])
  : 8877;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, getCorsHeaders());
    res.end();
    return;
  }
  
  // API: get world state
  if (url.pathname === '/api/world') {
    try {
      const world = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      });
      res.end(JSON.stringify(world));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...getCorsHeaders() });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  
  // API: inject event
  if (url.pathname === '/api/event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { event } = JSON.parse(body);
        const world = JSON.parse(fs.readFileSync(WORLD_PATH, 'utf8'));
        world.events.push({
          text: event,
          turn: world.turn,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(WORLD_PATH, JSON.stringify(world, null, 2) + '\n');
        res.writeHead(200, { 'Content-Type': 'application/json', ...getCorsHeaders() });
        res.end(JSON.stringify({ ok: true, world }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...getCorsHeaders() });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  // Static files
  let filePath = url.pathname === '/' 
    ? path.join(PUBLIC_DIR, 'index.html')
    : path.join(PUBLIC_DIR, url.pathname);
  
  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🦐 Pinch server running at http://0.0.0.0:${PORT}`);
  console.log(`🌍 World state: ${WORLD_PATH}`);
  console.log(`📡 API: http://0.0.0.0:${PORT}/api/world`);
});
