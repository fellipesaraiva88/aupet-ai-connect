const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression
app.use(compression());

// Serve static files from the dist directory (but don't serve index.html as static)
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true,
  lastModified: true,
  index: false, // Don't serve index.html automatically
  fallthrough: true // Allow request to continue if file not found
}));

// Cache control headers
app.use((req, res, next) => {
  // Don't cache index.html
  if (req.path === '/' || req.path === '/index.html') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// For all routes (including deep links), serve index.html (SPA routing)
app.get('*', (req, res) => {
  console.log('[SPA] Serving index.html for:', req.path);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
});
