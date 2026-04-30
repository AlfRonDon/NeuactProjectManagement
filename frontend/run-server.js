const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3420', 10);
const HOSTNAME = '0.0.0.0';

// Start Next.js standalone server
const { NextServer } = require('./.next/standalone/server');

const app = new NextServer({
  conf: { dir: '.' },
  port: PORT,
  hostname: HOSTNAME,
});

const server = createServer(async (req, res) => {
  try {
    await app.handleRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.end(err.message);
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`✓ Next.js server running on 0.0.0.0:${PORT}`);
  console.log(`✓ Access at https://100.90.185.31:${PORT}`);
});
