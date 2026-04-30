const https = require('https');
const http = require('http');
const fs = require('fs');

const httpsPort = 3420;
const httpPort = 3421;
const hostname = '0.0.0.0';

const certPath = '/home/rohith/backup/secrets/certs/cert.pem';
const keyPath = '/home/rohith/backup/secrets/certs/key.pem';

const httpsOptions = {
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
};

// HTTPS server that proxies to HTTP backend on 3421
https.createServer(httpsOptions, (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: httpPort,
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
}).listen(httpsPort, hostname, () => {
  console.log(`✓ HTTPS proxy ready on ${hostname}:${httpsPort}`);
});
