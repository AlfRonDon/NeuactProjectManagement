const https = require('https');
const http = require('http');
const fs = require('fs');

const KEYCLOAK_PORT = 8080;
const PROXY_PORT = 8083;

const certPath = process.env.CERT_PATH || '/home/rohith/backup/secrets/certs/cert.pem';
const keyPath = process.env.KEY_PATH || '/home/rohith/backup/secrets/certs/key.pem';

const httpsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

const server = https.createServer(httpsOptions, (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: KEYCLOAK_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${KEYCLOAK_PORT}`,
      'x-forwarded-for': '127.0.0.1',
      'x-forwarded-host': req.headers.host,
      'x-forwarded-proto': 'https',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Rewrite Location headers to use the proxy's host
    const headers = { ...proxyRes.headers };
    if (headers.location && headers.location.includes('localhost:' + KEYCLOAK_PORT)) {
      headers.location = headers.location.replace(
        `http://localhost:${KEYCLOAK_PORT}`,
        `https://${req.headers.host}`
      );
    }
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Keycloak unreachable');
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Keycloak HTTPS proxy listening on 0.0.0.0:${PROXY_PORT} -> localhost:${KEYCLOAK_PORT}`);
});
