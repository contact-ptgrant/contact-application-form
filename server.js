const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your Admin Portal Password here or via Render Environment Variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ptgrant2026';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'entries.json');

// Helper to load entries safely
function getEntries() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        return [];
    }
}

// Handle Contact Form Submission
app.post('/submit', (req, res) => {
    const { firstName, lastName, phone, email, preference } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    // Capture visitor IP address
    const clientIp = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress;

    const newEntry = {
        id: Date.now(),
        timestamp,
        clientIp: clientIp || 'Unknown',
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        email: email || '',
        preference: preference || ''
    };

    // Save entry to entries.json
    const entries = getEntries();
    entries.unshift(newEntry); // Put latest submissions first

    fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), (err) => {
        if (err) {
            console.error('Failed to write entry:', err);
            return res.status(500).json({ status: 'error' });
        }
        console.log(`New entry saved for ${firstName} ${lastName} (IP: ${clientIp})`);
        res.json({ status: 'success' });
    });
});

// Admin Authentication API
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin Password' });
    }
});

// Admin Data API
app.post('/api/admin/entries', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, entries: getEntries() });
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
});

// Serve Admin Portal UI
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve Main Contact Form UI
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
