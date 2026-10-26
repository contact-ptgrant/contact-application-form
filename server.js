const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Replace this EXACTLY with your InfinityFree web link!
// DO NOT put your render.com link here!
const TARGET_URL = 'contact-application-form.42web.io';

// Handle incoming requests cleanly without creating a loop
app.get('*', (req, res) => {
    // Prevent self-referencing loops
    const host = req.headers.host || '';
    if (TARGET_URL.includes(host)) {
        return res.status(400).send('Error: Target URL cannot be the same as this domain.');
    }
    
    // Perform 302 Found Redirect to InfinityFree
    res.redirect(302, TARGET_URL);
});

app.listen(PORT, () => {
    console.log(`Redirect server running on port ${PORT}`);
});
