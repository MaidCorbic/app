const http = require('http');
const fs = require('fs');
const path = require('path');

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
const root = path.join(__dirname, 'dist');

if (!fs.existsSync(root)) {
  console.error('Missing production build. Run npm start so Vite builds dist before serving.');
  http.createServer((_, res) => {
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><title>STRIDE is starting</title><p>STRIDE is preparing its night route. Please retry in a moment.</p>');
  }).listen(process.env.PORT || 3000);
} else http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== path.join(root, 'index.html')) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('STRIDE is running'));
