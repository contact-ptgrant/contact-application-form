const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/submit', (req, res) => {
    const { firstName, lastName, phone, email, preference } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    // Get visitor's IP address (handles Render proxy headers)
    const clientIp = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress;

    const entry = 
`========================================
PT-GRANT CONTACT SUBMISSION
========================================
Date:                    ${timestamp}
Visitor IP:              ${clientIp || 'Unknown'}
First Name:              ${firstName || ''}
Last Name:               ${lastName || ''}
Phone Number:            ${phone || ''}
Email Address:           ${email || ''}
Preferred Contact Method:${preference || ''}
========================================\n\n`;

    fs.appendFile(path.join(__dirname, 'submission.txt'), entry, (err) => {
        if (err) {
            console.error('Failed to write to submission.txt:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to record entry.' });
        }
        console.log(`New submission recorded for ${firstName} ${lastName} from IP: ${clientIp}`);
        res.json({ status: 'success' });
    });
});

// Secret route to view all entries in your browser
app.get('/secret-view-entries-my-secret-key-99', (req, res) => {
    const filePath = path.join(__dirname, 'submission.txt');
    
    if (!fs.existsSync(filePath)) {
        return res.send('<pre>No entries recorded yet.</pre>');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading entries.');
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
