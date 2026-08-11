const http = require('http');
const fs = require('fs');
const path = require('path');

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
http.createServer((req, res) => {
  const safePath = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
  const file = path.join(__dirname, safePath);
  if (!file.startsWith(__dirname)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('STRIDE is running'));
