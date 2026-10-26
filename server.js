const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for port 465
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    },
    // Prevent server timeout hangs if email connection fails
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 5000
});

app.post('/submit', (req, res) => {
    const { firstName, lastName, phone, email, preference } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    // Get visitor's IP address
    const clientIp = req.headers['x-forwarded-for'] 
        ? req.headers['x-forwarded-for'].split(',')[0].trim() 
        : req.socket.remoteAddress;

    const entryText = 
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

    // 1. Save entry to submission.txt first
    fs.appendFile(path.join(__dirname, 'submission.txt'), entryText, (err) => {
        if (err) console.error('Failed to write to submission.txt:', err);
    });

    // 2. Return SUCCESS immediately to the website visitor so it never hangs
    res.json({ status: 'success' });

    // 3. Send email notification in background
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const mailOptions = {
            from: `"PT-Grant Forms" <${process.env.SMTP_USER}>`,
            to: 'contact-ptgrant@proton.me',
            subject: `New PT-Grant Form Submission from ${firstName} ${lastName}`,
            text: entryText
        };

        transporter.sendMail(mailOptions)
            .then(() => console.log(`Email successfully sent to contact-ptgrant@proton.me for ${firstName} ${lastName}`))
            .catch((error) => console.error('Email dispatch failed (Check Render Environment SMTP_USER/SMTP_PASS):', error.message));
    } else {
        console.warn('SMTP_USER or SMTP_PASS not set in Environment variables. Skipping email dispatch.');
    }
});

// Secret route to view entries in browser
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
