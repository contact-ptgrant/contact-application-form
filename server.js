const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded and JSON body data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle form submission POST request
app.post('/submit', (req, res) => {
    const { firstName, lastName, phone, email, preference } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const entry = 
`========================================
PT-GRANT CONTACT SUBMISSION
========================================
Date:                    ${timestamp}
First Name:              ${firstName || ''}
Last Name:               ${lastName || ''}
Phone Number:            ${phone || ''}
Email Address:           ${email || ''}
Preferred Contact Method:${preference || ''}
========================================\n\n`;

    // Append entry directly to submission.txt on the server
    fs.appendFile(path.join(__dirname, 'submission.txt'), entry, (err) => {
        if (err) {
            console.error('Failed to write to submission.txt:', err);
            return res.status(500).json({ status: 'error', message: 'Failed to record entry.' });
        }
        console.log(`New submission recorded for ${firstName} ${lastName}`);
        res.json({ status: 'success' });
    });
});

// Fallback route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
