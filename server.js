const express = require('express');
const { execSync } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // Serve your game files

app.post('/generate-levels', (req, res) => {
  try {
    const worlds = req.body.worlds || ['12', '13', '14'];
    const worldsStr = worlds.join(' ');
    
    console.log(`Generating worlds: ${worldsStr}`);
    const output = execSync(`python generate_level.py ${worldsStr}`, { 
      encoding: 'utf-8',
      cwd: __dirname 
    });
    
    res.json({ success: true, output: output });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Game server running on http://localhost:3000');
  console.log('Open your browser to http://localhost:3000/your-game.html');
});