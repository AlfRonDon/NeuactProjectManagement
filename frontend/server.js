const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3420', 10);

const app = next({ hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`
✓ Next.js server ready on 0.0.0.0:${port}
✓ Access at:
  - http://localhost:${port}
  - https://100.90.185.31:${port}
  - http://192.168.1.20:${port}
    `);
  });
});
