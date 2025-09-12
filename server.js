const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const http = require('http');
const https = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// WebXR/AR を許可（Meta Quest など）
app.use((req, res, next) => {
  // xr-spatial-tracking を自身のオリジンで許可
  res.setHeader('Permissions-Policy', 'xr-spatial-tracking=(self)');
  next();
});

// Serve static files from public directory
app.use(express.static('public'));

// Backend proxy (to local media-scanner on 7777) => single ngrok tunnelでOK
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://localhost:7777';
const backendURL = new URL(BACKEND_TARGET);
app.use('/backend', (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/backend/, '') || '/';
  const requestOptions = {
    protocol: backendURL.protocol,
    hostname: backendURL.hostname,
    port: backendURL.port || (backendURL.protocol === 'https:' ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: backendURL.host
    }
  };
  const proxy = (backendURL.protocol === 'https:' ? https : http).request(requestOptions, (proxyRes) => {
    res.status(proxyRes.statusCode || 502);
    // 転送ヘッダ（content-length は除外）
    Object.entries(proxyRes.headers || {}).forEach(([k, v]) => {
      if (k.toLowerCase() === 'content-length') return;
      res.setHeader(k, v);
    });
    proxyRes.pipe(res);
  });
  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(502).send('Bad Gateway');
  });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxy);
  } else {
    proxy.end();
  }
});

// API endpoint to get images list
app.get('/api/images', async (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'static', 'images');
    const files = await fs.readdir(imagesDir);
    
    // Filter only image files
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Sort alphabetically
    images.sort();
    
    // Update the JSON file
    const jsonData = { images };
    const jsonPath = path.join(__dirname, 'public', 'data', 'images_list.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    
    // Also update static/data directory
    const staticJsonPath = path.join(__dirname, 'static', 'data', 'images_list.json');
    await fs.writeFile(staticJsonPath, JSON.stringify(jsonData, null, 2));
    
    res.json(jsonData);
  } catch (error) {
    console.error('Error reading images directory:', error);
    res.status(500).json({ error: 'Failed to read images directory' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/images`);
});
