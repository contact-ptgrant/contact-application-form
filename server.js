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
// Replace user and pass with your SMTP credentials (or environment variables)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true, // true for port 465, false for port 587
    auth: {
        user: process.env.SMTP_USER || 'your-sending-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

app.post('/submit', async (req, res) => {
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

    // 1. Append entry locally to submission.txt
    fs.appendFile(path.join(__dirname, 'submission.txt'), entryText, (err) => {
        if (err) console.error('Failed to write to submission.txt:', err);
    });

    // 2. Send entry directly to your email inbox
    const mailOptions = {
        from: `"PT-Grant Forms" <${process.env.SMTP_USER || 'your-sending-email@gmail.com'}>`,
        to: 'contact-ptgrant@proton.me',
        subject: `New PT-Grant Form Submission from ${firstName} ${lastName}`,
        text: entryText
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to contact-ptgrant@proton.me for ${firstName} ${lastName}`);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error sending email notification:', error);
        // Still return success to the user so form user experience is uninterrupted
        res.json({ status: 'success', note: 'Saved locally, email dispatch pending configuration' });
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
