const https = require('https');
const http = require('http');
const fs = require('fs');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const internalPort = 3421;
const httpsPort = parseInt(process.env.HTTPS_PORT || '3420', 10);

// Read SSL certificates
const certPath = process.env.CERT_PATH || '/home/rohith/backup/secrets/certs/cert.pem';
const keyPath = process.env.KEY_PATH || '/home/rohith/backup/secrets/certs/key.pem';

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error(`❌ SSL certificates not found at ${certPath} and ${keyPath}`);
  process.exit(1);
}

const httpsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

const app = next({ dev, hostname, port: internalPort });
const handle = app.getRequestHandler();

let httpServerReady = false;

app.prepare().then(() => {
  // Start internal HTTP server
  const httpServer = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(internalPort, hostname, () => {
    console.log(`✓ Next.js internal HTTP server on ${hostname}:${internalPort}`);
    httpServerReady = true;

    // Start HTTPS server once HTTP is ready
    const httpsServer = https.createServer(httpsOptions, (req, res) => {
      const options = {
        hostname: 'localhost',
        port: internalPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      req.pipe(proxyReq);

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(502);
        res.end('Bad Gateway');
      });
    });

    httpsServer.listen(httpsPort, hostname, () => {
      console.log(`
✓ Next.js server ready with HTTPS
✓ Access at:
  - https://localhost:${httpsPort}
  - https://100.90.185.31:${httpsPort}
  - https://192.168.1.20:${httpsPort}
      `);
    });

    httpsServer.on('error', (err) => {
      console.error(`❌ HTTPS server error:`, err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${httpsPort} is already in use`);
      }
      process.exit(1);
    });
  });

  httpServer.on('error', (err) => {
    console.error(`❌ HTTP server error:`, err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('Failed to prepare app:', err);
  process.exit(1);
});
