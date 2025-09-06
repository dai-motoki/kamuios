const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

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
