
---

### 2. `server.js` (Secure Backend)
```javascript
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/get-video-info', (req, res) => {
    const { url } = req.body;

    // Strict Facebook URL validation
    const fbRegex = /^(https?:\/\/)?(www\.)?(facebook|fb)\.(com|watch|reel)\/.+$/;
    if (!fbRegex.test(url)) {
        return res.status(400).json({ error: 'Invalid Facebook video URL. Please check and try again.' });
    }

    // Use yt-dlp to extract video metadata securely
    // -J outputs JSON, --no-warnings keeps console clean
    const command = `yt-dlp -J --no-warnings "${url}"`;

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error.message}`);
            return res.status(500).json({ 
                error: 'Failed to fetch video. It may be private, unavailable, or restricted.' 
            });
        }

        try {
            const data = JSON.parse(stdout);
            const formats = data.formats || [];
            
            // Intelligently filter for best HD and SD video formats
            const hdFormat = formats.find(f => f.height >= 720 && f.vcodec !== 'none' && f.url) || 
                             formats.find(f => f.height >= 480 && f.vcodec !== 'none' && f.url);
                             
            const sdFormat = formats.find(f => f.height >= 360 && f.height < 720 && f.vcodec !== 'none' && f.url) || 
                             formats.find(f => f.height >= 240 && f.vcodec !== 'none' && f.url);

            const result = {
                title: data.title || 'Facebook Video',
                thumbnail: data.thumbnail || '',
                qualities: []
            };

            if (hdFormat) {
                result.qualities.push({ quality: 'HD', resolution: `${hdFormat.height}p`, url: hdFormat.url });
            }
            if (sdFormat) {
                result.qualities.push({ quality: 'SD', resolution: `${sdFormat.height}p`, url: sdFormat.url });
            }

            if (result.qualities.length === 0) {
                return res.status(404).json({ error: 'No downloadable formats found. Video format is unsupported.' });
            }

            res.json(result);
        } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ error: 'Failed to parse video information.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 CCT FB DOWNLOADER Backend running on http://localhost:${PORT}`);
});
